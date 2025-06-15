const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")
const { v4: uuidv4 } = require("uuid")

class CompileController {
  constructor() {
    this.compileCode = this.compileCode.bind(this)
    this.compileAndRun = this.compileAndRun.bind(this)
    this.runJavaScript = this.runJavaScript.bind(this)
    this.runPython = this.runPython.bind(this)
    this.runC = this.runC.bind(this)
    this.runJava = this.runJava.bind(this)
    this.runDart = this.runDart.bind(this)
    this.cleanup = this.cleanup.bind(this)
  }

  async compileCode(req, res) {
    const { language, code, input } = req.body
    const { languageConfig, tempDir } = req.app.locals // Get from app.locals

    if (!languageConfig || !languageConfig[language]) {
      return res.status(400).json({
        success: false,
        error: "Unsupported language or server configuration error.",
      })
    }

    if (!code || code.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "No code provided.",
      })
    }

    try {
      const result = await this.compileAndRun(language, code, input, languageConfig, tempDir)
      // Send result.data for successful compilations to match frontend expectation
      if (result.success) {
        res.json({ success: true, data: result })
      } else {
        res.status(200).json(result) // Send 200 for compilation errors, but success: false
      }
    } catch (error) {
      console.error(`Critical error during compilation for ${language}:`, error)
      res.status(500).json({
        success: false,
        error: "An unexpected server error occurred during compilation.",
        details: error.message,
      })
    }
  }

  async compileAndRun(language, code, input = "", languageConfig, tempDir) {
    const config = languageConfig[language]
    const fileId = uuidv4()
    const fileName = `temp_${fileId}${config.extension}`
    const filePath = path.join(tempDir, fileName)
    const filesToClean = [filePath]

    try {
      fs.writeFileSync(filePath, code)

      let result
      switch (language) {
        case "javascript":
          result = await this.runJavaScript(filePath, input)
          break
        case "python":
          result = await this.runPython(filePath, input)
          break
        case "c":
          const cArtifacts = await this.runC(filePath, input, fileId, tempDir)
          result = cArtifacts.result
          if (cArtifacts.executablePath) filesToClean.push(cArtifacts.executablePath)
          break
        case "java":
          const javaArtifacts = await this.runJava(filePath, input, fileId, tempDir, code)
          result = javaArtifacts.result
          if (javaArtifacts.classFile) filesToClean.push(javaArtifacts.classFile)
          if (javaArtifacts.javaSourceFileInTemp) filesToClean.push(javaArtifacts.javaSourceFileInTemp) // if copied
          break
        case "dart":
          result = await this.runDart(filePath, input)
          break
        default:
          throw new Error(`Unsupported language handler: ${language}`)
      }
      result.language = language // Add language to the result for HTML preview handling
      return result
    } finally {
      this.cleanup(filesToClean)
    }
  }

  _executeProcess(command, input, timeout = 10000, options = {}) {
    return new Promise((resolve) => {
      const startTime = Date.now()
      const childProcess = exec(command, { timeout, ...options }, (error, stdout, stderr) => {
        const executionTime = Date.now() - startTime
        resolve({
          success: !error,
          output: stdout.toString().trim(),
          error: error ? stderr.toString().trim() || error.message : stderr.toString().trim() || "", // Prioritize stderr for error messages
          stderr: stderr.toString().trim(), // Always include stderr
          executionTime: executionTime,
        })
      })

      if (input && typeof input === "string") {
        childProcess.stdin.write(input)
        childProcess.stdin.end()
      }
    })
  }

  async runJavaScript(filePath, input) {
    return this._executeProcess(`node "${filePath}"`, input)
  }

  async runPython(filePath, input) {
    // Try python3 first, then python if it fails (for broader compatibility)
    try {
      const result = await this._executeProcess(`python3 "${filePath}"`, input)
      if (result.success || (result.error && !result.error.toLowerCase().includes("command not found"))) {
        return result
      }
    } catch (e) {
      /* Fall through if python3 not found */
    }
    return this._executeProcess(`python "${filePath}"`, input)
  }

  async runC(filePath, input, fileId, tempDir) {
    const executablePath = path.join(tempDir, `temp_c_${fileId}`)
    const compileResult = await this._executeProcess(`gcc "${filePath}" -o "${executablePath}" -lm`, null, 10000, {
      shell: true,
    }) // Added -lm for math library

    if (!compileResult.success) {
      return { result: compileResult, executablePath: null } // Compile error
    }
    const runResult = await this._executeProcess(`"${executablePath}"`, input)
    return { result: runResult, executablePath }
  }

  async runJava(filePath, input, fileId, tempDir, originalCode) {
    // Determine class name from code content
    const classNameMatch = originalCode.match(/public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/)
    if (!classNameMatch || !classNameMatch[1]) {
      return {
        result: {
          success: false,
          output: "",
          error: "Could not find a public class (e.g., public class Main) in your Java code.",
          stderr: "No public class found.",
          executionTime: 0,
        },
        classFile: null,
        javaSourceFileInTemp: null,
      }
    }
    const className = classNameMatch[1]
    const tempJavaFileName = `${className}.java`
    const tempJavaFilePath = path.join(tempDir, tempJavaFileName)

    // Copy original file to temp file with correct class name if they differ
    // This is crucial if the uploaded file is `temp_xyz.java` but class is `Main`
    if (path.basename(filePath) !== tempJavaFileName) {
      fs.copyFileSync(filePath, tempJavaFilePath)
    } else {
      // If names match, no need to copy, use original filePath for compilation
      // This case is unlikely with uuid filenames but good to consider.
      // For simplicity, we'll assume filePath is the one to compile if names match,
      // but the logic below uses tempJavaFilePath which is safer.
      // If filePath is already tempDir/ClassName.java, this copy is redundant but harmless.
      fs.copyFileSync(filePath, tempJavaFilePath) // Safer to always copy to ensure context
    }

    const compileResult = await this._executeProcess(`javac "${tempJavaFilePath}"`, null, 15000, { cwd: tempDir })

    if (!compileResult.success) {
      return { result: compileResult, classFile: null, javaSourceFileInTemp: tempJavaFilePath }
    }

    const classFile = path.join(tempDir, `${className}.class`)
    const runResult = await this._executeProcess(`java ${className}`, input, 15000, { cwd: tempDir })
    return { result: runResult, classFile, javaSourceFileInTemp: tempJavaFilePath }
  }

  async runDart(filePath, input) {
    return this._executeProcess(`dart run "${filePath}"`, input, 15000) // dart run is preferred over just dart
  }

  cleanup(filePaths) {
    if (!Array.isArray(filePaths)) filePaths = [filePaths]
    filePaths.forEach((filePath) => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath)
        } catch (err) {
          console.error(`Failed to delete temp file ${filePath}:`, err)
        }
      }
    })
  }
}

module.exports = new CompileController()

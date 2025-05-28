const express = require("express");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 1111;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "view"));

const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const languageConfig = {
  javascript: {
    extension: ".js",
    command: "node",
    syntax: "javascript",
  },
  python: {
    extension: ".py",
    command: "python3",
    syntax: "python",
  },
  c: {
    extension: ".c",
    command: "gcc",
    compileArgs: ["-o"],
    syntax: "c",
  },
  java: {
    extension: ".java",
    command: "javac",
    runCommand: "java",
    syntax: "java",
  },
  dart: {
    extension: ".dart",
    command: "dart",
    syntax: "dart",
  },
};

app.get("/", (req, res) => {
  res.render("index", {
    languages: Object.keys(languageConfig),
  });
});

app.post("/compile", async (req, res) => {
  const { language, code, input } = req.body;

  if (!languageConfig[language]) {
    return res.json({
      success: false,
      error: "Unsupported language",
    });
  }

  try {
    const result = await compileAndRun(language, code, input);
    res.json(result);
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
    });
  }
});

async function compileAndRun(language, code, input = "") {
  const config = languageConfig[language];
  const fileId = uuidv4();
  const fileName = `temp_${fileId}${config.extension}`;
  const filePath = path.join(tempDir, fileName);

  try {
    fs.writeFileSync(filePath, code);

    let result;
    switch (language) {
      case "javascript":
        result = await runJavaScript(filePath, input);
        break;
      case "python":
        result = await runPython(filePath, input);
        break;
      case "c":
        result = await runC(filePath, input, fileId);
        break;
      case "java":
        result = await runJava(filePath, input, fileId);
        break;
      case "dart":
        result = await runDart(filePath, input);
        break;
      default:
        throw new Error("Unsupported language");
    }

    return result;
  } finally {
    cleanup(filePath, language, fileId);
  }
}

async function runJavaScript(filePath, input) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const process = exec(
      `node "${filePath}"`,
      { timeout: 10000 },
      (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: stdout,
          error: stderr || (error ? error.message : ""),
          executionTime: Date.now() - startTime,
        });
      }
    );

    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }
  });
}

async function runPython(filePath, input) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const process = exec(
      `python3 "${filePath}"`,
      { timeout: 10000 },
      (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: stdout,
          error: stderr || (error ? error.message : ""),
          executionTime: Date.now() - startTime,
        });
      }
    );

    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }
  });
}

async function runC(filePath, input, fileId) {
  const executablePath = path.join(tempDir, `temp_${fileId}`);

  return new Promise((resolve) => {
    exec(
      `gcc "${filePath}" -o "${executablePath}"`,
      { timeout: 10000 },
      (compileError, compileStdout, compileStderr) => {
        if (compileError) {
          resolve({
            success: false,
            output: "",
            error: compileStderr || compileError.message,
            executionTime: 0,
          });
          return;
        }

        const startTime = Date.now();
        const process = exec(
          `"${executablePath}"`,
          { timeout: 10000 },
          (runError, stdout, stderr) => {
            resolve({
              success: !runError,
              output: stdout,
              error: stderr || (runError ? runError.message : ""),
              executionTime: Date.now() - startTime,
            });
          }
        );

        if (input) {
          process.stdin.write(input);
          process.stdin.end();
        }
      }
    );
  });
}

async function runJava(filePath, input, fileId) {
  const code = fs.readFileSync(filePath, "utf8");
  const classNameMatch = code.match(/public\s+class\s+(\w+)/);

  if (!classNameMatch) {
    return {
      success: false,
      output: "",
      error:
        "Could not find a public class in your Java code. Make sure your class is named 'Main' or update the class name.",
      executionTime: 0,
    };
  }

  const className = classNameMatch[1];
  const javaFile = path.join(tempDir, `${className}.java`);

  fs.copyFileSync(filePath, javaFile);

  return new Promise((resolve) => {
    exec(
      `javac "${javaFile}"`,
      { cwd: tempDir, timeout: 10000 },
      (compileError, compileStdout, compileStderr) => {
        if (compileError) {
          resolve({
            success: false,
            output: "",
            error: compileStderr || compileError.message,
            executionTime: 0,
          });
          return;
        }

        const startTime = Date.now();
        const process = exec(
          `java ${className}`,
          { cwd: tempDir, timeout: 10000 },
          (runError, stdout, stderr) => {
            resolve({
              success: !runError,
              output: stdout,
              error: stderr || (runError ? runError.message : ""),
              executionTime: Date.now() - startTime,
            });

            try {
              fs.unlinkSync(javaFile);
              fs.unlinkSync(path.join(tempDir, `${className}.class`));
            } catch (e) {
              console.error("Java cleanup error:", e);
            }
          }
        );

        if (input) {
          process.stdin.write(input);
          process.stdin.end();
        }
      }
    );
  });
}

async function runDart(filePath, input) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const process = exec(
      `dart "${filePath}"`,
      { timeout: 10000 },
      (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: stdout,
          error: stderr || (error ? error.message : ""),
          executionTime: Date.now() - startTime,
        });
      }
    );

    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }
  });
}

function cleanup(filePath, language, fileId) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (language === "c") {
      const executablePath = path.join(tempDir, `temp_${fileId}`);
      if (fs.existsSync(executablePath)) {
        fs.unlinkSync(executablePath);
      }
    }
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

app.use((req, res) => {
  res.status(404).render("404", {
    title: "Page Not Found",
  });
});

app.listen(PORT, () => {
  console.log(` Compiler server running on http://localhost:${PORT}`);
});

module.exports = app;

// Rashid's Compiler - Complete Version with All Fixes
;(() => {
  const Swal = window.Swal || null
  const Prism = window.Prism || null

  class RashidsCompiler {
    constructor() {
      console.log("🚀 Initializing Rashid's Compiler...")
      this.initializeElements()
      this.initializeTheme()
      this.setupEventListeners()
      this.setupAdvancedAutoClosing()
      this.setupBracketMatching()
      this.loadDefaultCode()
      this.updateLineNumbers()
      this.updateStats()
      this.updateSyntaxHighlighting()

      setTimeout(() => this.showWelcomeMessage(), 1000)
      console.log("✅ Rashid's Compiler initialized successfully!")
    }

    initializeElements() {
      this.languageSelect = document.getElementById("language")
      this.codeEditor = document.getElementById("codeEditor")
      this.codeHighlight = document.getElementById("codeHighlight")
      this.inputArea = document.getElementById("inputArea")
      this.outputArea = document.getElementById("outputArea")
      this.runBtn = document.getElementById("runBtn")
      this.clearBtn = document.getElementById("clearBtn")
      this.copyBtn = document.getElementById("copyBtn")
      this.downloadBtn = document.getElementById("downloadBtn")
      this.formatBtn = document.getElementById("formatBtn")
      this.themeSwitcher = document.getElementById("themeSwitcher")
      this.loadingOverlay = document.getElementById("loadingOverlay")
      this.executionTime = document.getElementById("executionTime")
      this.executionStatus = document.getElementById("executionStatus")
      this.lineNumbersContainer = document.getElementById("lineNumbers")
      this.lineCountEl = document.getElementById("lineCount")
      this.charCountEl = document.getElementById("charCount")
      this.prismThemeLink = document.getElementById("prism-theme")
      console.log("✅ Elements initialized")
    }

    initializeTheme() {
      console.log("🎨 Initializing theme system...")
      const savedTheme = localStorage.getItem("rashids-compiler-theme")
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

      if (savedTheme === "dark-mode") {
        this.setTheme(true)
      } else if (savedTheme === "light-mode") {
        this.setTheme(false)
      } else {
        this.setTheme(prefersDark)
      }

      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem("rashids-compiler-theme")) {
          this.setTheme(e.matches)
        }
      })
      console.log("🎨 Theme system initialized")
    }

    setTheme(isDarkMode) {
      document.body.classList.toggle("dark-mode", isDarkMode)
      document.body.classList.toggle("light-mode", !isDarkMode)

      if (this.themeSwitcher) {
        const icon = this.themeSwitcher.querySelector("i")
        const text = this.themeSwitcher.querySelector("span")
        if (icon && text) {
          icon.className = isDarkMode ? "fas fa-sun" : "fas fa-moon"
          text.textContent = isDarkMode ? "Light" : "Dark"
        }
      }

      if (this.prismThemeLink) {
        this.prismThemeLink.href = isDarkMode
          ? "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css"
          : "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css"
      }

      setTimeout(() => this.updateSyntaxHighlighting(), 100)
      console.log(isDarkMode ? "🌙 Dark mode set" : "☀️ Light mode set")
    }

    animateThemeTransition() {
      document.body.style.transition = "background-color 0.5s ease, color 0.5s ease"
      this.createThemeRipple()

      setTimeout(() => {
        const isCurrentlyDark = document.body.classList.contains("dark-mode")
        this.setTheme(!isCurrentlyDark)
        localStorage.setItem("rashids-compiler-theme", !isCurrentlyDark ? "dark-mode" : "light-mode")
        this.showThemeChangeNotification(!isCurrentlyDark)

        setTimeout(() => {
          document.body.style.transition = ""
        }, 500)
      }, 100)
    }

    createThemeRipple() {
      const ripple = document.createElement("div")
      ripple.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: ${document.body.classList.contains("dark-mode") ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"};
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 9999;
        animation: themeRipple 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
      `

      const style = document.createElement("style")
      style.textContent = `
        @keyframes themeRipple {
          to {
            width: 250vmax;
            height: 250vmax;
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
      document.body.appendChild(ripple)

      setTimeout(() => {
        if (document.body.contains(ripple)) document.body.removeChild(ripple)
        if (document.head.contains(style)) document.head.removeChild(style)
      }, 700)
    }

    setupEventListeners() {
      if (this.languageSelect) {
        this.languageSelect.addEventListener("change", () => {
          this.loadDefaultCode()
          this.showLanguageChangeNotification()
        })
      }

      if (this.codeEditor) {
        this.codeEditor.addEventListener("input", () => this.handleEditorInput())
        this.codeEditor.addEventListener("scroll", () => this.syncScroll())
        this.codeEditor.addEventListener("keydown", (e) => this.handleKeyDown(e))
        this.codeEditor.addEventListener("keypress", (e) => this.handleKeyPress(e))
        this.codeEditor.addEventListener("focus", () => this.highlightMatchingBrackets())
        this.codeEditor.addEventListener("blur", () => this.clearBracketHighlights())
        this.codeEditor.addEventListener("click", () => setTimeout(() => this.highlightMatchingBrackets(), 0))
      }

      if (this.themeSwitcher) {
        this.themeSwitcher.addEventListener("click", (e) => {
          e.preventDefault()
          this.animateThemeTransition()
        })
      }

      this.setupButtonListeners()
      this.setupGlobalKeyboardShortcuts()
      console.log("🎧 Event listeners set up")
    }

    handleEditorInput() {
      this.updateSyntaxHighlighting()
      this.updateLineNumbers()
      this.updateStats()
      this.syncScroll()
      this.highlightMatchingBrackets()
    }

    setupButtonListeners() {
      if (this.runBtn)
        this.runBtn.addEventListener("click", (e) => {
          e.preventDefault()
          this.runCode()
        })
      if (this.clearBtn)
        this.clearBtn.addEventListener("click", (e) => {
          e.preventDefault()
          this.clearCode()
        })
      if (this.copyBtn)
        this.copyBtn.addEventListener("click", (e) => {
          e.preventDefault()
          this.copyCode()
        })
      if (this.downloadBtn)
        this.downloadBtn.addEventListener("click", (e) => {
          e.preventDefault()
          this.downloadCode()
        })
      if (this.formatBtn)
        this.formatBtn.addEventListener("click", (e) => {
          e.preventDefault()
          this.formatCode()
        })
    }

    setupGlobalKeyboardShortcuts() {
      document.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key.toLowerCase()) {
            case "enter":
              e.preventDefault()
              this.runCode()
              break
            case "s":
              e.preventDefault()
              this.downloadCode()
              break
            case "d":
              e.preventDefault()
              this.animateThemeTransition()
              break
            case "/":
              if (document.activeElement === this.codeEditor) {
                e.preventDefault()
                this.toggleComment()
              }
              break
            case "f":
              if (document.activeElement === this.codeEditor) {
                e.preventDefault()
                this.showFindDialog()
              }
              break
          }
        }
        if (e.key === "Escape") {
          this.clearBracketHighlights()
        }
      })
    }

    setupAdvancedAutoClosing() {
      this.autoClosePairs = {
        "(": { close: ")", context: "all" },
        "[": { close: "]", context: "all" },
        "{": { close: "}", context: "all" },
        '"': { close: '"', context: "string" },
        "'": { close: "'", context: "string" },
        "`": { close: "`", context: "template" },
      }
      this.languageSpecificPairs = {
        javascript: { "/*": { close: "*/", context: "comment" }, "/**": { close: "*/", context: "jsdoc" } },
        python: { '"""': { close: '"""', context: "docstring" }, "'''": { close: "'''", context: "docstring" } },
        c: { "/*": { close: "*/", context: "comment" } },
        java: { "/*": { close: "*/", context: "comment" }, "/**": { close: "*/", context: "javadoc" } },
        dart: { "/*": { close: "*/", context: "comment" }, "/**": { close: "*/", context: "dartdoc" } },
      }
      this.autoInsertedChars = new Map()
      console.log("🔧 Auto-closing configured")
    }

    setupBracketMatching() {
      this.matchingBrackets = { "(": ")", "[": "]", "{": "}", ")": "(", "]": "[", "}": "{" }
      this.bracketHighlightElements = []
      console.log("🔗 Bracket matching configured")
    }

    handleKeyPress(e) {
      if (!this.codeEditor) return
      const char = e.key
      const cursorPos = this.codeEditor.selectionStart
      const value = this.codeEditor.value

      if (this.autoClosePairs[char]) {
        const pair = this.autoClosePairs[char]
        const closingChar = pair.close

        if (
          (char === '"' || char === "'" || char === "`") &&
          value[cursorPos] === closingChar &&
          this.autoInsertedChars.get(cursorPos) === closingChar
        ) {
          e.preventDefault()
          this.codeEditor.selectionStart = this.codeEditor.selectionEnd = cursorPos + 1
          this.autoInsertedChars.delete(cursorPos)
          this.handleEditorInput()
          return
        }

        e.preventDefault()
        const beforeCursor = value.substring(0, cursorPos)
        const afterCursor = value.substring(cursorPos)
        this.codeEditor.value = beforeCursor + char + closingChar + afterCursor
        this.codeEditor.selectionStart = this.codeEditor.selectionEnd = cursorPos + 1
        this.autoInsertedChars.set(cursorPos + 1, closingChar)
        this.handleEditorInput()
      }
    }

    handleKeyDown(e) {
      if (!this.codeEditor) return
      const cursorPos = this.codeEditor.selectionStart
      const value = this.codeEditor.value

      if (e.key === "Backspace") {
        const charBefore = value[cursorPos - 1]
        const charAfter = value[cursorPos]
        if (
          this.autoClosePairs[charBefore] &&
          this.autoClosePairs[charBefore].close === charAfter &&
          this.autoInsertedChars.get(cursorPos) === charAfter
        ) {
          e.preventDefault()
          this.codeEditor.value = value.substring(0, cursorPos - 1) + value.substring(cursorPos + 1)
          this.codeEditor.selectionStart = this.codeEditor.selectionEnd = cursorPos - 1
          this.autoInsertedChars.delete(cursorPos)
          this.handleEditorInput()
          return
        }
      }

      if (e.key === "Tab") {
        e.preventDefault()
        const start = this.codeEditor.selectionStart
        const end = this.codeEditor.selectionEnd
        const indent = "    "

        if (start !== end) {
          this.handleMultiLineIndentation(e.shiftKey, indent)
        } else {
          if (e.shiftKey) {
            this.unindentLine(indent)
          } else {
            this.indentLine(indent)
          }
        }
        this.handleEditorInput()
        return
      }

      if (e.key === "Enter") {
        e.preventDefault()
        this.handleSmartEnter()
        this.handleEditorInput()
        return
      }
    }

    handleMultiLineIndentation(unindent, indentChars) {
      const start = this.codeEditor.selectionStart
      const end = this.codeEditor.selectionEnd
      const value = this.codeEditor.value

      const lineStartIndex = value.lastIndexOf("\n", start - 1) + 1
      let lineEndIndex = value.indexOf("\n", end - 1)
      if (lineEndIndex === -1) lineEndIndex = value.length

      const selectedLinesText = value.substring(lineStartIndex, lineEndIndex)
      const lines = selectedLinesText.split("\n")
      let newSelectedText = ""
      let changeInLength = 0

      lines.forEach((line, index) => {
        if (unindent) {
          if (line.startsWith(indentChars)) {
            newSelectedText += line.substring(indentChars.length)
            changeInLength -= indentChars.length
          } else if (line.startsWith("\t")) {
            newSelectedText += line.substring(1)
            changeInLength -= 1
          } else {
            newSelectedText += line
          }
        } else {
          newSelectedText += indentChars + line
          changeInLength += indentChars.length
        }
        if (index < lines.length - 1) {
          newSelectedText += "\n"
        }
      })

      this.codeEditor.value = value.substring(0, lineStartIndex) + newSelectedText + value.substring(lineEndIndex)

      if (unindent) {
        this.codeEditor.selectionStart = Math.max(lineStartIndex, start - indentChars.length)
      } else {
        this.codeEditor.selectionStart = start + indentChars.length
      }
      this.codeEditor.selectionEnd = start + newSelectedText.length - (selectedLinesText.length - (end - start))
    }

    indentLine(indentChars) {
      const start = this.codeEditor.selectionStart
      const value = this.codeEditor.value
      this.codeEditor.value = value.substring(0, start) + indentChars + value.substring(start)
      this.codeEditor.selectionStart = this.codeEditor.selectionEnd = start + indentChars.length
    }

    unindentLine(indentChars) {
      const start = this.codeEditor.selectionStart
      const value = this.codeEditor.value
      const lineStart = value.lastIndexOf("\n", start - 1) + 1

      if (value.substring(lineStart, start).endsWith(indentChars)) {
        this.codeEditor.value = value.substring(0, start - indentChars.length) + value.substring(start)
        this.codeEditor.selectionStart = this.codeEditor.selectionEnd = start - indentChars.length
      } else if (value.substring(lineStart, start).endsWith("\t")) {
        this.codeEditor.value = value.substring(0, start - 1) + value.substring(start)
        this.codeEditor.selectionStart = this.codeEditor.selectionEnd = start - 1
      }
    }

    handleSmartEnter() {
      const cursorPos = this.codeEditor.selectionStart
      const value = this.codeEditor.value
      const lineStart = value.lastIndexOf("\n", cursorPos - 1) + 1
      const currentLine = value.substring(lineStart, cursorPos)
      const currentIndentMatch = currentLine.match(/^\s*/)
      let indent = currentIndentMatch ? currentIndentMatch[0] : ""

      const charBefore = value[cursorPos - 1]
      const charAfter = value[cursorPos]

      let newText = "\n" + indent

      if (
        (charBefore === "{" && charAfter === "}") ||
        (charBefore === "[" && charAfter === "]") ||
        (charBefore === "(" && charAfter === ")")
      ) {
        const extraIndent = "    "
        newText = "\n" + indent + extraIndent + "\n" + indent
        this.codeEditor.value = value.substring(0, cursorPos) + newText + value.substring(cursorPos)
        this.codeEditor.selectionStart = this.codeEditor.selectionEnd =
          cursorPos + 1 + indent.length + extraIndent.length
      } else {
        if (/[{[(:]\s*$/.test(currentLine.trim())) {
          indent += "    "
        }
        newText = "\n" + indent
        this.codeEditor.value = value.substring(0, cursorPos) + newText + value.substring(cursorPos)
        this.codeEditor.selectionStart = this.codeEditor.selectionEnd = cursorPos + newText.length
      }
    }

    highlightMatchingBrackets() {
      this.clearBracketHighlights(true)
      if (!this.codeEditor || !this.codeEditor.value) return

      const cursorPos = this.codeEditor.selectionStart
      const code = this.codeEditor.value
      const charBefore = code[cursorPos - 1]
      const charAfter = code[cursorPos]

      let openBracket, closeBracket, searchForward, startPos

      if (this.matchingBrackets[charBefore] && !["(", "[", "{"].includes(charBefore)) {
        closeBracket = charBefore
        openBracket = this.matchingBrackets[closeBracket]
        searchForward = false
        startPos = cursorPos - 1
      } else if (this.matchingBrackets[charAfter] && ["(", "[", "{"].includes(charAfter)) {
        openBracket = charAfter
        closeBracket = this.matchingBrackets[openBracket]
        searchForward = true
        startPos = cursorPos
      } else {
        return
      }

      let balance = 0
      let foundPos = -1

      if (searchForward) {
        for (let i = startPos; i < code.length; i++) {
          if (code[i] === openBracket) balance++
          else if (code[i] === closeBracket) balance--
          if (balance === 0 && code[i] === closeBracket) {
            foundPos = i
            break
          }
        }
      } else {
        for (let i = startPos; i >= 0; i--) {
          if (code[i] === closeBracket) balance++
          else if (code[i] === openBracket) balance--
          if (balance === 0 && code[i] === openBracket) {
            foundPos = i
            break
          }
        }
      }

      if (foundPos !== -1) {
        this.addBracketHighlightStyle(startPos)
        this.addBracketHighlightStyle(foundPos)
      }
    }

    addBracketHighlightStyle(pos) {
      console.log(`Highlight bracket at: ${pos}`)
    }

    clearBracketHighlights(silent = false) {
      if (!silent) console.log("Clearing bracket highlights")
    }

    updateLineNumbers() {
      if (!this.lineNumbersContainer || !this.codeEditor) return
      const code = this.codeEditor.value
      const lines = code.split("\n")
      const lineCount = Math.max(lines.length, 1)

      const currentLineDivs = this.lineNumbersContainer.children.length
      if (currentLineDivs < lineCount) {
        for (let i = currentLineDivs; i < lineCount; i++) {
          const div = document.createElement("div")
          this.lineNumbersContainer.appendChild(div)
        }
      } else if (currentLineDivs > lineCount) {
        for (let i = currentLineDivs - 1; i >= lineCount; i--) {
          this.lineNumbersContainer.removeChild(this.lineNumbersContainer.children[i])
        }
      }

      for (let i = 0; i < lineCount; i++) {
        this.lineNumbersContainer.children[i].textContent = i + 1
      }
      this.syncScroll()
    }

    updateStats() {
      if (!this.codeEditor || !this.lineCountEl || !this.charCountEl) return
      const code = this.codeEditor.value
      const lines = code.split("\n").length
      const chars = code.length
      const words = code.trim() ? code.trim().split(/\s+/).length : 0

      this.lineCountEl.textContent = `Lines: ${lines}`
      this.charCountEl.textContent = `Characters: ${chars} | Words: ${words}`
    }

    syncScroll() {
      if (!this.codeEditor || !this.codeHighlight || !this.lineNumbersContainer) return
      const scrollTop = this.codeEditor.scrollTop
      const scrollLeft = this.codeEditor.scrollLeft
      this.codeHighlight.scrollTop = scrollTop
      this.codeHighlight.scrollLeft = scrollLeft
      this.lineNumbersContainer.scrollTop = scrollTop
    }

    loadDefaultCode() {
      if (!this.languageSelect || !this.codeEditor) return
      const language = this.languageSelect.value
      if (window.defaultCode && window.defaultCode[language]) {
        this.codeEditor.value = window.defaultCode[language]
      } else {
        this.codeEditor.value = `// No default code for ${language}`
      }
      this.autoInsertedChars.clear()
      this.handleEditorInput()
    }

    updateSyntaxHighlighting() {
      if (!this.codeEditor || !this.codeHighlight || !this.languageSelect || !Prism) return
      const code = this.codeEditor.value
      const language = this.languageSelect.value
      const prismLanguage = language === "c" ? "clike" : language
      const codeElement = this.codeHighlight.querySelector("code")

      if (codeElement) {
        codeElement.className = `language-${prismLanguage}`
        codeElement.textContent = code
        Prism.highlightElement(codeElement)
      }
    }

    async runCode() {
      if (!this.codeEditor || !this.runBtn || !this.outputArea) return
      const language = this.languageSelect.value
      const code = this.codeEditor.value.trim()
      const input = this.inputArea ? this.inputArea.value : ""

      if (!code) {
        this.showInfoAlert("No Code to Execute", "Please write some code before running.")
        return
      }

      this.showLoading(true)
      this.runBtn.disabled = true
      this.runBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...'
      if (this.executionStatus) {
        this.executionStatus.textContent = "Running..."
        this.executionStatus.className = "status-running"
      }
      const startTime = performance.now()

      try {
        const response = await fetch("/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, code, input }),
        })
        const result = await response.json()
        const executionTimeMs = result.executionTime || Math.round(performance.now() - startTime)
        this.displayResult(result, executionTimeMs)
        if (result.success) {
          this.showSuccessNotification(`Code executed in ${executionTimeMs}ms`)
        }
      } catch (error) {
        console.error("❌ Network or fetch error:", error)
        this.displayResult({ success: false, output: "", error: "Network error: " + error.message }, 0)
      } finally {
        this.showLoading(false)
        this.runBtn.disabled = false
        this.runBtn.innerHTML = '<i class="fas fa-play"></i> Run'
      }
    }

    displayResult(result, executionTimeMs) {
      if (this.executionTime) this.executionTime.textContent = `${executionTimeMs}ms`
      if (this.executionStatus) {
        this.executionStatus.textContent = result.success ? "Success" : "Error"
        this.executionStatus.className = result.success ? "status-success" : "status-error"
      }
      if (this.outputArea) {
        this.outputArea.textContent = result.success
          ? result.output || "Execution successful, no output."
          : `Error: ${result.error || "Unknown error"}`
      }
    }

    showLoading(show) {
      if (this.loadingOverlay) this.loadingOverlay.style.display = show ? "flex" : "none"
    }

    clearCode() {
      if (Swal) {
        Swal.fire({
          title: "🗑️ Clear All Code?",
          text: "This will clear code and input. Cannot be undone!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#dc3545",
          cancelButtonColor: "#6c757d",
          confirmButtonText: "Yes, clear it!",
          background: document.body.classList.contains("dark-mode") ? "#21262d" : "#ffffff",
          color: document.body.classList.contains("dark-mode") ? "#c9d1d9" : "#212529",
        }).then((result) => {
          if (result.isConfirmed) this.performClear()
        })
      } else {
        this.performClear()
      }
    }

    performClear() {
      if (this.codeEditor) this.codeEditor.value = ""
      if (this.inputArea) this.inputArea.value = ""
      if (this.outputArea) this.outputArea.textContent = "🎉 Welcome to Rashid's Compiler! Output will appear here."
      if (this.executionTime) this.executionTime.textContent = "Ready"
      if (this.executionStatus) {
        this.executionStatus.textContent = "Waiting"
        this.executionStatus.className = "status-waiting"
      }
      this.autoInsertedChars.clear()
      this.handleEditorInput()
      this.showSuccessToast("🧹 Code cleared!")
    }

    async copyCode() {
      if (!this.codeEditor || !this.codeEditor.value.trim()) {
        this.showInfoAlert("No Code to Copy", "Write some code first.")
        return
      }
      try {
        await navigator.clipboard.writeText(this.codeEditor.value)
        this.showSuccessToast("📋 Code copied!")
      } catch (err) {
        this.codeEditor.select()
        document.execCommand("copy")
        this.showSuccessToast("📋 Code copied (fallback)!")
      }
    }

    downloadCode() {
      if (!this.codeEditor || !this.languageSelect || !this.codeEditor.value.trim()) {
        this.showInfoAlert("No Code to Download", "Write some code first.")
        return
      }
      const language = this.languageSelect.value
      const code = this.codeEditor.value
      const extensions = { javascript: ".js", python: ".py", c: ".c", java: ".java", dart: ".dart" }
      const filename = `rashids-code-${Date.now()}${extensions[language] || ".txt"}`
      const blob = new Blob([code], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      this.showSuccessToast(`💾 Downloaded as ${filename}`)
    }

    formatCode() {
      if (!this.codeEditor || !this.codeEditor.value.trim()) {
        this.showInfoAlert("No Code to Format", "Write some code first.")
        return
      }
      const code = this.codeEditor.value
      const lines = code.split(/\r\n|\r|\n/)
      const trimmedLines = lines.map((line) => line.trimEnd())

      let indentLevel = 0
      const indentChar = "    "
      const formattedLines = trimmedLines.map((line) => {
        const currentLine = line
        if (currentLine.includes("}")) indentLevel = Math.max(0, indentLevel - 1)
        const indentedLine = indentChar.repeat(indentLevel) + currentLine.trimStart()
        if (currentLine.includes("{")) indentLevel++
        return indentedLine
      })

      this.codeEditor.value = formattedLines.join("\n")
      this.handleEditorInput()
      this.showSuccessToast("✨ Code formatted!")
    }

    toggleComment() {
      const cursorPos = this.codeEditor.selectionStart
      const value = this.codeEditor.value
      const language = this.languageSelect.value

      const commentChars = {
        javascript: "//",
        python: "#",
        c: "//",
        java: "//",
        dart: "//",
      }

      const commentChar = commentChars[language] || "//"
      const lineStart = value.lastIndexOf("\n", cursorPos - 1) + 1
      const lineEnd = value.indexOf("\n", cursorPos)
      const line = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd)

      let newLine
      if (line.trim().startsWith(commentChar)) {
        newLine = line.replace(new RegExp(`^(\\s*)${commentChar}\\s?`), "$1")
      } else {
        const indent = line.match(/^\s*/)[0]
        newLine = indent + commentChar + " " + line.substring(indent.length)
      }

      const beforeLine = value.substring(0, lineStart)
      const afterLine = value.substring(lineEnd === -1 ? value.length : lineEnd)

      this.codeEditor.value = beforeLine + newLine + afterLine
      this.codeEditor.selectionStart = this.codeEditor.selectionEnd = cursorPos
      this.handleEditorInput()
    }

    showFindDialog() {
      if (Swal) {
        Swal.fire({
          title: "🔍 Find in Code",
          input: "text",
          inputPlaceholder: "Enter text to search...",
          showCancelButton: true,
          confirmButtonText: "Find",
          cancelButtonText: "Cancel",
          background: document.body.classList.contains("dark-mode") ? "#21262d" : "#ffffff",
          color: document.body.classList.contains("dark-mode") ? "#c9d1d9" : "#212529",
        }).then((result) => {
          if (result.isConfirmed && result.value) {
            this.findInCode(result.value)
          }
        })
      }
    }

    findInCode(searchText) {
      const value = this.codeEditor.value
      const index = value.indexOf(searchText)

      if (index !== -1) {
        this.codeEditor.focus()
        this.codeEditor.selectionStart = index
        this.codeEditor.selectionEnd = index + searchText.length
        this.codeEditor.scrollIntoView()
      } else {
        if (Swal) {
          Swal.fire({
            icon: "info",
            title: "Not Found",
            text: `"${searchText}" was not found in the code.`,
            background: document.body.classList.contains("dark-mode") ? "#21262d" : "#ffffff",
            color: document.body.classList.contains("dark-mode") ? "#c9d1d9" : "#212529",
          })
        }
      }
    }

    showWelcomeMessage() {
      if (Swal) {
        Swal.fire({
          title: "🎉 Welcome to Rashid's Compiler!",
          html: `
            <div style="text-align: left; line-height: 1.6;">
              <p><strong>🚀 Features:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>🌟 Multi-language support with syntax highlighting</li>
                <li>🎨 Dark/light theme with smooth animations</li>
                <li>🔧 Advanced auto-closing brackets and quotes</li>
                <li>📊 Real-time code statistics</li>
                <li>⚡ Smart indentation and formatting</li>
                <li>🔍 Find functionality</li>
                <li>💾 Download and copy features</li>
              </ul>
              
              <p><strong>⌨️ Keyboard Shortcuts:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><kbd>Ctrl+Enter</kbd> - Run code</li>
                <li><kbd>Ctrl+S</kbd> - Download code</li>
                <li><kbd>Ctrl+D</kbd> - Toggle theme</li>
                <li><kbd>Ctrl+/</kbd> - Toggle comment</li>
                <li><kbd>Ctrl+F</kbd> - Find in code</li>
                <li><kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> - Indent/Unindent</li>
                <li><kbd>Enter</kbd> - Smart line breaks</li>
              </ul>
            </div>
          `,
          icon: "info",
          confirmButtonText: "Start Coding! 💻",
          confirmButtonColor: "#007bff",
          background: document.body.classList.contains("dark-mode") ? "#21262d" : "#ffffff",
          color: document.body.classList.contains("dark-mode") ? "#c9d1d9" : "#212529",
          width: "600px",
        })
      }
    }

    showLanguageChangeNotification() {
      const lang = this.languageSelect.value
      this.showSuccessToast(`Switched to ${lang.charAt(0).toUpperCase() + lang.slice(1)}`)
    }

    showThemeChangeNotification(isDarkMode) {
      this.showSuccessToast(isDarkMode ? "🌙 Dark Mode Activated" : "☀️ Light Mode Activated")
    }

    showSuccessNotification(message) {
      if (Swal) {
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: document.body.classList.contains("dark-mode") ? "#161b22" : "#f0f0f0",
          color: document.body.classList.contains("dark-mode") ? "#c9d1d9" : "#212529",
        })
        Toast.fire({ icon: "success", title: message })
      }
    }

    showSuccessToast(message) {
      if (Swal) {
        const Toast = Swal.mixin({
          toast: true,
          position: "bottom-end",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: false,
          background: document.body.classList.contains("dark-mode") ? "#21262d" : "#e9ecef",
          color: document.body.classList.contains("dark-mode") ? "#c9d1d9" : "#212529",
        })
        Toast.fire({ icon: "success", title: message })
      }
    }

    showInfoAlert(title, text) {
      if (Swal) {
        Swal.fire({
          icon: "info",
          title: title,
          text: text,
          confirmButtonColor: "#007bff",
          background: document.body.classList.contains("dark-mode") ? "#21262d" : "#ffffff",
          color: document.body.classList.contains("dark-mode") ? "#c9d1d9" : "#212529",
        })
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    try {
      window.rashidsCompiler = new RashidsCompiler()
    } catch (error) {
      console.error("❌ FATAL: Failed to initialize Rashid's Compiler:", error)
      document.body.innerHTML = `<div style="color: red; text-align: center; padding: 50px;">
        <h1>Error Initializing Editor</h1><p>Something went wrong. Please try refreshing the page.</p>
        <pre>${error.stack || error.message}</pre>
      </div>`
    }
  })

  const customSwalStyles = document.createElement("style")
  customSwalStyles.textContent = `
    .swal2-popup {
        border-radius: var(--radius-lg) !important;
        font-family: var(--font-sans) !important;
        box-shadow: var(--shadow-xl) !important;
    }
    .swal2-title {
        font-weight: 600 !important;
        font-size: 1.3rem !important;
    }
    .swal2-html-container {
        font-size: 0.95rem !important;
    }
    .swal2-confirm, .swal2-cancel {
        border-radius: var(--radius) !important;
        font-weight: 500 !important;
        padding: 10px 20px !important;
    }
    .swal2-toast {
        box-shadow: var(--shadow-lg) !important;
        border-radius: var(--radius) !important;
    }
    kbd {
        background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
        border: 2px solid #cbd5e0;
        border-radius: 6px;
        padding: 4px 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        color: #475569;
        margin: 0 3px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: inline-block;
    }
    body.dark-mode kbd {
        background: linear-gradient(135deg, #334155, #475569);
        border-color: #64748b;
        color: #e2e8f0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
  `
  document.head.appendChild(customSwalStyles)
})()

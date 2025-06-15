// Rashid's Compiler - Complete Version with All Fixes
;(() => {
  const Swal = window.Swal || null
  const Prism = window.Prism || null

  class RashidsCompiler {
    constructor() {
      console.log("🚀 Initializing Rashid's Compiler...")
      this.initializeElements()
      this.initializeTheme() // Call before setupEventListeners that might use theme
      this.setupEventListeners()
      this.setupAdvancedAutoClosing()
      this.setupBracketMatching()
      this.loadDefaultCode()
      this.updateLineNumbers()
      this.updateStats()
      this.updateSyntaxHighlighting() // Initial highlight

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
      this.themeSwitcher = document.getElementById("themeSwitcher") // Assumes this ID exists
      this.loadingOverlay = document.getElementById("loadingOverlay")
      this.executionTimeEl = document.getElementById("executionTime") // Renamed for clarity
      this.executionStatusEl = document.getElementById("executionStatus") // Renamed for clarity
      this.lineNumbersContainer = document.getElementById("lineNumbers")
      this.lineCountEl = document.getElementById("lineCount")
      this.charCountEl = document.getElementById("charCount")
      this.wordCountEl = document.getElementById("wordCount") // Make sure this ID exists in your HTML

      // Prism theme links - ensure these IDs are in your HTML
      this.prismThemeLightLink = document.getElementById("prism-theme-light")
      this.prismThemeDarkLink = document.getElementById("prism-theme-dark")
      console.log("✅ Elements initialized")
    }

    initializeTheme() {
      console.log("🎨 Initializing theme system...")
      const savedTheme = localStorage.getItem("rashids-compiler-theme")
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

      let initialThemeIsDark = prefersDark // Default to system preference

      if (savedTheme === "dark-mode") {
        initialThemeIsDark = true
      } else if (savedTheme === "light-mode") {
        initialThemeIsDark = false
      }
      // If no savedTheme, initialThemeIsDark remains system preference

      this.setTheme(initialThemeIsDark, false) // Set theme without animation initially

      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        // Only update if no theme has been manually set by the user
        if (!localStorage.getItem("rashids-compiler-theme")) {
          this.setTheme(e.matches, false) // No animation for system changes
        }
      })
      console.log("🎨 Theme system initialized")
    }

    setTheme(isDarkMode, animate = true) {
      const htmlElement = document.documentElement

      if (animate) {
        // Add a temporary transition class for body background
        document.body.style.transition = "background-color 0.5s ease, color 0.5s ease"
      }

      htmlElement.classList.remove("light-mode", "dark-mode")
      htmlElement.classList.add(isDarkMode ? "dark-mode" : "light-mode")

      // Update body classes too if specific body styles depend on it, though html class is preferred
      document.body.classList.remove("light-mode", "dark-mode")
      document.body.classList.add(isDarkMode ? "dark-mode" : "light-mode")

      if (this.themeSwitcher) {
        const icon = this.themeSwitcher.querySelector("i")
        const text = this.themeSwitcher.querySelector("span")
        if (icon && text) {
          icon.className = isDarkMode ? "fas fa-sun" : "fas fa-moon"
          text.textContent = isDarkMode ? "Light" : "Dark"
        }
      }

      if (this.prismThemeLightLink && this.prismThemeDarkLink) {
        this.prismThemeLightLink.disabled = isDarkMode
        this.prismThemeDarkLink.disabled = !isDarkMode
      }

      // Update syntax highlighting after theme change
      // Use a small timeout to ensure CSS is applied
      setTimeout(() => {
        this.updateSyntaxHighlighting()
        if (animate) {
          document.body.style.transition = "" // Remove temporary transition
        }
      }, 50)

      console.log(isDarkMode ? "🌙 Dark mode set" : "☀️ Light mode set")
    }

    animateThemeTransition() {
      this.createThemeRipple() // Optional: visual effect

      const currentThemeIsDark = document.documentElement.classList.contains("dark-mode")
      const newThemeIsDark = !currentThemeIsDark

      this.setTheme(newThemeIsDark, true) // Apply theme with animation flag
      localStorage.setItem("rashids-compiler-theme", newThemeIsDark ? "dark-mode" : "light-mode")
      this.showThemeChangeNotification(newThemeIsDark)
    }

    createThemeRipple() {
      // This is a visual flair, ensure it doesn't break anything if removed.
      const ripple = document.createElement("div")
      const currentBg = getComputedStyle(document.body).backgroundColor
      const rippleColor = document.documentElement.classList.contains("dark-mode")
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.1)"

      ripple.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: ${rippleColor};
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 9999;
        opacity: 1;
      `
      // Keyframes need to be in CSS or injected into a <style> tag
      // For simplicity, this effect might be better handled with CSS transitions on a pseudo-element if possible
      // Or ensure the keyframes are globally available.
      // For now, let's make it simpler:
      document.body.appendChild(ripple)

      requestAnimationFrame(() => {
        ripple.style.transition =
          "width 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), height 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        ripple.style.width = "250vmax"
        ripple.style.height = "250vmax"
        ripple.style.opacity = "0"
      })

      setTimeout(() => {
        if (document.body.contains(ripple)) document.body.removeChild(ripple)
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
            // case "s": // This is handled by storage.js now
            //   e.preventDefault()
            //   this.downloadCode() // Or trigger save modal from storage.js
            //   break;
            case "d": // Keep for theme toggle if not conflicting
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
        const indent = "  " // Using 2 spaces for indent

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
            // Also handle tab character for unindent
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

      // Adjust selection
      if (unindent) {
        this.codeEditor.selectionStart = Math.max(
          lineStartIndex,
          start -
            (lines.filter((line) => line.startsWith(indentChars) || line.startsWith("\t")).length *
              indentChars.length) /
              lines.length,
        ) // Approximate
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
      const indentUnit = "  " // 2 spaces

      const charBefore = value[cursorPos - 1]
      const charAfter = value[cursorPos]

      let newText = "\n" + indent

      if (
        (charBefore === "{" && charAfter === "}") ||
        (charBefore === "[" && charAfter === "]") ||
        (charBefore === "(" && charAfter === ")")
      ) {
        newText = "\n" + indent + indentUnit + "\n" + indent
        this.codeEditor.value = value.substring(0, cursorPos) + newText + value.substring(cursorPos)
        this.codeEditor.selectionStart = this.codeEditor.selectionEnd =
          cursorPos + 1 + indent.length + indentUnit.length
      } else {
        if (/[{[(:]\s*$/.test(currentLine.trim())) {
          // If line ends with an opening bracket or colon
          indent += indentUnit
        }
        newText = "\n" + indent
        this.codeEditor.value = value.substring(0, cursorPos) + newText + value.substring(cursorPos)
        this.codeEditor.selectionStart = this.codeEditor.selectionEnd = cursorPos + newText.length
      }
    }

    highlightMatchingBrackets() {
      this.clearBracketHighlights(true) // silent clear
      if (!this.codeEditor || !this.codeEditor.value || !this.codeHighlight) return

      const cursorPos = this.codeEditor.selectionStart
      const code = this.codeEditor.value
      const charBeforeCursor = code[cursorPos - 1]
      const charAtCursor = code[cursorPos] // For checking if cursor is *before* an opening bracket

      let openBracketChar, closeBracketChar, searchForward, startPos

      // Check if cursor is right after a closing bracket or right before an opening bracket
      if (this.matchingBrackets[charBeforeCursor] && !["(", "[", "{"].includes(charBeforeCursor)) {
        // After a closing bracket
        closeBracketChar = charBeforeCursor
        openBracketChar = this.matchingBrackets[closeBracketChar]
        searchForward = false // Search backwards for the open bracket
        startPos = cursorPos - 1
      } else if (this.matchingBrackets[charAtCursor] && ["(", "[", "{"].includes(charAtCursor)) {
        // Before an opening bracket
        openBracketChar = charAtCursor
        closeBracketChar = this.matchingBrackets[openBracketChar]
        searchForward = true // Search forwards for the close bracket
        startPos = cursorPos
      } else {
        return // No bracket to match at cursor position
      }

      let balance = 0
      let foundPos = -1

      if (searchForward) {
        for (let i = startPos; i < code.length; i++) {
          if (code[i] === openBracketChar) balance++
          else if (code[i] === closeBracketChar) balance--
          if (balance === 0 && code[i] === closeBracketChar) {
            foundPos = i
            break
          }
        }
      } else {
        // Search backward
        for (let i = startPos; i >= 0; i--) {
          if (code[i] === closeBracketChar) balance++
          else if (code[i] === openBracketChar) balance--
          if (balance === 0 && code[i] === openBracketChar) {
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
      // This function needs to actually add a visible style.
      // Since we are using Prism, modifying the DOM inside the <pre> is tricky.
      // A simpler approach for now is to log, or use a more advanced editor library.
      // For a visual effect without complex DOM manipulation:
      // Create temporary span elements absolutely positioned over the characters.
      // This is complex to get right with scrolling and character widths.
      // For now, let's keep it as a placeholder for future enhancement or rely on editor features.
      // console.log(`Visually highlight bracket at: ${pos}`);
      // A simple way: add a class to the main editor temporarily
      if (this.codeHighlight) {
        // This is a placeholder for a more robust solution
        // For a real implementation, you'd need to calculate char positions
        // and overlay spans or use a library that supports this.
      }
    }

    clearBracketHighlights(silent = false) {
      // Placeholder for clearing visual highlights
      if (!silent) {
        // console.log("Clearing bracket highlights");
      }
    }

    updateLineNumbers() {
      if (!this.lineNumbersContainer || !this.codeEditor) return
      const code = this.codeEditor.value
      const lines = code.split("\n")
      const lineCount = Math.max(lines.length, 1) // Ensure at least one line number

      // Efficiently update line numbers
      const currentLineNumberElements = this.lineNumbersContainer.children.length
      if (currentLineNumberElements < lineCount) {
        const fragment = document.createDocumentFragment()
        for (let i = currentLineNumberElements; i < lineCount; i++) {
          const div = document.createElement("div")
          div.textContent = i + 1
          fragment.appendChild(div)
        }
        this.lineNumbersContainer.appendChild(fragment)
      } else if (currentLineNumberElements > lineCount) {
        for (let i = currentLineNumberElements - 1; i >= lineCount; i--) {
          this.lineNumbersContainer.removeChild(this.lineNumbersContainer.lastChild)
        }
      }
      // Update text content if numbers changed (e.g., after deleting lines in middle)
      // This is simplified; a full diff would be more complex.
      // For now, this handles adding/removing at end.
      // If lines are deleted from middle, existing divs might have wrong numbers.
      // A more robust way:
      // this.lineNumbersContainer.innerHTML = '';
      // for (let i = 0; i < lineCount; i++) {
      //    this.lineNumbersContainer.innerHTML += `<div>${i + 1}</div>`;
      // }
      // But the add/remove at end is more performant for typing.
      // Let's ensure all numbers are correct:
      for (let i = 0; i < lineCount; i++) {
        if (this.lineNumbersContainer.children[i]) {
          this.lineNumbersContainer.children[i].textContent = i + 1
        }
      }

      this.syncScroll() // Ensure scroll is synced after line number changes
    }

    updateStats() {
      if (!this.codeEditor || !this.lineCountEl || !this.charCountEl || !this.wordCountEl) return
      const code = this.codeEditor.value
      const lines = code.split("\n").length
      const chars = code.length
      const words = code.trim() ? code.trim().split(/\s+/).filter(Boolean).length : 0

      this.lineCountEl.textContent = `Lines: ${lines}`
      this.charCountEl.textContent = `Chars: ${chars}`
      this.wordCountEl.textContent = `Words: ${words}`
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
        this.codeEditor.value = `// Welcome to Rashid's Compiler!\n// Select a language and start coding.\n// Default code for ${language} not found.`
      }
      this.autoInsertedChars.clear()
      this.handleEditorInput() // This will trigger highlight, line numbers, stats
    }

    updateSyntaxHighlighting() {
      if (!this.codeEditor || !this.codeHighlight || !this.languageSelect || !Prism) return
      const code = this.codeEditor.value
      const language = this.languageSelect.value

      // Map to Prism's language classes. 'c' uses 'clike'.
      let prismLanguage
      switch (language) {
        case "c":
          prismLanguage = "c" // Prism has 'c' directly
          break
        case "cpp":
          prismLanguage = "cpp"
          break
        case "csharp":
          prismLanguage = "csharp"
          break
        case "java":
          prismLanguage = "java"
          break
        case "python":
          prismLanguage = "python"
          break
        case "javascript":
          prismLanguage = "javascript"
          break
        case "html":
          prismLanguage = "markup" // Prism uses 'markup' for HTML
          break
        case "dart":
          prismLanguage = "dart"
          break
        default:
          prismLanguage = "clike" // Fallback
      }

      const codeElement = this.codeHighlight.querySelector("code")

      if (codeElement) {
        codeElement.className = `language-${prismLanguage}`
        codeElement.textContent = code // Set text content for Prism to highlight
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

      this.showLoading(true, "Compiling & Running...")
      this.runBtn.disabled = true
      this.runBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...'
      if (this.executionStatusEl) {
        this.executionStatusEl.textContent = "Running..."
        this.executionStatusEl.className = "status-running"
      }
      const requestStartTime = performance.now()

      try {
        const response = await fetch("/api/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, code, input }),
        })
        const result = await response.json()

        // Use executionTime from backend if available, otherwise calculate frontend perceived time
        const executionTimeMs = result.data?.executionTime ?? performance.now() - requestStartTime
        this.displayResult(result, Math.round(executionTimeMs))

        if (result.success) {
          this.showSuccessNotification(`Code executed successfully!`)
        } else {
          // Error already displayed by displayResult
        }
      } catch (error) {
        console.error("❌ Network or fetch error:", error)
        this.displayResult({ success: false, error: "Network error or server unavailable. " + error.message }, 0)
      } finally {
        this.showLoading(false)
        this.runBtn.disabled = false
        this.runBtn.innerHTML = '<i class="fas fa-play"></i> Run'
      }
    }

    displayResult(result, executionTimeMs) {
      console.log("Received result:", result) // Log the full result for debugging
      if (this.executionTimeEl) this.executionTimeEl.textContent = `Time: ${executionTimeMs}ms`

      if (this.executionStatusEl) {
        this.executionStatusEl.textContent = result.success ? "Success" : "Error"
        this.executionStatusEl.className = result.success ? "status-success" : "status-error"
      }

      if (this.outputArea) {
        if (result.success) {
          this.outputArea.textContent = result.data?.output || "Execution successful, no output."
          if (result.data?.language === "html" && result.data?.output) {
            // Handle HTML preview
            try {
              const previewWindow = window.open("", "_blank")
              if (previewWindow) {
                previewWindow.document.write(result.data.output)
                previewWindow.document.close()
                this.outputArea.textContent =
                  "HTML preview opened in a new tab. Raw HTML also shown if it's not pure HTML content."
              } else {
                this.outputArea.textContent =
                  "HTML Output:\n" + result.data.output + "\n\n(Popup blocked? Could not open preview tab.)"
              }
            } catch (e) {
              console.error("Error opening HTML preview:", e)
              this.outputArea.textContent = "HTML Output (preview failed to open):\n" + result.data.output
            }
          }
        } else {
          // Prioritize specific error fields from backend
          let errorMessage = "Execution failed."
          if (result.error) {
            // Main error message from backend's 'error' field
            errorMessage = result.error
          } else if (result.message) {
            // Fallback to 'message' field
            errorMessage = result.message
          } else if (result.details) {
            // For validation errors
            errorMessage = result.details.map((d) => d.msg || d.message).join("; ")
          }

          this.outputArea.textContent = `Error: ${errorMessage}`
          if (result.stderr) {
            // Append stderr if available
            this.outputArea.textContent += `\n\nDetails:\n${result.stderr}`
          }
        }
      }
    }

    showLoading(show, message = "Processing...") {
      if (this.loadingOverlay) {
        const textEl = this.loadingOverlay.querySelector(".loading-text h3") // Ensure this selector is correct
        if (textEl) textEl.textContent = message
        this.loadingOverlay.style.display = show ? "flex" : "none"
      }
    }

    clearCode() {
      if (Swal) {
        Swal.fire({
          title: "🗑️ Clear All?",
          text: "This will clear the editor, input, and output. This action cannot be undone.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "var(--accent-danger, #dc3545)",
          cancelButtonColor: "var(--text-secondary, #6c757d)",
          confirmButtonText: "Yes, clear it!",
          background: document.documentElement.classList.contains("dark-mode")
            ? "var(--bg-tertiary, #21262d)"
            : "var(--bg-primary, #ffffff)",
          color: document.documentElement.classList.contains("dark-mode")
            ? "var(--text-primary, #c9d1d9)"
            : "var(--text-primary, #212529)",
        }).then((result) => {
          if (result.isConfirmed) this.performClear()
        })
      } else {
        if (confirm("Are you sure you want to clear everything?")) this.performClear()
      }
    }

    performClear() {
      if (this.codeEditor) this.codeEditor.value = ""
      if (this.inputArea) this.inputArea.value = ""
      if (this.outputArea) this.outputArea.textContent = "🎉 Welcome to Rashid's Compiler! Output will appear here."
      if (this.executionTimeEl) this.executionTimeEl.textContent = "Time: 0ms"
      if (this.executionStatusEl) {
        this.executionStatusEl.textContent = "Waiting"
        this.executionStatusEl.className = "status-waiting"
      }
      this.autoInsertedChars.clear()
      this.handleEditorInput() // Update stats, line numbers, highlight
      this.showSuccessToast("🧹 Editor cleared!")
      if (window.codeStorage) {
        // If storage module is present
        window.codeStorage.currentCodeId = null
        window.codeStorage.updateFileName("Untitled Code")
      }
    }

    async copyCode() {
      if (!this.codeEditor || !this.codeEditor.value.trim()) {
        this.showInfoAlert("No Code to Copy", "The editor is empty. Write some code first!")
        return
      }
      try {
        await navigator.clipboard.writeText(this.codeEditor.value)
        this.showSuccessToast("📋 Code copied to clipboard!")
      } catch (err) {
        // Fallback for older browsers or if clipboard API fails
        this.codeEditor.select()
        document.execCommand("copy") // Deprecated but good fallback
        this.showSuccessToast("📋 Code copied (fallback method)!")
      }
    }

    downloadCode() {
      if (!this.codeEditor || !this.languageSelect || !this.codeEditor.value.trim()) {
        this.showInfoAlert("No Code to Download", "The editor is empty. Write some code first.")
        return
      }
      const language = this.languageSelect.value
      const code = this.codeEditor.value
      const extensions = {
        javascript: ".js",
        python: ".py",
        c: ".c",
        java: ".java",
        dart: ".dart",
        html: ".html",
        cpp: ".cpp",
        csharp: ".cs",
      }
      const filename = `rashids_code_${Date.now()}${extensions[language] || ".txt"}`
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
      // Basic formatter - can be improved with Prettier or language-specific tools
      if (!this.codeEditor || !this.codeEditor.value.trim()) {
        this.showInfoAlert("No Code to Format", "The editor is empty.")
        return
      }

      const code = this.codeEditor.value
      // This is a very naive formatter. For real formatting, integrate a library like Prettier.
      // For demonstration, let's try a simple indent adjustment.
      const lines = code.split("\n")
      let indentLevel = 0
      const indentUnit = "  " // 2 spaces
      const formattedCode = lines
        .map((line) => {
          const trimmedLine = line.trim()
          if (trimmedLine.match(/[}\]]$/)) {
            // If line ends with } or ]
            indentLevel = Math.max(0, indentLevel - 1)
          }
          const indentedLine = indentUnit.repeat(indentLevel) + trimmedLine
          if (trimmedLine.match(/[{[]$/)) {
            // If line ends with { or [
            indentLevel++
          }
          return indentedLine
        })
        .join("\n")

      this.codeEditor.value = formattedCode
      this.handleEditorInput() // Update UI
      this.showSuccessToast("✨ Code formatted (basic)!")
    }

    toggleComment() {
      if (!this.codeEditor) return
      const cursorPos = this.codeEditor.selectionStart
      const value = this.codeEditor.value
      const language = this.languageSelect.value

      const commentChars = {
        javascript: "//",
        python: "#",
        c: "//",
        java: "//",
        dart: "//",
        cpp: "//",
        csharp: "//",
        html: "<!-- -->", // HTML is special
      }

      const commentChar = commentChars[language] || "//"
      const lineStart = value.lastIndexOf("\n", cursorPos - 1) + 1
      const lineEnd = value.indexOf("\n", cursorPos)
      const currentLineText = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd)

      let newLineText
      const indentMatch = currentLineText.match(/^\s*/)
      const indent = indentMatch ? indentMatch[0] : ""
      const lineContent = currentLineText.substring(indent.length)

      if (language === "html") {
        if (lineContent.startsWith("<!--") && lineContent.endsWith("-->")) {
          newLineText = indent + lineContent.substring(4, lineContent.length - 3).trim()
        } else {
          newLineText = indent + "<!-- " + lineContent + " -->"
        }
      } else {
        if (lineContent.startsWith(commentChar)) {
          newLineText = indent + lineContent.substring(commentChar.length).trimStart()
        } else {
          newLineText = indent + commentChar + " " + lineContent
        }
      }

      this.codeEditor.value =
        value.substring(0, lineStart) + newLineText + value.substring(lineEnd === -1 ? value.length : lineEnd)
      this.codeEditor.selectionStart = this.codeEditor.selectionEnd =
        cursorPos + (newLineText.length - currentLineText.length)
      this.handleEditorInput()
    }

    showFindDialog() {
      if (Swal) {
        Swal.fire({
          title: "🔍 Find in Code",
          input: "text",
          inputPlaceholder: "Enter text to search...",
          showCancelButton: true,
          confirmButtonText: "Find Next",
          cancelButtonText: "Cancel",
          background: document.documentElement.classList.contains("dark-mode")
            ? "var(--bg-tertiary)"
            : "var(--bg-primary)",
          color: document.documentElement.classList.contains("dark-mode")
            ? "var(--text-primary)"
            : "var(--text-primary)",
          inputValidator: (value) => {
            if (!value) {
              return "You need to write something to search!"
            }
          },
        }).then((result) => {
          if (result.isConfirmed && result.value) {
            this.findInCode(result.value)
          }
        })
      }
    }

    findInCode(searchText, startIndex = -1) {
      if (!this.codeEditor || !searchText) return
      const code = this.codeEditor.value
      const searchFrom = startIndex === -1 ? this.codeEditor.selectionEnd || 0 : startIndex

      const index = code.toLowerCase().indexOf(searchText.toLowerCase(), searchFrom)

      if (index !== -1) {
        this.codeEditor.focus()
        this.codeEditor.selectionStart = index
        this.codeEditor.selectionEnd = index + searchText.length

        // Scroll into view
        const textLines = code.substring(0, index).split("\n").length
        const lineHeight = Number.parseFloat(getComputedStyle(this.codeEditor).lineHeight)
        this.codeEditor.scrollTop = (textLines - 5) * lineHeight // Scroll to a bit above the line

        // Option to find next
        // You might store searchText and lastFoundIndex for a "Find Next" feature
      } else {
        if (startIndex !== -1) {
          // If we were already searching and found nothing more
          this.showInfoAlert("End of Document", `No more occurrences of "${searchText}" found.`)
        } else {
          this.showInfoAlert("Not Found", `"${searchText}" was not found in the code.`)
        }
      }
    }

    showWelcomeMessage() {
      if (Swal && !localStorage.getItem("rashidsCompilerWelcomeShown")) {
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
                <li>⚡ Smart indentation and formatting (basic)</li>
                <li>🔍 Find functionality (Ctrl+F)</li>
                <li>💾 Download and copy features</li>
                <li>📚 Code Saving & Library (Ctrl+S, Ctrl+O, Ctrl+L)</li>
              </ul>
              
              <p><strong>⌨️ Keyboard Shortcuts:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><kbd>Ctrl+Enter</kbd> - Run code</li>
                <li><kbd>Ctrl+S</kbd> - Save code</li>
                <li><kbd>Ctrl+O</kbd> - Load code</li>
                <li><kbd>Ctrl+L</kbd> - Open Library</li>
                <li><kbd>Ctrl+D</kbd> - Toggle theme</li>
                <li><kbd>Ctrl+/</kbd> - Toggle comment</li>
                <li><kbd>Ctrl+F</kbd> - Find in code</li>
                <li><kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> - Indent/Unindent</li>
              </ul>
            </div>
          `,
          icon: "info",
          confirmButtonText: "Start Coding! 💻",
          confirmButtonColor: "var(--accent-primary, #007bff)",
          background: document.documentElement.classList.contains("dark-mode")
            ? "var(--bg-tertiary)"
            : "var(--bg-primary)",
          color: document.documentElement.classList.contains("dark-mode")
            ? "var(--text-primary)"
            : "var(--text-primary)",
          width: "600px",
        }).then(() => {
          localStorage.setItem("rashidsCompilerWelcomeShown", "true")
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
      // General success, non-toast
      if (Swal) {
        Swal.fire({
          icon: "success",
          title: message,
          toast: false, // Make it a modal, not a toast
          position: "center",
          showConfirmButton: true, // User needs to acknowledge
          timer: null, // No auto-close
          confirmButtonColor: "var(--accent-success, #28a745)",
          background: document.documentElement.classList.contains("dark-mode")
            ? "var(--bg-tertiary)"
            : "var(--bg-primary)",
          color: document.documentElement.classList.contains("dark-mode")
            ? "var(--text-primary)"
            : "var(--text-primary)",
        })
      }
    }

    showSuccessToast(message) {
      if (Swal) {
        const Toast = Swal.mixin({
          toast: true,
          position: "bottom-end",
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true,
          background: document.documentElement.classList.contains("dark-mode")
            ? "var(--bg-secondary)"
            : "var(--bg-tertiary)",
          color: document.documentElement.classList.contains("dark-mode")
            ? "var(--text-primary)"
            : "var(--text-primary)",
          didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer)
            toast.addEventListener("mouseleave", Swal.resumeTimer)
          },
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
          confirmButtonColor: "var(--accent-info, #17a2b8)",
          background: document.documentElement.classList.contains("dark-mode")
            ? "var(--bg-tertiary)"
            : "var(--bg-primary)",
          color: document.documentElement.classList.contains("dark-mode")
            ? "var(--text-primary)"
            : "var(--text-primary)",
        })
      }
    }
  } // End of RashidsCompiler class

  document.addEventListener("DOMContentLoaded", () => {
    try {
      window.rashidsCompiler = new RashidsCompiler()
    } catch (error) {
      console.error("❌ FATAL: Failed to initialize Rashid's Compiler:", error)
      document.body.innerHTML = `<div style="color: red; text-align: center; padding: 50px; font-family: sans-serif;">
        <h1>Error Initializing Editor</h1><p>Something went wrong. Please try refreshing the page or check the console for details.</p>
        <pre style="text-align: left; background: #f0f0f0; padding: 10px; border-radius: 5px; color: #333; white-space: pre-wrap;">${error.stack || error.message}</pre>
      </div>`
    }
  })

  // Ensure custom Swal styles are applied (from your previous script)
  const customSwalStyles = document.createElement("style")
  customSwalStyles.textContent = `
    .swal2-popup {
        border-radius: var(--radius-lg, 12px) !important;
        font-family: var(--font-sans, "Inter", sans-serif) !important;
        box-shadow: var(--shadow-xl, 0 20px 25px rgba(0,0,0,0.15)) !important;
        background-color: var(--bg-primary) !important;
        color: var(--text-primary) !important;
    }
    .swal2-title {
        font-weight: 600 !important;
        font-size: 1.3rem !important;
        color: var(--text-primary) !important;
    }
    .swal2-html-container {
        font-size: 0.95rem !important;
        color: var(--text-secondary) !important;
    }
    .swal2-confirm, .swal2-cancel, .swal2-deny {
        border-radius: var(--radius, 8px) !important;
        font-weight: 500 !important;
        padding: 10px 20px !important;
    }
    .swal2-toast {
        box-shadow: var(--shadow-lg, 0 10px 15px rgba(0,0,0,0.1)) !important;
        border-radius: var(--radius, 8px) !important;
        background-color: var(--bg-secondary) !important;
        color: var(--text-primary) !important;
    }
    kbd {
        background: linear-gradient(135deg, var(--bg-tertiary, #e9ecef), var(--bg-secondary, #f8f9fa));
        border: 1px solid var(--border-color, #dee2e6);
        border-radius: 6px;
        padding: 4px 8px;
        font-family: var(--font-mono, "JetBrains Mono", monospace);
        font-size: 11px;
        font-weight: 600;
        color: var(--text-secondary, #6c757d);
        margin: 0 3px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: inline-block;
    }
    html.dark-mode kbd { /* More specific for dark mode */
        background: linear-gradient(135deg, #334155, #475569);
        border-color: #64748b;
        color: #e2e8f0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
  `
  document.head.appendChild(customSwalStyles)
})()

class CompilerApp {
  constructor() {
    this.initializeElements()
    this.setupEventListeners()
    this.loadDefaultCode()
    this.updateSyntaxHighlighting()
    this.showWelcomeMessage()
    this.setupLineNumbers()
  }

  initializeElements() {
    this.languageSelect = document.getElementById("language")
    this.codeEditor = document.getElementById("codeEditor")
    this.codeHighlight = document.getElementById("codeHighlight")
    this.inputArea = document.getElementById("inputArea")
    this.outputArea = document.getElementById("outputArea")
    this.errorArea = document.getElementById("errorArea")
    this.runBtn = document.getElementById("runBtn")
    this.clearBtn = document.getElementById("clearBtn")
    this.copyBtn = document.getElementById("copyBtn")
    this.downloadBtn = document.getElementById("downloadBtn")
    this.fullscreenBtn = document.getElementById("fullscreenBtn")
    this.loadingOverlay = document.getElementById("loadingOverlay")
    this.executionTime = document.getElementById("executionTime")
    this.executionStatus = document.getElementById("executionStatus")
    this.tabBtns = document.querySelectorAll(".tab-btn")
    this.tabPanes = document.querySelectorAll(".tab-pane")
    this.editorContainer = document.querySelector(".editor-container")
  }

  setupEventListeners() {
    // Language selection
    this.languageSelect.addEventListener("change", () => {
      this.loadDefaultCode()
      this.updateSyntaxHighlighting()
      this.showLanguageChangeNotification()
    })

    // Code editor
    this.codeEditor.addEventListener("input", () => {
      this.updateSyntaxHighlighting()
      this.updateLineNumbers()
    })

    this.codeEditor.addEventListener("scroll", () => {
      this.codeHighlight.scrollTop = this.codeEditor.scrollTop
      this.codeHighlight.scrollLeft = this.codeEditor.scrollLeft
      if (this.lineNumbers) {
        this.lineNumbers.scrollTop = this.codeEditor.scrollTop
      }
    })

    this.codeEditor.addEventListener("keydown", (e) => {
      this.handleKeyDown(e)
    })

    // Enhanced focus and blur events
    this.codeEditor.addEventListener("focus", () => {
      this.codeEditor.style.color = "#ffffff"
      this.codeEditor.style.caretColor = "#4ade80"
    })

    this.codeEditor.addEventListener("blur", () => {
      this.codeEditor.style.color = "#ffffff"
    })

    // Buttons
    this.runBtn.addEventListener("click", () => this.runCode())
    this.clearBtn.addEventListener("click", () => this.clearCode())
    this.copyBtn.addEventListener("click", () => this.copyCode())
    this.downloadBtn.addEventListener("click", () => this.downloadCode())
    this.fullscreenBtn.addEventListener("click", () => this.toggleFullscreen())

    // Tabs
    this.tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabName = btn.dataset.tab
        this.switchTab(tabName)
      })
    })

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "Enter":
            e.preventDefault()
            this.runCode()
            break
          case "s":
            e.preventDefault()
            this.downloadCode()
            break
          case "`":
            e.preventDefault()
            this.clearCode()
            break
        }
      }
      
      // F11 for fullscreen
      if (e.key === "F11") {
        e.preventDefault()
        this.toggleFullscreen()
      }
    })
  }

  setupLineNumbers() {
    // Create line numbers container
    this.lineNumbers = document.createElement('div')
    this.lineNumbers.className = 'line-numbers'
    this.editorContainer.appendChild(this.lineNumbers)
    
    // Add line numbers rows container
    this.lineNumbersRows = document.createElement('div')
    this.lineNumbersRows.className = 'line-numbers-rows'
    this.lineNumbers.appendChild(this.lineNumbersRows)
    
    // Add class to code editor and highlight
    this.codeEditor.classList.add('editor-with-line-numbers')
    this.codeHighlight.classList.add('editor-with-line-numbers')
    
    // Initial line numbers
    this.updateLineNumbers()
  }

  updateLineNumbers() {
    const code = this.codeEditor.value
    const lines = code.split('\n')
    const lineCount = lines.length
    
    // Clear existing line numbers
    this.lineNumbersRows.innerHTML = ''
    
    // Add new line numbers
    for (let i = 1; i <= lineCount; i++) {
      const lineNumber = document.createElement('div')
      lineNumber.className = 'line-number'
      lineNumber.textContent = i
      this.lineNumbersRows.appendChild(lineNumber)
    }
  }

  showWelcomeMessage() {
    Swal.fire({
      title: '🎉 Welcome to CodeCraft!',
      html: `
        <div style="text-align: left; font-size: 14px; line-height: 1.6;">
          <p><strong>🚀 Quick Start:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Select your programming language</li>
            <li>Write or edit the sample code</li>
            <li>Click "Run Code" or press <kbd>Ctrl+Enter</kbd></li>
          </ul>
          
          <p><strong>⌨️ Keyboard Shortcuts:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li><kbd>Ctrl+Enter</kbd> - Run code</li>
            <li><kbd>Ctrl+S</kbd> - Download code</li>
            <li><kbd>Tab</kbd> - Add indentation</li>
            <li><kbd>F11</kbd> - Toggle fullscreen</li>
          </ul>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Let\'s Code! 💻',
      confirmButtonColor: '#667eea',
      background: '#fff',
      customClass: {
        popup: 'swal-custom-popup'
      }
    })
  }

  showLanguageChangeNotification() {
    const language = this.languageSelect.value
    const languageEmojis = {
      javascript: '🟨',
      python: '🐍',
      c: '⚡',
      java: '☕',
      dart: '🎯'
    }
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      icon: 'success',
      title: `${languageEmojis[language]} Switched to ${language.charAt(0).toUpperCase() + language.slice(1)}`,
      background: '#fff',
      color: '#333'
    })
  }

  loadDefaultCode() {
    const language = this.languageSelect.value
    if (window.defaultCode && window.defaultCode[language]) {
      this.codeEditor.value = window.defaultCode[language]
      this.updateSyntaxHighlighting()
      this.updateLineNumbers()
    }
  }

  updateSyntaxHighlighting() {
    const code = this.codeEditor.value
    const language = this.languageSelect.value

    const languageMap = {
      javascript: "javascript",
      python: "python",
      c: "c",
      java: "java",
      dart: "dart",
    }

    const prismLanguage = languageMap[language] || "javascript"
    const codeElement = this.codeHighlight.querySelector("code")
    codeElement.className = `language-${prismLanguage}`
    codeElement.textContent = code

    if (window.Prism) {
      window.Prism.highlightElement(codeElement)
    }

    this.codeEditor.style.color = "#ffffff"
    this.codeEditor.style.caretColor = "#4ade80"
  }

  handleKeyDown(e) {
    if (e.key === "Tab") {
      e.preventDefault()
      const start = this.codeEditor.selectionStart
      const end = this.codeEditor.selectionEnd
      const value = this.codeEditor.value

      if (e.shiftKey) {
        const lineStart = value.lastIndexOf("\n", start - 1) + 1
        const lineText = value.substring(lineStart, start)
        if (lineText.startsWith("    ")) {
          this.codeEditor.value = value.substring(0, lineStart) + lineText.substring(4) + value.substring(start)
          this.codeEditor.selectionStart = start - 4
          this.codeEditor.selectionEnd = end - 4
        }
      } else {
        this.codeEditor.value = value.substring(0, start) + "    " + value.substring(end)
        this.codeEditor.selectionStart = this.codeEditor.selectionEnd = start + 4
      }

      this.updateSyntaxHighlighting()
      this.updateLineNumbers()
    }
  }

  async runCode() {
    const language = this.languageSelect.value
    const code = this.codeEditor.value.trim()
    const input = this.inputArea.value

    if (!code) {
      Swal.fire({
        icon: 'warning',
        title: 'No Code to Run',
        text: 'Please enter some code before running.',
        confirmButtonColor: '#667eea'
      })
      return
    }

    this.showLoading(true)
    this.runBtn.disabled = true
    this.runBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...'

    try {
      const response = await fetch("/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ language, code, input }),
      })

      const result = await response.json()
      this.displayResult(result)
      
      if (result.success) {
        this.showSuccessNotification(result.executionTime)
      }
    } catch (error) {
      this.showError("Network error: " + error.message)
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Failed to connect to the server. Please try again.',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      this.showLoading(false)
      this.runBtn.disabled = false
      this.runBtn.innerHTML = '<i class="fas fa-play"></i> Run Code'
    }
  }

  showSuccessNotification(executionTime) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      icon: 'success',
      title: `✅ Code executed successfully in ${executionTime}ms`,
      background: '#fff',
      color: '#333'
    })
  }

  displayResult(result) {
    if (result.executionTime !== undefined) {
      this.executionTime.innerHTML = `<i class="fas fa-clock"></i> ${result.executionTime}ms`
    }

    this.executionStatus.innerHTML = result.success 
      ? '<i class="fas fa-check-circle"></i> Success' 
      : '<i class="fas fa-times-circle"></i> Failed'
    this.executionStatus.className = result.success ? "success" : "error"

    this.outputArea.textContent = result.output || "No output generated"

    if (result.error) {
      this.errorArea.textContent = `❌ Error Details:\n\n${result.error}`
      this.switchTab("errors")
    } else {
      this.errorArea.textContent = "✅ No errors detected\n\nYour code compiled and ran successfully!"
      this.switchTab("output")
    }
  }

  showError(message) {
    this.outputArea.textContent = ""
    this.errorArea.textContent = `❌ ${message}`
    this.executionStatus.innerHTML = '<i class="fas fa-times-circle"></i> Error'
    this.executionStatus.className = "error"
    this.switchTab("errors")
  }

  showLoading(show) {
    this.loadingOverlay.style.display = show ? "flex" : "none"
  }

  clearCode() {
    Swal.fire({
      title: '🗑️ Clear Code?',
      text: "This will clear all your code and input. This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, clear it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.codeEditor.value = ""
        this.inputArea.value = ""
        this.outputArea.textContent = `🚀 Click "Run Code" to see your program output here...

💡 Tips:
• Use console.log() in JavaScript
• Use print() in Python  
• Use printf() in C
• Use System.out.println() in Java
• Use print() in Dart`
        this.errorArea.textContent = `✅ No errors detected

Your code will be checked for:
• Syntax errors
• Compilation errors  
• Runtime exceptions
• Timeout issues`
        this.executionTime.innerHTML = '<i class="fas fa-clock"></i> Ready'
        this.executionStatus.innerHTML = '<i class="fas fa-info-circle"></i> Waiting'
        this.executionStatus.className = ""
        this.updateSyntaxHighlighting()
        this.updateLineNumbers()
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          icon: 'success',
          title: '🧹 Code cleared successfully!',
          background: '#fff'
        })
      }
    })
  }

  async copyCode() {
    try {
      await navigator.clipboard.writeText(this.codeEditor.value)
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        icon: 'success',
        title: '📋 Code copied to clipboard!',
        background: '#fff'
      })
    } catch (error) {
      this.codeEditor.select()
      document.execCommand("copy")
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        icon: 'success',
        title: '📋 Code copied to clipboard!',
        background: '#fff'
      })
    }
  }

  downloadCode() {
    const language = this.languageSelect.value
    const code = this.codeEditor.value

    if (!code.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'No Code to Download',
        text: 'Please write some code before downloading.',
        confirmButtonColor: '#667eea'
      })
      return
    }

    const extensions = {
      javascript: ".js",
      python: ".py",
      c: ".c",
      java: ".java",
      dart: ".dart",
    }

    const filename = `code${extensions[language] || ".txt"}`
    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      icon: 'success',
      title: `💾 Code downloaded as ${filename}`,
      background: '#fff'
    })
  }

  toggleFullscreen() {
    const editorSection = document.querySelector('.editor-section')
    
    if (!document.fullscreenElement) {
      editorSection.requestFullscreen().then(() => {
        this.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>'
        editorSection.style.borderRadius = '0'
      }).catch(() => {
        Swal.fire({
          icon: 'error',
          title: 'Fullscreen Error',
          text: 'Unable to enter fullscreen mode.',
          confirmButtonColor: '#ef4444'
        })
      })
    } else {
      document.exitFullscreen().then(() => {
        this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>'
        editorSection.style.borderRadius = 'var(--radius-xl)'
      })
    }
  }

  switchTab(tabName) {
    this.tabBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName)
    })

    this.tabPanes.forEach((pane) => {
      pane.classList.toggle("active", pane.id === `${tabName}Tab`)
    })
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new CompilerApp()
})

// Add custom styles for SweetAlert2
const style = document.createElement('style')
style.textContent = `
  .swal-custom-popup {
    border-radius: 16px !important;
    font-family: 'Inter', sans-serif !important;
  }
  
  .swal2-popup {
    border-radius: 16px !important;
  }
  
  .swal2-title {
    font-weight: 600 !important;
  }
  
  kbd {
    background: #f1f5f9;
    border: 1px solid #cbd5e0;
    border-radius: 4px;
    padding: 2px 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #4a5568;
  }
`
document.head.appendChild(style)

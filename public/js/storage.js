// Storage functionality for Rashid's Compiler
class CodeStorage {
  constructor() {
    this.currentCodeId = null
    this.currentPage = 1
    this.codesPerPage = 10 // Default, can be adjusted
    this.setupEventListeners()
    console.log("📦 Code Storage initialized")
  }

  setupEventListeners() {
    // Save button
    document.getElementById("saveBtn")?.addEventListener("click", () => this.showSaveModal())

    // Load button
    document.getElementById("loadBtn")?.addEventListener("click", () => this.showLoadModal())

    // Library button
    document.getElementById("libraryBtn")?.addEventListener("click", () => this.showLibraryModal())

    // Save modal events
    document.getElementById("closeSaveModal")?.addEventListener("click", () => this.hideSaveModal())
    document.getElementById("cancelSave")?.addEventListener("click", () => this.hideSaveModal())
    document.getElementById("saveForm")?.addEventListener("submit", (e) => this.handleSaveCode(e))

    // Load modal events
    document.getElementById("closeLoadModal")?.addEventListener("click", () => this.hideLoadModal())
    document.getElementById("searchCodes")?.addEventListener("input", (e) => this.handleSearch(e, "load"))
    document.getElementById("filterLanguage")?.addEventListener("change", () => this.loadCodes())
    document.getElementById("sortBy")?.addEventListener("change", () => this.loadCodes())

    // Library modal events
    document.getElementById("closeLibraryModal")?.addEventListener("click", () => this.hideLibraryModal())
    document.getElementById("librarySearch")?.addEventListener("input", (e) => this.handleSearch(e, "library"))
    document.getElementById("libraryFilterLanguage")?.addEventListener("change", () => this.loadLibraryCodes())

    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.switchTab(e.target.dataset.tab))
    })

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault()
            this.showSaveModal()
            break
          case "o":
            e.preventDefault()
            this.showLoadModal()
            break
          case "l":
            e.preventDefault()
            this.showLibraryModal()
            break
        }
      }
    })

    // Close modals on overlay click
    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          this.hideAllModals()
        }
      })
    })
  }

  // Save Modal Functions
  showSaveModal() {
    const modal = document.getElementById("saveModal")
    if (modal) {
      modal.style.display = "flex"
      document.body.style.overflow = "hidden"

      const language = window.rashidsCompiler?.languageSelect.value || "javascript"
      const titleInput = document.getElementById("codeTitle")
      if (titleInput && !this.currentCodeId) {
        // Only prefill for new saves
        titleInput.value = `My ${language.charAt(0).toUpperCase() + language.slice(1)} Code - ${new Date().toLocaleTimeString()}`
      } else if (titleInput && this.currentCodeId) {
        // If editing, title should already be set or fetched
        // For now, let's assume it's pre-filled if currentCodeId exists
      }
      titleInput?.focus()
      titleInput?.select()
    }
  }

  hideSaveModal() {
    const modal = document.getElementById("saveModal")
    if (modal) {
      modal.style.display = "none"
      document.body.style.overflow = "auto"
      this.resetSaveForm()
    }
  }

  resetSaveForm() {
    const form = document.getElementById("saveForm")
    if (form) form.reset()
    // Reset currentCodeId if the form is for a new save, not an update
    // This logic might need refinement if "Save As" is different from "Save/Update"
    // For now, let's assume save modal always resets to new unless explicitly loading for update.
    // this.currentCodeId = null; // Reconsider this if update uses the same modal
  }

  async handleSaveCode(e) {
    e.preventDefault()

    const formData = new FormData(e.target)
    const { codeEditor, inputArea, languageSelect, outputArea } = window.rashidsCompiler

    if (!codeEditor?.value.trim()) {
      this.showError("Please write some code before saving.")
      return
    }

    const codeData = {
      title: formData.get("title") || `Untitled ${languageSelect.value} Code`,
      description: formData.get("description") || "",
      author: formData.get("author") || "Anonymous",
      language: languageSelect.value,
      code: codeEditor.value,
      input: inputArea?.value || "",
      output: outputArea?.textContent || "", // Or get from a more reliable source if output is complex
      isPublic: formData.get("isPublic") === "on",
      tags:
        formData
          .get("tags")
          ?.split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag) || [],
    }

    try {
      this.showLoading(this.currentCodeId ? "Updating code..." : "Saving code...")

      let response
      if (this.currentCodeId) {
        // Update existing code
        response = await fetch(`/api/codes/${this.currentCodeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(codeData),
        })
      } else {
        // Create new code
        response = await fetch("/api/codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(codeData),
        })
      }

      const result = await response.json()

      if (result.success) {
        this.currentCodeId = result.data._id // Update currentCodeId for both new and updated
        this.updateFileName(result.data.title)
        this.hideSaveModal()
        this.showSuccess(
          this.currentCodeId && response.method === "PUT"
            ? "Code updated successfully! ✨"
            : "Code saved successfully! 🎉",
        )
      } else {
        this.showError(
          result.message ||
            (Array.isArray(result.data)
              ? result.data.map((d) => d.msg || d.message).join(", ")
              : "Failed to save code"),
        )
      }
    } catch (error) {
      console.error("Save/Update error:", error)
      this.showError("Network error. Please try again.")
    } finally {
      this.hideLoading()
    }
  }

  // Load Modal Functions
  showLoadModal() {
    const modal = document.getElementById("loadModal")
    if (modal) {
      modal.style.display = "flex"
      document.body.style.overflow = "hidden"
      this.loadCodes() // Load initial set of codes
    }
  }

  hideLoadModal() {
    const modal = document.getElementById("loadModal")
    if (modal) {
      modal.style.display = "none"
      document.body.style.overflow = "auto"
    }
  }

  async loadCodes(page = 1) {
    this.currentPage = page // Store current page for pagination and delete refresh
    const codesList = document.getElementById("codesList")
    const language = document.getElementById("filterLanguage")?.value
    const search = document.getElementById("searchCodes")?.value
    const sortBy = document.getElementById("sortBy")?.value.split("_")[0] || "createdAt"
    const sortOrder = document.getElementById("sortBy")?.value.split("_")[1] || "desc"

    const Swal = window.Swal // Declare Swal variable
    const Prism = window.Prism // Declare Prism variable

    if (!codesList) return

    codesList.innerHTML = `<div class="loading-codes"><i class="fas fa-spinner fa-spin"></i><span>Loading your codes...</span></div>`

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: this.codesPerPage.toString(),
        isPublic: "false", // For "Load" modal, show user's own codes (public and private)
        // This requires authentication in a real app. For now, it shows all.
      })

      if (language && language !== "all") params.append("language", language)
      if (search) params.append("search", search)
      if (sortBy) params.append("sortBy", sortBy)
      if (sortOrder) params.append("sortOrder", sortOrder)

      const response = await fetch(`/api/codes?${params.toString()}`)
      const result = await response.json()

      if (result.success && result.data.codes) {
        this.renderCodesList(result.data.codes, "codesList")
        this.renderPagination(result.data.pagination, "loadCodes")
      } else {
        codesList.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><span>${result.message || "Failed to load codes."}</span></div>`
      }
    } catch (error) {
      console.error("Load codes error:", error)
      codesList.innerHTML = `<div class="error-message"><i class="fas fa-server"></i><span>Network error or server issue. Please try again.</span></div>`
    }
  }

  renderCodesList(codes, listElementId) {
    const codesListEl = document.getElementById(listElementId)
    if (!codesListEl) return

    if (!codes || codes.length === 0) {
      codesListEl.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open"></i>
          <h3>No codes found</h3>
          <p>Try adjusting your search or filters, or save some new code!</p>
        </div>`
      return
    }

    codesListEl.innerHTML = codes
      .map(
        (code) => `
      <div class="code-item" data-id="${code._id}">
        <div class="code-header">
          <div class="code-title">
            <h4>${this.escapeHtml(code.title)}</h4>
            <span class="language-badge ${code.language.toLowerCase()}">${code.language}</span>
            ${code.isPublic ? '<span class="privacy-badge public"><i class="fas fa-globe-americas"></i> Public</span>' : '<span class="privacy-badge private"><i class="fas fa-lock"></i> Private</span>'}
          </div>
          <div class="code-actions">
            <button class="btn-icon" onclick="codeStorage.loadCode('${code._id}')" title="Load Code">
              <i class="fas fa-file-import"></i>
            </button>
            <button class="btn-icon" onclick="codeStorage.viewCode('${code._id}')" title="View Details">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon delete-btn" onclick="codeStorage.deleteCode('${code._id}')" title="Delete Code">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="code-meta">
          <span><i class="fas fa-user"></i> ${this.escapeHtml(code.author)}</span>
          <span><i class="fas fa-calendar-alt"></i> ${code.formattedDate || new Date(code.createdAt).toLocaleDateString()}</span>
          <span><i class="fas fa-eye"></i> ${code.views || 0} views</span>
          <span><i class="fas fa-heart"></i> ${code.likes || 0} likes</span>
        </div>
        ${code.description ? `<div class="code-description">${this.escapeHtml(code.description)}</div>` : ""}
        ${
          code.tags && code.tags.length > 0
            ? `<div class="code-tags">${code.tags
                .map((tag) => `<span class="tag">${this.escapeHtml(tag)}</span>`)
                .join("")}</div>`
            : ""
        }
      </div>`,
      )
      .join("")
  }

  renderPagination(pagination, loadFunctionPrefix) {
    const paginationEl = document.getElementById(
      loadFunctionPrefix === "loadCodes" ? "pagination" : "libraryPagination",
    ) // Adjust based on modal
    if (!paginationEl) return

    if (!pagination || pagination.totalPages <= 1) {
      paginationEl.innerHTML = ""
      return
    }

    let paginationHTML = ""
    const maxPagesToShow = 5 // Max number of page buttons to show
    const currentPage = pagination.currentPage
    const totalPages = pagination.totalPages

    // Previous button
    if (pagination.hasPrev) {
      paginationHTML += `<button class="pagination-btn" onclick="codeStorage.${loadFunctionPrefix}(${currentPage - 1})"><i class="fas fa-chevron-left"></i> Prev</button>`
    }

    // Page numbers logic
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    if (startPage > 1) {
      paginationHTML += `<button class="pagination-btn" onclick="codeStorage.${loadFunctionPrefix}(1)">1</button>`
      if (startPage > 2) {
        paginationHTML += `<span class="pagination-dots">...</span>`
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `<button class="pagination-btn ${i === currentPage ? "active" : ""}" onclick="codeStorage.${loadFunctionPrefix}(${i})">${i}</button>`
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `<span class="pagination-dots">...</span>`
      }
      paginationHTML += `<button class="pagination-btn" onclick="codeStorage.${loadFunctionPrefix}(${totalPages})">${totalPages}</button>`
    }

    // Next button
    if (pagination.hasNext) {
      paginationHTML += `<button class="pagination-btn" onclick="codeStorage.${loadFunctionPrefix}(${currentPage + 1})">Next <i class="fas fa-chevron-right"></i></button>`
    }
    paginationEl.innerHTML = paginationHTML
  }

  async loadCode(codeId) {
    try {
      this.showLoading("Loading code details...")
      const response = await fetch(`/api/codes/${codeId}`)
      const result = await response.json()

      if (result.success) {
        const code = result.data
        const { codeEditor, inputArea, languageSelect } = window.rashidsCompiler

        if (codeEditor) codeEditor.value = code.code
        if (inputArea) inputArea.value = code.input || ""
        if (languageSelect) languageSelect.value = code.language

        this.currentCodeId = code._id
        this.updateFileName(code.title)

        if (window.rashidsCompiler && typeof window.rashidsCompiler.handleEditorInput === "function") {
          window.rashidsCompiler.handleEditorInput()
        }

        // Pre-fill save modal if it's opened next for this code
        const titleInput = document.getElementById("codeTitle")
        const descInput = document.getElementById("codeDescription")
        const authorInput = document.getElementById("codeAuthor")
        const tagsInput = document.getElementById("codeTags")
        const publicCheckbox = document.getElementById("isPublic")

        if (titleInput) titleInput.value = code.title
        if (descInput) descInput.value = code.description || ""
        if (authorInput) authorInput.value = code.author || ""
        if (tagsInput) tagsInput.value = code.tags?.join(", ") || ""
        if (publicCheckbox) publicCheckbox.checked = code.isPublic || false

        this.hideAllModals() // Close any open modal (like Load or Library)
        this.showSuccess(`Code "${this.escapeHtml(code.title)}" loaded! 📂`)
      } else {
        this.showError(result.message || "Failed to load code.")
      }
    } catch (error) {
      console.error("Load code error:", error)
      this.showError("Network error. Please try again.")
    } finally {
      this.hideLoading()
    }
  }

  async deleteCode(codeId) {
    const Swal = window.Swal // Declare Swal variable
    const result = await Swal.fire({
      title: "🗑️ Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--accent-danger)",
      cancelButtonColor: "var(--text-secondary)",
      confirmButtonText: "Yes, delete it!",
      background: document.body.classList.contains("dark-mode") ? "var(--bg-tertiary)" : "var(--bg-primary)",
      color: "var(--text-primary)",
    })

    if (!result.isConfirmed) return

    try {
      this.showLoading("Deleting code...")
      const response = await fetch(`/api/codes/${codeId}`, { method: "DELETE" })
      const deleteResult = await response.json()

      if (deleteResult.success) {
        this.showSuccess("Code deleted successfully! 🗑️")
        if (this.currentCodeId === codeId) {
          // If deleted code was loaded
          this.currentCodeId = null
          this.updateFileName("Untitled Code")
          // Optionally clear editor via rashidsCompiler instance
          window.rashidsCompiler?.clearBtn.click()
        }
        // Refresh the list in the currently active modal/tab
        const activeLoadModal = document.getElementById("loadModal")?.style.display === "flex"
        const activeLibraryModal = document.getElementById("libraryModal")?.style.display === "flex"

        if (activeLoadModal) {
          this.loadCodes(this.currentPage)
        } else if (activeLibraryModal) {
          const activeTab = document.querySelector("#libraryModal .tab-btn.active")?.dataset.tab
          if (activeTab === "browse") this.loadLibraryCodes()
          else if (activeTab === "my-codes") this.loadMyCodes() // Assuming loadMyCodes exists
        }
      } else {
        this.showError(deleteResult.message || "Failed to delete code.")
      }
    } catch (error) {
      console.error("Delete code error:", error)
      this.showError("Network error. Please try again.")
    } finally {
      this.hideLoading()
    }
  }

  async viewCode(codeId) {
    try {
      this.showLoading("Fetching code details...")
      const response = await fetch(`/api/codes/${codeId}`)
      const result = await response.json()
      this.hideLoading()

      if (result.success) {
        const code = result.data
        const Swal = window.Swal // Declare Swal variable
        const Prism = window.Prism // Declare Prism variable
        Swal.fire({
          title: `<span style="color: var(--accent-primary);">${this.escapeHtml(code.title)}</span>`,
          html: `
            <div class="code-details-popup">
              <p><strong>Language:</strong> <span class="language-badge ${code.language.toLowerCase()}">${code.language}</span></p>
              <p><strong>Author:</strong> ${this.escapeHtml(code.author)}</p>
              <p><strong>Created:</strong> ${code.formattedDate || new Date(code.createdAt).toLocaleString()}</p>
              <p><strong>Visibility:</strong> ${code.isPublic ? '<span class="privacy-badge public"><i class="fas fa-globe-americas"></i> Public</span>' : '<span class="privacy-badge private"><i class="fas fa-lock"></i> Private</span>'}</p>
              <p><i class="fas fa-eye"></i> ${code.views || 0} views | <i class="fas fa-heart"></i> ${code.likes || 0} likes</p>
              ${code.description ? `<p><strong>Description:</strong> ${this.escapeHtml(code.description)}</p>` : ""}
              ${code.tags && code.tags.length > 0 ? `<p><strong>Tags:</strong> ${code.tags.map((tag) => `<span class="tag">${this.escapeHtml(tag)}</span>`).join(" ")}</p>` : ""}
              <div class="code-preview-container">
                <strong>Code Preview:</strong>
                <pre class="code-preview-content language-${code.language.toLowerCase()}"><code>${this.escapeHtml(code.codePreview || "")}</code></pre>
              </div>
            </div>`,
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-file-import"></i> Load This Code',
          cancelButtonText: "Close",
          confirmButtonColor: "var(--accent-primary)",
          background: document.body.classList.contains("dark-mode") ? "var(--bg-tertiary)" : "var(--bg-primary)",
          color: "var(--text-primary)",
          customClass: {
            popup: "swal-wide",
            htmlContainer: "swal-html-container-custom",
          },
          didOpen: () => {
            // Highlight preview if Prism is available
            const previewElement = Swal.getPopup().querySelector(".code-preview-content code")
            if (previewElement && Prism && Prism.languages[code.language.toLowerCase()]) {
              previewElement.innerHTML = Prism.highlight(
                previewElement.textContent,
                Prism.languages[code.language.toLowerCase()],
                code.language.toLowerCase(),
              )
            }
          },
        }).then((actionResult) => {
          if (actionResult.isConfirmed) {
            this.loadCode(codeId)
          }
        })
      } else {
        this.showError(result.message || "Failed to load code details.")
      }
    } catch (error) {
      this.hideLoading()
      console.error("View code error:", error)
      this.showError("Network error. Please try again.")
    }
  }

  // Library Modal Functions
  showLibraryModal() {
    const modal = document.getElementById("libraryModal")
    if (modal) {
      modal.style.display = "flex"
      document.body.style.overflow = "hidden"
      this.switchTab("browse") // Default to browse tab
    }
  }

  hideLibraryModal() {
    const modal = document.getElementById("libraryModal")
    if (modal) {
      modal.style.display = "none"
      document.body.style.overflow = "auto"
    }
  }

  switchTab(tabName) {
    document.querySelectorAll("#libraryModal .tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName)
    })
    document.querySelectorAll("#libraryModal .tab-pane").forEach((pane) => {
      pane.classList.toggle("active", pane.id === `${tabName.replace("-", "")}Tab`)
    })

    switch (tabName) {
      case "browse":
        this.loadLibraryCodes()
        break
      case "my-codes":
        this.loadMyCodes()
        break // Placeholder for now
      case "statistics":
        this.loadStatistics()
        break
    }
  }

  async loadLibraryCodes(page = 1) {
    this.libraryCurrentPage = page
    const libraryGrid = document.getElementById("libraryGrid")
    const language = document.getElementById("libraryFilterLanguage")?.value
    const search = document.getElementById("librarySearch")?.value

    if (!libraryGrid) return
    libraryGrid.innerHTML = `<div class="loading-codes"><i class="fas fa-spinner fa-spin"></i><span>Loading public codes...</span></div>`

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12", // Show more cards in library view
        isPublic: "true",
      })
      if (language && language !== "all") params.append("language", language)
      if (search) params.append("search", search)
      // Add sorting for library if needed, e.g., by likes or views
      params.append("sortBy", "likes")
      params.append("sortOrder", "desc")

      const response = await fetch(`/api/codes?${params.toString()}`)
      const result = await response.json()

      if (result.success && result.data.codes) {
        this.renderLibraryGrid(result.data.codes)
        this.renderPagination(result.data.pagination, "loadLibraryCodes") // Use a different pagination element or prefix
      } else {
        libraryGrid.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><span>${result.message || "Failed to load library codes."}</span></div>`
      }
    } catch (error) {
      console.error("Load library codes error:", error)
      libraryGrid.innerHTML = `<div class="error-message"><i class="fas fa-server"></i><span>Network error. Please try again.</span></div>`
    }
  }

  renderLibraryGrid(codes) {
    const libraryGrid = document.getElementById("libraryGrid")
    if (!libraryGrid) return

    if (!codes || codes.length === 0) {
      libraryGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search-minus"></i>
          <h3>No public codes found</h3>
          <p>Try different filters or be the first to share your code!</p>
        </div>`
      return
    }

    libraryGrid.innerHTML = codes
      .map(
        (code) => `
      <div class="library-card" data-id="${code._id}">
        <div class="card-header">
          <h4>${this.escapeHtml(code.title)}</h4>
          <span class="language-badge ${code.language.toLowerCase()}">${code.language}</span>
        </div>
        <div class="card-meta">
          <span><i class="fas fa-user-edit"></i> ${this.escapeHtml(code.author)}</span>
          <span><i class="fas fa-eye"></i> ${code.views || 0}</span>
          <span><i class="fas fa-heartbeat"></i> ${code.likes || 0}</span>
        </div>
        ${code.description ? `<div class="card-description">${this.escapeHtml(code.description)}</div>` : ""}
        ${
          code.tags && code.tags.length > 0
            ? `<div class="card-tags">${code.tags
                .map((tag) => `<span class="tag">${this.escapeHtml(tag)}</span>`)
                .join("")}</div>`
            : ""
        }
        <div class="card-actions">
          <button class="btn btn-primary btn-sm" onclick="codeStorage.loadCode('${code._id}')">
            <i class="fas fa-file-import"></i> Load
          </button>
          <button class="btn btn-secondary btn-sm" onclick="codeStorage.viewCode('${code._id}')">
            <i class="fas fa-info-circle"></i> View
          </button>
          <button class="btn btn-like btn-sm" onclick="codeStorage.likeCode('${code._id}', this)">
            <i class="far fa-heart"></i> Like
          </button>
        </div>
      </div>`,
      )
      .join("")
  }

  async likeCode(codeId, buttonElement) {
    try {
      // Optimistic update for UI
      const icon = buttonElement.querySelector("i")
      const isLiked = icon.classList.contains("fas") // Assuming 'fas fa-heart' means liked

      // For now, we only increment. A real like system would toggle.
      // if (isLiked) {
      //   icon.classList.remove("fas");
      //   icon.classList.add("far");
      // } else {
      //   icon.classList.remove("far");
      //   icon.classList.add("fas");
      // }
      // buttonElement.disabled = true; // Prevent multiple clicks

      const response = await fetch(`/api/codes/${codeId}/like`, { method: "POST" })
      const result = await response.json()

      if (result.success) {
        this.showSuccess("Code liked! ❤️")
        // Update likes count on the card if possible, or reload list
        const card = buttonElement.closest(".library-card")
        if (card) {
          const likesElement = card.querySelector(".card-meta span:nth-child(3)") // Assuming 3rd span is likes
          if (likesElement) likesElement.innerHTML = `<i class="fas fa-heartbeat"></i> ${result.data.likes}`
        }
        icon.classList.remove("far") // Change to solid heart
        icon.classList.add("fas")
        buttonElement.disabled = true // Disable after liking
      } else {
        this.showError(result.message || "Failed to like code.")
        // Revert UI if optimistic update was more complex
        // if (isLiked) { /* ... revert ... */ } else { /* ... revert ... */ }
      }
    } catch (error) {
      console.error("Like code error:", error)
      this.showError("Network error. Please try again.")
    } finally {
      // buttonElement.disabled = false; // Re-enable if not permanently disabled after one like
    }
  }

  async loadMyCodes() {
    const myCodesList = document.getElementById("myCodesList")
    if (myCodesList) {
      myCodesList.innerHTML = `
        <div class="feature-placeholder">
          <i class="fas fa-user-shield"></i>
          <h3>Authentication Coming Soon!</h3>
          <p>This section will show your personal codes once user accounts are implemented.</p>
          <button class="btn btn-primary" disabled>Sign In (Soon)</button>
        </div>`
    }
  }

  async loadStatistics() {
    const statsGrid = document.getElementById("statsGrid")
    if (!statsGrid) return
    statsGrid.innerHTML = `<div class="loading-codes"><i class="fas fa-spinner fa-spin"></i><span>Loading statistics...</span></div>`

    try {
      const response = await fetch("/api/codes/statistics")
      const result = await response.json()

      if (result.success) {
        this.renderStatistics(result.data)
      } else {
        statsGrid.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><span>${result.message || "Failed to load statistics."}</span></div>`
      }
    } catch (error) {
      console.error("Load statistics error:", error)
      statsGrid.innerHTML = `<div class="error-message"><i class="fas fa-server"></i><span>Network error. Please try again.</span></div>`
    }
  }

  renderStatistics(stats) {
    const statsGrid = document.getElementById("statsGrid")
    if (!statsGrid) return

    statsGrid.innerHTML = `
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-code-branch"></i></div>
          <div class="stat-content"><h3>${stats.totalCodes || 0}</h3><p>Total Codes</p></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-globe"></i></div>
          <div class="stat-content"><h3>${stats.publicCodes || 0}</h3><p>Public Codes</p></div>
        </div>
      </div>
      
      ${
        stats.languageStats && stats.languageStats.length > 0
          ? `
      <div class="language-stats">
        <h4>Popular Languages (Public)</h4>
        <div class="language-chart">
          ${stats.languageStats
            .map(
              (lang) => `
            <div class="language-stat">
              <div class="language-info">
                <span class="language-name">${this.escapeHtml(lang._id)}</span>
                <span class="language-count">${lang.count} codes</span>
              </div>
              <div class="language-bar"><div class="language-fill" style="width: ${Math.max(5, (lang.count / (stats.languageStats[0].count || 1)) * 100)}%"></div></div>
              <small>Avg. Likes: ${lang.totalLikes / lang.count || 0}, Avg. Views: ${lang.totalViews / lang.count || 0}</small>
            </div>`,
            )
            .join("")}
        </div>
      </div>`
          : "<p>No language statistics available yet.</p>"
      }
      
      ${
        stats.recentCodes && stats.recentCodes.length > 0
          ? `
      <div class="recent-codes-section">
        <h4>Recently Added Public Codes</h4>
        <div class="recent-list">
          ${stats.recentCodes
            .map(
              (code) => `
            <div class="recent-item" onclick="codeStorage.loadCode('${code._id}')" title="Load ${this.escapeHtml(code.title)}">
              <div class="recent-info">
                <h5>${this.escapeHtml(code.title)}</h5>
                <span class="recent-meta">${code.language} • by ${this.escapeHtml(code.author)} • ${code.formattedDate || new Date(code.createdAt).toLocaleDateString()}</span>
              </div>
              <i class="fas fa-chevron-right"></i>
            </div>`,
            )
            .join("")}
        </div>
      </div>`
          : "<p>No recent public codes.</p>"
      }

      ${
        stats.mostLikedCodes && stats.mostLikedCodes.length > 0
          ? `
      <div class="popular-codes-section">
        <h4>Most Liked Public Codes</h4>
        <div class="popular-list">
          ${stats.mostLikedCodes
            .map(
              (code) => `
            <div class="popular-item" onclick="codeStorage.loadCode('${code._id}')" title="Load ${this.escapeHtml(code.title)}">
              <div class="popular-info">
                <h5>${this.escapeHtml(code.title)} <span class="likes-count"><i class="fas fa-heart"></i> ${code.likes}</span></h5>
                <span class="popular-meta">${code.language} • by ${this.escapeHtml(code.author)}</span>
              </div>
              <i class="fas fa-angle-double-right"></i>
            </div>`,
            )
            .join("")}
        </div>
      </div>`
          : ""
      }
    `
  }

  // Search Debouncing
  handleSearch(event, type) {
    // type can be 'load' or 'library'
    clearTimeout(this.searchTimeout)
    this.searchTimeout = setTimeout(() => {
      if (type === "load") this.loadCodes(1)
      else if (type === "library") this.loadLibraryCodes(1)
    }, 500) // 500ms debounce
  }

  // Utility Functions
  updateFileName(title) {
    const fileNameEl = document.getElementById("currentFileName")
    if (fileNameEl) fileNameEl.textContent = this.escapeHtml(title) || "Untitled Code"
  }

  hideAllModals() {
    this.hideSaveModal()
    this.hideLoadModal()
    this.hideLibraryModal()
  }

  showLoading(message = "Loading...") {
    const overlay = document.getElementById("loadingOverlay")
    if (overlay) {
      const textEl = overlay.querySelector(".loading-text h3")
      if (textEl) textEl.textContent = message
      overlay.style.display = "flex"
    }
  }

  hideLoading() {
    const overlay = document.getElementById("loadingOverlay")
    if (overlay) overlay.style.display = "none"
  }

  showSuccess(message) {
    if (window.Swal) {
      const Toast = window.Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: document.body.classList.contains("dark-mode") ? "var(--bg-secondary)" : "var(--bg-primary)",
        color: "var(--text-primary)",
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", window.Swal.stopTimer)
          toast.addEventListener("mouseleave", window.Swal.resumeTimer)
        },
      })
      Toast.fire({ icon: "success", title: message })
    }
  }

  showError(message) {
    if (window.Swal) {
      const Toast = window.Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000, // Longer for errors
        timerProgressBar: true,
        background: document.body.classList.contains("dark-mode") ? "var(--bg-secondary)" : "var(--bg-primary)",
        color: "var(--accent-danger)", // Use danger color for error text
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", window.Swal.stopTimer)
          toast.addEventListener("mouseleave", window.Swal.resumeTimer)
        },
      })
      Toast.fire({ icon: "error", title: message })
    }
  }

  escapeHtml(text) {
    if (text === null || typeof text === "undefined") return ""
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }
}

// Initialize storage when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.codeStorage = new CodeStorage()
})

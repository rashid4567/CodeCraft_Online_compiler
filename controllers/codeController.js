const Code = require("../models/Code")
const { validationResult } = require("express-validator")
const { responseHelper } = require("../utils/responseHelper")

class CodeController {
  constructor() {
    this.getAllCodes = this.getAllCodes.bind(this)
    this.getCodeById = this.getCodeById.bind(this)
    this.createCode = this.createCode.bind(this)
    this.updateCode = this.updateCode.bind(this)
    this.deleteCode = this.deleteCode.bind(this)
    this.toggleLike = this.toggleLike.bind(this)
    this.getCodesByLanguage = this.getCodesByLanguage.bind(this)
    this.getStatistics = this.getStatistics.bind(this)
  }

  // Get all codes with pagination and filtering
  async getAllCodes(req, res) {
    try {
      const page = Number.parseInt(req.query.page) || 1
      const limit = Number.parseInt(req.query.limit) || 10 // Default to 10 for general lists
      const skip = (page - 1) * limit
      const { language, search, sortBy = "createdAt", sortOrder = "desc", isPublic } = req.query

      const query = {}

      if (isPublic !== undefined) {
        query.isPublic = isPublic === "true"
      }

      if (language && language !== "all") {
        query.language = language
      }

      let codes
      let total

      const sortOptions = {}
      if (sortBy) {
        sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1
      } else {
        sortOptions.createdAt = -1 // Default sort
      }

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), "i")
        query.$or = [{ title: regex }, { description: regex }, { tags: regex }]
        // For search, we might want to fetch all matching and then paginate client-side or adjust limit
        // For simplicity here, we apply limit directly.
        // More complex search might need a dedicated search endpoint or aggregation.
        codes = await Code.find(query).sort(sortOptions).limit(limit).skip(skip).select("-code -input -output") // Exclude large fields for list view
        total = await Code.countDocuments(query) // Count documents matching the search query
      } else {
        codes = await Code.find(query).sort(sortOptions).limit(limit).skip(skip).select("-code -input -output")
        total = await Code.countDocuments(query)
      }

      const totalPages = Math.ceil(total / limit)

      responseHelper(res, {
        codes,
        pagination: {
          currentPage: page,
          totalPages,
          totalCodes: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      })
    } catch (error) {
      console.error("Get all codes error:", error)
      responseHelper(res, error.message, "Failed to fetch codes", false, 500)
    }
  }

  // Get code by ID
  async getCodeById(req, res) {
    try {
      const { id } = req.params
      const code = await Code.findById(id)

      if (!code) {
        return responseHelper(res, null, "Code not found", false, 404)
      }

      await code.incrementViews()
      responseHelper(res, code)
    } catch (error) {
      console.error("Get code by ID error:", error)
      if (error.name === "CastError") {
        return responseHelper(res, "Invalid code ID format", "Invalid ID", false, 400)
      }
      responseHelper(res, error.message, "Failed to fetch code", false, 500)
    }
  }

  // Create new code
  async createCode(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return responseHelper(res, errors.array(), "Validation failed", false, 400)
      }

      const { title, description, language, code, input, output, isPublic, tags, author, executionTime, isSuccessful } =
        req.body

      const newCode = new Code({
        title: title || `Untitled ${language} Code`,
        description,
        language,
        code,
        input: input || "",
        output: output || "",
        isPublic: isPublic || false,
        tags: Array.isArray(tags)
          ? tags
          : tags
            ? String(tags)
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag)
            : [],
        author: author || "Anonymous",
        executionTime: executionTime || 0,
        isSuccessful: isSuccessful || false,
      })

      const savedCode = await newCode.save()
      responseHelper(res, savedCode, "Code saved successfully", true, 201)
    } catch (error) {
      console.error("Create code error:", error)
      if (error.name === "ValidationError") {
        return responseHelper(
          res,
          Object.values(error.errors).map((err) => ({
            field: err.path,
            message: err.message,
          })),
          "Validation failed",
          false,
          400,
        )
      }
      responseHelper(res, error.message, "Failed to save code", false, 500)
    }
  }

  // Update code
  async updateCode(req, res) {
    try {
      const { id } = req.params
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return responseHelper(res, errors.array(), "Validation failed", false, 400)
      }

      const updateData = { ...req.body }
      if (updateData.tags && !Array.isArray(updateData.tags)) {
        updateData.tags = String(updateData.tags)
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      }

      const updatedCode = await Code.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })

      if (!updatedCode) {
        return responseHelper(res, null, "Code not found", false, 404)
      }
      responseHelper(res, updatedCode, "Code updated successfully")
    } catch (error) {
      console.error("Update code error:", error)
      if (error.name === "CastError") {
        return responseHelper(res, "Invalid code ID format", "Invalid ID", false, 400)
      }
      if (error.name === "ValidationError") {
        return responseHelper(
          res,
          Object.values(error.errors).map((err) => ({
            field: err.path,
            message: err.message,
          })),
          "Validation failed",
          false,
          400,
        )
      }
      responseHelper(res, error.message, "Failed to update code", false, 500)
    }
  }

  // Delete code
  async deleteCode(req, res) {
    try {
      const { id } = req.params
      const deletedCode = await Code.findByIdAndDelete(id)

      if (!deletedCode) {
        return responseHelper(res, null, "Code not found", false, 404)
      }
      responseHelper(res, { id: deletedCode._id }, "Code deleted successfully")
    } catch (error) {
      console.error("Delete code error:", error)
      if (error.name === "CastError") {
        return responseHelper(res, "Invalid code ID format", "Invalid ID", false, 400)
      }
      responseHelper(res, error.message, "Failed to delete code", false, 500)
    }
  }

  // Like/Unlike code
  async toggleLike(req, res) {
    try {
      const { id } = req.params
      const code = await Code.findById(id)

      if (!code) {
        return responseHelper(res, null, "Code not found", false, 404)
      }

      await code.toggleLike() // This now just increments likes
      responseHelper(res, { likes: code.likes }, "Code like status updated")
    } catch (error) {
      console.error("Toggle like error:", error)
      if (error.name === "CastError") {
        return responseHelper(res, "Invalid code ID format", "Invalid ID", false, 400)
      }
      responseHelper(res, error.message, "Failed to update like status", false, 500)
    }
  }

  // Get codes by language
  async getCodesByLanguage(req, res) {
    try {
      const { language } = req.params
      const limit = Number.parseInt(req.query.limit) || 10
      const codes = await Code.findByLanguage(language, limit)
      responseHelper(res, codes)
    } catch (error) {
      console.error("Get codes by language error:", error)
      responseHelper(res, error.message, "Failed to fetch codes by language", false, 500)
    }
  }

  // Get statistics
  async getStatistics(req, res) {
    try {
      const totalCodes = await Code.countDocuments()
      const publicCodes = await Code.countDocuments({ isPublic: true })
      const languageStats = await Code.aggregate([
        { $match: { isPublic: true } }, // Consider only public codes for popular stats
        {
          $group: {
            _id: "$language",
            count: { $sum: 1 },
            avgExecutionTime: { $avg: "$executionTime" },
            totalLikes: { $sum: "$likes" },
            totalViews: { $sum: "$views" },
          },
        },
        { $sort: { count: -1 } }, // Sort by most number of codes
        { $limit: 5 }, // Top 5 languages
      ])

      const recentCodes = await Code.find({ isPublic: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title language createdAt author formattedDate") // Include formattedDate

      const mostLikedCodes = await Code.find({ isPublic: true })
        .sort({ likes: -1, createdAt: -1 })
        .limit(5)
        .select("title language author likes views formattedDate")

      const mostViewedCodes = await Code.find({ isPublic: true })
        .sort({ views: -1, createdAt: -1 })
        .limit(5)
        .select("title language author likes views formattedDate")

      responseHelper(res, {
        totalCodes,
        publicCodes,
        languageStats,
        recentCodes,
        mostLikedCodes,
        mostViewedCodes,
      })
    } catch (error) {
      console.error("Get statistics error:", error)
      responseHelper(res, error.message, "Failed to fetch statistics", false, 500)
    }
  }
}

module.exports = new CodeController()

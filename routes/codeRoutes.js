const express = require("express")
const { body, validationResult } = require("express-validator")
const codeController = require("../controllers/codeController")

const router = express.Router()

// Validation middleware
const validateCode = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),

  body("language").isIn(["javascript", "python", "c", "java", "dart"]).withMessage("Invalid language"),

  body("code")
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ max: 50000 })
    .withMessage("Code must be less than 50KB"),

  body("input").optional().isLength({ max: 10000 }).withMessage("Input must be less than 10KB"),

  body("output").optional().isLength({ max: 10000 }).withMessage("Output must be less than 10KB"),

  body("isPublic").optional().isBoolean().withMessage("isPublic must be a boolean"),

  body("author").optional().trim().isLength({ max: 50 }).withMessage("Author name must be less than 50 characters"),

  body("tags")
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every((tag) => typeof tag === "string" && tag.length <= 30)
      }
      return typeof value === "string" && value.length <= 30
    })
    .withMessage("Tags must be strings with max 30 characters each"),
]

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors.array(),
    })
  }
  next()
}

// Routes
router.get("/", codeController.getAllCodes)
router.get("/statistics", codeController.getStatistics)
router.get("/language/:language", codeController.getCodesByLanguage)
router.get("/:id", codeController.getCodeById)
router.post("/", validateCode, handleValidationErrors, codeController.createCode)
router.put("/:id", validateCode, handleValidationErrors, codeController.updateCode)
router.delete("/:id", codeController.deleteCode)
router.post("/:id/like", codeController.toggleLike)

module.exports = router

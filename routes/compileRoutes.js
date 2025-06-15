const express = require("express")
const { body, validationResult } = require("express-validator")
const compileController = require("../controllers/compileController")

const router = express.Router()

// Validation middleware
const validateCompileRequest = [
  body("language").isIn(["javascript", "python", "c", "java", "dart"]).withMessage("Invalid language"),
  body("code")
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ max: 50000 })
    .withMessage("Code must be less than 50KB"),
  body("input").optional().isLength({ max: 10000 }).withMessage("Input must be less than 10KB"),
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

// Compile route
router.post("/", validateCompileRequest, handleValidationErrors, compileController.compileCode)

module.exports = router

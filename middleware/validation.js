const { body, param, validationResult } = require("express-validator")
const { responseHelper } = require("../utils/responseHelper")

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return responseHelper(res, errors.array(), "Validation Error", false, 400)
  }
  next()
}

const validateCompilation = [
  body("language").trim().notEmpty().withMessage("Language is required."),
  body("code").notEmpty().withMessage("Code is required."),
  body("input").optional().isString(),
  handleValidationErrors,
]

const validateCodeCreation = [
  body("title").optional().trim().isLength({ max: 100 }).withMessage("Title cannot exceed 100 characters."),
  body("description").optional().trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters."),
  body("language")
    .trim()
    .notEmpty()
    .withMessage("Language is required.")
    .isIn(["javascript", "python", "java", "csharp", "cpp", "html", "css"])
    .withMessage("Invalid language specified."),
  body("code").notEmpty().withMessage("Code content is required."),
  body("input").optional().isString(),
  body("output").optional().isString(),
  body("author").optional().trim().isLength({ max: 50 }).withMessage("Author name cannot exceed 50 characters."),
  body("tags").optional().isArray().withMessage("Tags must be an array of strings."),
  body("tags.*")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Each tag cannot exceed 30 characters."),
  body("isPublic").optional().isBoolean().withMessage("isPublic must be a boolean."),
  handleValidationErrors,
]

const validateCodeUpdate = [
  param("id").isMongoId().withMessage("Invalid code ID format."),
  body("title").optional().trim().isLength({ max: 100 }).withMessage("Title cannot exceed 100 characters."),
  body("description").optional().trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters."),
  body("language")
    .optional()
    .trim()
    .isIn(["javascript", "python", "java", "csharp", "cpp", "html", "css"])
    .withMessage("Invalid language specified."),
  body("code").optional().notEmpty().withMessage("Code content cannot be empty if provided."),
  body("input").optional().isString(),
  body("output").optional().isString(),
  body("author").optional().trim().isLength({ max: 50 }).withMessage("Author name cannot exceed 50 characters."),
  body("tags").optional().isArray().withMessage("Tags must be an array of strings."),
  body("tags.*")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Each tag cannot exceed 30 characters."),
  body("isPublic").optional().isBoolean().withMessage("isPublic must be a boolean."),
  handleValidationErrors,
]

module.exports = {
  validateCompilation,
  validateCodeCreation,
  validateCodeUpdate,
}

const { responseHelper } = require("../utils/responseHelper")

const errorHandler = (err, req, res, next) => {
  console.error("Global Error Handler:", err)

  const statusCode = err.statusCode || 500
  const message = err.message || "An unexpected error occurred on the server."

  // If it's a known error type or has a specific status code, use it
  // Otherwise, it's a generic server error
  responseHelper(res, err.data || null, message, false, statusCode)
}

module.exports = errorHandler

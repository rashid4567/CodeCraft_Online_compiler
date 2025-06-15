/**
 * Standardized response helper function.
 * @param {object} res - Express response object.
 * @param {any} data - Data to be sent in the response.
 * @param {string} message - A descriptive message.
 * @param {boolean} success - Indicates if the operation was successful.
 * @param {number} statusCode - HTTP status code.
 */
const responseHelper = (res, data = null, message = "", success = true, statusCode = 200) => {
  res.status(statusCode).json({
    success,
    message: message || (success ? "Operation successful" : "Operation failed"),
    data,
  })
}

module.exports = { responseHelper }

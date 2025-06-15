const express = require("express")
const path = require("path")
const fs = require("fs")
const cors = require("cors")
require("dotenv").config()

// Import database connection
const connectDB = require("./config/database")

// Import routes
const compileRoutes = require("./routes/compileRoutes")
const codeRoutes = require("./routes/codeRoutes")

const app = express()
const PORT = process.env.PORT || 1111

// Connect to MongoDB
connectDB()

// Middleware
app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(express.static("public"))

// View engine setup
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

// Create temp directory
const tempDir = path.join(__dirname, "temp")
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir)
}

// Language configuration
const languageConfig = {
  javascript: {
    extension: ".js",
    command: "node",
    syntax: "javascript",
  },
  python: {
    extension: ".py",
    command: "python3",
    syntax: "python",
  },
  c: {
    extension: ".c",
    command: "gcc",
    compileArgs: ["-o"],
    syntax: "c",
  },
  java: {
    extension: ".java",
    command: "javac",
    runCommand: "java",
    syntax: "java",
  },
  dart: {
    extension: ".dart",
    command: "dart",
    syntax: "dart",
  },
}

// Make languageConfig available globally
app.locals.languageConfig = languageConfig
app.locals.tempDir = tempDir

// Routes
app.get("/", (req, res) => {
  res.render("index", {
    title: "Rashid's Compiler - Online Code Editor", // Add this line
    languages: Object.keys(languageConfig),
  })
})

// API Routes
app.use("/api/compile", compileRoutes)
app.use("/api/codes", codeRoutes)

// Legacy compile route for backward compatibility
app.use("/compile", compileRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack)
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).render("404", {
    title: "Page Not Found",
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Rashid's Compiler server running on http://localhost:${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`🗄️  Database: ${process.env.MONGODB_URI ? "Connected" : "Local MongoDB"}`)
})

module.exports = app

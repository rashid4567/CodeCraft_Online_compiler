// This script is for manual execution to initialize or seed the database if needed.
// Example: node scripts/initDatabase.js

const mongoose = require("mongoose")
const dotenv = require("dotenv")
const Code = require("../models/Code") // Adjust path as necessary

// Load environment variables from .env file
dotenv.config({ path: require("path").resolve(__dirname, "..", ".env") })

const sampleCodes = [
  {
    title: "Hello World in Python",
    description: "A simple Hello World program written in Python.",
    language: "python",
    code: 'print("Hello, World!")',
    author: "Seed User",
    tags: ["python", "beginner", "hello world"],
    isPublic: true,
  },
  {
    title: "JavaScript Sum Function",
    description: "A basic function to sum two numbers in JavaScript.",
    language: "javascript",
    code: "function sum(a, b) {\n  return a + b;\n}\n\nconsole.log(sum(5, 3));",
    author: "Seed User",
    tags: ["javascript", "function", "math"],
    isPublic: true,
  },
  {
    title: "Simple HTML Page",
    description: "A very basic HTML page structure.",
    language: "html",
    code: "<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Welcome</h1>\n  <p>This is a simple HTML page.</p>\n</body>\n</html>",
    author: "Seed User",
    tags: ["html", "web", "beginner"],
    isPublic: false, // Example of a private code
  },
]

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("MongoDB Connected for seeding...")

    // Clear existing codes (optional, be careful with this in production)
    // await Code.deleteMany({});
    // console.log('Existing codes cleared.');

    const existingCodesCount = await Code.countDocuments()
    if (existingCodesCount === 0) {
      await Code.insertMany(sampleCodes)
      console.log("Database seeded successfully with sample codes!")
    } else {
      console.log("Database already contains data. Seeding skipped.")
    }
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await mongoose.disconnect()
    console.log("MongoDB disconnected.")
  }
}

// Run the seeder
seedDatabase()

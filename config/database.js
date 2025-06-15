const mongoose = require("mongoose")

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/rashids_compiler"

    const conn = await mongoose.connect(mongoURI)

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err)
    })

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB disconnected")
    })

    // Setup database indexes after connection
    await setupIndexes()

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close()
      console.log("🔒 MongoDB connection closed through app termination")
      process.exit(0)
    })
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message)

    // In development, continue without database
    if (process.env.NODE_ENV !== "production") {
      console.log("⚠️  Continuing without database in development mode")
      return
    }

    process.exit(1)
  }
}

// Setup database indexes
const setupIndexes = async () => {
  try {
    const Code = require("../models/Code")

    // Ensure indexes are created
    await Code.createIndexes()
    console.log("✅ Database indexes created successfully")

    // Drop any existing text indexes that might cause issues
    try {
      await Code.collection.dropIndex("title_text_description_text")
    } catch (err) {
      // Index doesn't exist, which is fine
    }
  } catch (error) {
    console.error("⚠️  Index setup warning:", error.message)
    // Don't fail the app if indexes can't be created
  }
}

module.exports = connectDB

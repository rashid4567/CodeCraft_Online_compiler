const mongoose = require("mongoose")

const codeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    language: {
      type: String,
      required: [true, "Language is required"],
      enum: ["javascript", "python", "java", "csharp", "cpp", "html", "css"], // Add more as needed
    },
    code: {
      type: String,
      required: [true, "Code content is required"],
    },
    input: {
      type: String,
      default: "",
    },
    output: {
      type: String,
      default: "",
    },
    author: {
      type: String,
      default: "Anonymous",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    executionTime: {
      type: Number, // in milliseconds
      default: 0,
    },
    isSuccessful: {
      type: Boolean, // Was the last execution successful?
      default: false,
    },
    // Consider adding a user reference if you implement authentication
    // userId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    // },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true }, // Ensure virtuals are included when document is converted to JSON
    toObject: { virtuals: true }, // Ensure virtuals are included when document is converted to object
  },
)

// Virtual for formatted date
codeSchema.virtual("formattedDate").get(function () {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(this.createdAt)
})

// Virtual for code preview (first 100 characters)
codeSchema.virtual("codePreview").get(function () {
  if (this.code) {
    return this.code.length > 150 ? this.code.substring(0, 150) + "..." : this.code
  }
  return ""
})

// Method to increment views
codeSchema.methods.incrementViews = async function () {
  this.views += 1
  await this.save()
}

// Method to toggle like (simplified for now, no user tracking)
codeSchema.methods.toggleLike = async function () {
  // In a real app, you'd check if a user has already liked it.
  // For now, just increment.
  this.likes += 1
  await this.save()
}

// Static method for searching codes (Regex based)
codeSchema.statics.searchCodes = async function (searchTerm, limit = 10) {
  const regex = new RegExp(searchTerm, "i") // 'i' for case-insensitive
  return this.find({
    $or: [{ title: regex }, { description: regex }, { tags: regex }, { language: regex }, { author: regex }],
    isPublic: true, // Optionally, only search public codes or make it a parameter
  })
    .sort({ likes: -1, views: -1, createdAt: -1 }) // Prioritize by engagement and recency
    .limit(limit)
    .select("-code -input -output") // Exclude large fields for search results
}

// Static method to find codes by language
codeSchema.statics.findByLanguage = async function (language, limit = 10) {
  return this.find({ language, isPublic: true }).sort({ createdAt: -1 }).limit(limit).select("-code -input -output")
}

// Indexing (Example - consider your query patterns)
// No text index needed if using regex search primarily.
// If you were to use $text search, you'd define it here:
// codeSchema.index({ title: 'text', description: 'text', tags: 'text' });

codeSchema.index({ language: 1, createdAt: -1 })
codeSchema.index({ isPublic: 1, createdAt: -1 })
codeSchema.index({ author: 1 })

module.exports = mongoose.model("Code", codeSchema)

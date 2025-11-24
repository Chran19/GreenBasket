const multer = require("multer")

// Configure multer for different file types
const createUploadMiddleware = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ["image/jpeg", "image/png", "image/webp"],
    maxFiles = 5,
  } = options

  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxSize,
      files: maxFiles,
    },
    fileFilter: (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error(`Only ${allowedTypes.join(", ")} files are allowed`), false)
      }
    },
  })
}

// Error handler for multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large",
        details: "Maximum file size is 5MB",
      })
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Too many files",
        details: "Maximum 5 files allowed",
      })
    }
  }

  if (err.message.includes("Only") && err.message.includes("files are allowed")) {
    return res.status(400).json({
      success: false,
      error: "Invalid file type",
      details: err.message,
    })
  }

  next(err)
}

module.exports = {
  createUploadMiddleware,
  handleUploadError,
}

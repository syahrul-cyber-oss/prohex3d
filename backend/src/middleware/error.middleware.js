const multer = require("multer");

function notFoundHandler(req, res, next) {
  return res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
}

function errorHandler(err, req, res, next) {
  console.error("ERROR:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  if (err instanceof multer.MulterError) {
    return handleMulterError(err, res);
  }

  if (err.name === "SyntaxError" && err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message || "Validation error",
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      success: false,
      message: err.message || "Unauthorized",
    });
  }

  if (err.code === "ENOENT") {
    return res.status(404).json({
      success: false,
      message: "File not found",
    });
  }

  if (err.code === "EACCES" || err.code === "EPERM") {
    return res.status(403).json({
      success: false,
      message: "File permission denied",
    });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File is too large",
    });
  }

  const statusCode = err.status || err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : err.message || "Request failed",
    error:
      process.env.NODE_ENV === "development"
        ? {
            name: err.name,
            message: err.message,
            stack: err.stack,
          }
        : undefined,
  });
}

function handleMulterError(err, res) {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Image file is too large. Maximum size is 10MB",
    });
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      success: false,
      message: "Only one file is allowed",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Invalid upload field. Use field name: image",
    });
  }

  if (err.code === "LIMIT_PART_COUNT") {
    return res.status(400).json({
      success: false,
      message: "Too many form parts",
    });
  }

  if (err.code === "LIMIT_FIELD_KEY") {
    return res.status(400).json({
      success: false,
      message: "Form field name is too long",
    });
  }

  if (err.code === "LIMIT_FIELD_VALUE") {
    return res.status(400).json({
      success: false,
      message: "Form field value is too long",
    });
  }

  if (err.code === "LIMIT_FIELD_COUNT") {
    return res.status(400).json({
      success: false,
      message: "Too many form fields",
    });
  }

  return res.status(400).json({
    success: false,
    message: err.message || "Upload error",
  });
}

function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.status = statusCode;
  return error;
}

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler,
  createError,
};
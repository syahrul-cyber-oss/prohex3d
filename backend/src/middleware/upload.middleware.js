const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const env = require("../config/env");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");

const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

function createSafeFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const name = path
    .basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const id = crypto.randomBytes(8).toString("hex");
  const timestamp = Date.now();

  return `image-${timestamp}-${id}-${name || "upload"}${ext}`;
}

function isAllowedExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(ext);
}

function isAllowedMimeType(mimetype) {
  const allowedTypes =
    env.upload && env.upload.allowedImageTypes
      ? env.upload.allowedImageTypes
      : ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  return allowedTypes.includes(mimetype);
}

ensureUploadsDir();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadsDir();
    cb(null, uploadsDir);
  },

  filename: function (req, file, cb) {
    const filename = createSafeFilename(file.originalname);
    cb(null, filename);
  },
});

const fileFilter = function (req, file, cb) {
  if (!file) {
    return cb(new Error("Image file is required"), false);
  }

  if (!file.originalname) {
    return cb(new Error("Original filename is required"), false);
  }

  if (!isAllowedExtension(file.originalname)) {
    return cb(
      new Error("Only jpg, jpeg, png, and webp image files are allowed"),
      false
    );
  }

  if (!isAllowedMimeType(file.mimetype)) {
    return cb(new Error("Invalid image mime type"), false);
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize:
      env.upload && env.upload.maxFileSize
        ? env.upload.maxFileSize
        : 10 * 1024 * 1024,
    files: 1,
  },
});

function handleUploadError(err, req, res, next) {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Image file is too large. Maximum size is 10MB",
      });
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Only one image file is allowed",
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Invalid upload field. Use field name: image",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(400).json({
    success: false,
    message: err.message || "Upload failed",
  });
}

function uploadSingleImage(req, res, next) {
  const uploader = upload.single("image");

  uploader(req, res, function (err) {
    handleUploadError(err, req, res, next);
  });
}

module.exports = {
  uploadSingleImage,
};
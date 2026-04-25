const fs = require("fs");
const path = require("path");
const env = require("../config/env");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

function getFileUrl(filename) {
  return `${env.server.baseUrl}/uploads/${filename}`;
}

function isSafeFilename(filename) {
  if (!filename) return false;
  if (filename.includes("..")) return false;
  if (filename.includes("/")) return false;
  if (filename.includes("\\")) return false;
  return true;
}

function getFileInfo(filename) {
  const filePath = path.join(uploadsDir, filename);
  const stats = fs.statSync(filePath);

  return {
    filename,
    originalName: filename,
    size: stats.size,
    sizeMB: Number((stats.size / 1024 / 1024).toFixed(2)),
    url: getFileUrl(filename),
    path: `/uploads/${filename}`,
    createdAt: stats.birthtime,
    updatedAt: stats.mtime,
  };
}

async function uploadImage(req, res, next) {
  try {
    ensureUploadsDir();

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required. Use field name: image",
      });
    }

    const image = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      sizeMB: Number((req.file.size / 1024 / 1024).toFixed(2)),
      url: getFileUrl(req.file.filename),
      path: `/uploads/${req.file.filename}`,
      uploadedAt: new Date().toISOString(),
    };

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: image,
    });
  } catch (error) {
    next(error);
  }
}

async function getUploadedImages(req, res, next) {
  try {
    ensureUploadsDir();

    const files = fs
      .readdirSync(uploadsDir)
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();

        return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
      })
      .map((file) => getFileInfo(file))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      message: "Uploaded images fetched successfully",
      total: files.length,
      data: files,
    });
  } catch (error) {
    next(error);
  }
}

async function getUploadedImageByName(req, res, next) {
  try {
    ensureUploadsDir();

    const { filename } = req.params;

    if (!isSafeFilename(filename)) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const image = getFileInfo(filename);

    return res.status(200).json({
      success: true,
      message: "Image fetched successfully",
      data: image,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteUploadedImage(req, res, next) {
  try {
    ensureUploadsDir();

    const { filename } = req.params;

    if (!isSafeFilename(filename)) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    fs.unlinkSync(filePath);

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: {
        filename,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadImage,
  getUploadedImages,
  getUploadedImageByName,
  deleteUploadedImage,
};
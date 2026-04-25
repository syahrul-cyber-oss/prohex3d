const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MODEL_EXTENSIONS = [".glb", ".gltf", ".obj", ".fbx", ".stl"];

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MODEL_MIME_TYPES = [
  "model/gltf-binary",
  "model/gltf+json",
  "application/octet-stream",
  "text/plain",
];

function ensureDirectory(dirPath) {
  if (!dirPath) {
    throw new Error("Directory path is required");
  }

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  return dirPath;
}

function fileExists(filePath) {
  if (!filePath) return false;
  return fs.existsSync(filePath);
}

function isSafeFilename(filename) {
  if (!filename) return false;
  if (typeof filename !== "string") return false;
  if (filename.includes("..")) return false;
  if (filename.includes("/")) return false;
  if (filename.includes("\\")) return false;
  if (filename.trim() === "") return false;

  return true;
}

function getExtension(filename) {
  return path.extname(filename || "").toLowerCase();
}

function getNameWithoutExtension(filename) {
  const ext = getExtension(filename);
  return path.basename(filename, ext);
}

function sanitizeFilename(filename) {
  if (!filename) {
    return "file";
  }

  const ext = getExtension(filename);
  const name = getNameWithoutExtension(filename)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${name || "file"}${ext}`;
}

function createRandomId(length = 12) {
  return crypto.randomBytes(length).toString("hex");
}

function createUniqueFilename(originalName, prefix = "file") {
  const ext = getExtension(originalName);
  const id = createRandomId(8);
  const timestamp = Date.now();

  return `${prefix}-${timestamp}-${id}${ext}`;
}

function isImageFile(filename) {
  const ext = getExtension(filename);
  return IMAGE_EXTENSIONS.includes(ext);
}

function isModelFile(filename) {
  const ext = getExtension(filename);
  return MODEL_EXTENSIONS.includes(ext);
}

function isAllowedImageMimeType(mimetype) {
  return IMAGE_MIME_TYPES.includes(mimetype);
}

function isAllowedModelMimeType(mimetype) {
  return MODEL_MIME_TYPES.includes(mimetype);
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) {
    return {
      bytes: 0,
      kb: 0,
      mb: 0,
      text: "0 B",
    };
  }

  const kb = bytes / 1024;
  const mb = kb / 1024;

  let text = `${bytes} B`;

  if (mb >= 1) {
    text = `${mb.toFixed(2)} MB`;
  } else if (kb >= 1) {
    text = `${kb.toFixed(2)} KB`;
  }

  return {
    bytes,
    kb: Number(kb.toFixed(2)),
    mb: Number(mb.toFixed(2)),
    text,
  };
}

function getFileInfo(filePath) {
  if (!fileExists(filePath)) {
    return null;
  }

  const stats = fs.statSync(filePath);
  const filename = path.basename(filePath);
  const size = formatFileSize(stats.size);

  return {
    filename,
    name: getNameWithoutExtension(filename),
    ext: getExtension(filename),
    path: filePath,
    size: stats.size,
    sizeKB: size.kb,
    sizeMB: size.mb,
    sizeText: size.text,
    isImage: isImageFile(filename),
    isModel: isModelFile(filename),
    createdAt: stats.birthtime,
    updatedAt: stats.mtime,
  };
}

function listFiles(dirPath, options = {}) {
  ensureDirectory(dirPath);

  const {
    onlyImages = false,
    onlyModels = false,
    includeHidden = false,
  } = options;

  return fs
    .readdirSync(dirPath)
    .filter((filename) => {
      if (!includeHidden && filename.startsWith(".")) {
        return false;
      }

      const filePath = path.join(dirPath, filename);
      const stats = fs.statSync(filePath);

      if (!stats.isFile()) {
        return false;
      }

      if (onlyImages) {
        return isImageFile(filename);
      }

      if (onlyModels) {
        return isModelFile(filename);
      }

      return true;
    })
    .map((filename) => {
      const filePath = path.join(dirPath, filename);
      return getFileInfo(filePath);
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function deleteFile(filePath) {
  if (!fileExists(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

function copyFile(sourcePath, targetPath) {
  if (!fileExists(sourcePath)) {
    throw new Error("Source file not found");
  }

  ensureDirectory(path.dirname(targetPath));

  fs.copyFileSync(sourcePath, targetPath);

  return getFileInfo(targetPath);
}

function moveFile(sourcePath, targetPath) {
  if (!fileExists(sourcePath)) {
    throw new Error("Source file not found");
  }

  ensureDirectory(path.dirname(targetPath));

  fs.renameSync(sourcePath, targetPath);

  return getFileInfo(targetPath);
}

function readFileBuffer(filePath) {
  if (!fileExists(filePath)) {
    throw new Error("File not found");
  }

  return fs.readFileSync(filePath);
}

function writeFileBuffer(filePath, buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Buffer is required");
  }

  ensureDirectory(path.dirname(filePath));

  fs.writeFileSync(filePath, buffer);

  return getFileInfo(filePath);
}

function readTextFile(filePath, fallback = "") {
  if (!fileExists(filePath)) {
    return fallback;
  }

  return fs.readFileSync(filePath, "utf-8");
}

function writeTextFile(filePath, content = "") {
  ensureDirectory(path.dirname(filePath));

  fs.writeFileSync(filePath, content, "utf-8");

  return getFileInfo(filePath);
}

function readJsonFile(filePath, fallback = null) {
  if (!fileExists(filePath)) {
    return fallback;
  }

  const raw = fs.readFileSync(filePath, "utf-8");

  if (!raw.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  ensureDirectory(path.dirname(filePath));

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

  return getFileInfo(filePath);
}

function validateImageFile(file, maxFileSize = 10 * 1024 * 1024) {
  if (!file) {
    return {
      valid: false,
      message: "Image file is required",
    };
  }

  if (!file.originalname) {
    return {
      valid: false,
      message: "Original filename is required",
    };
  }

  if (!isImageFile(file.originalname)) {
    return {
      valid: false,
      message: "Only jpg, jpeg, png, and webp images are allowed",
    };
  }

  if (file.mimetype && !isAllowedImageMimeType(file.mimetype)) {
    return {
      valid: false,
      message: "Invalid image mime type",
    };
  }

  if (file.size > maxFileSize) {
    return {
      valid: false,
      message: `Image file is too large. Maximum size is ${formatFileSize(maxFileSize).text}`,
    };
  }

  return {
    valid: true,
    message: "Image file is valid",
  };
}

function validateModelFile(file, maxFileSize = 100 * 1024 * 1024) {
  if (!file) {
    return {
      valid: false,
      message: "Model file is required",
    };
  }

  if (!file.originalname) {
    return {
      valid: false,
      message: "Original filename is required",
    };
  }

  if (!isModelFile(file.originalname)) {
    return {
      valid: false,
      message: "Only glb, gltf, obj, fbx, and stl models are allowed",
    };
  }

  if (file.mimetype && !isAllowedModelMimeType(file.mimetype)) {
    return {
      valid: false,
      message: "Invalid model mime type",
    };
  }

  if (file.size > maxFileSize) {
    return {
      valid: false,
      message: `Model file is too large. Maximum size is ${formatFileSize(maxFileSize).text}`,
    };
  }

  return {
    valid: true,
    message: "Model file is valid",
  };
}

function clearDirectory(dirPath, options = {}) {
  ensureDirectory(dirPath);

  const {
    onlyImages = false,
    onlyModels = false,
  } = options;

  const files = listFiles(dirPath, {
    onlyImages,
    onlyModels,
  });

  let deleted = 0;

  files.forEach((file) => {
    if (deleteFile(file.path)) {
      deleted += 1;
    }
  });

  return {
    deleted,
    total: files.length,
  };
}

function getFileType(filename) {
  if (isImageFile(filename)) {
    return "image";
  }

  if (isModelFile(filename)) {
    return "model";
  }

  return "file";
}

function getMimeTypeByExtension(filename) {
  const ext = getExtension(filename);

  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".obj": "text/plain",
    ".fbx": "application/octet-stream",
    ".stl": "application/octet-stream",
    ".json": "application/json",
    ".txt": "text/plain",
  };

  return map[ext] || "application/octet-stream";
}

module.exports = {
  IMAGE_EXTENSIONS,
  MODEL_EXTENSIONS,
  IMAGE_MIME_TYPES,
  MODEL_MIME_TYPES,

  ensureDirectory,
  fileExists,
  isSafeFilename,

  getExtension,
  getNameWithoutExtension,
  sanitizeFilename,
  createRandomId,
  createUniqueFilename,

  isImageFile,
  isModelFile,
  isAllowedImageMimeType,
  isAllowedModelMimeType,

  formatFileSize,
  getFileInfo,
  listFiles,

  deleteFile,
  copyFile,
  moveFile,

  readFileBuffer,
  writeFileBuffer,

  readTextFile,
  writeTextFile,

  readJsonFile,
  writeJsonFile,

  validateImageFile,
  validateModelFile,

  clearDirectory,
  getFileType,
  getMimeTypeByExtension,
};
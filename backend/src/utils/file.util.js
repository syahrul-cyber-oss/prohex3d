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

function ensureDir(dirPath) {
  if (!dirPath) {
    throw new Error("Directory path is required");
  }

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  return dirPath;
}

function exists(filePath) {
  if (!filePath) return false;
  return fs.existsSync(filePath);
}

function isFile(filePath) {
  if (!exists(filePath)) return false;
  return fs.statSync(filePath).isFile();
}

function isDirectory(dirPath) {
  if (!exists(dirPath)) return false;
  return fs.statSync(dirPath).isDirectory();
}

function getExt(filename) {
  return path.extname(filename || "").toLowerCase();
}

function getBaseName(filename) {
  return path.basename(filename || "");
}

function getNameWithoutExt(filename) {
  const ext = getExt(filename);
  return path.basename(filename || "", ext);
}

function isSafeFilename(filename) {
  if (!filename) return false;
  if (typeof filename !== "string") return false;
  if (filename.trim() === "") return false;
  if (filename.includes("..")) return false;
  if (filename.includes("/")) return false;
  if (filename.includes("\\")) return false;

  return true;
}

function sanitizeName(name) {
  if (!name) return "file";

  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "file";
}

function sanitizeFilename(filename) {
  const ext = getExt(filename);
  const name = getNameWithoutExt(filename);

  return `${sanitizeName(name)}${ext}`;
}

function randomId(length = 8) {
  return crypto.randomBytes(length).toString("hex");
}

function createUniqueFilename(originalName, prefix = "file") {
  const ext = getExt(originalName);
  const timestamp = Date.now();
  const id = randomId(8);

  return `${prefix}-${timestamp}-${id}${ext}`;
}

function createImageFilename(originalName) {
  return createUniqueFilename(originalName, "image");
}

function createModelFilename(originalName) {
  return createUniqueFilename(originalName, "model");
}

function isImageExt(filename) {
  return IMAGE_EXTENSIONS.includes(getExt(filename));
}

function isModelExt(filename) {
  return MODEL_EXTENSIONS.includes(getExt(filename));
}

function isImageMime(mimetype) {
  return IMAGE_MIME_TYPES.includes(mimetype);
}

function isModelMime(mimetype) {
  return MODEL_MIME_TYPES.includes(mimetype);
}

function getMimeType(filename) {
  const ext = getExt(filename);

  const mimeMap = {
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

  return mimeMap[ext] || "application/octet-stream";
}

function formatBytes(bytes) {
  const size = Number(bytes) || 0;

  if (size <= 0) {
    return {
      bytes: 0,
      kb: 0,
      mb: 0,
      text: "0 B",
    };
  }

  const kb = size / 1024;
  const mb = kb / 1024;

  let text = `${size} B`;

  if (mb >= 1) {
    text = `${mb.toFixed(2)} MB`;
  } else if (kb >= 1) {
    text = `${kb.toFixed(2)} KB`;
  }

  return {
    bytes: size,
    kb: Number(kb.toFixed(2)),
    mb: Number(mb.toFixed(2)),
    text,
  };
}

function getFileInfo(filePath) {
  if (!exists(filePath)) {
    return null;
  }

  const stats = fs.statSync(filePath);
  const filename = path.basename(filePath);
  const size = formatBytes(stats.size);

  return {
    filename,
    name: getNameWithoutExt(filename),
    ext: getExt(filename),
    mimetype: getMimeType(filename),
    path: filePath,
    size: stats.size,
    sizeKB: size.kb,
    sizeMB: size.mb,
    sizeText: size.text,
    isImage: isImageExt(filename),
    isModel: isModelExt(filename),
    createdAt: stats.birthtime,
    updatedAt: stats.mtime,
  };
}

function listFiles(dirPath, options = {}) {
  ensureDir(dirPath);

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

      if (!isFile(filePath)) {
        return false;
      }

      if (onlyImages) {
        return isImageExt(filename);
      }

      if (onlyModels) {
        return isModelExt(filename);
      }

      return true;
    })
    .map((filename) => getFileInfo(path.join(dirPath, filename)))
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function readBuffer(filePath) {
  if (!exists(filePath)) {
    throw new Error("File not found");
  }

  return fs.readFileSync(filePath);
}

function writeBuffer(filePath, buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Buffer is required");
  }

  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, buffer);

  return getFileInfo(filePath);
}

function readText(filePath, fallback = "") {
  if (!exists(filePath)) {
    return fallback;
  }

  return fs.readFileSync(filePath, "utf-8");
}

function writeText(filePath, content = "") {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf-8");

  return getFileInfo(filePath);
}

function readJson(filePath, fallback = null) {
  if (!exists(filePath)) {
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

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

  return getFileInfo(filePath);
}

function deleteFile(filePath) {
  if (!exists(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

function copyFile(sourcePath, targetPath) {
  if (!exists(sourcePath)) {
    throw new Error("Source file not found");
  }

  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);

  return getFileInfo(targetPath);
}

function moveFile(sourcePath, targetPath) {
  if (!exists(sourcePath)) {
    throw new Error("Source file not found");
  }

  ensureDir(path.dirname(targetPath));
  fs.renameSync(sourcePath, targetPath);

  return getFileInfo(targetPath);
}

function validateImageFile(file, maxSize = 10 * 1024 * 1024) {
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

  if (!isImageExt(file.originalname)) {
    return {
      valid: false,
      message: "Only jpg, jpeg, png, and webp images are allowed",
    };
  }

  if (file.mimetype && !isImageMime(file.mimetype)) {
    return {
      valid: false,
      message: "Invalid image mime type",
    };
  }

  if (file.size && file.size > maxSize) {
    return {
      valid: false,
      message: `Image file is too large. Maximum size is ${formatBytes(maxSize).text}`,
    };
  }

  return {
    valid: true,
    message: "Image file is valid",
  };
}

function validateModelFile(file, maxSize = 100 * 1024 * 1024) {
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

  if (!isModelExt(file.originalname)) {
    return {
      valid: false,
      message: "Only glb, gltf, obj, fbx, and stl models are allowed",
    };
  }

  if (file.mimetype && !isModelMime(file.mimetype)) {
    return {
      valid: false,
      message: "Invalid model mime type",
    };
  }

  if (file.size && file.size > maxSize) {
    return {
      valid: false,
      message: `Model file is too large. Maximum size is ${formatBytes(maxSize).text}`,
    };
  }

  return {
    valid: true,
    message: "Model file is valid",
  };
}

function removeEmptyDirs(dirPath) {
  if (!exists(dirPath)) {
    return false;
  }

  if (!isDirectory(dirPath)) {
    return false;
  }

  const files = fs.readdirSync(dirPath);

  if (files.length > 0) {
    return false;
  }

  fs.rmdirSync(dirPath);
  return true;
}

function clearDir(dirPath, options = {}) {
  ensureDir(dirPath);

  const files = listFiles(dirPath, options);

  let deleted = 0;

  files.forEach((file) => {
    if (deleteFile(file.path)) {
      deleted += 1;
    }
  });

  return {
    total: files.length,
    deleted,
  };
}

function safeJoin(baseDir, filename) {
  if (!isSafeFilename(filename)) {
    throw new Error("Invalid filename");
  }

  const finalPath = path.join(baseDir, filename);
  const resolvedBase = path.resolve(baseDir);
  const resolvedFinal = path.resolve(finalPath);

  if (!resolvedFinal.startsWith(resolvedBase)) {
    throw new Error("Invalid file path");
  }

  return finalPath;
}

function getFileType(filename) {
  if (isImageExt(filename)) {
    return "image";
  }

  if (isModelExt(filename)) {
    return "model";
  }

  return "file";
}

module.exports = {
  IMAGE_EXTENSIONS,
  MODEL_EXTENSIONS,
  IMAGE_MIME_TYPES,
  MODEL_MIME_TYPES,

  ensureDir,
  exists,
  isFile,
  isDirectory,

  getExt,
  getBaseName,
  getNameWithoutExt,

  isSafeFilename,
  sanitizeName,
  sanitizeFilename,

  randomId,
  createUniqueFilename,
  createImageFilename,
  createModelFilename,

  isImageExt,
  isModelExt,
  isImageMime,
  isModelMime,
  getMimeType,
  getFileType,

  formatBytes,
  getFileInfo,
  listFiles,

  readBuffer,
  writeBuffer,
  readText,
  writeText,
  readJson,
  writeJson,

  deleteFile,
  copyFile,
  moveFile,

  validateImageFile,
  validateModelFile,

  removeEmptyDirs,
  clearDir,
  safeJoin,
};
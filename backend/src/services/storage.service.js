const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const env = require("../config/env");

const backendRoot = path.join(__dirname, "..", "..");

const uploadsDir = path.join(backendRoot, env.storage.uploadsDir || "uploads");
const resultsDir = path.join(backendRoot, env.storage.resultsDir || "results");

const allowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const allowedModelExtensions = [".glb", ".gltf", ".obj", ".fbx", ".stl"];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureStorage() {
  ensureDir(uploadsDir);
  ensureDir(resultsDir);
}

function createId(length = 12) {
  return crypto.randomBytes(length).toString("hex");
}

function isSafeFilename(filename) {
  if (!filename) return false;
  if (typeof filename !== "string") return false;
  if (filename.includes("..")) return false;
  if (filename.includes("/")) return false;
  if (filename.includes("\\")) return false;
  return true;
}

function getExtension(filename) {
  return path.extname(filename).toLowerCase();
}

function isImageFile(filename) {
  return allowedImageExtensions.includes(getExtension(filename));
}

function isModelFile(filename) {
  return allowedModelExtensions.includes(getExtension(filename));
}

function normalizeFilename(filename) {
  const ext = getExtension(filename);
  const name = path
    .basename(filename, ext)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${name || "file"}${ext}`;
}

function createStoredFilename(originalName, prefix = "file") {
  const ext = getExtension(originalName);
  const id = createId(8);

  return `${prefix}-${Date.now()}-${id}${ext}`;
}

function getUploadPath(filename) {
  if (!isSafeFilename(filename)) {
    throw new Error("Invalid upload filename");
  }

  return path.join(uploadsDir, filename);
}

function getResultPath(filename) {
  if (!isSafeFilename(filename)) {
    throw new Error("Invalid result filename");
  }

  return path.join(resultsDir, filename);
}

function getUploadUrl(filename) {
  return `${env.server.baseUrl}/uploads/${filename}`;
}

function getResultUrl(filename) {
  return `${env.server.baseUrl}/results/${filename}`;
}

function getModelDownloadUrl(filename) {
  return `${env.server.baseUrl}/api/model/download/${filename}`;
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function getFileStats(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.statSync(filePath);
}

function getFileInfo(filePath, filename, type = "file") {
  const stats = getFileStats(filePath);

  if (!stats) {
    return null;
  }

  const baseInfo = {
    filename,
    type,
    size: stats.size,
    sizeKB: Number((stats.size / 1024).toFixed(2)),
    sizeMB: Number((stats.size / 1024 / 1024).toFixed(2)),
    ext: getExtension(filename),
    createdAt: stats.birthtime,
    updatedAt: stats.mtime,
  };

  if (type === "image") {
    return {
      ...baseInfo,
      path: `/uploads/${filename}`,
      url: getUploadUrl(filename),
    };
  }

  if (type === "model") {
    return {
      ...baseInfo,
      path: `/results/${filename}`,
      url: getResultUrl(filename),
      downloadUrl: getModelDownloadUrl(filename),
    };
  }

  return baseInfo;
}

function saveBufferToUploads(buffer, originalName) {
  ensureStorage();

  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Buffer is required");
  }

  if (!isImageFile(originalName)) {
    throw new Error("Only jpg, jpeg, png, and webp images are allowed");
  }

  const filename = createStoredFilename(originalName, "image");
  const filePath = getUploadPath(filename);

  fs.writeFileSync(filePath, buffer);

  return getFileInfo(filePath, filename, "image");
}

function saveBufferToResults(buffer, originalName) {
  ensureStorage();

  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Buffer is required");
  }

  if (!isModelFile(originalName)) {
    throw new Error("Only glb, gltf, obj, fbx, and stl models are allowed");
  }

  const filename = createStoredFilename(originalName, "model");
  const filePath = getResultPath(filename);

  fs.writeFileSync(filePath, buffer);

  return getFileInfo(filePath, filename, "model");
}

function saveBase64ToUploads(base64Data, originalName) {
  ensureStorage();

  if (!base64Data) {
    throw new Error("Base64 data is required");
  }

  const cleanBase64 = String(base64Data).replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");

  return saveBufferToUploads(buffer, originalName);
}

function saveBase64ToResults(base64Data, originalName) {
  ensureStorage();

  if (!base64Data) {
    throw new Error("Base64 data is required");
  }

  const cleanBase64 = String(base64Data).replace(
    /^data:application\/octet-stream;base64,/,
    ""
  );

  const buffer = Buffer.from(cleanBase64, "base64");

  return saveBufferToResults(buffer, originalName);
}

function listUploadedImages() {
  ensureStorage();

  return fs
    .readdirSync(uploadsDir)
    .filter((filename) => isImageFile(filename))
    .map((filename) => {
      const filePath = getUploadPath(filename);
      return getFileInfo(filePath, filename, "image");
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function listResultModels() {
  ensureStorage();

  return fs
    .readdirSync(resultsDir)
    .filter((filename) => isModelFile(filename))
    .map((filename) => {
      const filePath = getResultPath(filename);
      return getFileInfo(filePath, filename, "model");
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getUploadedImage(filename) {
  ensureStorage();

  if (!isSafeFilename(filename)) {
    throw new Error("Invalid filename");
  }

  if (!isImageFile(filename)) {
    throw new Error("File is not a valid image");
  }

  const filePath = getUploadPath(filename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return getFileInfo(filePath, filename, "image");
}

function getResultModel(filename) {
  ensureStorage();

  if (!isSafeFilename(filename)) {
    throw new Error("Invalid filename");
  }

  if (!isModelFile(filename)) {
    throw new Error("File is not a valid 3D model");
  }

  const filePath = getResultPath(filename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return getFileInfo(filePath, filename, "model");
}

function deleteUploadedImage(filename) {
  ensureStorage();

  if (!isSafeFilename(filename)) {
    throw new Error("Invalid filename");
  }

  const filePath = getUploadPath(filename);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

function deleteResultModel(filename) {
  ensureStorage();

  if (!isSafeFilename(filename)) {
    throw new Error("Invalid filename");
  }

  const filePath = getResultPath(filename);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

function copyUploadToResult(uploadFilename, resultFilename) {
  ensureStorage();

  if (!isSafeFilename(uploadFilename) || !isSafeFilename(resultFilename)) {
    throw new Error("Invalid filename");
  }

  const sourcePath = getUploadPath(uploadFilename);
  const targetPath = getResultPath(resultFilename);

  if (!fs.existsSync(sourcePath)) {
    throw new Error("Source upload file not found");
  }

  fs.copyFileSync(sourcePath, targetPath);

  return getFileInfo(targetPath, resultFilename, "model");
}

function moveUploadToResult(uploadFilename, resultFilename) {
  ensureStorage();

  if (!isSafeFilename(uploadFilename) || !isSafeFilename(resultFilename)) {
    throw new Error("Invalid filename");
  }

  const sourcePath = getUploadPath(uploadFilename);
  const targetPath = getResultPath(resultFilename);

  if (!fs.existsSync(sourcePath)) {
    throw new Error("Source upload file not found");
  }

  fs.renameSync(sourcePath, targetPath);

  return getFileInfo(targetPath, resultFilename, "model");
}

function readJsonFile(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) {
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
  const dir = path.dirname(filePath);

  ensureDir(dir);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getModelsDatabasePath() {
  ensureStorage();
  return path.join(resultsDir, "models.json");
}

function readModelsDatabase() {
  const databasePath = getModelsDatabasePath();

  if (!fs.existsSync(databasePath)) {
    writeJsonFile(databasePath, []);
  }

  return readJsonFile(databasePath, []);
}

function writeModelsDatabase(data) {
  const databasePath = getModelsDatabasePath();
  writeJsonFile(databasePath, data);
}

ensureStorage();

module.exports = {
  uploadsDir,
  resultsDir,

  ensureDir,
  ensureStorage,

  createId,
  createStoredFilename,
  normalizeFilename,

  isSafeFilename,
  isImageFile,
  isModelFile,
  getExtension,

  getUploadPath,
  getResultPath,

  getUploadUrl,
  getResultUrl,
  getModelDownloadUrl,

  fileExists,
  getFileStats,
  getFileInfo,

  saveBufferToUploads,
  saveBufferToResults,
  saveBase64ToUploads,
  saveBase64ToResults,

  listUploadedImages,
  listResultModels,

  getUploadedImage,
  getResultModel,

  deleteUploadedImage,
  deleteResultModel,

  copyUploadToResult,
  moveUploadToResult,

  readJsonFile,
  writeJsonFile,

  getModelsDatabasePath,
  readModelsDatabase,
  writeModelsDatabase,
};
const fs = require("fs");
const path = require("path");
const env = require("../config/env");

const resultsDir = path.join(__dirname, "..", "..", "results");
const databaseFile = path.join(resultsDir, "models.json");

function ensureResultsDir() {
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  if (!fs.existsSync(databaseFile)) {
    fs.writeFileSync(databaseFile, JSON.stringify([], null, 2));
  }
}

function readDatabase() {
  ensureResultsDir();

  const raw = fs.readFileSync(databaseFile, "utf-8");

  if (!raw.trim()) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function writeDatabase(data) {
  ensureResultsDir();
  fs.writeFileSync(databaseFile, JSON.stringify(data, null, 2));
}

function isSafeFilename(filename) {
  if (!filename) return false;
  if (filename.includes("..")) return false;
  if (filename.includes("/")) return false;
  if (filename.includes("\\")) return false;
  return true;
}

function isModelFile(filename) {
  const ext = path.extname(filename).toLowerCase();

  return [".glb", ".gltf", ".obj", ".fbx", ".stl"].includes(ext);
}

function getModelUrl(filename) {
  return `${env.server.baseUrl}/results/${filename}`;
}

function getDownloadUrl(filename) {
  return `${env.server.baseUrl}/api/model/download/${filename}`;
}

function getFileInfo(filename) {
  const filePath = path.join(resultsDir, filename);
  const stats = fs.statSync(filePath);

  return {
    filename,
    size: stats.size,
    sizeMB: Number((stats.size / 1024 / 1024).toFixed(2)),
    ext: path.extname(filename).toLowerCase(),
    path: `/results/${filename}`,
    url: getModelUrl(filename),
    downloadUrl: getDownloadUrl(filename),
    createdAt: stats.birthtime,
    updatedAt: stats.mtime,
  };
}

async function getAllModels(req, res, next) {
  try {
    ensureResultsDir();

    const databaseModels = readDatabase();

    const fileModels = fs
      .readdirSync(resultsDir)
      .filter((file) => isModelFile(file))
      .map((file) => {
        const info = getFileInfo(file);

        const dbData = databaseModels.find((item) => {
          return item.outputModel && item.outputModel.filename === file;
        });

        return {
          id: dbData ? dbData.id : file,
          status: dbData ? dbData.status : "completed",
          provider: dbData ? dbData.provider : "local",
          inputImage: dbData ? dbData.inputImage : null,
          outputModel: info,
          createdAt: dbData ? dbData.createdAt : info.createdAt,
          updatedAt: dbData ? dbData.updatedAt : info.updatedAt,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      message: "Models fetched successfully",
      total: fileModels.length,
      data: fileModels,
    });
  } catch (error) {
    next(error);
  }
}

async function getModelById(req, res, next) {
  try {
    ensureResultsDir();

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Model ID or filename is required",
      });
    }

    if (!isSafeFilename(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid model ID or filename",
      });
    }

    const databaseModels = readDatabase();

    const modelFromDb = databaseModels.find((item) => {
      if (item.id === id) return true;
      if (item.outputModel && item.outputModel.filename === id) return true;
      return false;
    });

    if (modelFromDb) {
      const filename = modelFromDb.outputModel
        ? modelFromDb.outputModel.filename
        : null;

      if (filename) {
        const filePath = path.join(resultsDir, filename);

        if (fs.existsSync(filePath)) {
          return res.status(200).json({
            success: true,
            message: "Model fetched successfully",
            data: {
              ...modelFromDb,
              outputModel: getFileInfo(filename),
            },
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: "Model data fetched successfully",
        data: modelFromDb,
      });
    }

    const modelPath = path.join(resultsDir, id);

    if (!fs.existsSync(modelPath)) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    if (!isModelFile(id)) {
      return res.status(400).json({
        success: false,
        message: "File is not a valid 3D model",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Model fetched successfully",
      data: {
        id,
        status: "completed",
        provider: "local",
        inputImage: null,
        outputModel: getFileInfo(id),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function downloadModel(req, res, next) {
  try {
    ensureResultsDir();

    const { filename } = req.params;

    if (!isSafeFilename(filename)) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    if (!isModelFile(filename)) {
      return res.status(400).json({
        success: false,
        message: "File is not a valid 3D model",
      });
    }

    const filePath = path.join(resultsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Model file not found",
      });
    }

    return res.download(filePath, filename);
  } catch (error) {
    next(error);
  }
}

async function deleteModel(req, res, next) {
  try {
    ensureResultsDir();

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Model ID or filename is required",
      });
    }

    if (!isSafeFilename(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid model ID or filename",
      });
    }

    const databaseModels = readDatabase();

    const modelFromDb = databaseModels.find((item) => {
      if (item.id === id) return true;
      if (item.outputModel && item.outputModel.filename === id) return true;
      return false;
    });

    let filename = id;

    if (modelFromDb && modelFromDb.outputModel) {
      filename = modelFromDb.outputModel.filename;
    }

    const filePath = path.join(resultsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Model file not found",
      });
    }

    if (!isModelFile(filename)) {
      return res.status(400).json({
        success: false,
        message: "File is not a valid 3D model",
      });
    }

    fs.unlinkSync(filePath);

    const filteredModels = databaseModels.filter((item) => {
      if (item.id === id) return false;
      if (item.outputModel && item.outputModel.filename === id) return false;
      if (item.outputModel && item.outputModel.filename === filename) return false;
      return true;
    });

    writeDatabase(filteredModels);

    return res.status(200).json({
      success: true,
      message: "Model deleted successfully",
      data: {
        id,
        filename,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllModels,
  getModelById,
  downloadModel,
  deleteModel,
};
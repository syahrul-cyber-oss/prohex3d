const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const env = require("../config/env");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
const resultsDir = path.join(__dirname, "..", "..", "results");
const databaseFile = path.join(resultsDir, "models.json");

function ensureFolders() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  if (!fs.existsSync(databaseFile)) {
    fs.writeFileSync(databaseFile, JSON.stringify([], null, 2));
  }
}

function readDatabase() {
  ensureFolders();

  const raw = fs.readFileSync(databaseFile, "utf-8");

  if (!raw.trim()) {
    return [];
  }

  return JSON.parse(raw);
}

function writeDatabase(data) {
  ensureFolders();
  fs.writeFileSync(databaseFile, JSON.stringify(data, null, 2));
}

function createId() {
  return crypto.randomBytes(12).toString("hex");
}

function isSafeFilename(filename) {
  if (!filename) return false;
  if (filename.includes("..")) return false;
  if (filename.includes("/")) return false;
  if (filename.includes("\\")) return false;
  return true;
}

function getModelUrl(filename) {
  return `${env.server.baseUrl}/results/${filename}`;
}

function getImageUrl(filename) {
  return `${env.server.baseUrl}/uploads/${filename}`;
}

function createDemoGlb(filePath) {
  const gltf = {
    asset: {
      version: "2.0",
      generator: "ProHex3D Demo Generator",
    },
    scene: 0,
    scenes: [
      {
        nodes: [],
      },
    ],
  };

  const json = JSON.stringify(gltf);
  const jsonPadding = (4 - (Buffer.byteLength(json) % 4)) % 4;
  const jsonBuffer = Buffer.from(json + " ".repeat(jsonPadding), "utf-8");

  const totalLength = 12 + 8 + jsonBuffer.length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const chunkHeader = Buffer.alloc(8);
  chunkHeader.writeUInt32LE(jsonBuffer.length, 0);
  chunkHeader.writeUInt32LE(0x4e4f534a, 4);

  const glb = Buffer.concat([header, chunkHeader, jsonBuffer]);

  fs.writeFileSync(filePath, glb);
}

async function generateModelFromImage(req, res, next) {
  try {
    ensureFolders();

    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "Filename is required",
        example: {
          filename: "image-123.jpg",
        },
      });
    }

    if (!isSafeFilename(filename)) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    const imagePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: "Uploaded image not found",
      });
    }

    const id = createId();
    const modelFilename = `model-${id}.glb`;
    const modelPath = path.join(resultsDir, modelFilename);

    const now = new Date().toISOString();

    const modelData = {
      id,
      status: "processing",
      provider: env.ai3d.provider,
      inputImage: {
        filename,
        path: `/uploads/${filename}`,
        url: getImageUrl(filename),
      },
      outputModel: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    };

    const models = readDatabase();
    models.push(modelData);
    writeDatabase(models);

    try {
      if (env.ai3d.provider === "demo") {
        createDemoGlb(modelPath);
      } else {
        const ai3dService = require("../services/ai3d.service");

        await ai3dService.generateModelFromImage({
          imagePath,
          imageFilename: filename,
          outputPath: modelPath,
          outputFilename: modelFilename,
        });
      }

      const updatedModels = readDatabase();

      const updatedData = updatedModels.map((item) => {
        if (item.id !== id) return item;

        return {
          ...item,
          status: "completed",
          outputModel: {
            filename: modelFilename,
            path: `/results/${modelFilename}`,
            url: getModelUrl(modelFilename),
            downloadUrl: `${env.server.baseUrl}/api/model/download/${modelFilename}`,
          },
          updatedAt: new Date().toISOString(),
        };
      });

      writeDatabase(updatedData);

      const completedModel = updatedData.find((item) => item.id === id);

      return res.status(201).json({
        success: true,
        message: "3D model generated successfully",
        data: completedModel,
      });
    } catch (generateError) {
      const failedModels = readDatabase();

      const failedData = failedModels.map((item) => {
        if (item.id !== id) return item;

        return {
          ...item,
          status: "failed",
          error: generateError.message || "Failed to generate 3D model",
          updatedAt: new Date().toISOString(),
        };
      });

      writeDatabase(failedData);

      return res.status(500).json({
        success: false,
        message: "Failed to generate 3D model",
        error: generateError.message,
      });
    }
  } catch (error) {
    next(error);
  }
}

async function getGenerateStatus(req, res, next) {
  try {
    ensureFolders();

    const { id } = req.params;

    const models = readDatabase();
    const model = models.find((item) => item.id === id);

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Generate data not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Generate status fetched successfully",
      data: {
        id: model.id,
        status: model.status,
        error: model.error,
        outputModel: model.outputModel,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getGeneratedModels(req, res, next) {
  try {
    ensureFolders();

    const models = readDatabase().sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      message: "Generated models fetched successfully",
      total: models.length,
      data: models,
    });
  } catch (error) {
    next(error);
  }
}

async function getGeneratedModelById(req, res, next) {
  try {
    ensureFolders();

    const { id } = req.params;

    const models = readDatabase();
    const model = models.find((item) => item.id === id);

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Generated model not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Generated model fetched successfully",
      data: model,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteGeneratedModel(req, res, next) {
  try {
    ensureFolders();

    const { id } = req.params;

    const models = readDatabase();
    const model = models.find((item) => item.id === id);

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Generated model not found",
      });
    }

    if (model.outputModel && model.outputModel.filename) {
      const modelPath = path.join(resultsDir, model.outputModel.filename);

      if (fs.existsSync(modelPath)) {
        fs.unlinkSync(modelPath);
      }
    }

    const filteredModels = models.filter((item) => item.id !== id);
    writeDatabase(filteredModels);

    return res.status(200).json({
      success: true,
      message: "Generated model deleted successfully",
      data: {
        id,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateModelFromImage,
  getGenerateStatus,
  getGeneratedModels,
  getGeneratedModelById,
  deleteGeneratedModel,
};
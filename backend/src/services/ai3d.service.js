const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const env = require("../config/env");

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getFileExt(filename) {
  return path.extname(filename).toLowerCase();
}

function isImageFile(filename) {
  const ext = getFileExt(filename);

  return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getModelUrlFromResponse(data) {
  if (!data) return null;

  if (typeof data === "string") {
    return data;
  }

  if (data.modelUrl) return data.modelUrl;
  if (data.model_url) return data.model_url;
  if (data.url) return data.url;
  if (data.downloadUrl) return data.downloadUrl;
  if (data.download_url) return data.download_url;
  if (data.resultUrl) return data.resultUrl;
  if (data.result_url) return data.result_url;

  if (data.data) {
    return getModelUrlFromResponse(data.data);
  }

  if (data.result) {
    return getModelUrlFromResponse(data.result);
  }

  if (data.output) {
    return getModelUrlFromResponse(data.output);
  }

  return null;
}

function getTaskIdFromResponse(data) {
  if (!data) return null;

  if (data.taskId) return data.taskId;
  if (data.task_id) return data.task_id;
  if (data.id) return data.id;

  if (data.data) {
    return getTaskIdFromResponse(data.data);
  }

  if (data.result) {
    return getTaskIdFromResponse(data.result);
  }

  return null;
}

function getStatusFromResponse(data) {
  if (!data) return null;

  if (data.status) return String(data.status).toLowerCase();
  if (data.state) return String(data.state).toLowerCase();

  if (data.data) {
    return getStatusFromResponse(data.data);
  }

  if (data.result) {
    return getStatusFromResponse(data.result);
  }

  return null;
}

async function downloadFile(url, outputPath) {
  ensureDir(outputPath);

  const response = await axios({
    method: "GET",
    url,
    responseType: "stream",
    timeout: 120000,
  });

  const writer = fs.createWriteStream(outputPath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function generateWithCustomApi({
  imagePath,
  imageFilename,
  outputPath,
  outputFilename,
}) {
  if (!env.ai3d.apiUrl) {
    throw new Error("AI3D_API_URL is required for custom AI provider");
  }

  if (!env.ai3d.apiKey) {
    throw new Error("AI3D_API_KEY is required for custom AI provider");
  }

  const form = new FormData();

  form.append("image", fs.createReadStream(imagePath), imageFilename);
  form.append("output_format", "glb");
  form.append("filename", outputFilename);

  const response = await axios.post(env.ai3d.apiUrl, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${env.ai3d.apiKey}`,
    },
    timeout: 180000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  const modelUrl = getModelUrlFromResponse(response.data);

  if (!modelUrl) {
    throw new Error("AI response does not contain model URL");
  }

  await downloadFile(modelUrl, outputPath);

  return {
    provider: "custom",
    modelUrl,
    outputPath,
    outputFilename,
  };
}

async function generateWithPollingApi({
  imagePath,
  imageFilename,
  outputPath,
  outputFilename,
}) {
  if (!env.ai3d.apiUrl) {
    throw new Error("AI3D_API_URL is required for polling AI provider");
  }

  if (!env.ai3d.apiKey) {
    throw new Error("AI3D_API_KEY is required for polling AI provider");
  }

  const createTaskUrl = env.ai3d.apiUrl;
  const statusUrl = process.env.AI3D_STATUS_URL || "";

  if (!statusUrl) {
    throw new Error("AI3D_STATUS_URL is required for polling AI provider");
  }

  const form = new FormData();

  form.append("image", fs.createReadStream(imagePath), imageFilename);
  form.append("output_format", "glb");
  form.append("filename", outputFilename);

  const createResponse = await axios.post(createTaskUrl, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${env.ai3d.apiKey}`,
    },
    timeout: 120000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  const taskId = getTaskIdFromResponse(createResponse.data);

  if (!taskId) {
    throw new Error("AI response does not contain task ID");
  }

  const maxAttempts = Number(process.env.AI3D_MAX_POLL_ATTEMPTS) || 60;
  const intervalMs = Number(process.env.AI3D_POLL_INTERVAL_MS) || 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await sleep(intervalMs);

    const statusResponse = await axios.get(`${statusUrl}/${taskId}`, {
      headers: {
        Authorization: `Bearer ${env.ai3d.apiKey}`,
      },
      timeout: 60000,
    });

    const status = getStatusFromResponse(statusResponse.data);
    const modelUrl = getModelUrlFromResponse(statusResponse.data);

    if (status === "failed" || status === "error") {
      throw new Error("AI generation failed");
    }

    if (
      status === "completed" ||
      status === "complete" ||
      status === "success" ||
      modelUrl
    ) {
      if (!modelUrl) {
        throw new Error("AI task completed but model URL is missing");
      }

      await downloadFile(modelUrl, outputPath);

      return {
        provider: "polling",
        taskId,
        modelUrl,
        outputPath,
        outputFilename,
      };
    }
  }

  throw new Error("AI generation timeout");
}

async function generateModelFromImage({
  imagePath,
  imageFilename,
  outputPath,
  outputFilename,
}) {
  if (!imagePath) {
    throw new Error("imagePath is required");
  }

  if (!imageFilename) {
    throw new Error("imageFilename is required");
  }

  if (!outputPath) {
    throw new Error("outputPath is required");
  }

  if (!outputFilename) {
    throw new Error("outputFilename is required");
  }

  if (!fileExists(imagePath)) {
    throw new Error("Input image file not found");
  }

  if (!isImageFile(imageFilename)) {
    throw new Error("Input file must be jpg, jpeg, png, or webp");
  }

  ensureDir(outputPath);

  const provider = String(env.ai3d.provider || "demo").toLowerCase();

  if (provider === "custom") {
    return generateWithCustomApi({
      imagePath,
      imageFilename,
      outputPath,
      outputFilename,
    });
  }

  if (provider === "polling") {
    return generateWithPollingApi({
      imagePath,
      imageFilename,
      outputPath,
      outputFilename,
    });
  }

  throw new Error(
    `Unsupported AI3D_PROVIDER: ${provider}. Use demo, custom, or polling.`
  );
}

module.exports = {
  generateModelFromImage,
  generateWithCustomApi,
  generateWithPollingApi,
  downloadFile,
};
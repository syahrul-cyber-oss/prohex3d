const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.join(__dirname, "..", "..", ".env"),
});

const env = {
  app: {
    name: process.env.APP_NAME || "ProHex3D",
    env: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT) || 5000,
  },

  client: {
    url: process.env.CLIENT_URL || "http://localhost:3000",
  },

  server: {
    baseUrl: process.env.SERVER_BASE_URL || "http://localhost:5000",
  },

  upload: {
    maxFileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
    allowedImageTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ],
  },

  ai3d: {
    provider: process.env.AI3D_PROVIDER || "demo",
    apiKey: process.env.AI3D_API_KEY || "",
    apiUrl: process.env.AI3D_API_URL || "",
  },

  storage: {
    uploadsDir: process.env.UPLOADS_DIR || "uploads",
    resultsDir: process.env.RESULTS_DIR || "results",
  },
};

function validateEnv() {
  if (!env.app.port) {
    throw new Error("PORT is required");
  }

  if (!env.client.url) {
    throw new Error("CLIENT_URL is required");
  }

  if (env.ai3d.provider !== "demo" && !env.ai3d.apiKey) {
    throw new Error("AI3D_API_KEY is required when AI3D_PROVIDER is not demo");
  }
}

validateEnv();

module.exports = env;
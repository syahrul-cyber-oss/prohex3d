const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const env = require("./config/env");

const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/error.middleware");

const uploadRoute = require("./routes/upload.route");
const generateRoute = require("./routes/generate.route");
const modelRoute = require("./routes/model.route");

const app = express();

const PORT = env.app.port;
const CLIENT_URL = env.client.url;

const uploadsDir = path.join(__dirname, "..", "uploads");
const resultsDir = path.join(__dirname, "..", "results");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use("/uploads", express.static(uploadsDir));
app.use("/results", express.static(resultsDir));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ProHex3D backend is running",
    app: "prohex3d",
    version: "1.0.0",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    server: "online",
    time: new Date().toISOString(),
  });
});

app.use("/api/upload", uploadRoute);
app.use("/api/generate", generateRoute);
app.use("/api/model", modelRoute);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ProHex3D backend running on http://localhost:${PORT}`);
});
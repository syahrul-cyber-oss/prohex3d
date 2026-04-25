const express = require("express");

const {
  generateModelFromImage,
  getGenerateStatus,
  getGeneratedModels,
  getGeneratedModelById,
  deleteGeneratedModel,
} = require("../controllers/generate.controller");

const router = express.Router();

/*
  POST /api/generate

  Generate model 3D dari foto yang sudah diupload.

  Body JSON:
  {
    "filename": "nama-file.jpg"
  }
*/
router.post("/", generateModelFromImage);

/*
  GET /api/generate

  Melihat semua hasil generate model 3D.
*/
router.get("/", getGeneratedModels);

/*
  GET /api/generate/status/:id

  Melihat status generate berdasarkan ID.
*/
router.get("/status/:id", getGenerateStatus);

/*
  GET /api/generate/:id

  Melihat detail hasil model 3D berdasarkan ID.
*/
router.get("/:id", getGeneratedModelById);

/*
  DELETE /api/generate/:id

  Menghapus hasil model 3D berdasarkan ID.
*/
router.delete("/:id", deleteGeneratedModel);

module.exports = router;
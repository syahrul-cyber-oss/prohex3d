const express = require("express");

const {
  getAllModels,
  getModelById,
  downloadModel,
  deleteModel,
} = require("../controllers/model.controller");

const router = express.Router();

/*
  GET /api/model

  Melihat semua file model 3D yang tersedia.
*/
router.get("/", getAllModels);

/*
  GET /api/model/:id

  Melihat detail model 3D berdasarkan ID atau nama file.
*/
router.get("/:id", getModelById);

/*
  GET /api/model/download/:filename

  Download file model 3D.
  Contoh:
  /api/model/download/model-123.glb
*/
router.get("/download/:filename", downloadModel);

/*
  DELETE /api/model/:id

  Menghapus model 3D berdasarkan ID atau nama file.
*/
router.delete("/:id", deleteModel);

module.exports = router;
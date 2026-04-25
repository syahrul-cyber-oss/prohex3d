const express = require("express");

const {
  uploadSingleImage,
} = require("../middleware/upload.middleware");

const {
  uploadImage,
  getUploadedImages,
  getUploadedImageByName,
  deleteUploadedImage,
} = require("../controllers/upload.controller");

const router = express.Router();

/*
  POST /api/upload

  Upload 1 foto.
  Field name dari frontend harus: image
*/
router.post("/", uploadSingleImage, uploadImage);

/*
  GET /api/upload

  Melihat semua foto yang sudah diupload.
*/
router.get("/", getUploadedImages);

/*
  GET /api/upload/:filename

  Melihat detail 1 foto berdasarkan nama file.
*/
router.get("/:filename", getUploadedImageByName);

/*
  DELETE /api/upload/:filename

  Menghapus foto dari folder uploads.
*/
router.delete("/:filename", deleteUploadedImage);

module.exports = router;
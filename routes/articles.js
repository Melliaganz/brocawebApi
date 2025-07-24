const express = require("express");
const router = express.Router();
const {
  createArticle,
  getAllArticles,
  getArticleById,
  deleteArticle,
  updateArticle,
} = require("../controllers/articleController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const multer = require("multer");
const path = require("path");

// Config multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { files: 5 },
});

// 🔓 Routes publiques
router.get("/", getAllArticles);
router.get("/:id", getArticleById);

// 🔐 Routes protégées (admin)
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.array("images", 10),
  createArticle
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  upload.array("images", 10),
  updateArticle
);

router.delete("/:id", authMiddleware, adminMiddleware, deleteArticle);

module.exports = router;

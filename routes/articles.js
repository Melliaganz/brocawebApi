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
const upload = require("../middleware/upload");

router.get("/", getAllArticles);
router.get("/:id", getArticleById);

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.array("images", 5),
  createArticle
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  upload.array("newImages", 5),
  updateArticle
);

router.delete("/:id", authMiddleware, adminMiddleware, deleteArticle);

module.exports = router;

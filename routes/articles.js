// routes/articles.js
const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const multer = require('multer');
const path = require('path');

// Config multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Routes publiques
router.get('/', articleController.getAllArticles);
router.get('/:id', articleController.getArticleById);

// Routes protégées (admin)
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  articleController.createArticle
);

router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  articleController.deleteArticle
);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), articleController.updateArticle);

module.exports = router;

// controllers/articleController.js
const Article = require("../models/Article");
const fs = require("fs");
const path = require("path");

// Créer un article
exports.createArticle = async (req, res) => {
  try {
    const { titre, description, prix, etat } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image requise." });
    }

    const article = new Article({
      titre,
      description,
      prix,
      etat,
      image: req.file.filename,
      createdBy: req.user.id,
    });

    await article.save();
    res.status(201).json(article);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de la création.", error: err.message });
  }
};

// Obtenir tous les articles
exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find().populate("createdBy", "nom email");
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

// Obtenir un article par ID
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate(
      "createdBy",
      "nom email"
    );
    if (!article)
      return res.status(404).json({ message: "Article non trouvé." });

    res.status(200).json(article);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

// Supprimer un article
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article non trouvé.' });

    // Supprimer l'image associée
    const imagePath = path.join(__dirname, '../uploads', article.image);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    // Supprimer l'article de la base
    await Article.findByIdAndDelete(req.params.id); // ✅ plus explicite que article.remove()

    res.status(200).json({ message: 'Article supprimé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression.', error: err.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const updates = req.body;
    if (req.file) {
      updates.image = req.file.filename;
    }

    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!updatedArticle) {
      return res.status(404).json({ message: "Article non trouvé." });
    }

    res.json({
      message: "Article mis à jour avec succès.",
      article: updatedArticle,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

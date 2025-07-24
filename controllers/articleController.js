// controllers/articleController.js
const Article = require("../models/Article");
const fs = require("fs");
const path = require("path");

// Créer un article
// controllers/articleController.js
exports.createArticle = async (req, res) => {
  try {
    const { titre, description, prix, etat, categorie } = req.body;

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "Au moins une image est requise." });
    }

    const imageFilenames = req.files.map((file) => file.filename);

    const article = new Article({
      titre,
      description,
      prix,
      etat,
      categorie,
      images: imageFilenames,
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
    if (!article)
      return res.status(404).json({ message: "Article non trouvé." });

    // Supprimer les images associées
    if (article.images && article.images.length > 0) {
      article.images.forEach((filename) => {
        const imagePath = path.join(__dirname, "../uploads", filename);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });
    }

    // Supprimer l'article de la base
    await Article.findByIdAndDelete(req.params.id); // ✅ plus explicite que article.remove()

    res.status(200).json({ message: "Article supprimé avec succès." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression.", error: err.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const updates = req.body;

    // Gérer les nouvelles images si uploadées
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map((file) => file.filename);
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


const Article = require("../models/Article");
const fs = require("fs");
const path = require("path");

// Créer un article
exports.createArticle = async (req, res) => {
  try {
    const { titre, description, prix, etat, categorie, quantite, mainImageIndex } = req.body;
    
    console.log(`[ARTICLE_CREATE] Tentative de création par l'utilisateur: ${req.user.id}`);

    if (!req.files || req.files.length === 0) {
      console.warn(`[ARTICLE_CREATE] Échec: Aucune image fournie par l'utilisateur ${req.user.id}`);
      return res.status(400).json({ message: "Au moins une image est requise." });
    }

    if (req.files.length > 5) {
      console.warn(`[ARTICLE_CREATE] Échec: Trop d'images (${req.files.length})`);
      return res.status(400).json({ message: "Vous ne pouvez envoyer que 5 images maximum." });
    }

    const imageFilenames = req.files.map((file) => file.filename);

    const article = new Article({
      titre,
      description,
      prix,
      etat,
      categorie,
      quantite: quantite !== undefined ? Number(quantite) : 1,
      images: imageFilenames,
      mainImageIndex: Math.min(
        Math.max(parseInt(mainImageIndex) || 0, 0),
        imageFilenames.length - 1
      ),
      createdBy: req.user.id,
    });

    await article.save();
    console.log(`[ARTICLE_CREATE] Succès: Article créé avec l'ID ${article._id} (${imageFilenames.length} images)`);
    res.status(201).json(article);
  } catch (err) {
    console.error(`[ARTICLE_CREATE_ERROR] Erreur lors de la création:`, err);
    res.status(500).json({ message: "Erreur lors de la création.", error: err.message });
  }
};

// Obtenir tous les articles
exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find().populate("createdBy", "nom email");
    res.status(200).json(articles);
  } catch (err) {
    console.error(`[ARTICLE_GETALL_ERROR] Erreur serveur:`, err);
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

// Obtenir un article par ID
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate("createdBy", "nom email");
    if (!article) {
      console.warn(`[ARTICLE_GETBYID] Article non trouvé: ${req.params.id}`);
      return res.status(404).json({ message: "Article non trouvé." });
    }
    res.status(200).json(article);
  } catch (err) {
    console.error(`[ARTICLE_GETBYID_ERROR] ID: ${req.params.id}:`, err);
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

// Supprimer un article
exports.deleteArticle = async (req, res) => {
  try {
    console.log(`[ARTICLE_DELETE] Tentative de suppression de l'article: ${req.params.id} par l'utilisateur: ${req.user.id}`);
    
    const article = await Article.findById(req.params.id);
    if (!article) {
      console.warn(`[ARTICLE_DELETE] Échec: Article ${req.params.id} non trouvé`);
      return res.status(404).json({ message: "Article non trouvé." });
    }

    // Suppression physique des images
    if (article.images && article.images.length > 0) {
      article.images.forEach((filename) => {
        const imagePath = path.join(__dirname, "../uploads", filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`[FS_CLEANUP] Fichier supprimé: ${filename}`);
        }
      });
    }

    await Article.findByIdAndDelete(req.params.id);
    console.log(`[ARTICLE_DELETE] Succès: Article ${req.params.id} supprimé de la base de données`);
    res.status(200).json({ message: "Article supprimé avec succès." });
  } catch (err) {
    console.error(`[ARTICLE_DELETE_ERROR] ID: ${req.params.id}:`, err);
    res.status(500).json({ message: "Erreur lors de la suppression.", error: err.message });
  }
};

// Mettre à jour un article
exports.updateArticle = async (req, res) => {
  try {
    const { titre, description, prix, etat, categorie, quantite, existingImages, mainImageIndex } = req.body;
    
    console.log(`[ARTICLE_UPDATE] Début modification ID: ${req.params.id} par User: ${req.user.id}`);

    const article = await Article.findById(req.params.id);
    if (!article) {
      console.warn(`[ARTICLE_UPDATE] Échec: Article ${req.params.id} non trouvé`);
      return res.status(404).json({ message: "Article non trouvé." });
    }

    // Gestion des images à conserver et à supprimer
    const keptImages = existingImages
      ? Array.isArray(existingImages) ? existingImages : [existingImages]
      : [];

    const imagesToDelete = article.images.filter((img) => !keptImages.includes(img));

    imagesToDelete.forEach((filename) => {
      const filePath = path.join(__dirname, "../uploads", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[FS_CLEANUP] Fichier obsolète supprimé: ${filename}`);
      }
    });

    const newImages = req.files ? req.files.map((file) => file.filename) : [];
    if (newImages.length > 0) {
      console.log(`[ARTICLE_UPDATE] ${newImages.length} nouvelles images ajoutées`);
    }

    // Mise à jour des données
    article.titre = titre || article.titre;
    article.description = description || article.description;
    article.prix = prix || article.prix;
    article.etat = etat || article.etat;
    article.categorie = categorie || article.categorie;

    if (quantite !== undefined) {
      const q = Number(quantite);
      article.quantite = isNaN(q) ? article.quantite : q;
    }

    article.images = [...keptImages, ...newImages];
    article.mainImageIndex = Number(mainImageIndex) || 0;

    await article.save();
    console.log(`[ARTICLE_UPDATE] Succès: Article ${article._id} mis à jour`);
    res.json({ message: "Article mis à jour avec succès.", article });

  } catch (err) {
    console.error(`[ARTICLE_UPDATE_ERROR] ID: ${req.params.id}:`, err);
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

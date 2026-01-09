const Article = require("../models/Article");
const cloudinary = require("cloudinary").v2;

exports.createArticle = async (req, res) => {
  try {
    const { titre, description, prix, etat, categorie, quantite, mainImageIndex } = req.body;
    
    console.log(`[ARTICLE_CREATE] Tentative de création par l'utilisateur: ${req.user.id}`);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Au moins une image est requise." });
    }

    if (req.files.length > 5) {
      return res.status(400).json({ message: "Vous ne pouvez envoyer que 5 images maximum." });
    }

    const imageUrls = req.files.map((file) => file.path);

    const article = new Article({
      titre,
      description,
      prix,
      etat,
      categorie,
      quantite: quantite !== undefined ? Number(quantite) : 1,
      images: imageUrls,
      mainImageIndex: Math.min(
        Math.max(parseInt(mainImageIndex) || 0, 0),
        imageUrls.length - 1
      ),
      createdBy: req.user.id,
    });

    await article.save();
    console.log(`[ARTICLE_CREATE] Succès: Article créé avec l'ID ${article._id}`);
    res.status(201).json(article);
  } catch (err) {
    console.error(`[ARTICLE_CREATE_ERROR] :`, err);
    res.status(500).json({ message: "Erreur lors de la création.", error: err.message });
  }
};

exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find().populate("createdBy", "nom email");
    res.status(200).json(articles);
  } catch (err) {
    console.error(`[GET_ALL_ARTICLES_ERROR] :`, err);
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate("createdBy", "nom email");
    if (!article) {
      return res.status(404).json({ message: "Article non trouvé." });
    }
    res.status(200).json(article);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article non trouvé." });
    }

    if (article.images && article.images.length > 0) {
      for (const url of article.images) {
        if (url.includes("cloudinary.com")) {
          try {
            const parts = url.split('/');
            const fileName = parts[parts.length - 1];
            const publicId = fileName.split('.')[0];
            await cloudinary.uploader.destroy(`articles/${publicId}`);
          } catch (cloudErr) {
            console.error(`[CLOUDINARY_DELETE_ERROR] :`, cloudErr);
          }
        }
      }
    }

    await Article.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Article supprimé avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression.", error: err.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const { titre, description, prix, etat, categorie, quantite, existingImages, mainImageIndex } = req.body;
    
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article non trouvé." });
    }

    const keptImages = existingImages
      ? Array.isArray(existingImages) ? existingImages : [existingImages]
      : [];

    const imagesToDelete = article.images.filter((img) => !keptImages.includes(img));

    for (const url of imagesToDelete) {
      if (url.includes("cloudinary.com")) {
        try {
          const parts = url.split('/');
          const fileName = parts[parts.length - 1];
          const publicId = fileName.split('.')[0];
          await cloudinary.uploader.destroy(`articles/${publicId}`);
        } catch (cloudErr) {
          console.error(`[CLOUDINARY_DELETE_ERROR] :`, cloudErr);
        }
      }
    }

    const newImages = req.files ? req.files.map((file) => file.path) : [];

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
    res.json({ message: "Article mis à jour avec succès.", article });

  } catch (err) {
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

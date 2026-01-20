const Article = require("../models/Article");
const cloudinary = require("cloudinary").v2;

const extractPublicId = (url) => {
  try {
    const parts = url.split("upload/")[1].split("/");
    parts.shift();
    const publicIdWithExtension = parts.join("/");
    return publicIdWithExtension.split(".")[0];
  } catch (err) {
    return null;
  }
};

exports.createArticle = async (req, res) => {
  try {
    const {
      titre,
      description,
      prix,
      etat,
      categorie,
      stock,
      mainImageIndex,
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "Au moins une image est requise." });
    }

    if (req.files.length > 5) {
      return res
        .status(400)
        .json({ message: "Vous ne pouvez envoyer que 5 images maximum." });
    }

    const imageUrls = req.files.map((file) => file.path);

    const article = new Article({
      titre,
      description,
      prix: Number(prix),
      etat,
      categorie,
      stock: stock !== undefined ? Number(stock) : 1,
      images: imageUrls,
      mainImageIndex: Math.min(
        Math.max(parseInt(mainImageIndex) || 0, 0),
        imageUrls.length - 1
      ),
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

exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find().populate("createdBy", "nom email");
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate(
      "createdBy",
      "nom email"
    );
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
        const publicId = extractPublicId(url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    }

    await Article.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Article supprimé avec succès." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression.", error: err.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const {
      titre,
      description,
      prix,
      etat,
      categorie,
      stock,
      existingImages,
      mainImageIndex,
    } = req.body;

    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article non trouvé." });
    }

    const keptImages = existingImages
      ? Array.isArray(existingImages)
        ? existingImages
        : [existingImages]
      : [];

    const imagesToDelete = article.images.filter(
      (img) => !keptImages.includes(img)
    );

    for (const url of imagesToDelete) {
      const publicId = extractPublicId(url);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudErr) {
          console.error(`[CLOUDINARY_DELETE_ERROR] :`, cloudErr);
        }
      }
    }

    const newImages = req.files ? req.files.map((file) => file.path) : [];

    article.titre = titre || article.titre;
    article.description = description || article.description;
    article.prix = prix !== undefined ? Number(prix) : article.prix;
    article.etat = etat || article.etat;
    article.categorie = categorie || article.categorie;

    if (stock !== undefined) {
      const s = Number(stock);
      article.stock = isNaN(s) ? article.stock : s;
    }

    article.images = [...keptImages, ...newImages];
    article.mainImageIndex = Number(mainImageIndex) || 0;

    await article.save();
    res.json({ message: "Article mis à jour avec succès.", article });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

const Article = require("../models/Article");
const cloudinary = require("cloudinary").v2;

// Fonction utilitaire pour extraire le public_id correctement
const extractPublicId = (url) => {
  try {
    // Découpe l'URL pour récupérer la partie après 'upload/'
    const parts = url.split("upload/")[1].split("/");
    // On enlève le premier élément (la version v12345678)
    parts.shift();
    // On récupère le reste et on enlève l'extension (.jpg, .png)
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
      quantite,
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

    // ATTENTION : Si tu supprimes ici, l'image disparaît des COMMANDES passées.
    // Si tu acceptes cela pour économiser de l'espace :
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
      quantite,
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

    // On identifie les images qui ne sont plus utilisées dans cet article
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

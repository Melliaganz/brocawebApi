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

    const sendEmail = req.app.get("sendEmail");
    if (sendEmail) {
      const mainImage = imageUrls[article.mainImageIndex] || imageUrls[0];
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
          <h1 style="color: #2c3e50; text-align: center;">Nouveauté sur Broca Web !</h1>
          <img src="${mainImage}" alt="${titre}" style="width: 100%; border-radius: 8px; margin-bottom: 15px;">
          <h2 style="color: #34495e;">${titre}</h2>
          <p style="color: #7f8c8d; line-height: 1.6;">${description.substring(0, 150)}...</p>
          <p style="font-size: 18px; font-weight: bold; color: #e67e22;">Prix : ${prix}€</p>
          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.CLIENT_URL}/articles/${article._id}" 
               style="background-color: #2980b9; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
               Voir l'article
            </a>
          </div>
          <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #bdc3c7; text-align: center;">Vous recevez cet email car vous êtes inscrit sur Broca Web.</p>
        </div>
      `;

      sendEmail(`Nouvel article : ${titre}`, emailHtml);
    }

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

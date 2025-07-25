const Article = require("../models/Article");
const Order = require("../models/Order");

exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.id;

    const updatedItems = [];

    for (const item of items) {
      const article = await Article.findById(item.articleId);
      if (!article) return res.status(404).json({ message: "Article introuvable." });

      if (article.quantite < item.quantity)
        return res.status(400).json({ message: `Stock insuffisant pour ${article.titre}` });

      // Mise à jour de la quantité
      article.quantite -= item.quantity;

      // S'il reste 0 → supprimer l'article
      if (article.quantite <= 0) {
        await Article.findByIdAndDelete(article._id);
      } else {
        await article.save();
      }

      updatedItems.push({
        article: article._id,
        titre: article.titre,
        prix: article.prix,
        quantity: item.quantity
      });
    }

    const order = new Order({
      user: userId,
      items: updatedItems,
      status: "en attente",
    });

    await order.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la création de commande", error: err.message });
  }
};

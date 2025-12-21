const fs = require("fs");
const path = require("path");
const Article = require("../models/Article");
const Order = require("../models/Order");

exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.id;
    const updatedItems = [];

    for (const item of items) {
      const article = await Article.findById(item.articleId);
      if (!article)
        return res.status(404).json({ message: "Article introuvable." });

      if (article.quantite < item.quantity)
        return res
          .status(400)
          .json({ message: `Stock insuffisant pour ${article.titre}` });

      article.quantite -= item.quantity;
      await article.save();

      if (article.quantite <= 0) {
        if (article.images && article.images.length > 0) {
          article.images.forEach((imageName) => {
            const filePath = path.join(__dirname, "..", "uploads", imageName);
            
            if (fs.existsSync(filePath)) {
              fs.unlink(filePath, (err) => {
                if (err) console.error(`Erreur suppression image ${imageName}:`, err);
                else console.log(`Fichier ${imageName} supprimé du serveur.`);
              });
            }
          });
        }

        await Article.findByIdAndDelete(article._id);
      }

      updatedItems.push({
        article: article._id,
        titre: article.titre,
        prix: article.prix,
        quantity: item.quantity,
      });
    }

    const order = new Order({
      user: userId,
      items: updatedItems,
      status: "payé",
      totalPrice: updatedItems.reduce(
        (acc, curr) => acc + curr.prix * curr.quantity,
        0
      ),
    });

    await order.save();

    res.status(201).json(order);
  } catch (err) {
    console.error("ERREUR BACKEND DETECTÉE :", err);
    res.status(500).json({
      message: "Erreur lors de la création de commande",
      error: err.message,
      stack: err.stack,
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "nom email")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Erreur récupération commandes", error: err.message });
  }
};

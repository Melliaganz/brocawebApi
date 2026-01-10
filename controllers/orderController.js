const fs = require("fs");
const path = require("path");
const Article = require("../models/Article");
const Order = require("../models/Order");

// Créer une commande
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

      article.quantite -= item.quantity;
      await article.save();

      if (article.quantite <= 0) {
        // Logique de suppression d'images si stock à zéro
        if (article.images && article.images.length > 0) {
          article.images.forEach((imageName) => {
            const filePath = path.join(__dirname, "..", "uploads", imageName);
            if (fs.existsSync(filePath)) {
              fs.unlink(filePath, (err) => {
                if (err) console.error(`Erreur suppression image ${imageName}:`, err);
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
      status: "En cours",
      totalPrice: updatedItems.reduce((acc, curr) => acc + curr.prix * curr.quantity, 0),
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la création", error: err.message });
  }
};

// Récupérer TOUTES les commandes (Admin) + Populate images
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "nom email")
      .populate("items.article", "images") // Indispensable pour voir les images côté admin
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Erreur récupération commandes", error: err.message });
  }
};

// Récupérer les commandes d'UN client + Populate images
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId })
      .populate("items.article", "images") // Indispensable pour les images côté client
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Erreur récupération de vos commandes", error: err.message });
  }
};

// Modifier l'état d'une commande (Admin uniquement)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validation des états autorisés
    const validStatuses = ["En cours", "Traité", "Livré"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Statut invalide." });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Commande introuvable." });

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la mise à jour", error: err.message });
  }
};

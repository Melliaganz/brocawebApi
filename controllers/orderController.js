const Article = require("../models/Article");
const Order = require("../models/Order");
const cloudinary = require("cloudinary").v2;

const extractPublicId = (url) => {
  try {
    if (!url || !url.includes("upload/")) return null;
    const parts = url.split('upload/')[1].split('/');
    parts.shift(); 
    return parts.join('/').split('.')[0];
  } catch (err) {
    return null;
  }
};

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

      const mainImage = article.images && article.images.length > 0 ? article.images[0] : null;

      updatedItems.push({
        article: article._id,
        titre: article.titre,
        prix: article.prix,
        quantity: item.quantity,
        image: mainImage, 
      });

      if (article.quantite <= 0) {
        await Article.findByIdAndDelete(article._id);
      } else {
        await article.save();
      }
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

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Erreur récupération de vos commandes", error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["En cours", "Traité", "Livré"];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Statut invalide." });

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Commande introuvable." });

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la mise à jour", error: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
  
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Commande introuvable." });
    for (const item of order.items) {
      if (item.image) {
        const articleExists = await Article.findById(item.article);
        const otherOrderUsingImg = await Order.findOne({ _id: { $ne: id }, "items.image": item.image });
        
        if (!articleExists && !otherOrderUsingImg) {
          const publicId = extractPublicId(item.image);
          if (publicId) await cloudinary.uploader.destroy(publicId);
        }
      }
    }

    await Order.findByIdAndDelete(id);
    res.status(200).json({ message: "Commande supprimée avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: err.message });
  }
};

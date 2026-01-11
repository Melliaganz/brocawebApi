const Cart = require("../models/Cart");
const Article = require("../models/Article");
const User = require("../models/User");

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.article"
    );
    res.json(cart || { items: [] });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération du panier." });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { articleId, quantite } = req.body;
    if (quantite < 1)
      return res.status(400).json({ message: "Quantité invalide." });

    const article = await Article.findById(articleId);
    if (!article)
      return res.status(404).json({ message: "Article introuvable." });
    if (quantite > article.stock)
      return res.status(400).json({ message: "Stock insuffisant." });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });

    const existingItem = cart.items.find(
      (item) => item.article.toString() === articleId
    );
    if (existingItem) {
      existingItem.quantite = quantite;
    } else {
      cart.items.push({ article: articleId, quantite });
    }

    await cart.save();

    await User.findByIdAndUpdate(req.user.id, { lastActivity: new Date() });

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout au panier." });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { articleId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Panier introuvable." });

    cart.items = cart.items.filter(
      (item) => item.article.toString() !== articleId
    );
    await cart.save();

    await User.findByIdAndUpdate(req.user.id, { lastActivity: new Date() });

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression." });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.id });
    res.json({ message: "Panier vidé." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du nettoyage du panier." });
  }
};

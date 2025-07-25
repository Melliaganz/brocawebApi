const Cart = require("../models/Cart");
const Article = require("../models/Article");

// Obtenir le panier de l'utilisateur
exports.getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate("items.article");
  res.json(cart || { items: [] });
};

// Ajouter ou mettre à jour un article
exports.addToCart = async (req, res) => {
  const { articleId, quantite } = req.body;
  if (quantite < 1) return res.status(400).json({ message: "Quantité invalide." });

  const article = await Article.findById(articleId);
  if (!article) return res.status(404).json({ message: "Article introuvable." });
  if (quantite > article.quantite) return res.status(400).json({ message: "Stock insuffisant." });

  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) cart = new Cart({ user: req.user.id, items: [] });

  const existingItem = cart.items.find((item) => item.article.toString() === articleId);
  if (existingItem) {
    existingItem.quantite = quantite;
  } else {
    cart.items.push({ article: articleId, quantite });
  }

  await cart.save();
  res.json(cart);
};

// Supprimer un article du panier
exports.removeFromCart = async (req, res) => {
  const { articleId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ message: "Panier introuvable." });

  cart.items = cart.items.filter((item) => item.article.toString() !== articleId);
  await cart.save();

  res.json(cart);
};

// Vider le panier
exports.clearCart = async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user.id });
  res.json({ message: "Panier vidé." });
};

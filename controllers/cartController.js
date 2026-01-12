const Cart = require("../models/Cart");
const Article = require("../models/Article");

exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id }).populate("items.article");
        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération du panier." });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { articleId, quantite } = req.body;
        const qtyToAdd = parseInt(quantite);

        if (isNaN(qtyToAdd) || qtyToAdd < 1) {
            return res.status(400).json({ message: "Quantité invalide." });
        }

        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).json({ message: "Article non trouvé." });
        }

        if (qtyToAdd > article.stock) {
            return res.status(400).json({ message: "Stock insuffisant." });
        }

        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.article.toString() === articleId);

        if (itemIndex > -1) {
            cart.items[itemIndex].quantite = qtyToAdd;
        } else {
            cart.items.push({ article: articleId, quantite: qtyToAdd });
        }

        await cart.save();
        await cart.populate("items.article");

        const io = req.app.get("io");
        if (io) io.emit("cart_updated");

        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'ajout au panier." });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { articleId } = req.params;
        let cart = await Cart.findOne({ user: req.user.id });

        if (cart) {
            cart.items = cart.items.filter(item => item.article.toString() !== articleId);
            await cart.save();
            await cart.populate("items.article");

            const io = req.app.get("io");
            if (io) io.emit("cart_updated");
        }

        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression." });
    }
};

exports.clearCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.status(200).json({ message: "Panier vidé.", items: [] });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la réinitialisation du panier." });
    }
};

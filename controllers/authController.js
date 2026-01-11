const User = require("../models/User");
const Cart = require("../models/Cart");
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, nom: user.nom },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

exports.register = async (req, res) => {
  try {
    const { nom, email, motDePasse } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email déjà utilisé." });
    }
    const newUser = new User({ nom, email, motDePasse });
    await newUser.save();
    const token = generateToken(newUser);
    res.status(201).json({
      message: "Compte créé avec succès.",
      token,
      user: {
        id: newUser._id,
        nom: newUser.nom,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect." });
    }
    const isMatch = await user.comparePassword(motDePasse);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect." });
    }

    await User.findByIdAndUpdate(user._id, {
      $set: { lastActivity: new Date() },
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("user_status_change", { userId: user._id, status: "online" });
      io.emit("cart_updated");
    }

    const token = generateToken(user);
    res.status(200).json({
      message: "Connexion réussie.",
      token,
      user: { id: user._id, nom: user.nom, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

exports.adminCreateUser = async (req, res) => {
  try {
    const { nom, email, motDePasse, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email déjà utilisé." });
    }
    const newUser = new User({ nom, email, motDePasse, role: role || "user" });
    await newUser.save();
    res.status(201).json({
      message: "Utilisateur créé avec succès.",
      user: {
        id: newUser._id,
        nom: newUser.nom,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-motDePasse").lean();

    const carts = await Cart.find()
      .populate("items.article", "nom prix images")
      .lean();

    const connectedUsers = req.app.get("connectedUsers");

    const usersWithCarts = users.map((u) => {
      const userCart = carts.find(
        (c) => c.user && c.user.toString() === u._id.toString()
      );

      const isOnline = connectedUsers && connectedUsers.has(u._id.toString());

      return {
        ...u,
        socketStatus: isOnline ? "online" : "offline",
        cart: userCart || { items: [] },
      };
    });

    res.status(200).json(usersWithCarts);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération." });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { nom, email, motDePasse, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    if (nom) user.nom = nom;
    if (email) user.email = email;
    if (role) user.role = role;
    if (motDePasse) user.motDePasse = motDePasse;
    await user.save();
    res.status(200).json({
      message: "Succès",
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur", error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res
        .status(400)
        .json({ message: "Impossible de supprimer son propre compte." });
    }
    await User.findByIdAndDelete(req.params.id);
    await Cart.findOneAndDelete({ user: req.params.id });
    res.status(200).json({ message: "Supprimé." });
  } catch (error) {
    res.status(500).json({ message: "Erreur." });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const threshold = new Date(Date.now() - 10 * 60 * 1000);
    const onlineUsers = await User.find({ lastActivity: { $gte: threshold } })
      .select("nom email lastActivity")
      .lean();
    const activeCarts = await Cart.find({ "items.0": { $exists: true } })
      .populate("user", "nom email")
      .populate("items.article")
      .lean();
    res
      .status(200)
      .json({ onlineCount: onlineUsers.length, onlineUsers, activeCarts });
  } catch (error) {
    res.status(500).json({ message: "Erreur stats.", error: error.message });
  }
};

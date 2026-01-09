const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

exports.register = async (req, res) => {
  try {
    const { nom, email, motDePasse } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      console.warn(`[AUTH_REGISTER] Échec : Email déjà utilisé (${email})`);
      return res.status(400).json({ message: "Email déjà utilisé." });
    }

    const newUser = new User({ nom, email, motDePasse });
    await newUser.save();

    console.log(`[AUTH_REGISTER] Nouvel utilisateur : ${newUser.email}`);

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
    console.error(`[AUTH_REGISTER_ERROR] :`, error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect." });
    }

    const isMatch = await user.comparePassword(motDePasse);
    if (!isMatch) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect." });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Connexion réussie.",
      token,
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
      },
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

    const newUser = new User({
      nom,
      email,
      motDePasse,
      role: role || "user"
    });

    await newUser.save();

    console.log(`[ADMIN_USER_CREATE] Admin ${req.user.id} a créé l'utilisateur : ${email}`);

    res.status(201).json({
      message: "Utilisateur créé avec succès par l'administrateur.",
      user: {
        id: newUser._id,
        nom: newUser.nom,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error(`[ADMIN_USER_CREATE_ERROR] :`, error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-motDePasse");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs." });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte admin." });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Utilisateur supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression." });
  }
};

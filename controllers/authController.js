// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Génération d'un token
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Enregistrement
exports.register = async (req, res) => {
  try {
    const { nom, email, motDePasse } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      console.warn(
        `[AUTH_REGISTER] Tentative d'inscription échouée : Email déjà utilisé (${email})`
      );
      return res.status(400).json({ message: "Email déjà utilisé." });
    }

    const newUser = new User({ nom, email, motDePasse });
    await newUser.save();

    console.log(
      `[AUTH_REGISTER] Nouvel utilisateur créé : ${newUser.email} (ID: ${newUser._id})`
    );

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
    console.error(
      `[AUTH_REGISTER_ERROR] Erreur lors de l'inscription :`,
      error
    );
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    console.log(`[AUTH_LOGIN] Tentative de connexion pour : ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`[AUTH_LOGIN] Échec : Utilisateur non trouvé (${email})`);
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect." });
    }

    const isMatch = await user.comparePassword(motDePasse);
    if (!isMatch) {
      console.warn(
        `[AUTH_LOGIN] Échec : Mot de passe incorrect pour (${email})`
      );
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect." });
    }

    const token = generateToken(user);
    console.log(`[AUTH_LOGIN] Succès : ${email} est maintenant connecté`);

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
    console.error(
      `[AUTH_LOGIN_ERROR] Erreur lors de la connexion pour ${req.body.email} :`,
      error
    );
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

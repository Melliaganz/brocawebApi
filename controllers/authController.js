// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Génération d'un token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Enregistrement
exports.register = async (req, res) => {
      console.log('📦 req.body dans register:', req.body); // 👈 ajoute cette ligne

  try {
    const { nom, email, motDePasse } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email déjà utilisé.' });

    const newUser = new User({ nom, email, motDePasse });
    await newUser.save();

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Compte créé avec succès.',
      token,
      user: {
        id: newUser._id,
        nom: newUser.nom,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });

    const isMatch = await user.comparePassword(motDePasse);
    if (!isMatch) return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });

    const token = generateToken(user);

    res.status(200).json({
      message: 'Connexion réussie.',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

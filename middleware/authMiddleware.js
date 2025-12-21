// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès non autorisé. Token manquant.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-motDePasse');

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    }

    req.user = { id: user._id, role: user.role };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide.', error: err.message });
  }
};


module.exports = authMiddleware;

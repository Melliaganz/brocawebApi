// middleware/adminMiddleware.js
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Accès interdit. Administrateur requis.' });
  }
};

module.exports = adminMiddleware;

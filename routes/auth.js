const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Accès refusé. Admin requis." });
  }
};

router.post("/register", authController.register);
router.post("/login", authController.login);

router.post(
  "/admin/create-user",
  authMiddleware,
  adminMiddleware,
  authController.adminCreateUser
);

router.get(
  "/admin/users",
  authMiddleware,
  adminMiddleware,
  authController.getAllUsers
);
router.put(
  "/admin/users/:id",
  authMiddleware,
  adminMiddleware,
  authController.updateUser
);
router.delete(
  "/admin/users/:id",
  authMiddleware,
  adminMiddleware,
  authController.deleteUser
);

module.exports = router;

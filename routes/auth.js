const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.post("/admin/create-user", authMiddleware, (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Accès refusé. Admin requis." });
    }
    next();
}, authController.adminCreateUser);

module.exports = router;

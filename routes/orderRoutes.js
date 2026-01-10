const express = require("express");
const router = express.Router();
const { createOrder, getAllOrders, getUserOrders } = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

// Route pour les clients (doit être avant toute route avec paramètre :id)
router.get("/my-orders", authMiddleware, getUserOrders);

// Routes générales
router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getAllOrders);

module.exports = router;

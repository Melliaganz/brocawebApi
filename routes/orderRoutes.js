const express = require("express");
const router = express.Router();
const { 
  createOrder, 
  getAllOrders, 
  getUserOrders, 
  updateOrderStatus 
} = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

// Route client
router.get("/my-orders", authMiddleware, getUserOrders);

// Routes générales & Admin
router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getAllOrders);
router.put("/:id/status", authMiddleware, updateOrderStatus); // Nouvelle route admin

module.exports = router;

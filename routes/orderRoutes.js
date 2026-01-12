const express = require("express");
const router = express.Router();
const { 
  createOrder, 
  getAllOrders, 
  getUserOrders, 
  updateOrderStatus, 
  deleteOrder
} = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/my-orders", authMiddleware, getUserOrders);

router.post("/", authMiddleware, createOrder);

router.get("/", authMiddleware, getAllOrders);
router.put("/:id/status", authMiddleware, updateOrderStatus);
router.delete("/:id", authMiddleware, deleteOrder);

module.exports = router;

const express = require("express");
const router = express.Router();
const { createOrder, getAllOrders } = require("../controllers/orderController");
// const { protect, admin } = require("../middleware/authMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createOrder);
router.get("/",  authMiddleware, getAllOrders);

module.exports = router;

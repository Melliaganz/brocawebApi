const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const cartController = require("../controllers/cartController");

router.use(authMiddleware);

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.delete("/remove/:articleId", cartController.removeFromCart);
router.delete("/clear", cartController.clearCart);

module.exports = router;

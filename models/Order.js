const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      article: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
      titre: String,
      prix: Number,
      quantity: Number,
      image: String,
    },
  ],
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["En cours", "Traité", "Livré"],
    default: "En cours",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);

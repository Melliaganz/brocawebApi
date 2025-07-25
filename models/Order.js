const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      article: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
      titre: String,
      prix: Number,
      quantity: Number,
    }
  ],
  status: { type: String, enum: ["en attente", "validée", "annulée"], default: "en attente" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);

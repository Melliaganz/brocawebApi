const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  description: { type: String, required: true },
  prix: { type: Number, required: true },
  etat: { type: String, required: true },
  categorie: { type: String, required: true },
  stock: { type: Number, required: true, default: 1, min: 0 },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  mainImageIndex: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Article', articleSchema);

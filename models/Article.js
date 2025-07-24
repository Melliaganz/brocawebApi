// models/Article.js
const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  description: { type: String, required: true },
  prix: { type: Number, required: true },
  etat: { type: String, required: true },
  categorie: { type: String, required: true },

  images: [{ type: String }],

  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Article', articleSchema);

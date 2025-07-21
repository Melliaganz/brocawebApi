// models/Article.js
const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  prix: {
    type: Number,
    required: true,
    min: 0,
  },
  etat: {
    type: String,
    enum: ['Neuf', 'Très bon état', 'Bon état', 'À réparer'],
    required: true,
  },
  image: {
    type: String, // nom de fichier/image stockée dans `/uploads`
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Article', articleSchema);

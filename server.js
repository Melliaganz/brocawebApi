// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Pour lire le JSON dans les requêtes
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // pour les images

// Routes
const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connecté à MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`));
})
.catch((err) => {
    console.error('❌ Erreur de connexion MongoDB :', err.message);
});

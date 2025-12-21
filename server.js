// server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const orderRoutes = require("./routes/orderRoutes");

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Pour lire le JSON dans les requêtes
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // pour les images

// Gestion globale des erreurs (à placer après toutes les routes)
app.use((err, req, res, next) => {
  // Erreur Multer
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "Limite de 5 images dépassée." });
    }
    return res.status(400).json({ message: "Erreur lors de l'upload.", error: err.message });
  }

  // Autres erreurs (y compris celles venant de next(err))
  const status = err.status || 500;
  res.status(status).json({ 
    message: err.message || "Une erreur interne est survenue.",
    error: process.env.NODE_ENV === 'development' ? err.stack : err.message 
  });
});

// Routes
const authRoutes = require("./routes/auth");
const articleRoutes = require("./routes/articles");
const cartRoutes = require("./routes/cart");
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log("📁 Dossier 'uploads' créé avec succès.");
}

app.post("/test-body", (req, res) => {
  console.log("🔍 req.body reçu dans /test-body :", req.body);
  res.json({ body: req.body });
});

app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// gestion des erreurs multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "Limite de 5 images dépassée." });
    }
    return res
      .status(400)
      .json({ message: "Erreur lors de l'upload.", error: err.message });
  }
  res
    .status(500)
    .json({ message: "Une erreur interne est survenue.", error: err.message });
});

mongoose
  .connect(process.env.MONGO_URI)

  .then(() => {
    console.log("✅ Connecté à MongoDB");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion MongoDB :", err.message);
  });

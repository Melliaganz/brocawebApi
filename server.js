const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const fs = require('fs');

dotenv.config();

const app = express();

// 1. Middlewares de base
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Ajouté pour aider à lire le FormData
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 2. Création du dossier uploads si besoin
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 3. Tes Routes
const authRoutes = require("./routes/auth");
const articleRoutes = require("./routes/articles");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orderRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.post("/test-body", (req, res) => {
    res.json({ body: req.body });
});

// 4. GESTION DES ERREURS (DOIT ÊTRE EN DERNIER)
const multer = require("multer");
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "Limite de 5 images dépassée." });
    }
    // C'est ici que tu recevais "Erreur lors de l'upload" sans détails
    return res.status(400).json({ message: "Erreur Multer lors de l'upload.", error: err.message });
  }

  const status = err.status || 500;
  res.status(status).json({ 
    message: err.message || "Une erreur interne est survenue.",
    error: process.env.NODE_ENV === 'development' ? err.stack : err.message 
  });
});

// 5. Connexion DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connecté à MongoDB");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));
  })
  .catch((err) => console.error("❌ Erreur MongoDB :", err.message));

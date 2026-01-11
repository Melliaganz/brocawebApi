const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const fs = require('fs');
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Stockage des utilisateurs connectés (userId -> socketId)
const connectedUsers = new Map();

io.on("connection", (socket) => {
  socket.on("register_user", (userId) => {
    connectedUsers.set(userId, socket.id);
    io.emit("user_status_change", { userId, status: "online" });
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        io.emit("user_status_change", { userId, status: "offline" });
        break;
      }
    }
  });
});

// Rendre io accessible dans les routes si besoin
app.set("io", io);
app.set("connectedUsers", connectedUsers);

const authRoutes = require("./routes/auth");
const articleRoutes = require("./routes/articles");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orderRoutes");
const categoryRoutes = require("./routes/category");

app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);

app.post("/test-body", (req, res) => {
    res.json({ body: req.body });
});

const multer = require("multer");
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "Limite de 5 images dépassée." });
    }
    return res.status(400).json({ message: "Erreur Multer lors de l'upload.", error: err.message });
  }

  const status = err.status || 500;
  res.status(status).json({ 
    message: err.message || "Une erreur interne est survenue.",
    error: process.env.NODE_ENV === 'development' ? err.stack : err.message 
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connecté à MongoDB");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Serveur et WebSockets lancés sur le port ${PORT}`));
  })
  .catch((err) => console.error("❌ Erreur MongoDB :", err.message));

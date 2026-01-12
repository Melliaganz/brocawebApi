const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const path = require("path");
const fs = require('fs');
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

let mongoServer;
let app;
let server;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);

    app = express();
    server = http.createServer(app);
    const io = new Server(server);

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    const authRoutes = require("../routes/auth");
    const articleRoutes = require("../routes/articles");
    const cartRoutes = require("../routes/cart");
    const orderRoutes = require("../routes/orderRoutes");
    const categoryRoutes = require("../routes/category");

    app.use("/api/auth", authRoutes);
    app.use("/api/articles", articleRoutes);
    app.use("/api/cart", cartRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/categories", categoryRoutes);

    app.post("/test-body", (req, res) => {
        res.json({ body: req.body });
    });

    app.use((err, req, res, next) => {
        const status = err.status || 500;
        res.status(status).json({ message: err.message });
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    server.close();
});

describe("Tests du Serveur Express", () => {
    
    test("GET /api/articles devrait renvoyer un status 200 ou 404", async () => {
        const res = await request(app).get("/api/articles");
        expect([200, 404, 204]).toContain(res.statusCode);
    });

    test("POST /test-body devrait retourner le JSON envoyé", async () => {
        const payload = { test: "data" };
        const res = await request(app)
            .post("/test-body")
            .send(payload);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.body).toEqual(payload);
    });

    test("Route inconnue devrait retourner 404", async () => {
        const res = await request(app).get("/api/unknown");
        expect(res.statusCode).toBe(404);
    });
});

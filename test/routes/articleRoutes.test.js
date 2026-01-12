const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const articleRoutes = require("../../routes/articles");
const User = require("../../models/User");

let mongoServer;
let app;
let adminToken;
let userToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());
    app.use("/api/articles", articleRoutes);

    process.env.JWT_SECRET = "testsecret";

    const admin = await User.create({
        nom: "Admin",
        email: "admin@test.com",
        motDePasse: "123456",
        role: "admin"
    });
    adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);

    const user = await User.create({
        nom: "User",
        email: "user@test.com",
        motDePasse: "123456",
        role: "user"
    });
    userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("Intégration Routes Articles", () => {
    test("GET /api/articles - Public (200)", async () => {
        const res = await request(app).get("/api/articles");
        expect(res.statusCode).toBe(200);
    });

    test("POST /api/articles - Bloqué si non admin (403)", async () => {
        const res = await request(app)
            .post("/api/articles")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ titre: "Test" });
        
        expect(res.statusCode).toBe(403);
    });

    test("POST /api/articles - Bloqué si pas de token (401)", async () => {
        const res = await request(app)
            .post("/api/articles")
            .send({ titre: "Test" });
        
        expect(res.statusCode).toBe(401);
    });

    test("DELETE /api/articles/:id - Bloqué si non admin", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .delete(`/api/articles/${fakeId}`)
            .set("Authorization", `Bearer ${userToken}`);
            
        expect(res.statusCode).toBe(403);
    });
});

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const Cart = require("../../models/Cart");
const authController = require("../../controllers/authController");

let mongoServer;
let app;
let adminToken;
let adminUser;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());

    const mockIo = {
        emit: jest.fn()
    };
    app.set("io", mockIo);
    app.set("connectedUsers", new Map());

    app.post("/api/auth/register", authController.register);
    app.post("/api/auth/login", authController.login);
    app.get("/api/auth/users", authController.getAllUsers);
    app.put("/api/auth/users/:id", authController.updateUser);
    app.delete("/api/auth/users/:id", (req, res, next) => {
        req.user = { id: adminUser._id.toString() }; 
        next();
    }, authController.deleteUser);
    app.get("/api/auth/dashboard", authController.getAdminDashboard);

    process.env.JWT_SECRET = "testsecret";
});

beforeEach(async () => {
    await User.deleteMany({});
    await Cart.deleteMany({});

    adminUser = await User.create({
        nom: "Admin",
        email: "admin@test.com",
        motDePasse: "password123",
        role: "admin"
    });
    adminToken = jwt.sign({ id: adminUser._id, role: "admin" }, process.env.JWT_SECRET);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("Auth Controller", () => {
    
    test("S'enregistrer avec succès", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                nom: "Jean Test",
                email: "jean@test.com",
                motDePasse: "password123"
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.token).toBeDefined();
    });

    test("Échec de l'enregistrement si l'email existe déjà", async () => {
        await User.create({ 
            nom: "Doublon", 
            email: "double@test.com", 
            motDePasse: "password123" 
        });
        
        const res = await request(app)
            .post("/api/auth/register")
            .send({ 
                nom: "Autre", 
                email: "double@test.com", 
                motDePasse: "password123" 
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Email déjà utilisé.");
    });

    test("Connexion réussie", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: "admin@test.com",
                motDePasse: "password123"
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    test("Récupérer tous les utilisateurs avec leurs paniers", async () => {
        const user = await User.create({ 
            nom: "Client", 
            email: "client@test.com", 
            motDePasse: "password123" 
        });
        
        await Cart.create({
            user: user._id,
            items: []
        });

        const res = await request(app).get("/api/auth/users");

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        const emails = res.body.map(u => u.email);
        expect(emails).toContain("client@test.com");
    });

    test("Mettre à jour un utilisateur", async () => {
        const user = await User.create({ 
            nom: "UpdateMe", 
            email: "update@test.com", 
            motDePasse: "password123" 
        });
        
        const res = await request(app)
            .put(`/api/auth/users/${user._id}`)
            .send({ nom: "UpdatedName" });

        expect(res.statusCode).toBe(200);
        expect(res.body.user.nom).toBe("UpdatedName");
    });

    test("Interdire la suppression de son propre compte", async () => {
        const res = await request(app)
            .delete(`/api/auth/users/${adminUser._id}`);

        expect(res.statusCode).toBe(400);
    });
});

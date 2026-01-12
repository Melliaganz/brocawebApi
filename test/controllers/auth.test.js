const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();
process.env.JWT_SECRET = "testsecret";

const User = require("../../models/User");
const authController = require("../../controllers/authController");

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());

    app.set("io", { emit: jest.fn() });
    app.set("connectedUsers", new Map());

    app.post("/api/auth/register", authController.register);
    app.post("/api/auth/login", authController.login);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
});

describe("Auth Controller", () => {
    const mockUser = {
        nom: "Test User",
        email: "test@example.com",
        motDePasse: "password123"
    };

    describe("POST /api/auth/register", () => {
        test("Devrait créer un nouvel utilisateur et retourner un token", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send(mockUser);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty("token");
            expect(res.body.user.email).toBe(mockUser.email);
            
            const userInDb = await User.findOne({ email: mockUser.email });
            expect(userInDb).toBeTruthy();
        });

        test("Devrait échouer si l'email est déjà utilisé", async () => {
            await User.create(mockUser);

            const res = await request(app)
                .post("/api/auth/register")
                .send(mockUser);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe("Email déjà utilisé.");
        });
    });

    describe("POST /api/auth/login", () => {
        test("Devrait connecter l'utilisateur avec des identifiants valides", async () => {
            await User.create(mockUser);

            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: mockUser.email,
                    motDePasse: mockUser.motDePasse
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("token");
            expect(res.body.user.nom).toBe(mockUser.nom);
        });

        test("Devrait échouer avec un mauvais mot de passe", async () => {
            await User.create(mockUser);

            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: mockUser.email,
                    motDePasse: "wrongpassword"
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe("Email ou mot de passe incorrect.");
        });

        test("Devrait échouer si l'utilisateur n'existe pas", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "ghost@example.com",
                    motDePasse: "password123"
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe("Email ou mot de passe incorrect.");
        });
    });
});

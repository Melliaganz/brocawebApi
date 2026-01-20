const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../server");
const Category = require("../../models/Category");
const User = require("../../models/User");
const jwt = require("jsonwebtoken");

describe("Category Routes", () => {
    let adminToken;
    const MONGO_URI_TEST = "mongodb+srv://Lucas:5LLwLJ4JF1yv3Z7s@brocawebapi.un5laul.mongodb.net/test_db?retryWrites=true&w=majority";
    const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

    beforeAll(async () => {
        jest.setTimeout(60000);
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGO_URI_TEST);
        }
        await Category.deleteMany({});
        await User.deleteMany({});

        const admin = await User.create({
            nom: "Admin",
            email: "admin_cat@test.com",
            motDePasse: "password123",
            role: "admin"
        });

        adminToken = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it("devrait créer une catégorie (POST /api/categories)", async () => {
        const res = await request(app)
            .post("/api/categories")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: "Nouvelle Categorie" });

        expect(res.statusCode).toBe(201);
    });

    it("devrait récupérer toutes les catégories (GET /api/categories)", async () => {
        const res = await request(app).get("/api/categories");
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});

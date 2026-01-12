const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../server");
const Category = require("../../models/Category");
const User = require("../../models/User");
const Article = require("../../models/Article");
const jwt = require("jsonwebtoken");

describe("Category Routes", () => {
    let token;
    let adminToken;
    const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/test_db_categories");
        }
        await Category.deleteMany({});
        await User.deleteMany({});
        await Article.deleteMany({});

        const admin = await User.create({
            nom: "Admin",
            email: "admin@test.com",
            motDePasse: "password123",
            role: "admin"
        });

        adminToken = jwt.sign(
            { id: admin._id, role: admin.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        await Category.deleteMany({});
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    it("devrait créer une catégorie (POST /api/categories)", async () => {
        const res = await request(app)
            .post("/api/categories")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: "Nouvelle Categorie" });

        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe("Nouvelle Categorie");
    });

    it("devrait récupérer toutes les catégories (GET /api/categories)", async () => {
        const res = await request(app).get("/api/categories");
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    it("devrait échouer si l'article ajouté au panier n'existe pas (Exemple de test 400)", async () => {
        const res = await request(app)
            .post("/api/cart/add")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ articleId: new mongoose.Types.ObjectId(), quantity: 1 });

        expect(res.statusCode).toBe(400);
    });
});

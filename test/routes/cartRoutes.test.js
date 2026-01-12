const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../server");
const Cart = require("../../models/Cart");
const User = require("../../models/User");
const Article = require("../../models/Article");
const Category = require("../../models/Category");
const jwt = require("jsonwebtoken");

describe("Cart Routes", () => {
    let token;
    let userId;
    let articleId;
    const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

    beforeAll(async () => {
        process.env.JWT_SECRET = JWT_SECRET;
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/test_db_cart");
        }
        
        await User.deleteMany({});
        await Cart.deleteMany({});
        await Article.deleteMany({});
        await Category.deleteMany({});

        const user = await User.create({
            nom: "Test User",
            email: "test_cart@test.com",
            motDePasse: "password123",
            role: "user"
        });
        userId = user._id;

        token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        const category = await Category.create({ name: "Test Category" });
        const article = await Article.create({
            titre: "Article Test",
            prix: 10,
            description: "Description test",
            categorie: category.name,
            etat: "neuf",
            stock: 5
        });
        articleId = article._id;
    }, 30000);

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it("devrait ajouter un article au panier (POST /api/cart/add)", async () => {
        const res = await request(app)
            .post("/api/cart/add")
            .set("Authorization", `Bearer ${token}`)
            .send({ articleId: articleId, quantite: 1 });

        expect(res.statusCode).toBe(200);
        expect(res.body.items).toBeDefined();
        expect(res.body.items.length).toBeGreaterThan(0);
    });

    it("devrait récupérer le panier de l'utilisateur (GET /api/cart)", async () => {
        const res = await request(app)
            .get("/api/cart")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        if (res.body.user) {
            expect(res.body.user.toString()).toBe(userId.toString());
        }
    });

    it("devrait supprimer un article du panier (DELETE /api/cart/remove/:id)", async () => {
        const res = await request(app)
            .delete(`/api/cart/remove/${articleId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        const itemExists = res.body.items.some(item => 
            item.article && item.article.toString() === articleId.toString()
        );
        expect(itemExists).toBeFalsy();
    });

    it("devrait refuser l'accès si non authentifié", async () => {
        const res = await request(app)
            .get("/api/cart");

        expect(res.statusCode).toBe(401);
    });
});

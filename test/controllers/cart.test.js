const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");

const Cart = require("../../models/Cart");
const Article = require("../../models/Article");
const User = require("../../models/User");
const cartController = require("../../controllers/cartController");

let mongoServer;
let app;
let testUser;
let testArticle;

const mockIo = {
    emit: jest.fn()
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());
    app.set("io", mockIo);

    testUser = await User.create({
        nom: "Client Test",
        email: "client@test.com",
        motDePasse: "password123"
    });

    app.use((req, res, next) => {
        req.user = { id: testUser._id.toString() };
        next();
    });

    app.get("/api/cart", cartController.getCart);
    app.post("/api/cart", cartController.addToCart);
    app.delete("/api/cart/:articleId", cartController.removeFromCart);
    app.post("/api/cart/clear", cartController.clearCart);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Cart.deleteMany({});
    await Article.deleteMany({});
    
    testArticle = await Article.create({
        titre: "Article Test",
        description: "Description",
        prix: 10,
        etat: "neuf",
        categorie: "test",
        stock: 10,
        images: ["image.jpg"],
        createdBy: new mongoose.Types.ObjectId()
    });

    jest.clearAllMocks();
});

describe("Cart Controller", () => {
    test("Devrait récupérer un panier vide par défaut", async () => {
        const res = await request(app).get("/api/cart");
        expect(res.statusCode).toBe(200);
        expect(res.body.items).toEqual([]);
    });

    test("Devrait ajouter un article au panier", async () => {
        const res = await request(app)
            .post("/api/cart")
            .send({
                articleId: testArticle._id.toString(),
                quantite: 2
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.items.length).toBe(1);
    });

    test("Devrait retourner une erreur si le stock est insuffisant", async () => {
        const res = await request(app)
            .post("/api/cart")
            .send({
                articleId: testArticle._id.toString(),
                quantite: 50
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Stock insuffisant.");
    });

    test("Devrait retourner une erreur si la quantité est invalide", async () => {
        const res = await request(app)
            .post("/api/cart")
            .send({
                articleId: testArticle._id.toString(),
                quantite: 0
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Quantité invalide.");
    });

    test("Devrait supprimer un article du panier", async () => {
        await Cart.create({
            user: testUser._id,
            items: [{ article: testArticle._id, quantite: 1 }]
        });

        const res = await request(app).delete(`/api/cart/${testArticle._id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.items.length).toBe(0);
    });

    test("Devrait vider le panier", async () => {
        const res = await request(app).post("/api/cart/clear");
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Panier vidé.");
    });
});

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const Order = require("../../models/Order");
const Article = require("../../models/Article");
const User = require("../../models/User");
const orderController = require("../../controllers/orderController");

let mongoServer;
let app;
let mockUser;
let mockArticle;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());

    // Mock middleware pour simuler req.user
    const mockAuth = (req, res, next) => {
        req.user = { id: mockUser._id.toString() };
        next();
    };

    app.post("/api/orders", mockAuth, orderController.createOrder);
    app.get("/api/orders/me", mockAuth, orderController.getUserOrders);
    app.put("/api/orders/:id/status", mockAuth, orderController.updateOrderStatus);

    mockUser = await User.create({
        nom: "Test User",
        email: "test@example.com",
        motDePasse: "hashedpassword"
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Order.deleteMany({});
    await Article.deleteMany({});

    mockArticle = await Article.create({
        titre: "Article Test",
        description: "Description",
        prix: 100,
        etat: "Neuf",
        categorie: "Vêtements",
        stock: 5,
        images: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
        createdBy: mockUser._id
    });
});

describe("Order Controller", () => {
    test("Devrait créer une commande et réduire le stock", async () => {
        const orderData = {
            items: [{ articleId: mockArticle._id.toString(), quantity: 2 }]
        };

        const res = await request(app)
            .post("/api/orders")
            .send(orderData);

        expect(res.statusCode).toBe(201);
        expect(res.body.totalPrice).toBe(200);
        expect(res.body.items[0].titre).toBe("Article Test");

        const updatedArticle = await Article.findById(mockArticle._id);
        expect(updatedArticle.stock).toBe(3);
    });

    test("Devrait échouer si le stock est insuffisant", async () => {
        const orderData = {
            items: [{ articleId: mockArticle._id.toString(), quantity: 10 }]
        };

        const res = await request(app)
            .post("/api/orders")
            .send(orderData);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("Stock insuffisant");
    });

    test("Devrait supprimer l'article si le stock atteint 0", async () => {
        const orderData = {
            items: [{ articleId: mockArticle._id.toString(), quantity: 5 }]
        };

        const res = await request(app)
            .post("/api/orders")
            .send(orderData);

        expect(res.statusCode).toBe(201);

        const deletedArticle = await Article.findById(mockArticle._id);
        expect(deletedArticle).toBeNull();
    });

    test("Devrait récupérer les commandes de l'utilisateur", async () => {
        await Order.create({
            user: mockUser._id,
            items: [{ article: mockArticle._id, titre: "Test", prix: 10, quantity: 1 }],
            totalPrice: 10,
            status: "En cours"
        });

        const res = await request(app).get("/api/orders/me");

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
    });

    test("Devrait mettre à jour le statut d'une commande", async () => {
        const order = await Order.create({
            user: mockUser._id,
            items: [{ article: mockArticle._id, titre: "Test", prix: 10, quantity: 1 }],
            totalPrice: 10,
            status: "En cours"
        });

        const res = await request(app)
            .put(`/api/orders/${order._id}/status`)
            .send({ status: "Livré" });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe("Livré");
    });
});

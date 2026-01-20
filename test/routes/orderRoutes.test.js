const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../server");
const Order = require("../../models/Order");
const User = require("../../models/User");
const jwt = require("jsonwebtoken");

describe("Order Routes", () => {
    let token;
    let adminToken;
    const MONGO_URI_TEST = "mongodb+srv://Lucas:5LLwLJ4JF1yv3Z7s@brocawebapi.un5laul.mongodb.net/test_db?retryWrites=true&w=majority";
    const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

    beforeAll(async () => {
        jest.setTimeout(60000);
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGO_URI_TEST);
        }
        await Order.deleteMany({});
        await User.deleteMany({});

        const user = await User.create({ 
            nom: "User", 
            email: "u@t.com", 
            motDePasse: "password123", 
            role: "user" 
        });
        const admin = await User.create({ 
            nom: "Admin", 
            email: "a@t.com", 
            motDePasse: "password123", 
            role: "admin" 
        });

        token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
        adminToken = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it("devrait créer une nouvelle commande (POST /api/orders)", async () => {
        const res = await request(app)
            .post("/api/orders")
            .set("Authorization", `Bearer ${token}`)
            .send({ 
                items: [], 
                total: 100, 
                adresseLivraison: "123 Rue de Test",
                ville: "Paris",
                codePostal: "75000"
            });
        
        expect(res.statusCode).toBe(201);
    });

    it("devrait récupérer les commandes de l'utilisateur (GET /api/orders/my-orders)", async () => {
        const res = await request(app)
            .get("/api/orders/my-orders")
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });
});

const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const TEST_JWT_SECRET = "testsecret";
process.env.JWT_SECRET = TEST_JWT_SECRET;

const app = require("../../server");
const Order = require("../../models/Order");
const User = require("../../models/User");
const Article = require("../../models/Article");
const Category = require("../../models/Category");

describe("Order Routes", () => {
  let userToken;
  let adminToken;
  let userId;
  let articleId;
  let orderId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/test_db_orders"
      );
    }

    await User.deleteMany({});
    await Order.deleteMany({});
    await Article.deleteMany({});
    await Category.deleteMany({});

    const user = await User.create({
      nom: "Client User",
      email: "client@test.com",
      motDePasse: "password123",
      role: "user",
    });
    userId = user._id;

    const admin = await User.create({
      nom: "Admin User",
      email: "admin_order@test.com",
      motDePasse: "password123",
      role: "admin",
    });

    userToken = jwt.sign({ id: user._id, role: user.role }, TEST_JWT_SECRET, {
      expiresIn: "1h",
    });
    adminToken = jwt.sign({ id: admin._id, role: admin.role }, TEST_JWT_SECRET, {
      expiresIn: "1h",
    });

    const category = await Category.create({ name: "Order Category" });
    const article = await Article.create({
      titre: "Article Commande",
      prix: 50,
      description: "Description test",
      categorie: category.name,
      etat: "neuf",
      stock: 10,
    });
    articleId = article._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("devrait créer une nouvelle commande (POST /api/orders)", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        items: [{ article: articleId, quantity: 2 }],
        totalAmount: 100,
        shippingAddress: "123 Rue de Test, Paris",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("_id");
    orderId = res.body._id;
  });

  it("devrait récupérer les commandes de l'utilisateur connecté (GET /api/orders/my-orders)", async () => {
    const res = await request(app)
      .get("/api/orders/my-orders")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("devrait permettre à l'admin de récupérer toutes les commandes (GET /api/orders)", async () => {
    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it("devrait mettre à jour le statut d'une commande (PUT /api/orders/:id/status)", async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Expédiée" });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("Expédiée");
  });

  it("devrait supprimer une commande (DELETE /api/orders/:id)", async () => {
    const res = await request(app)
      .delete(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);

    const checkOrder = await Order.findById(orderId);
    expect(checkOrder).toBeNull();
  });
});

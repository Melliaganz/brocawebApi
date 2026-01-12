const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const Category = require("../../models/Category");
const Article = require("../../models/Article");
const categoryController = require("../../controllers/categoryController");

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());

    app.get("/api/categories", categoryController.getCategories);
    app.post("/api/categories", categoryController.createCategory);
    app.delete("/api/categories/:id", categoryController.deleteCategory);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Category.deleteMany({});
    await Article.deleteMany({});
});

describe("Category Controller", () => {
    test("Devrait créer une nouvelle catégorie", async () => {
        const res = await request(app)
            .post("/api/categories")
            .send({ name: "Vintage" });

        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe("Vintage");
    });

    test("Ne devrait pas créer de doublon (insensible à la casse)", async () => {
        await Category.create({ name: "Vintage" });
        const res = await request(app)
            .post("/api/categories")
            .send({ name: "vintage" });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Cette catégorie existe déjà.");
    });

    test("Devrait refuser la suppression si des articles utilisent la catégorie", async () => {
        const cat = await Category.create({ name: "Meubles" });
        
        await Article.create({
            titre: "Table Basse",
            description: "Une table",
            prix: 50,
            etat: "neuf",
            categorie: "Meubles",
            stock: 5,
            images: ["test.jpg"],
            createdBy: new mongoose.Types.ObjectId()
        });

        const res = await request(app).delete(`/api/categories/${cat._id}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("utilisent encore cette catégorie");
    });

    test("Devrait supprimer une catégorie vide", async () => {
        const cat = await Category.create({ name: "A supprimer" });
        const res = await request(app).delete(`/api/categories/${cat._id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Catégorie supprimée avec succès.");
    });
});

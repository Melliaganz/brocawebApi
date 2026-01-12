const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const cloudinary = require("cloudinary").v2;

const Article = require("../../models/Article");
const User = require("../../models/User");
const articleController = require("../../controllers/articleController");

jest.mock("cloudinary", () => ({
    v2: {
        uploader: {
            destroy: jest.fn().mockResolvedValue({ result: "ok" }),
        },
    },
}));

let mongoServer;
let app;
let testUser;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());

    testUser = await User.create({
        nom: "Test Bot",
        email: "bot@test.com",
        motDePasse: "hashed_password"
    });

    app.use((req, res, next) => {
        req.user = { id: testUser._id.toString() };
        next();
    });

    app.post("/api/articles", articleController.createArticle);
    app.get("/api/articles", articleController.getAllArticles);
    app.get("/api/articles/:id", articleController.getArticleById);
    app.put("/api/articles/:id", articleController.updateArticle);
    app.delete("/api/articles/:id", articleController.deleteArticle);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Article.deleteMany({});
    jest.clearAllMocks();
});

describe("Article Controller", () => {
    const getValidData = () => ({
        titre: "Article de Test",
        description: "Une superbe description de test",
        prix: 25,
        etat: "neuf",
        categorie: "vetements",
        images: ["http://res.cloudinary.com/demo/image/upload/v1/test.jpg"],
        createdBy: testUser._id
    });

    test("Devrait retourner une erreur si aucune image n'est envoyée lors de la création", async () => {
        const res = await request(app)
            .post("/api/articles")
            .send({ 
                titre: "Test sans image",
                description: "desc",
                prix: 10,
                etat: "bon",
                categorie: "divers" 
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Au moins une image est requise.");
    });

    test("Devrait retourner une erreur si plus de 5 images sont envoyées", async () => {
        const fakeFiles = Array(6).fill({ path: "some/path.jpg" });
        
        const tempApp = express();
        tempApp.use(express.json());
        tempApp.use((req, res, next) => {
            req.user = { id: testUser._id.toString() };
            req.files = fakeFiles; 
            next();
        });
        tempApp.post("/api/articles", articleController.createArticle);

        const res = await request(tempApp)
            .post("/api/articles")
            .send(getValidData());

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Vous ne pouvez envoyer que 5 images maximum.");
    });

    test("Devrait récupérer tous les articles", async () => {
        await Article.create(getValidData());
        const res = await request(app).get("/api/articles");
        
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].createdBy.nom).toBe("Test Bot");
    });

    test("Devrait mettre à jour un article et supprimer les anciennes images de Cloudinary", async () => {
        const article = await Article.create({
            ...getValidData(),
            images: ["http://res.cloudinary.com/demo/image/upload/v1/old_image.jpg"]
        });

        const res = await request(app)
            .put(`/api/articles/${article._id}`)
            .send({
                titre: "Titre modifié",
                existingImages: [] 
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.article.titre).toBe("Titre modifié");
        expect(cloudinary.uploader.destroy).toHaveBeenCalled();
    });

    test("Devrait supprimer un article et nettoyer Cloudinary", async () => {
        const article = await Article.create(getValidData());
        const res = await request(app).delete(`/api/articles/${article._id}`);
        
        expect(res.statusCode).toBe(200);
        expect(cloudinary.uploader.destroy).toHaveBeenCalled();
        const check = await Article.findById(article._id);
        expect(check).toBeNull();
    });
});

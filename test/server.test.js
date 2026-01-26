const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("path");
const fs = require('fs');

// On importe l'application configurée dans server.js
const app = require("../server"); 

let mongoServer;

beforeAll(async () => {
    // Configuration de la base de données de test en mémoire
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);

    // Mock de la fonction sendEmail pour éviter d'envoyer de vrais emails durant les tests
    // Cela permet de vérifier si la fonction est appelée sans utiliser de crédentiels SMTP
    app.set("sendEmail", jest.fn().mockResolvedValue(true));

    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    // On ferme les connexions si nécessaire
});

describe("Tests du Serveur Express", () => {
    
    test("GET /api/articles devrait renvoyer un status 200 ou 404", async () => {
        const res = await request(app).get("/api/articles");
        expect([200, 404, 204]).toContain(res.statusCode);
    });

    test("POST /test-body devrait retourner le JSON envoyé", async () => {
        const payload = { test: "data" };
        const res = await request(app)
            .post("/test-body")
            .send(payload);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.body).toEqual(payload);
    });

    test("Route inconnue devrait retourner 404", async () => {
        const res = await request(app).get("/api/unknown");
        expect(res.statusCode).toBe(404);
    });
});

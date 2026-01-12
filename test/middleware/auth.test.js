const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../../models/User");
const authMiddleware = require("../../middleware/authMiddleware");

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    process.env.JWT_SECRET = "test_secret_123";
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("Auth Middleware", () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    test("Devrait retourner 401 si aucun en-tête d'autorisation n'est présent", async () => {
        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Authentification requise" });
        expect(next).not.toHaveBeenCalled();
    });

    test("Devrait retourner 401 si le token ne commence pas par Bearer", async () => {
        req.headers.authorization = "Token 12345";
        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("Devrait retourner 401 si le token est invalide ou expiré", async () => {
        req.headers.authorization = "Bearer token_invalide";
        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token invalide ou expiré" });
    });

    test("Devrait passer et ajouter l'utilisateur à req si le token est valide", async () => {
        const user = await User.create({
            nom: "Auth Test",
            email: "auth@test.com",
            motDePasse: "password123"
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        req.headers.authorization = `Bearer ${token}`;

        await authMiddleware(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user._id.toString()).toBe(user._id.toString());
        expect(next).toHaveBeenCalled();
    });

    test("Devrait retourner 401 si l'utilisateur n'existe plus en base", async () => {
        const id = new mongoose.Types.ObjectId();
        const token = jwt.sign({ id }, process.env.JWT_SECRET);
        req.headers.authorization = `Bearer ${token}`;

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Utilisateur non trouvé" });
    });
});

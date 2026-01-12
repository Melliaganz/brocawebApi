const adminMiddleware = require("../../middleware/adminMiddleware");

describe("Admin Middleware", () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    test("Devrait laisser passer si l'utilisateur est admin", () => {
        req.user = { role: "admin" };

        adminMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test("Devrait bloquer avec une 403 si l'utilisateur n'est pas admin", () => {
        req.user = { role: "user" };

        adminMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Accès interdit. Administrateur requis." });
        expect(next).not.toHaveBeenCalled();
    });

    test("Devrait bloquer si req.user n'est pas défini", () => {
        req.user = undefined;

        adminMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});

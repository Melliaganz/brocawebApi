const multer = require('multer');
const upload = require('../../middleware/upload');

describe("Middleware Upload", () => {
    test("Devrait être configuré avec CloudinaryStorage", () => {
        expect(upload.storage).toBeDefined();
        // Vérifie si le dossier de destination est correct
        expect(upload.storage.params.folder).toBe('articles');
    });

    test("Devrait limiter la taille des fichiers à 5 Mo", () => {
        expect(upload.limits.fileSize).toBe(5 * 1024 * 1024);
    });

    test("Devrait accepter les formats d'image définis", () => {
        const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        expect(upload.storage.params.allowed_formats).toEqual(expect.arrayContaining(allowed));
    });
});

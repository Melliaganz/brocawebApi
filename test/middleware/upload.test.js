const upload = require("../../middleware/upload");

describe("Middleware Upload", () => {
    test("Le middleware upload devrait être correctement exporté", () => {
        expect(upload).toBeDefined();
        expect(typeof upload.single).toBe("function");
        expect(typeof upload.array).toBe("function");
    });
});

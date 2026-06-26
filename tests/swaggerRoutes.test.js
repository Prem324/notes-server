process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecret";
process.env.MONGO_URI = "mongodb://localhost/test";

const request = require("supertest");
const app = require("../app");

describe("Swagger Docs", () => {
    test("GET /api-docs should return Swagger docs page", async () => {
        const response = await request(app).get("/api-docs/");

        expect(response.statusCode).toBe(200);
        expect(response.text).toContain("Swagger UI");
    });
});
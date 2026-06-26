process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecret";
process.env.MONGO_URI = "mongodb://localhost/test";

const request = require("supertest");
const app = require("../app");

describe("Health Routes", () => {
    test("GET /health should return server health status", async () => {
        const response = await request(app).get("/health");

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message: "Server is healthy",
            uptime: expect.any(Number),
            timestamp: expect.any(String),
            environment: "test",
        });
    });
});
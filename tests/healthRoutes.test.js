process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecret";
process.env.MONGO_URI = "mongodb://localhost/test";

const request = require("supertest");
const app = require("../app");

describe("Health Routes", () => {
    test("GET /health should return server health status", async () => {
        const response = await request(app).get("/health");

        expect(response.statusCode).toBe(503);

        expect(response.body).toEqual({
            success: false,
            status: "unhealthy",
            message: "Database connection is unavailable",
            uptime: expect.any(Number),
            timestamp: expect.any(String),
            environment: "test",
            database: "disconnected",
        });
    });
});
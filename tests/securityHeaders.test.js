const request = require("supertest");
const app = require("../app");

describe("Security headers", () => {
    test("should include Helmet security headers", async () => {
        const response = await request(app).get("/");

        console.log("BODY:", response.body);
        console.log("HEADERS:", response.headers);

        expect(response.headers).toHaveProperty(
            "x-content-type-options",
            "nosniff"
        );

        expect(response.headers).toHaveProperty("x-frame-options");

        expect(response.headers).not.toHaveProperty("x-powered-by");
    });
});
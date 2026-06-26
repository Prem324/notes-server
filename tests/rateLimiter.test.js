const express = require("express");
const request = require("supertest");

const {
    loginLimiter,
    registerLimiter,
} = require("../middleware/rateLimiter");


// Helper function to create a small test app
const createTestApp = (limiter) => {
    const app = express();

    app.use(express.json());

    app.post(
        "/test",
        limiter,
        (req, res) => {
            res.status(200).json({
                success: true,
            });
        }
    );

    return app;
};


describe("rateLimiter middleware", () => {
    test("loginLimiter should allow first 5 requests and block 6th request", async () => {
        // =====================
        // ARRANGE
        // =====================

        const app = createTestApp(
            loginLimiter
        );


        // =====================
        // ACT + ASSERT
        // First 5 requests should pass
        // =====================

        for (let i = 1; i <= 5; i++) {
            const response = await request(app)
                .post("/test")
                .send({
                    email: "prem@gmail.com",
                    password: "123456",
                });

            expect(response.statusCode).toBe(200);

            expect(response.body).toEqual({
                success: true,
            });
        }


        // =====================
        // ACT
        // 6th request should be blocked
        // =====================

        const blockedResponse = await request(app)
            .post("/test")
            .send({
                email: "prem@gmail.com",
                password: "123456",
            });


        // =====================
        // ASSERT
        // =====================

        expect(blockedResponse.statusCode).toBe(429);

        expect(blockedResponse.body).toEqual({
            success: false,
            message:
                "Too many login attempts. Please try again later.",
        });
    });


    test("registerLimiter should allow first 3 requests and block 4th request", async () => {
        // =====================
        // ARRANGE
        // =====================

        const app = createTestApp(
            registerLimiter
        );


        // =====================
        // ACT + ASSERT
        // First 3 requests should pass
        // =====================

        for (let i = 1; i <= 3; i++) {
            const response = await request(app)
                .post("/test")
                .send({
                    name: "Prem",
                    email: `prem${i}@gmail.com`,
                    password: "123456",
                });

            expect(response.statusCode).toBe(200);

            expect(response.body).toEqual({
                success: true,
            });
        }


        // =====================
        // ACT
        // 4th request should be blocked
        // =====================

        const blockedResponse = await request(app)
            .post("/test")
            .send({
                name: "Prem",
                email: "prem4@gmail.com",
                password: "123456",
            });


        // =====================
        // ASSERT
        // =====================

        expect(blockedResponse.statusCode).toBe(429);

        expect(blockedResponse.body).toEqual({
            success: false,
            message:
                "Too many registration attempts. Please try again later.",
        });
    });
});
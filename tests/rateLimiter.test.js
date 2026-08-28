const express = require("express");
const request = require("supertest");


// ============================================================
// Mock rate-limit-redis
// ============================================================

jest.mock("rate-limit-redis", () => {

    class MockRedisStore {

        constructor() {
            this.hits = new Map();
        }

        async increment(key) {

            const current =
                this.hits.get(key) || 0;

            const totalHits =
                current + 1;

            this.hits.set(key, totalHits);

            return {
                totalHits,
                resetTime: new Date(
                    Date.now() + 15 * 60 * 1000
                ),
            };
        }

        async decrement(key) {

            const current =
                this.hits.get(key) || 0;

            this.hits.set(
                key,
                Math.max(current - 1, 0)
            );
        }

        async resetKey(key) {
            this.hits.delete(key);
        }
    }

    return {
        RedisStore: MockRedisStore,
    };
});


const {
    loginLimiter,
    registerLimiter,
} = require("../middleware/rateLimiter");


// ============================================================
// Helper
// ============================================================

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


// ============================================================
// Tests
// ============================================================

describe("rateLimiter middleware", () => {


    test(
        "loginLimiter should allow first 5 requests and block 6th request",
        async () => {

            const app =
                createTestApp(loginLimiter);


            // First 5 requests

            for (let i = 1; i <= 5; i++) {

                const response =
                    await request(app)
                        .post("/test")
                        .send({
                            email: "prem@gmail.com",
                            password: "123456",
                        });

                expect(
                    response.statusCode
                ).toBe(200);

                expect(
                    response.body
                ).toEqual({
                    success: true,
                });
            }


            // 6th request

            const blockedResponse =
                await request(app)
                    .post("/test")
                    .send({
                        email: "prem@gmail.com",
                        password: "123456",
                    });


            expect(
                blockedResponse.statusCode
            ).toBe(429);

            expect(
                blockedResponse.body
            ).toEqual({
                success: false,
                message:
                    "Too many login attempts. Please try again later.",
            });

        }
    );


    test(
        "registerLimiter should allow first 3 requests and block 4th request",
        async () => {

            const app =
                createTestApp(registerLimiter);


            // First 3 requests

            for (let i = 1; i <= 3; i++) {

                const response =
                    await request(app)
                        .post("/test")
                        .send({
                            name: "Prem",
                            email: `prem${i}@gmail.com`,
                            password: "123456",
                        });

                expect(
                    response.statusCode
                ).toBe(200);

                expect(
                    response.body
                ).toEqual({
                    success: true,
                });
            }


            // 4th request

            const blockedResponse =
                await request(app)
                    .post("/test")
                    .send({
                        name: "Prem",
                        email: "prem4@gmail.com",
                        password: "123456",
                    });


            expect(
                blockedResponse.statusCode
            ).toBe(429);

            expect(
                blockedResponse.body
            ).toEqual({
                success: false,
                message:
                    "Too many registration attempts. Please try again later.",
            });

        }
    );

});
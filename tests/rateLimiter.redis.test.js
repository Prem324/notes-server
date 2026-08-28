const express = require("express");
const request = require("supertest");

const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const redisConnection = require("../config/redis");


// ============================================================
// Test configuration
// ============================================================

const createRedisLimiter = () => {

    return rateLimit({

        windowMs: 60 * 1000,

        max: 2,

        standardHeaders: true,

        legacyHeaders: false,

        store: new RedisStore({

            sendCommand: (...args) =>
                redisConnection.call(...args),

        }),

        message: {
            success: false,
            message: "Too many requests",
        },

    });
};


// ============================================================
// Test app
// ============================================================

const createTestApp = () => {

    const app = express();

    app.use(express.json());

    const redisLimiter =
        createRedisLimiter();

    app.get(
        "/test",
        redisLimiter,
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

describe(
    "Redis Rate Limiter Integration",
    () => {

        let app;


        beforeAll(async () => {

            // Make sure Redis is connected
            await redisConnection.ping();

            app = createTestApp();

        });


        afterAll(async () => {

            /*
             * Close Redis connection so
             * Jest can exit cleanly.
             */
            await redisConnection.quit();

        });


        test(
            "should enforce rate limit using real Redis",
            async () => {

                const uniqueIp =
                    `integration-${Date.now()}`;

                /*
                 * We use X-Forwarded-For so
                 * each test run gets a fresh
                 * rate-limit key.
                 */

                const first =
                    await request(app)
                        .get("/test")
                        .set(
                            "X-Forwarded-For",
                            uniqueIp
                        );

                expect(
                    first.statusCode
                ).toBe(200);


                const second =
                    await request(app)
                        .get("/test")
                        .set(
                            "X-Forwarded-For",
                            uniqueIp
                        );

                expect(
                    second.statusCode
                ).toBe(200);


                const third =
                    await request(app)
                        .get("/test")
                        .set(
                            "X-Forwarded-For",
                            uniqueIp
                        );

                expect(
                    third.statusCode
                ).toBe(429);


                expect(
                    third.body
                ).toEqual({
                    success: false,
                    message: "Too many requests",
                });

            }
        );

    }
);
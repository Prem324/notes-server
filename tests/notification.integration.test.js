process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecret";
process.env.MONGO_URI = "mongodb://localhost/test";
process.env.FEATURE_NOTIFICATIONS = "true";

jest.mock("../middleware/rateLimiter", () => ({
    loginLimiter: (req, res, next) => next(),
    registerLimiter: (req, res, next) => next(),
    forgotPasswordLimiter: (req, res, next) => next(),
    resetPasswordLimiter: (req, res, next) => next(),
    resendVerificationLimiter: (req, res, next) => next(),
}));

jest.mock("../services/emailService", () => ({
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

const User = require("../models/User");
const Notification = require("../models/Notification");
const featureFlags = require("../config/featureFlags");

const {
    connectTestDB,
    clearTestDB,
    closeTestDB,
} = require("./setupTestDB");

describe("Notification Integration", () => {
    let token;
    let otherToken;
    let user;
    let otherUser;

    const registerAndLogin = async (name, email) => {
        await request(app)
            .post("/api/v1/auth/register")
            .send({
                name,
                email,
                password: "Password123",
            })
            .expect(201);

        await User.updateOne(
            { email },
            { emailVerified: true }
        );

        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({
                email,
                password: "Password123",
            })
            .expect(200);

        return response.body.data.accessToken;
    };

    const createNotification = async (
        recipient,
        overrides = {}
    ) => {
        return Notification.create({
            recipient,
            type: "NOTE_SHARED",
            title: "Note shared with you",
            message: "A user shared a note with you.",
            ...overrides,
        });
    };

    beforeAll(async () => {
        await connectTestDB();
    });

    beforeEach(async () => {
        featureFlags.notifications = true;

        const unique = `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

        const userEmail = `notification-${unique}@example.com`;
        const otherEmail = `other-${unique}@example.com`;

        token = await registerAndLogin(
            "Notification User",
            userEmail
        );

        otherToken = await registerAndLogin(
            "Other User",
            otherEmail
        );

        user = await User.findOne({ email: userEmail });
        otherUser = await User.findOne({ email: otherEmail });
    });

    afterEach(async () => {
        featureFlags.notifications = true;
        await clearTestDB();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    describe("Authentication", () => {
        test("should reject requests without authentication", async () => {
            await request(app)
                .get("/api/v1/notifications")
                .expect(401);
        });
    });

    describe("GET /api/v1/notifications", () => {
        test("should return only the authenticated user's notifications", async () => {
            await createNotification(user._id);
            await createNotification(otherUser._id);

            const response = await request(app)
                .get("/api/v1/notifications")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(
                response.body.data.notifications
            ).toHaveLength(1);

            expect(
                response.body.data.notifications[0].title
            ).toBe("Note shared with you");

            expect(
                response.body.data.pagination.total
            ).toBe(1);
        });

        test("should filter unread notifications", async () => {
            await createNotification(user._id);
            await createNotification(user._id, {
                title: "Already read",
                read: true,
            });

            const response = await request(app)
                .get("/api/v1/notifications?unreadOnly=true")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(
                response.body.data.notifications
            ).toHaveLength(1);

            expect(
                response.body.data.notifications[0].read
            ).toBe(false);
        });

        test("should reject invalid pagination", async () => {
            await request(app)
                .get("/api/v1/notifications?page=0")
                .set("Authorization", `Bearer ${token}`)
                .expect(400);
        });

        test("should paginate notification history", async () => {
            await createNotification(user._id, {
                title: "Notification 1",
            });

            await createNotification(user._id, {
                title: "Notification 2",
            });

            const response = await request(app)
                .get("/api/v1/notifications?page=1&limit=1")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(
                response.body.data.notifications
            ).toHaveLength(1);

            expect(
                response.body.data.pagination.total
            ).toBe(2);

            expect(
                response.body.data.pagination.totalPages
            ).toBe(2);
        });
    });

    describe("GET /api/v1/notifications/unread-count", () => {
        test("should return the unread count for the current user", async () => {
            await createNotification(user._id);
            await createNotification(user._id);
            await createNotification(user._id, {
                read: true,
            });

            await createNotification(otherUser._id);

            const response = await request(app)
                .get("/api/v1/notifications/unread-count")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body.data.count).toBe(2);
        });
    });

    describe("PATCH /api/v1/notifications/:id/read", () => {
        test("should mark the user's notification as read", async () => {
            const notification = await createNotification(user._id);

            const response = await request(app)
                .patch(
                    `/api/v1/notifications/${notification._id}/read`
                )
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.read).toBe(true);

            const updated = await Notification.findById(
                notification._id
            );

            expect(updated.read).toBe(true);
        });

        test("should not mark another user's notification as read", async () => {
            const notification = await createNotification(
                otherUser._id
            );

            await request(app)
                .patch(
                    `/api/v1/notifications/${notification._id}/read`
                )
                .set("Authorization", `Bearer ${token}`)
                .expect(404);

            const unchanged = await Notification.findById(
                notification._id
            );

            expect(unchanged.read).toBe(false);
        });

        test("should reject an invalid notification ID", async () => {
            await request(app)
                .patch("/api/v1/notifications/invalid-id/read")
                .set("Authorization", `Bearer ${token}`)
                .expect(400);
        });
    });

    describe("PATCH /api/v1/notifications/read-all", () => {
        test("should mark all of the current user's notifications as read", async () => {
            await createNotification(user._id);
            await createNotification(user._id);
            await createNotification(otherUser._id);

            const response = await request(app)
                .patch("/api/v1/notifications/read-all")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.modifiedCount).toBe(2);

            expect(
                await Notification.countDocuments({
                    recipient: user._id,
                    read: false,
                })
            ).toBe(0);

            expect(
                await Notification.countDocuments({
                    recipient: otherUser._id,
                    read: false,
                })
            ).toBe(1);
        });
    });

    describe("DELETE /api/v1/notifications/:id", () => {
        test("should delete the current user's notification", async () => {
            const notification = await createNotification(user._id);

            const response = await request(app)
                .delete(
                    `/api/v1/notifications/${notification._id}`
                )
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            expect(
                await Notification.findById(notification._id)
            ).toBeNull();
        });

        test("should not delete another user's notification", async () => {
            const notification = await createNotification(
                otherUser._id
            );

            await request(app)
                .delete(
                    `/api/v1/notifications/${notification._id}`
                )
                .set("Authorization", `Bearer ${token}`)
                .expect(404);

            expect(
                await Notification.findById(notification._id)
            ).not.toBeNull();
        });
    });

    describe("Feature flag", () => {
        test("should reject notification requests when disabled", async () => {
            featureFlags.notifications = false;

            try {
                await request(app)
                    .get("/api/v1/notifications")
                    .set("Authorization", `Bearer ${token}`)
                    .expect(503);
            } finally {
                featureFlags.notifications = true;
            }
        });
    });
});
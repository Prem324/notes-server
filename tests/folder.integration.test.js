process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecret";
process.env.MONGO_URI = "mongodb://localhost/test";
process.env.FEATURE_FOLDERS = "false";

jest.mock("../middleware/rateLimiter", () => ({
    loginLimiter: (req, res, next) => next(),
    registerLimiter: (req, res, next) => next(),
    forgotPasswordLimiter: (req, res, next) => next(),
}));

jest.mock("../services/emailService", () => ({
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

const request = require("supertest");

const app = require("../app");

const User = require("../models/User");
const Folder = require("../models/Folder");

const {
    connectTestDB,
    clearTestDB,
    closeTestDB,
} = require("./setupTestDB");

beforeAll(async () => {
    process.env.JWT_SECRET = "testsecret";

    await connectTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

afterAll(async () => {
    await closeTestDB();
});

const registerAndLogin = async (
    name,
    email,
    password = "Password123"
) => {
    await request(app)
        .post("/api/v1/auth/register")
        .send({
            name,
            email,
            password,
        });

    await User.updateOne(
        { email },
        { emailVerified: true }
    );

    const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email,
            password,
        });

    return loginResponse.body.data.accessToken;
};

describe("Folder API", () => {
    test("should reject unauthenticated request", async () => {
        const response = await request(app)
            .get("/api/v1/folders");

        expect(response.status).toBe(401);
    });
});

test("should reject folder request when feature is disabled", async () => {
    const token = await registerAndLogin(
        "Prem",
        "prem@example.com"
    );

    const response = await request(app)
        .get("/api/v1/folders")
        .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
        "This feature is currently unavailable"
    );
});
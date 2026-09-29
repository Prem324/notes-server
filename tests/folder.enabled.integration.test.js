process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecret";
process.env.MONGO_URI = "mongodb://localhost/test";
process.env.FEATURE_FOLDERS = "true";

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

describe("Folder API - enabled feature", () => {
    test("should create a folder", async () => {
        const token = await registerAndLogin(
            "Prem",
            "prem@example.com"
        );

        const response = await request(app)
            .post("/api/v1/folders")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Work",
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe("Work");

        const folder = await Folder.findOne({
            name: "Work",
        });

        expect(folder).not.toBeNull();
    });

    test("should fetch user's folders", async () => {
        const token = await registerAndLogin(
            "Prem",
            "prem@example.com"
        );

        await request(app)
            .post("/api/v1/folders")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Work" });

        await request(app)
            .post("/api/v1/folders")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Personal" });

        const response = await request(app)
            .get("/api/v1/folders")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);

        expect(
            response.body.data.map((folder) => folder.name)
        ).toEqual([
            "Personal",
            "Work",
        ]);
    });

    test("should reject duplicate folder name for same user", async () => {
        const token = await registerAndLogin(
            "Prem",
            "prem@example.com"
        );

        await request(app)
            .post("/api/v1/folders")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Work" });

        const response = await request(app)
            .post("/api/v1/folders")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Work" });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
    });

    test("should update a folder", async () => {
        const token = await registerAndLogin(
            "Prem",
            "prem@example.com"
        );

        const createResponse = await request(app)
            .post("/api/v1/folders")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Work" });

        const folderId = createResponse.body.data._id;

        const response = await request(app)
            .put(`/api/v1/folders/${folderId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Office" });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe("Office");
    });

    test("should delete a folder", async () => {
        const token = await registerAndLogin(
            "Prem",
            "prem@example.com"
        );

        const createResponse = await request(app)
            .post("/api/v1/folders")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Work" });

        const folderId = createResponse.body.data._id;

        const response = await request(app)
            .delete(`/api/v1/folders/${folderId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const folder = await Folder.findById(folderId);

        expect(folder).toBeNull();
    });

    test("should not allow one user to update another user's folder", async () => {
        const user1Token = await registerAndLogin(
            "Prem",
            "prem1@example.com"
        );

        const user2Token = await registerAndLogin(
            "User Two",
            "prem2@example.com"
        );

        const createResponse = await request(app)
            .post("/api/v1/folders")
            .set("Authorization", `Bearer ${user1Token}`)
            .send({ name: "Private" });

        const folderId = createResponse.body.data._id;

        const response = await request(app)
            .put(`/api/v1/folders/${folderId}`)
            .set("Authorization", `Bearer ${user2Token}`)
            .send({ name: "Hacked" });

        expect(response.status).toBe(404);
    });

    test("should not allow one user to delete another user's folder", async () => {
        const user1Token = await registerAndLogin(
            "Prem",
            "prem1@example.com"
        );

        const user2Token = await registerAndLogin(
            "User Two",
            "prem2@example.com"
        );

        const createResponse = await request(app)
            .post("/api/v1/folders")
            .set("Authorization", `Bearer ${user1Token}`)
            .send({ name: "Private" });

        const folderId = createResponse.body.data._id;

        const response = await request(app)
            .delete(`/api/v1/folders/${folderId}`)
            .set("Authorization", `Bearer ${user2Token}`);

        expect(response.status).toBe(404);
    });
});
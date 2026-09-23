process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecret";
process.env.MONGO_URI = "mongodb://localhost/test";
process.env.FEATURE_TAGS = "true";

jest.mock("../middleware/rateLimiter", () => {
    return {
        loginLimiter: (req, res, next) => next(),
        registerLimiter: (req, res, next) => next(),
        forgotPasswordLimiter: (req, res, next) => next(),
    };
});

jest.mock("../services/emailService", () => ({
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

const request = require("supertest");

const app = require("../app");

const Tag = require("../models/Tag");
const User = require("../models/User");

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
    name = "Prem",
    email = "prem@gmail.com",
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

describe("Tag Integration Tests", () => {
    test("POST /api/v1/tags should create tag for authenticated user", async () => {
        const token = await registerAndLogin();

        const response = await request(app)
            .post("/api/v1/tags")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "javascript",
            });

        expect(response.statusCode).toBe(201);

        expect(response.body.success).toBe(true);

        expect(response.body.message).toBe(
            "Tag created successfully"
        );

        expect(response.body.data).toEqual(
            expect.objectContaining({
                name: "javascript",
            })
        );

        const tags = await Tag.find();

        expect(tags.length).toBe(1);
        expect(tags[0].name).toBe("javascript");
    });

    test("POST /api/v1/tags should reject unauthenticated request", async () => {
        const response = await request(app)
            .post("/api/v1/tags")
            .send({
                name: "javascript",
            });

        expect(response.statusCode).toBe(401);

        expect(response.body).toEqual({
            success: false,
            message: "No token provided",
        });

        const tags = await Tag.find();

        expect(tags.length).toBe(0);
    });

    test("POST /api/v1/tags should reject invalid tag name", async () => {
        const token = await registerAndLogin();

        const response = await request(app)
            .post("/api/v1/tags")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "",
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        const tags = await Tag.find();

        expect(tags.length).toBe(0);
    });

    test("POST /api/v1/tags should reject duplicate tag for same user", async () => {
        const token = await registerAndLogin();

        await request(app)
            .post("/api/v1/tags")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "javascript",
            });

        const response = await request(app)
            .post("/api/v1/tags")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "javascript",
            });

        expect(response.statusCode).toBe(409);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "Tag already exists"
        );

        const tags = await Tag.find();

        expect(tags.length).toBe(1);
    });

    test("POST /api/v1/tags should block request when tags feature is disabled", async () => {
        const token = await registerAndLogin();

        const featureFlags = require("../config/featureFlags");

        const originalValue = featureFlags.tags;

        featureFlags.tags = false;

        const response = await request(app)
            .post("/api/v1/tags")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "javascript",
            });

        featureFlags.tags = originalValue;

        expect(response.statusCode).toBe(503);

        expect(response.body).toEqual(
            expect.objectContaining({
                success: false,
                message: "This feature is currently unavailable",
            })
        );

        const tags = await Tag.find();

        expect(tags.length).toBe(0);
    });


    test("GET /api/v1/tags should return authenticated user's tags", async () => {
    const token = await registerAndLogin();

    await request(app)
        .post("/api/v1/tags")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "javascript",
        });

    await request(app)
        .post("/api/v1/tags")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "backend",
        });

    const response = await request(app)
        .get("/api/v1/tags")
        .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
        "Tags fetched successfully"
    );

    expect(response.body.data).toHaveLength(2);

    expect(response.body.data[0].name).toBe("backend");
    expect(response.body.data[1].name).toBe("javascript");
});


test("GET /api/v1/tags should reject unauthenticated request", async () => {
    const response = await request(app)
        .get("/api/v1/tags");

    expect(response.statusCode).toBe(401);

    expect(response.body).toEqual({
        success: false,
        message: "No token provided",
    });
});


test("GET /api/v1/tags should return only current user's tags", async () => {
    const userAToken = await registerAndLogin(
        "Prem",
        "prem@gmail.com"
    );

    const userBToken = await registerAndLogin(
        "Rahul",
        "rahul@gmail.com"
    );

    await request(app)
        .post("/api/v1/tags")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
            name: "javascript",
        });

    await request(app)
        .post("/api/v1/tags")
        .set("Authorization", `Bearer ${userBToken}`)
        .send({
            name: "java",
        });

    const response = await request(app)
        .get("/api/v1/tags")
        .set("Authorization", `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0].name).toBe("javascript");
});

test("PUT /api/v1/tags/:id should update own tag", async () => {
    const token = await registerAndLogin();

    const createResponse = await request(app)
        .post("/api/v1/tags")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "javascript",
        });

    const tagId = createResponse.body.data._id;

    const response = await request(app)
        .put(`/api/v1/tags/${tagId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "typescript",
        });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
        "Tag updated successfully"
    );

    expect(response.body.data.name).toBe("typescript");

    const updatedTag = await Tag.findById(tagId);

    expect(updatedTag.name).toBe("typescript");
});

test("PUT /api/v1/tags/:id should reject updating another user's tag", async () => {
    const userAToken = await registerAndLogin(
        "Prem",
        "prem@gmail.com"
    );

    const userBToken = await registerAndLogin(
        "Rahul",
        "rahul@gmail.com"
    );

    const createResponse = await request(app)
        .post("/api/v1/tags")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
            name: "javascript",
        });

    const tagId = createResponse.body.data._id;

    const response = await request(app)
        .put(`/api/v1/tags/${tagId}`)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({
            name: "hacked",
        });

    expect(response.statusCode).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
        "Tag not found"
    );

    const tag = await Tag.findById(tagId);

    expect(tag.name).toBe("javascript");
});

test("PUT /api/v1/tags/:id should reject duplicate tag name", async () => {
    const token = await registerAndLogin();

    await request(app)
        .post("/api/v1/tags")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "javascript",
        });

    const secondTagResponse = await request(app)
        .post("/api/v1/tags")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "backend",
        });

    const secondTagId = secondTagResponse.body.data._id;

    const response = await request(app)
        .put(`/api/v1/tags/${secondTagId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "javascript",
        });

    expect(response.statusCode).toBe(409);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
        "Tag already exists"
    );
});

test("DELETE /api/v1/tags/:id should delete own tag", async () => {
    const token = await registerAndLogin();

    const createResponse = await request(app)
        .post("/api/v1/tags")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "javascript",
        });

    const tagId = createResponse.body.data._id;

    const response = await request(app)
        .delete(`/api/v1/tags/${tagId}`)
        .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
        success: true,
        message: "Tag deleted successfully",
    });

    const deletedTag = await Tag.findById(tagId);

    expect(deletedTag).toBeNull();
});
test("DELETE /api/v1/tags/:id should reject deleting another user's tag", async () => {
    const userAToken = await registerAndLogin(
        "Prem",
        "prem@gmail.com"
    );

    const userBToken = await registerAndLogin(
        "Rahul",
        "rahul@gmail.com"
    );

    const createResponse = await request(app)
        .post("/api/v1/tags")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
            name: "javascript",
        });

    const tagId = createResponse.body.data._id;

    const response = await request(app)
        .delete(`/api/v1/tags/${tagId}`)
        .set("Authorization", `Bearer ${userBToken}`);

    expect(response.statusCode).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
        "Tag not found"
    );

    const tag = await Tag.findById(tagId);

    expect(tag).not.toBeNull();
});

test("PUT invalid tag ID returns 400", async () => {
    const token = await registerAndLogin();

    const response = await request(app)
        .put("/api/v1/tags/invalid-id")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Tag" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid tag ID");
});

test("DELETE invalid tag ID returns 400", async () => {
    const token = await registerAndLogin();

    const response = await request(app)
        .delete("/api/v1/tags/invalid-id")
        .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid tag ID");
});
});
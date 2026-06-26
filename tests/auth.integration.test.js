process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecret";
process.env.MONGO_URI = "mongodb://localhost/test";

jest.mock("../middleware/rateLimiter", () => {
    return {
        loginLimiter: (req, res, next) => next(),
        registerLimiter: (req, res, next) => next(),
    };
});
const request = require("supertest");
const app = require("../app");
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

describe("Register Integration Tests", () => {
    test("POST /api/v1/auth/register should create user in database", async () => {
        const response = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Prem",
                email: "prem@gmail.com",
                password: "123456",
            });

        expect(response.statusCode).toBe(201);

        expect(response.body.success).toBe(true);

        expect(response.body.data).toEqual({
            id: expect.any(String),
            name: "Prem",
            email: "prem@gmail.com",
        });

        const user = await User.findOne({
            email: "prem@gmail.com",
        }).select("+password");

        expect(user).not.toBeNull();

        expect(user.name).toBe("Prem");

        expect(user.password).not.toBe("123456");
    });


    test("POST /api/v1/auth/register should reject duplicate email", async () => {
        await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Prem",
                email: "prem@gmail.com",
                password: "Paaword123",
            });

        const response = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Prem Again",
                email: "prem@gmail.com",
                password: "PAssword123abc",
            });

        expect(response.statusCode).toBe(409);

        expect(response.body).toEqual({
            success: false,
            message: "Email already exists",
        });

        const users = await User.find({
            email: "prem@gmail.com",
        });

        expect(users.length).toBe(1);
    });


    test("POST /api/v1/auth/register should reject invalid email", async () => {
        const response = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Prem",
                email: "invalid-email",
                password: "Password123",
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toContain("email");

        const users = await User.find();

        expect(users.length).toBe(0);
    });
});



describe("Login Integration Tests", () => {
    test("POST /api/v1/auth/login should login user successfully", async () => {
    // =====================
    // ARRANGE
    // =====================

    const registerResponse = await request(app)
        .post("/api/v1/auth/register")
        .send({
            name: "Prem",
            email: "prem@gmail.com",
            password: "Password123",
        });

    expect(registerResponse.statusCode).toBe(201);


    // =====================
    // ACT
    // =====================

    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: "prem@gmail.com",
            password: "Password123",
        });


    // =====================
    // ASSERT
    // =====================

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.token).toEqual(
        expect.any(String)
    );
});

test("POST /api/v1/auth/login should reject invalid password", async () => {
    // =====================
    // ARRANGE
    // =====================

    await request(app)
        .post("/api/v1/auth/register")
        .send({
            name: "Prem",
            email: "prem@gmail.com",
            password: "Password123",
        });


    // =====================
    // ACT
    // =====================

    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: "prem@gmail.com",
            password: "WrongPassword123",
        });


    // =====================
    // ASSERT
    // =====================

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
        "Invalid credentials"
    );
});

test("POST /api/v1/auth/login should reject non-existing user", async () => {
    // =====================
    // ACT
    // =====================

    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: "missing@gmail.com",
            password: "Password123",
        });


    // =====================
    // ASSERT
    // =====================

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
        "Invalid credentials"
    );
});

test("POST /api/v1/auth/login should reject missing password", async () => {
    // =====================
    // ACT
    // =====================

    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: "prem@gmail.com",
        });


    // =====================
    // ASSERT
    // =====================

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toContain(
        "password"
    );
});
});


describe("Profile Integration Tests", () => {
    test("GET /api/v1/auth/profile should return user from valid token", async () => {
    // =====================
    // ARRANGE
    // =====================

    const registerResponse = await request(app)
        .post("/api/v1/auth/register")
        .send({
            name: "Prem",
            email: "prem@gmail.com",
            password: "Password123",
        });

    expect(registerResponse.statusCode).toBe(201);

    const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: "prem@gmail.com",
            password: "Password123",
        });

    expect(loginResponse.statusCode).toBe(200);

    const token = loginResponse.body.data.token;


    // =====================
    // ACT
    // =====================

    const response = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${token}`);


    // =====================
    // ASSERT
    // =====================

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.user).toEqual(
        expect.objectContaining({
            id: expect.any(String),
            role: expect.any(String),
        })
    );
});


test("GET /api/v1/auth/profile should reject request without token", async () => {
    // =====================
    // ACT
    // =====================

    const response = await request(app)
        .get("/api/v1/auth/profile");


    // =====================
    // ASSERT
    // =====================

    expect(response.statusCode).toBe(401);

    expect(response.body).toEqual({
        success: false,
        message: "No token provided",
    });
});


test("GET /api/v1/auth/profile should reject invalid token", async () => {
    // =====================
    // ACT
    // =====================

    const response = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", "Bearer invalid-token");


    // =====================
    // ASSERT
    // =====================

    expect(response.statusCode).toBe(401);

    expect(response.body).toEqual({
        success: false,
        message: "Invalid token",
    });
});
});
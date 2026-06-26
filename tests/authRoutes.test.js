const request = require("supertest");

const authService =
require("../services/authService");


// Mock authService
jest.mock("../services/authService");


// Mock rate limiters so they do not block tests
jest.mock("../middleware/rateLimiter", () => {
    return {
        loginLimiter: (req, res, next) => next(),
        registerLimiter: (req, res, next) => next(),
    };
});


// Mock auth middleware for /profile route
jest.mock("../middleware/auth", () => {
    return (req, res, next) => {
        req.user = {
            id: "user123",
            role: "user",
        };

        next();
    };
});


// IMPORTANT:
// app should be required after mocks are defined
const app = require("../app");
const { message } = require("../validators/noteValidator");


beforeEach(() => {
    jest.clearAllMocks();
});


describe("Auth Routes", () => {
    test("POST /api/v1/auth/register should register user successfully", async () => {
        // =====================
        // ARRANGE
        // =====================

        const requestBody = {
            name: "Prem",
            email: "prem@gmail.com",
            password: "Password123",
        };

        const fakeUser = {
            _id: "user123",
            name: "Prem",
            email: "prem@gmail.com",
            password: "hashedPassword",
        };

        authService.registerUser.mockResolvedValue(
            fakeUser
        );


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .post("/api/v1/auth/register")
            .send(requestBody);


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(201);

        expect(response.body).toEqual({
            success: true,
            message:"User registered successfully",
            data: {
                id: "user123",
                name: "Prem",
                email: "prem@gmail.com",
            },
        });

        expect(
            authService.registerUser
        ).toHaveBeenCalledWith(
            requestBody
        );
    });


    test("POST /api/v1/auth/register should return 400 for invalid email", async () => {
        // =====================
        // ARRANGE
        // =====================

        const invalidBody = {
            name: "Prem",
            email: "invalid-email",
            password: "Password123",
        };


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .post("/api/v1/auth/register")
            .send(invalidBody);


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toContain(
            "email"
        );

        expect(
            authService.registerUser
        ).not.toHaveBeenCalled();
    });


    test("POST /api/v1/auth/login should login user successfully", async () => {
        // =====================
        // ARRANGE
        // =====================

        const requestBody = {
            email: "prem@gmail.com",
            password: "Password123",
        };

        authService.loginUser.mockResolvedValue(
            "fake-token"
        );


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .post("/api/v1/auth/login")
            .send(requestBody);


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            data:{
                token:"fake-token",
            },
            success: true,
            message:"Login successful",
        });

        expect(
            authService.loginUser
        ).toHaveBeenCalledWith(
            "prem@gmail.com",
            "Password123"
        );
    });


    test("POST /api/v1/auth/login should return 400 when password is missing", async () => {
        // =====================
        // ARRANGE
        // =====================

        const invalidBody = {
            email: "prem@gmail.com",
        };


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .post("/api/v1/auth/login")
            .send(invalidBody);


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toContain(
            "password"
        );

        expect(
            authService.loginUser
        ).not.toHaveBeenCalled();
    });


    test("POST /api/v1/auth/login should return error when service throws", async () => {
        // =====================
        // ARRANGE
        // =====================

        const error = new Error(
            "Invalid credentials"
        );

        error.statusCode = 401;

        authService.loginUser.mockRejectedValue(
            error
        );


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

        expect(response.statusCode).toBe(401);

        expect(response.body).toEqual({
            success: false,
            message: "Invalid credentials",
        });

        expect(
            authService.loginUser
        ).toHaveBeenCalledWith(
            "prem@gmail.com",
            "WrongPassword123"
        );
    });


    test("GET /api/v1/auth/profile should return authenticated user", async () => {
        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .get("/api/v1/auth/profile");


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            user: {
                id: "user123",
                role: "user",
            },
        });
    });
});
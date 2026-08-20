const request = require("supertest");

const authService = require("../services/authService");

jest.mock("../services/authService");

jest.mock("../middleware/rateLimiter", () => ({
    loginLimiter: (req, res, next) => next(),
    registerLimiter: (req, res, next) => next(),
    forgotPasswordLimiter: (req, res, next) => next(),
}));

jest.mock("../middleware/auth", () => {
    return (req, res, next) => {
        req.user = {
            id: "user123",
            role: "user",
        };

        next();
    };
});

const app = require("../app");

beforeEach(() => {
    jest.clearAllMocks();
});


describe("Auth Routes", () => {

    test(
        "POST /api/v1/auth/register should register user successfully",
        async () => {

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

            const response = await request(app)
                .post("/api/v1/auth/register")
                .send(requestBody);

            expect(response.statusCode).toBe(201);

            expect(response.body).toEqual({
                success: true,
                message: "User registered successfully",
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
        }
    );


    test(
        "POST /api/v1/auth/register should return 400 for invalid email",
        async () => {

            const invalidBody = {
                name: "Prem",
                email: "invalid-email",
                password: "Password123",
            };

            const response = await request(app)
                .post("/api/v1/auth/register")
                .send(invalidBody);

            expect(response.statusCode).toBe(400);

            expect(response.body.success)
                .toBe(false);

            expect(response.body.message)
                .toContain("email");

            expect(
                authService.registerUser
            ).not.toHaveBeenCalled();
        }
    );


    test(
        "POST /api/v1/auth/login should login user successfully",
        async () => {

            const requestBody = {
                email: "prem@gmail.com",
                password: "Password123",
            };

            authService.loginUser.mockResolvedValue({
                accessToken:"fake-access-token",
                refreshToken:"fake-refresh-token",
            }
            );

            const response = await request(app)
                .post("/api/v1/auth/login")
                .send(requestBody);

            expect(response.statusCode).toBe(200);

            expect(response.body).toEqual({
                data: {
                    accessToken: "fake-access-token",
                },
                success: true,
                message: "Login successful",
            });

            expect(
                authService.loginUser
            ).toHaveBeenCalledWith(
                "prem@gmail.com",
                "Password123"
            );
        }
    );


    test(
        "POST /api/v1/auth/login should return 400 when password is missing",
        async () => {

            const invalidBody = {
                email: "prem@gmail.com",
            };

            const response = await request(app)
                .post("/api/v1/auth/login")
                .send(invalidBody);

            expect(response.statusCode).toBe(400);

            expect(response.body.success)
                .toBe(false);

            expect(response.body.message)
                .toContain("password");

            expect(
                authService.loginUser
            ).not.toHaveBeenCalled();
        }
    );


    test(
        "POST /api/v1/auth/login should return 401 when service throws",
        async () => {

            const error = new Error(
                "Invalid credentials"
            );

            error.statusCode = 401;

            authService.loginUser.mockRejectedValue(
                error
            );

            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: "prem@gmail.com",
                    password: "WrongPassword123",
                });

            expect(response.statusCode).toBe(401);

            expect(response.body).toEqual({
                success: false,
                message: "Invalid credentials",
            });
        }
    );


    test(
        "GET /api/v1/auth/profile should return authenticated user",
        async () => {

            const response = await request(app)
                .get("/api/v1/auth/profile");

            expect(response.statusCode)
                .toBe(200);

            expect(response.body).toEqual({
                success: true,
                user: {
                    id: "user123",
                    role: "user",
                },
            });
        }
    );

});

describe("Password Reset Routes", () => {

    test(
        "POST /api/v1/auth/forgot-password should request reset",
        async () => {

            authService.forgotPassword
                .mockResolvedValue({
                    message:
                        "If a user with that email exists, a password reset link has been sent to the email address provided.",
                });

            const response = await request(app)
                .post("/api/v1/auth/forgot-password")
                .send({
                    email: "prem@gmail.com",
                });

            expect(response.statusCode)
                .toBe(200);

            expect(
                authService.forgotPassword
            ).toHaveBeenCalledWith(
                "prem@gmail.com"
            );
        }
    );


    test(
        "POST /api/v1/auth/reset-password/:token should reset password",
        async () => {

            authService.resetPassword
                .mockResolvedValue({
                    message:
                        "Password reset successfully",
                });

            const response = await request(app)
                .post(
                    "/api/v1/auth/reset-password/fake-token"
                )
                .send({
                    password: "NewPassword123",
                });

            expect(response.statusCode)
                .toBe(200);

            expect(
                authService.resetPassword
            ).toHaveBeenCalledWith(
                "fake-token",
                "NewPassword123"
            );
        }
    );

});


describe("Email Verification Routes", () => {

    test(
        "GET /api/v1/auth/verify-email/:token should verify email",
        async () => {

            authService.verifyEmail
                .mockResolvedValue({
                    message:
                        "Email verified successfully",
                });

            const response = await request(app)
                .get(
                    "/api/v1/auth/verify-email/fake-token"
                );

            expect(response.statusCode)
                .toBe(200);

            expect(
                authService.verifyEmail
            ).toHaveBeenCalledWith(
                "fake-token"
            );
        }
    );


    test(
        "POST /api/v1/auth/resend-verification should resend email",
        async () => {

            authService.resendVerificationEmail
                .mockResolvedValue({
                    message:
                        "Verification email sent successfully",
                });

            const response = await request(app)
                .post(
                    "/api/v1/auth/resend-verification"
                )
                .send({
                    email: "prem@gmail.com",
                });

            expect(response.statusCode)
                .toBe(200);

            expect(
                authService.resendVerificationEmail
            ).toHaveBeenCalledWith(
                "prem@gmail.com"
            );
        }
    );

});
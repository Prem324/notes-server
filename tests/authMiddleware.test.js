const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

// Mock jsonwebtoken
jest.mock("jsonwebtoken");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("auth middleware", () => {
    test("should return 401 when no token is provided", () => {
        // =====================
        // ARRANGE
        // =====================

        const req = {
            headers: {},
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const next = jest.fn();

        // =====================
        // ACT
        // =====================

        auth(req, res, next);

        // =====================
        // ASSERT
        // =====================

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "No token provided",
        });

        expect(next).not.toHaveBeenCalled();

        expect(jwt.verify).not.toHaveBeenCalled();
    });


    test("should return 401 when token is invalid", () => {
        // =====================
        // ARRANGE
        // =====================

        const req = {
            headers: {
                authorization: "Bearer invalid-token",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const next = jest.fn();

        // jwt.verify throws error for invalid token
        jwt.verify.mockImplementation(() => {
            throw new Error("Invalid token");
        });


        // =====================
        // ACT
        // =====================

        auth(req, res, next);

        // =====================
        // ASSERT
        // =====================

        expect(jwt.verify).toHaveBeenCalledWith(
            "invalid-token",
            process.env.JWT_SECRET
        );

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Invalid token",
        });

        expect(next).not.toHaveBeenCalled();
    });


    test("should attach decoded user to req.user and call next when token is valid", () => {
        // =====================
        // ARRANGE
        // =====================

        const req = {
            headers: {
                authorization: "Bearer valid-token",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const next = jest.fn();

        const decodedUser = {
            id: "user123",
            role: "user",
        };


        // jwt.verify returns decoded payload for valid token
        jwt.verify.mockReturnValue(decodedUser);


        // =====================
        // ACT
        // =====================

        auth(req, res, next);


        // =====================
        // ASSERT
        // =====================

        expect(jwt.verify).toHaveBeenCalledWith(
            "valid-token",
            process.env.JWT_SECRET
        );

        expect(req.user).toEqual(decodedUser);

        expect(next).toHaveBeenCalled();

        expect(res.status).not.toHaveBeenCalled();

        expect(res.json).not.toHaveBeenCalled();
    });

    test("should return 401 when authorization format is invalid", () => {
    const req = {
        headers: {
            authorization: "invalid-format-token",
        },
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid token format",
    });

    expect(jwt.verify).not.toHaveBeenCalled();

    expect(next).not.toHaveBeenCalled();
});
});
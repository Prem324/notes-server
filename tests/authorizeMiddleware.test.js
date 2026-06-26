const authorize = require("../middleware/authorize");

describe("authorize middleware", () => {
    test("should allow user with correct role", () => {
        // =====================
        // ARRANGE
        // =====================

        const req = {
            user: {
                id: "user123",
                role: "admin",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const next = jest.fn();

        const middleware = authorize("admin");


        // =====================
        // ACT
        // =====================

        middleware(req, res, next);


        // =====================
        // ASSERT
        // =====================

        expect(next).toHaveBeenCalled();

        expect(res.status).not.toHaveBeenCalled();

        expect(res.json).not.toHaveBeenCalled();
    });


    test("should allow user when role is included in multiple allowed roles", () => {
        // =====================
        // ARRANGE
        // =====================

        const req = {
            user: {
                id: "user123",
                role: "moderator",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const next = jest.fn();

        const middleware = authorize(
            "admin",
            "moderator"
        );


        // =====================
        // ACT
        // =====================

        middleware(req, res, next);


        // =====================
        // ASSERT
        // =====================

        expect(next).toHaveBeenCalled();

        expect(res.status).not.toHaveBeenCalled();

        expect(res.json).not.toHaveBeenCalled();
    });


    test("should reject user with wrong role", () => {
        // =====================
        // ARRANGE
        // =====================

        const req = {
            user: {
                id: "user123",
                role: "user",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const next = jest.fn();

        const middleware = authorize("admin");


        // =====================
        // ACT
        // =====================

        middleware(req, res, next);


        // =====================
        // ASSERT
        // =====================

        expect(res.status).toHaveBeenCalledWith(403);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Access denied",
        });

        expect(next).not.toHaveBeenCalled();
    });


    test("should reject request when req.user is missing", () => {
        // =====================
        // ARRANGE
        // =====================

        const req = {};

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const next = jest.fn();

        const middleware = authorize("admin");


        // =====================
        // ACT
        // =====================

        middleware(req, res, next);


        // =====================
        // ASSERT
        // =====================

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Not authenticated",
        });

        expect(next).not.toHaveBeenCalled();
    });
});
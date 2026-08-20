const authorize = require("../middleware/authorize");

describe("authorize middleware", () => {

    test("should return 401 when user is not authenticated", () => {

        const req = {};

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const next = jest.fn();

        authorize("admin")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Not authenticated",
        });

        expect(next).not.toHaveBeenCalled();
    });


    test("should return 403 when user does not have required role", () => {

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

        authorize("admin")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Access denied",
        });

        expect(next).not.toHaveBeenCalled();
    });


    test("should call next when user has required role", () => {

        const req = {
            user: {
                id: "admin123",
                role: "admin",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const next = jest.fn();

        authorize("admin")(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });


    test("should allow any of multiple permitted roles", () => {

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

        authorize("admin", "user")(
            req,
            res,
            next
        );

        expect(next).toHaveBeenCalledTimes(1);
    });

});
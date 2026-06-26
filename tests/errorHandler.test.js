const errorHandler =
require("../middleware/errorHandler");

describe("errorHandler middleware", () => {
    test("should return custom statusCode and error message", () => {
        // =====================
        // ARRANGE
        // =====================

        const error =
        new Error("Note not found");

        error.statusCode = 404;

        const req = {};

        const res = {
            status:
            jest.fn().mockReturnThis(),

            json:
            jest.fn(),
        };

        const next = jest.fn();


        // =====================
        // ACT
        // =====================

        errorHandler(
            error,
            req,
            res,
            next
        );


        // =====================
        // ASSERT
        // =====================

        expect(res.status)
        .toHaveBeenCalledWith(404);

        expect(res.json)
        .toHaveBeenCalledWith({
            success: false,
            message: "Note not found",
        });
    });


    test("should return 500 when statusCode is missing", () => {
        // =====================
        // ARRANGE
        // =====================

        const error =
        new Error("Database failed");

        const req = {};

        const res = {
            status:
            jest.fn().mockReturnThis(),

            json:
            jest.fn(),
        };

        const next = jest.fn();


        // =====================
        // ACT
        // =====================

        errorHandler(
            error,
            req,
            res,
            next
        );


        // =====================
        // ASSERT
        // =====================

        expect(res.status)
        .toHaveBeenCalledWith(500);

        expect(res.json)
        .toHaveBeenCalledWith({
            success: false,
            message: "Database failed",
        });
    });


    test("should return default message when error message is missing", () => {
        // =====================
        // ARRANGE
        // =====================

        const error = {
            statusCode: 500,
        };

        const req = {};

        const res = {
            status:
            jest.fn().mockReturnThis(),

            json:
            jest.fn(),
        };

        const next = jest.fn();


        // =====================
        // ACT
        // =====================

        errorHandler(
            error,
            req,
            res,
            next
        );


        // =====================
        // ASSERT
        // =====================

        expect(res.status)
        .toHaveBeenCalledWith(500);

        expect(res.json)
        .toHaveBeenCalledWith({
            success: false,
            message: "Server Error",
        });
    });


    test("should handle Mongoose CastError", () => {
    const error = {
        name: "CastError",
        message: "Cast to ObjectId failed",
    };

    const req = {};

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid resource ID",
    });
});


test("should handle Multer file size error", () => {
    const error = {
        code: "LIMIT_FILE_SIZE",
        message: "File too large",
    };

    const req = {};

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "File size too large. Maximum size is 5MB",
    });
});


test("should handle Multer unexpected file error", () => {
    const error = {
        code: "LIMIT_UNEXPECTED_FILE",
        message: "Unexpected field",
    };

    const req = {};

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Too many files uploaded or invalid file field",
    });
});


});
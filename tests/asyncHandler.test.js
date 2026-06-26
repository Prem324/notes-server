const asyncHandler = require("../middleware/asyncHandler");

describe("asyncHandler middleware", () => {
    test("should call wrapped async function successfully", async () => {
        // =====================
        // ARRANGE
        // =====================

        const req = {};
        const res = {};
        const next = jest.fn();

        const controller = jest.fn().mockResolvedValue(
            "success"
        );

        const wrappedController = asyncHandler(
            controller
        );


        // =====================
        // ACT
        // =====================

        await wrappedController(
            req,
            res,
            next
        );


        // =====================
        // ASSERT
        // =====================

        expect(controller).toHaveBeenCalledWith(
            req,
            res,
            next
        );

        expect(next).not.toHaveBeenCalled();
    });


    test("should pass error to next when wrapped async function rejects", async () => {
        // =====================
        // ARRANGE
        // =====================

        const req = {};
        const res = {};
        const next = jest.fn();

        const error = new Error(
            "Something went wrong"
        );

        const controller = jest.fn().mockRejectedValue(
            error
        );

        const wrappedController = asyncHandler(
            controller
        );


        // =====================
        // ACT
        // =====================

        await wrappedController(
            req,
            res,
            next
        );


        // =====================
        // ASSERT
        // =====================

        expect(controller).toHaveBeenCalledWith(
            req,
            res,
            next
        );

        expect(next).toHaveBeenCalledWith(
            error
        );
    });


    test("should pass synchronous thrown error to next", async () => {
        // =====================
        // ARRANGE
        // =====================

        const req = {};
        const res = {};
        const next = jest.fn();

        const error = new Error(
            "Sync error"
        );

        const controller = jest.fn(() => {
            throw error;
        });

        const wrappedController = asyncHandler(
            controller
        );


        // =====================
        // ACT
        // =====================

        await wrappedController(
            req,
            res,
            next
        );


        // =====================
        // ASSERT
        // =====================

        expect(controller).toHaveBeenCalledWith(
            req,
            res,
            next
        );

        expect(next).toHaveBeenCalledWith(
            error
        );
    });
});
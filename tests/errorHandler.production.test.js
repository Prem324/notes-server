jest.mock("../config/env", () => ({
    nodeEnv: "production",
}));

const errorHandler = require("../middleware/errorHandler");

const logger = require("../config/logger");

describe("errorHandler production behavior", () => {
    test("should hide 500 error details in production", () => {
        const loggerSpy = jest
            .spyOn(logger, "error")
            .mockImplementation(() => {});

        const error = new Error(
            "Cannot read properties of undefined"
        );

        const req = {};

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const next = jest.fn();

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Something went wrong",
        }));

        expect(loggerSpy).toHaveBeenCalled();

        loggerSpy.mockRestore();
    });
});
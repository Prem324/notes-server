jest.mock("../config/env", () => ({
    nodeEnv: "test",
}));

const requestLogger = require("../middleware/requestLogger");

describe("requestLogger middleware", () => {
    test("should call next immediately in test environment", () => {
        const req = {};
        const res = {};
        const next = jest.fn();

        requestLogger(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
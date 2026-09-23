const requireFeature = require("../middleware/featureFlag");
const featureFlags = require("../config/featureFlags");
const FEATURE_NAMES = require("../config/featureNames");

describe("requireFeature middleware", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            requestId: "test-request-id",
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("allows request when feature is enabled", () => {
        featureFlags.tags = true;

        const middleware = requireFeature("tags");

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    test("blocks request when feature is disabled", () => {
        featureFlags.tags = false;

        const middleware = requireFeature(FEATURE_NAMES.TAGS);

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(503);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "This feature is currently unavailable",
            requestId: "test-request-id",
        });

        expect(next).not.toHaveBeenCalled();
    });

    test("returns 500 for unknown feature flag", () => {
        const middleware = requireFeature("unknownFeature");

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Unknown feature flag",
            requestId: "test-request-id",
        });

        expect(next).not.toHaveBeenCalled();
    });
});
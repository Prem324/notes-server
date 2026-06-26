const request = require("supertest");

const analyticsService =
require("../services/analyticsService");

jest.mock("../services/analyticsService");

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

describe("Analytics Authorization", () => {
    test("should reject non-admin user from analytics route", async () => {
        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .get("/api/v1/analytics/notes-per-user");


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(403);

        expect(response.body).toEqual({
            success: false,
            message: "Access denied",
        });

        expect(
            analyticsService.getNotesPerUser
        ).not.toHaveBeenCalled();
    });
});
const request = require("supertest");

const analyticsService =
require("../services/analyticsService");

jest.mock("../services/analyticsService");

jest.mock("../middleware/auth", () => {
    return (req, res, next) => {
        req.user = {
            id: "user123",
            role: "admin",
        };

        next();
    };
});

const app = require("../app");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Analytics Routes", () => {
    test("GET /api/v1/analytics/notes-per-user should return notes per user", async () => {
        // =====================
        // ARRANGE
        // =====================

        const fakeData = [
            {
                userId: "user123",
                name: "Prem",
                email: "prem@gmail.com",
                totalNotes: 5,
            },
        ];

        analyticsService.getNotesPerUser.mockResolvedValue(
            fakeData
        );


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .get("/api/v1/analytics/notes-per-user");


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message:"Notes per user fetched successfully",
            data: fakeData,
        });

        expect(
            analyticsService.getNotesPerUser
        ).toHaveBeenCalled();
    });


    test("GET /api/v1/analytics/comments-per-note should return comments per note", async () => {
        const fakeData = [
            {
                noteId: "note123",
                title: "My Note",
                totalComments: 3,
            },
        ];

        analyticsService.getCommentsPerNote.mockResolvedValue(
            fakeData
        );

        const response = await request(app)
            .get("/api/v1/analytics/comments-per-note");

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message:"Comments per note fetched successfully",
            data: fakeData,
        });

        expect(
            analyticsService.getCommentsPerNote
        ).toHaveBeenCalled();
    });


    test("GET /api/v1/analytics/most-active-user should return most active user", async () => {
        const fakeData = [
            {
                userId: "user123",
                name: "Prem",
                email: "prem@gmail.com",
                totalNotes: 20,
            },
        ];

        analyticsService.getMostActiveUser.mockResolvedValue(
            fakeData
        );

        const response = await request(app)
            .get("/api/v1/analytics/most-active-user");

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message:"Most active user fetched successfully",
            data: fakeData,
        });

        expect(
            analyticsService.getMostActiveUser
        ).toHaveBeenCalled();
    });


    test("GET /api/v1/analytics/monthly-notes should return monthly notes count", async () => {
        const fakeData = {
            totalNotes: 12,
        };

        analyticsService.getMonthlyNotes.mockResolvedValue(
            fakeData
        );

        const response = await request(app)
            .get("/api/v1/analytics/monthly-notes");

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message:"Monthly notes fetched successfully",
            data: fakeData,
        });

        expect(
            analyticsService.getMonthlyNotes
        ).toHaveBeenCalled();
    });


    test("GET /api/v1/analytics/monthly-notes should return error when service throws", async () => {
        const error = new Error(
            "Analytics failed"
        );

        error.statusCode = 500;

        analyticsService.getMonthlyNotes.mockRejectedValue(
            error
        );

        const response = await request(app)
            .get("/api/v1/analytics/monthly-notes");

        expect(response.statusCode).toBe(500);

        expect(response.body).toEqual({
            success: false,
            message: "Analytics failed",
        });

        expect(
            analyticsService.getMonthlyNotes
        ).toHaveBeenCalled();
    });
});
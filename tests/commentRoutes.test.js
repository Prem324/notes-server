const request = require("supertest");
const app = require("../app");
const commentService = require("../services/commentService");

// Mock comment service
jest.mock("../services/commentService");

// Mock auth middleware
jest.mock("../middleware/auth", () => {
    return (req, res, next) => {
        req.user = {
            id: "user123",
            role: "user",
        };

        next();
    };
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Comment Routes", () => {
    test("POST /api/v1/comments/:noteId should create comment", async () => {
        // =====================
        // ARRANGE
        // =====================

        const fakeComment = {
            _id: "comment123",
            text: "Nice note",
            note: "note123",
            user: "user123",
        };

        commentService.createComment.mockResolvedValue(
            fakeComment
        );


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .post("/api/v1/comments/note123")
            .send({
                text: "Nice note",
            });


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(201);

        expect(response.body).toEqual({
            success: true,
            message:"Comment created successfully",
            data: fakeComment,
        });

        expect(
            commentService.createComment
        ).toHaveBeenCalledWith(
            "Nice note",
            "note123",
            "user123"
        );
    });


    test("GET /api/v1/comments/note/:noteId should return comments", async () => {
        // =====================
        // ARRANGE
        // =====================

        const fakeComments = [
            {
                _id: "comment1",
                text: "First comment",
                note: "note123",
                user: {
                    name: "Prem",
                    email: "prem@gmail.com",
                },
            },
            {
                _id: "comment2",
                text: "Second comment",
                note: "note123",
                user: {
                    name: "Rahul",
                    email: "rahul@gmail.com",
                },
            },
        ];

        commentService.getCommentsByNote.mockResolvedValue(
            fakeComments
        );


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .get("/api/v1/comments/note/note123");


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message:"Comments fetched successfully",
            data: fakeComments,
        });

        expect(
            commentService.getCommentsByNote
        ).toHaveBeenCalledWith(
            "note123"
        );
    });

    test("POST /api/v1/comments/:noteId should return 404 when note does not exist", async () => {
    // =====================
    // ARRANGE
    // =====================

    const error =
    new Error("Note not found");

    error.statusCode = 404;

    commentService.createComment
    .mockRejectedValue(error);


    // =====================
    // ACT
    // =====================

    const response =
    await request(app)
        .post("/api/v1/comments/wrongNoteId")
        .send({
            text: "Nice note",
        });


    // =====================
    // ASSERT
    // =====================

    expect(response.statusCode)
    .toBe(404);

    expect(response.body)
    .toEqual({
        success: false,
        message: "Note not found",
    });

    expect(
        commentService.createComment
    ).toHaveBeenCalledWith(
        "Nice note",
        "wrongNoteId",
        "user123"
    );
});
});
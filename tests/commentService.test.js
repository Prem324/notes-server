const Comment = require("../models/Comment");
const Note = require("../models/Note");

const {
    createComment,
    getCommentsByNote,
} = require("../services/commentService");

// Mock models
jest.mock("../models/Comment");
jest.mock("../models/Note");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("commentService - createComment", () => {
    test("should create comment successfully and return populated comment", async () => {
        // =====================
        // ARRANGE
        // =====================

        const fakeNote = {
            _id: "note123",
            title: "Test Note",
        };

        const createdComment = {
            _id: "comment123",
            text: "This is a test comment",
            note: "note123",
            user: "user123",
        };

        const populatedComment = {
            _id: "comment123",
            text: "This is a test comment",
            note: {
                _id: "note123",
                title: "Test Note",
            },
            user: {
                _id: "user123",
                name: "Prem",
                email: "prem@example.com",
            },
        };

        Note.findById.mockResolvedValue(fakeNote);

        Comment.create.mockResolvedValue(createdComment);

        const leanMock = jest
            .fn()
            .mockResolvedValue(populatedComment);

        const secondPopulateMock = jest
            .fn()
            .mockReturnValue({
                lean: leanMock,
            });

        const firstPopulateMock = jest
            .fn()
            .mockReturnValue({
                populate: secondPopulateMock,
            });

        Comment.findById.mockReturnValue({
            populate: firstPopulateMock,
        });

        // =====================
        // ACT
        // =====================

        const result = await createComment(
            "This is a test comment",
            "note123",
            "user123"
        );

        // =====================
        // ASSERT
        // =====================

        expect(Note.findById).toHaveBeenCalledWith("note123");

        expect(Comment.create).toHaveBeenCalledWith({
            text: "This is a test comment",
            note: "note123",
            user: "user123",
        });

        expect(Comment.findById).toHaveBeenCalledWith(
            "comment123"
        );

        expect(firstPopulateMock).toHaveBeenCalledWith(
            "user",
            "name email"
        );

        expect(secondPopulateMock).toHaveBeenCalledWith(
            "note",
            "title"
        );

        expect(leanMock).toHaveBeenCalled();

        expect(result).toEqual(populatedComment);
    });

    test("should throw error when note does not exist", async () => {
        // =====================
        // ARRANGE
        // =====================

        Note.findById.mockResolvedValue(null);

        // =====================
        // ACT + ASSERT
        // =====================

        await expect(
            createComment(
                "This is a test comment",
                "wrongNoteId",
                "user123"
            )
        ).rejects.toMatchObject({
            message: "Note not found",
            statusCode: 404,
        });

        expect(Note.findById).toHaveBeenCalledWith(
            "wrongNoteId"
        );

        expect(Comment.create).not.toHaveBeenCalled();
        expect(Comment.findById).not.toHaveBeenCalled();
    });
});

describe("commentService - getCommentsByNote", () => {
    test("should get comments by note successfully", async () => {
        // =====================
        // ARRANGE
        // =====================

        const fakeComments = [
            {
                _id: "comment1",
                text: "First comment",
                note: {
                    _id: "note123",
                    title: "Test Note",
                },
                user: {
                    _id: "user123",
                    name: "Prem",
                    email: "prem@gmail.com",
                },
            },
            {
                _id: "comment2",
                text: "Second comment",
                note: {
                    _id: "note123",
                    title: "Test Note",
                },
                user: {
                    _id: "user456",
                    name: "Rahul",
                    email: "rahul@gmail.com",
                },
            },
        ];

        const leanMock = jest
            .fn()
            .mockResolvedValue(fakeComments);

        const sortMock = jest
            .fn()
            .mockReturnValue({
                lean: leanMock,
            });

        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            sort: sortMock,
        };

        Comment.find.mockReturnValue(mockQuery);

        // =====================
        // ACT
        // =====================

        const result = await getCommentsByNote("note123");

        // =====================
        // ASSERT
        // =====================

        expect(Comment.find).toHaveBeenCalledWith({
            note: "note123",
        });

        expect(mockQuery.populate).toHaveBeenCalledWith(
            "user",
            "name email"
        );

        expect(mockQuery.populate).toHaveBeenCalledWith(
            "note",
            "title content"
        );

        expect(sortMock).toHaveBeenCalledWith({
            createdAt: -1,
        });

        expect(leanMock).toHaveBeenCalled();

        expect(result).toEqual(fakeComments);
    });
});
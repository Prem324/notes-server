const Note = require("../models/Note");
const Comment = require("../models/Comment");

const {
    getNotesPerUser,
    getCommentsPerNote,
    getMostActiveUser,
    getMonthlyNotes,
} = require("../services/analyticsService");

jest.mock("../models/Note");
jest.mock("../models/Comment");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("analyticsService", () => {
    test("getNotesPerUser should return notes count grouped by user", async () => {
        // =====================
        // ARRANGE
        // =====================

        const fakeResult = [
            {
                userId: "user123",
                name: "Prem",
                email: "prem@gmail.com",
                totalNotes: 5,
            },
            {
                userId: "user456",
                name: "Rahul",
                email: "rahul@gmail.com",
                totalNotes: 2,
            },
        ];

        Note.aggregate.mockResolvedValue(fakeResult);


        // =====================
        // ACT
        // =====================

        const result = await getNotesPerUser();


        // =====================
        // ASSERT
        // =====================

        expect(Note.aggregate).toHaveBeenCalledWith([
            {
                $group: {
                    _id: "$user",
                    totalNotes: {
                        $sum: 1,
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $project: {
                    _id: 0,
                    userId: "$user._id",
                    name: "$user.name",
                    email: "$user.email",
                    totalNotes: 1,
                },
            },
            {
                $sort: {
                    totalNotes: -1,
                },
            },
        ]);

        expect(result).toEqual(fakeResult);
    });


    test("getCommentsPerNote should return top 3 notes by comment count", async () => {
        // =====================
        // ARRANGE
        // =====================

        const fakeResult = [
            {
                noteId: "note123",
                title: "First Note",
                totalComments: 10,
            },
            {
                noteId: "note456",
                title: "Second Note",
                totalComments: 5,
            },
        ];

        Comment.aggregate.mockResolvedValue(fakeResult);


        // =====================
        // ACT
        // =====================

        const result = await getCommentsPerNote();


        // =====================
        // ASSERT
        // =====================

        expect(Comment.aggregate).toHaveBeenCalledWith([
            {
                $group: {
                    _id: "$note",
                    totalComments: {
                        $sum: 1,
                    },
                },
            },
            {
                $lookup: {
                    from: "notes",
                    localField: "_id",
                    foreignField: "_id",
                    as: "note",
                },
            },
            {
                $unwind: "$note",
            },
            {
                $project: {
                    _id: 0,
                    noteId: "$note._id",
                    title: "$note.title",
                    totalComments: 1,
                },
            },
            {
                $sort: {
                    totalComments: -1,
                },
            },
            {
                $limit: 3,
            },
        ]);

        expect(result).toEqual(fakeResult);
    });


    test("getMostActiveUser should return user with highest note count", async () => {
        // =====================
        // ARRANGE
        // =====================

        const fakeResult = [
            {
                userId: "user123",
                name: "Prem",
                email: "prem@gmail.com",
                totalNotes: 20,
            },
        ];

        Note.aggregate.mockResolvedValue(fakeResult);


        // =====================
        // ACT
        // =====================

        const result = await getMostActiveUser();


        // =====================
        // ASSERT
        // =====================

        expect(Note.aggregate).toHaveBeenCalledWith([
            {
                $group: {
                    _id: "$user",
                    totalNotes: {
                        $sum: 1,
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $sort: {
                    totalNotes: -1,
                },
            },
            {
                $limit: 1,
            },
            {
                $project: {
                    _id: 0,
                    userId: "$user._id",
                    name: "$user.name",
                    email: "$user.email",
                    totalNotes: 1,
                },
            },
        ]);

        expect(result).toEqual(fakeResult);
    });


    test("getMonthlyNotes should return current month note count", async () => {
        // =====================
        // ARRANGE
        // =====================

        const fakeResult = [
            {
                _id: null,
                totalNotes: 12,
            },
        ];

        Note.aggregate.mockResolvedValue(fakeResult);


        // =====================
        // ACT
        // =====================

        const result = await getMonthlyNotes();


        // =====================
        // ASSERT
        // =====================

        expect(Note.aggregate).toHaveBeenCalled();

        const pipeline = Note.aggregate.mock.calls[0][0];

        expect(pipeline[0]).toHaveProperty("$match");
        expect(pipeline[0].$match).toHaveProperty("createdAt");

        expect(pipeline[0].$match.createdAt).toHaveProperty("$gte");
        expect(pipeline[0].$match.createdAt).toHaveProperty("$lt");

        expect(pipeline[1]).toEqual({
            $group: {
                _id: null,
                totalNotes: {
                    $sum: 1,
                },
            },
        });

        expect(result).toEqual({
            _id: null,
            totalNotes: 12,
        });
    });


    test("getMonthlyNotes should return 0 when no notes exist this month", async () => {
        // =====================
        // ARRANGE
        // =====================

        Note.aggregate.mockResolvedValue([]);


        // =====================
        // ACT
        // =====================

        const result = await getMonthlyNotes();


        // =====================
        // ASSERT
        // =====================

        expect(result).toEqual({
            totalNotes: 0,
        });
    });
});
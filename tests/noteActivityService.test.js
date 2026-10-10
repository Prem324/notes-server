jest.mock("../services/noteAccessService", () => ({
    getNoteAccess: jest.fn(),
}));

jest.mock("../services/auditService", () => ({
    getNoteActivity: jest.fn(),
}));

const {
    getNoteAccess,
} = require("../services/noteAccessService");

const {
    getNoteActivity,
} = require("../services/auditService");

const {
    getActivityForNote,
} = require("../services/noteActivityService");

describe("noteActivityService.getActivityForNote", () => {
    const validNoteId = "507f1f77bcf86cd799439011";

    const request = {
        noteId: validNoteId,
        userId: "user123",
        role: "user",
        page: 1,
        limit: 20,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("rejects an invalid note ID", async () => {
        await expect(
            getActivityForNote({
                ...request,
                noteId: "invalid-id",
            })
        ).rejects.toThrow("Invalid note ID");

        expect(getNoteAccess).not.toHaveBeenCalled();
        expect(getNoteActivity).not.toHaveBeenCalled();
    });

    test("does not fetch activity when access is denied", async () => {
        getNoteAccess.mockRejectedValue(
            new Error("Not authorized to access this note")
        );

        await expect(
            getActivityForNote(request)
        ).rejects.toThrow(
            "Not authorized to access this note"
        );

        expect(getNoteAccess).toHaveBeenCalledWith(
            validNoteId,
            "user123",
            "user"
        );

        expect(getNoteActivity).not.toHaveBeenCalled();
    });

    test("fetches activity after access is granted", async () => {
        const expectedResult = {
            activities: [],
            pagination: {
                totalLogs: 0,
                currentPage: 1,
                totalPages: 0,
                limit: 20,
                hasNextPage: false,
                hasPrevPage: false,
            },
        };

        getNoteAccess.mockResolvedValue({
            accessRole: "owner",
            canRead: true,
        });

        getNoteActivity.mockResolvedValue(expectedResult);

        const result = await getActivityForNote(request);

        expect(getNoteAccess).toHaveBeenCalledWith(
            validNoteId,
            "user123",
            "user"
        );

        expect(getNoteActivity).toHaveBeenCalledWith({
            noteId: validNoteId,
            page: 1,
            limit: 20,
        });

        expect(result).toEqual(expectedResult);
    });
});

jest.mock("../models/AuditLog", () => ({
    find: jest.fn(),
    countDocuments: jest.fn(),
}));

const AuditLog = require("../models/AuditLog");

const {
    getNoteActivity,
} = require("../services/auditService");

describe("auditService.getNoteActivity", () => {
    let query;

    beforeEach(() => {
        jest.clearAllMocks();

        query = {
            select: jest.fn(),
            sort: jest.fn(),
            skip: jest.fn(),
            limit: jest.fn(),
            lean: jest.fn(),
        };

        query.select.mockReturnValue(query);
        query.sort.mockReturnValue(query);
        query.skip.mockReturnValue(query);
        query.limit.mockReturnValue(query);
        query.lean.mockResolvedValue([
            {
                _id: "activity123",
                action: "NOTE_CREATED",
                createdAt: new Date("2026-10-10T10:00:00Z"),
                metadata: {
                    title: "Private metadata",
                },
                ipAddress: "127.0.0.1",
                userAgent: "Test browser",
            },
            {
                _id: "activity456",
                action: "ATTACHMENT_UPLOADED",
                createdAt: new Date("2026-10-10T11:00:00Z"),
            },
        ]);

        AuditLog.find.mockReturnValue(query);
        AuditLog.countDocuments.mockResolvedValue(25);
    });

    test("filters by note ID and paginates results", async () => {
        const result = await getNoteActivity({
            noteId: "note123",
            page: 2,
            limit: 10,
        });

        const expectedFilter = {
            resource: "Note",
            resourceId: "note123",
        };

        expect(AuditLog.find).toHaveBeenCalledWith(
            expectedFilter
        );

        expect(AuditLog.countDocuments).toHaveBeenCalledWith(
            expectedFilter
        );

        expect(query.select).toHaveBeenCalledWith(
            "action createdAt"
        );

        expect(query.sort).toHaveBeenCalledWith({
            createdAt: -1,
            _id: -1,
        });

        expect(query.skip).toHaveBeenCalledWith(10);
        expect(query.limit).toHaveBeenCalledWith(10);

        expect(result.pagination).toEqual({
            totalLogs: 25,
            currentPage: 2,
            totalPages: 3,
            limit: 10,
            hasNextPage: true,
            hasPrevPage: true,
        });
    });

    test("returns safe activity fields without audit metadata", async () => {
        const result = await getNoteActivity({
            noteId: "note123",
        });

        expect(result.activities).toEqual([
            {
                id: "activity123",
                action: "NOTE_CREATED",
                description: "Note created",
                createdAt: new Date("2026-10-10T10:00:00Z"),
            },
            {
                id: "activity456",
                action: "ATTACHMENT_UPLOADED",
                description: "Attachment uploaded",
                createdAt: new Date("2026-10-10T11:00:00Z"),
            },
        ]);

        expect(result.activities[0]).not.toHaveProperty(
            "metadata"
        );

        expect(result.activities[0]).not.toHaveProperty(
            "ipAddress"
        );

        expect(result.activities[0]).not.toHaveProperty(
            "userAgent"
        );
    });

    test("uses defaults and caps the page size at 50", async () => {
        await getNoteActivity({
            noteId: "note123",
            limit: 500,
        });

        expect(query.skip).toHaveBeenCalledWith(0);
        expect(query.limit).toHaveBeenCalledWith(50);
    });

    test("handles an empty activity history", async () => {
        query.lean.mockResolvedValue([]);
        AuditLog.countDocuments.mockResolvedValue(0);

        const result = await getNoteActivity({
            noteId: "note123",
        });

        expect(result.activities).toEqual([]);

        expect(result.pagination).toEqual({
            totalLogs: 0,
            currentPage: 1,
            totalPages: 0,
            limit: 20,
            hasNextPage: false,
            hasPrevPage: false,
        });
    });
});

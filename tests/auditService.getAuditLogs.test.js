jest.mock("../models/AuditLog", () => ({
    countDocuments: jest.fn(),
    find: jest.fn(),
}));


const AuditLog =
    require("../models/AuditLog");

const {
    getAuditLogs,
} = require("../services/auditService");


describe("auditService.getAuditLogs", () => {

    beforeEach(() => {

        jest.clearAllMocks();

    });


    test("should return audit logs with pagination", async () => {

        const logs = [
            {
                _id: "log1",
                action: "NOTE_CREATED",
                resource: "Note",
            },
            {
                _id: "log2",
                action: "NOTE_UPDATED",
                resource: "Note",
            },
        ];


        AuditLog.countDocuments
            .mockResolvedValue(25);


        const lean =
            jest.fn()
                .mockResolvedValue(logs);


        const limit =
            jest.fn()
                .mockReturnValue({
                    lean,
                });


        const skip =
            jest.fn()
                .mockReturnValue({
                    limit,
                });


        const sort =
            jest.fn()
                .mockReturnValue({
                    skip,
                });


        const populate =
            jest.fn()
                .mockReturnValue({
                    sort,
                });


        AuditLog.find
            .mockReturnValue({
                populate,
            });


        const result =
            await getAuditLogs({
                page: 2,
                limit: 10,
            });


        expect(
            AuditLog.countDocuments
        ).toHaveBeenCalledWith({});


        expect(
            AuditLog.find
        ).toHaveBeenCalledWith({});


        expect(
            result
        ).toEqual({

            logs,

            pagination: {

                totalLogs: 25,

                currentPage: 2,

                totalPages: 3,

                limit: 10,

                hasNextPage: true,

                hasPrevPage: true,

            },

        });

    });


    test("should filter audit logs by action", async () => {

        AuditLog.countDocuments
            .mockResolvedValue(1);


        const lean =
            jest.fn()
                .mockResolvedValue([]);


        const limit =
            jest.fn()
                .mockReturnValue({
                    lean,
                });


        const skip =
            jest.fn()
                .mockReturnValue({
                    limit,
                });


        const sort =
            jest.fn()
                .mockReturnValue({
                    skip,
                });


        const populate =
            jest.fn()
                .mockReturnValue({
                    sort,
                });


        AuditLog.find
            .mockReturnValue({
                populate,
            });


        await getAuditLogs({

            page: 1,

            limit: 20,

            action: "NOTE_CREATED",

        });


        expect(
            AuditLog.countDocuments
        ).toHaveBeenCalledWith({

            action: "NOTE_CREATED",

        });


        expect(
            AuditLog.find
        ).toHaveBeenCalledWith({

            action: "NOTE_CREATED",

        });

    });


    test("should filter audit logs by resource", async () => {

        AuditLog.countDocuments
            .mockResolvedValue(2);


        const lean =
            jest.fn()
                .mockResolvedValue([]);


        const limit =
            jest.fn()
                .mockReturnValue({
                    lean,
                });


        const skip =
            jest.fn()
                .mockReturnValue({
                    limit,
                });


        const sort =
            jest.fn()
                .mockReturnValue({
                    skip,
                });


        const populate =
            jest.fn()
                .mockReturnValue({
                    sort,
                });


        AuditLog.find
            .mockReturnValue({
                populate,
            });


        await getAuditLogs({

            page: 1,

            limit: 20,

            resource: "User",

        });


        expect(
            AuditLog.find
        ).toHaveBeenCalledWith({

            resource: "User",

        });

    });


    test("should filter audit logs by userId", async () => {

        AuditLog.countDocuments
            .mockResolvedValue(1);


        const lean =
            jest.fn()
                .mockResolvedValue([]);


        const limit =
            jest.fn()
                .mockReturnValue({
                    lean,
                });


        const skip =
            jest.fn()
                .mockReturnValue({
                    limit,
                });


        const sort =
            jest.fn()
                .mockReturnValue({
                    skip,
                });


        const populate =
            jest.fn()
                .mockReturnValue({
                    sort,
                });


        const populateChain = {
            sort,
        };


        AuditLog.find
            .mockReturnValue({
                populate: jest.fn()
                    .mockReturnValue(populateChain),
            });


        await getAuditLogs({

            page: 1,

            limit: 20,

            userId: "user123",

        });


        expect(
            AuditLog.find
        ).toHaveBeenCalledWith({

            user: "user123",

        });

    });


    test("should apply maximum limit of 100", async () => {

        AuditLog.countDocuments
            .mockResolvedValue(0);


        const lean =
            jest.fn()
                .mockResolvedValue([]);


        const limit =
            jest.fn()
                .mockReturnValue({
                    lean,
                });


        const skip =
            jest.fn()
                .mockReturnValue({
                    limit,
                });


        const sort =
            jest.fn()
                .mockReturnValue({
                    skip,
                });


        AuditLog.find
            .mockReturnValue({

                populate: jest.fn()
                    .mockReturnValue({

                        sort: jest.fn()
                            .mockReturnValue({

                                skip: jest.fn()
                                    .mockReturnValue({

                                        limit,

                                    }),

                            }),

                    }),

            });


        await getAuditLogs({

            page: 1,

            limit: 500,

        });


        expect(limit)
            .toHaveBeenCalledWith(100);

    });

});
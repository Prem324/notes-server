jest.mock("../models/AuditLog", () => ({
    create: jest.fn(),
}));

const AuditLog = require("../models/AuditLog");

const {
    log,
} = require("../services/auditService");


describe("auditService", () => {

    beforeEach(() => {

        jest.clearAllMocks();

    });


    test("should create an audit log", async () => {

        const auditData = {

            userId: "user123",

            action: "NOTE_CREATED",

            resource: "Note",

            resourceId: "note123",

            metadata: {
                title: "Test Note",
            },

            ipAddress: "127.0.0.1",

            userAgent: "Jest Test",

        };


        const createdLog = {

            _id: "audit123",

            user: "user123",

            action: "NOTE_CREATED",

            resource: "Note",

            resourceId: "note123",

            metadata: {
                title: "Test Note",
            },

            ipAddress: "127.0.0.1",

            userAgent: "Jest Test",

        };


        AuditLog.create.mockResolvedValue(
            createdLog
        );


        const result =
            await log(auditData);


        expect(result)
            .toEqual(createdLog);


        expect(
            AuditLog.create
        ).toHaveBeenCalledTimes(1);


        expect(
            AuditLog.create
        ).toHaveBeenCalledWith({

            user: "user123",

            action: "NOTE_CREATED",

            resource: "Note",

            resourceId: "note123",

            metadata: {
                title: "Test Note",
            },

            ipAddress: "127.0.0.1",

            userAgent: "Jest Test",

        });

    });


    test("should use default values when optional fields are omitted", async () => {

        AuditLog.create.mockResolvedValue({
            _id: "audit123",
        });


        await log({

            userId: "user123",

            action: "USER_LOGIN",

            resource: "User",

        });


        expect(
            AuditLog.create
        ).toHaveBeenCalledWith({

            user: "user123",

            action: "USER_LOGIN",

            resource: "User",

            resourceId: null,

            metadata: {},

            ipAddress: null,

            userAgent: null,

        });

    });

});
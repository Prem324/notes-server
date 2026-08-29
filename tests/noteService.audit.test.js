jest.mock("../models/Note", () => ({
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findByIdAndUpdate: jest.fn(),
}));

jest.mock("../services/auditService", () => ({
    log: jest.fn(),
}));

const Note = require("../models/Note");
const auditService = require("../services/auditService");

const {
    createNote,
} = require("../services/noteService");


describe("noteService audit logging", () => {

    beforeEach(() => {

        jest.clearAllMocks();

    });


    test("should create audit log when note is created", async () => {

        const note = {
            _id: "note123",
            title: "Test Note",
            content: "Test Content",
            user: "user123",
        };


        Note.create.mockResolvedValue(
            note
        );

        auditService.log.mockResolvedValue(
            {}
        );


        const result =
            await createNote(
                {
                    title: "Test Note",
                    content: "Test Content",
                },
                "user123"
            );


        expect(result)
            .toEqual(note);


        expect(
            Note.create
        ).toHaveBeenCalledWith({
            title: "Test Note",
            content: "Test Content",
            user: "user123",
        });


        expect(auditService.log).toHaveBeenCalledWith({

    userId: "user123",

    action: "NOTE_CREATED",

    resource: "Note",

    resourceId: "note123",

    metadata: {
        title: "Test Note",
    },

    ipAddress: null,
    
    userAgent: null,

});

    });

});
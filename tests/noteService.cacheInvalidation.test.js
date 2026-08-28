jest.mock("../services/redisService", () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delByPattern: jest.fn(),
}));

jest.mock("../models/Note", () => ({
    countDocuments: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
}));

jest.mock("../services/mediaService", () => ({
    deleteFile: jest.fn(),
}));

jest.mock("../utils/cacheKeys", () => ({
    notesListKey: jest.fn(
        (userId, role, page, limit, search) =>
            `notes:${userId}:${role}:${page}:${limit}:${search}`
    ),

    notesUserPattern: jest.fn(
        (userId) =>
            `notes:${userId}:*`
    ),
}));


const Note =
    require("../models/Note");

const redisService =
    require("../services/redisService");

const mediaService =
    require("../services/mediaService");

const {
    getAllNotes,
    createNote,
    updateNote,
    deleteNote,
    uploadAttachment,
    deleteAttachment,
} = require("../services/noteService");

const {
    notesUserPattern,
} = require("../utils/cacheKeys");


describe(
    "noteService Redis cache invalidation",
    () => {

        beforeEach(() => {

            jest.clearAllMocks();

            redisService.delByPattern
                .mockResolvedValue(1);

            redisService.del
                .mockResolvedValue(1);

        });


        // =====================================================
        // CREATE NOTE
        // =====================================================

        test(
            "createNote should invalidate user's notes cache",
            async () => {

                const createdNote = {
                    _id: "note123",
                    title: "New Note",
                    content: "Testing Redis",
                    user: "user123",
                };


                Note.create.mockResolvedValue(
                    createdNote
                );


                const result =
                    await createNote(
                        {
                            title: "New Note",
                            content: "Testing Redis",
                        },
                        "user123"
                    );


                expect(result)
                    .toEqual(createdNote);


                expect(
                    Note.create
                ).toHaveBeenCalledWith({
                    title: "New Note",
                    content: "Testing Redis",
                    user: "user123",
                });


                expect(
                    redisService.delByPattern
                ).toHaveBeenCalledWith(
                    notesUserPattern(
                        "user123"
                    )
                );

            }
        );


        // =====================================================
        // UPDATE NOTE
        // =====================================================

        test(
            "updateNote should invalidate user's notes cache",
            async () => {

                const note = {
                    _id: "note123",
                    user: {
                        toString: () =>
                            "user123",
                    },
                    title: "Old Title",
                    content: "Old Content",
                    completed: false,

                    save: jest.fn(),
                };


                note.save.mockResolvedValue(
                    note
                );


                Note.findById.mockResolvedValue(
                    note
                );


                const result =
                    await updateNote(
                        "note123",
                        {
                            title: "Updated Title",
                        },
                        "user123",
                        "user"
                    );


                expect(result)
                    .toEqual(note);


                expect(
                    note.title
                ).toBe("Updated Title");


                expect(
                    note.save
                ).toHaveBeenCalled();


                expect(
                    redisService.delByPattern
                ).toHaveBeenCalledWith(
                    notesUserPattern(
                        "user123"
                    )
                );

            }
        );


        // =====================================================
        // DELETE NOTE
        // =====================================================

        test(
            "deleteNote should invalidate user's notes cache",
            async () => {

                const note = {
                    _id: "note123",

                    user: {
                        toString: () =>
                            "user123",
                    },

                    attachments: [],
                };


                Note.findById.mockResolvedValue(
                    note
                );


                Note.findByIdAndDelete
                    .mockResolvedValue(
                        note
                    );


                const result =
                    await deleteNote(
                        "note123",
                        "user123",
                        "user"
                    );


                expect(result)
                    .toEqual({
                        message:
                            "Note deleted successfully",
                    });


                expect(
                    Note.findByIdAndDelete
                ).toHaveBeenCalledWith(
                    "note123"
                );


                expect(
                    redisService.delByPattern
                ).toHaveBeenCalledWith(
                    notesUserPattern(
                        "user123"
                    )
                );

            }
        );


        // =====================================================
        // UPLOAD ATTACHMENT
        // =====================================================

        test(
            "uploadAttachment should invalidate user's notes cache",
            async () => {

                const note = {
                    _id: "note123",

                    user: {
                        toString: () =>
                            "user123",
                    },
                };


                const updatedNote = {
                    _id: "note123",
                    attachments: [
                        {
                            publicId:
                                "cloudinary/test",
                        },
                    ],
                };


                Note.findById.mockResolvedValue(
                    note
                );


                Note.findByIdAndUpdate
                    .mockResolvedValue(
                        updatedNote
                    );


                const attachments = [
                    {
                        url:
                            "https://example.com/image.webp",

                        publicId:
                            "cloudinary/test",

                        fileName:
                            "image.webp",

                        fileType:
                            "image/webp",

                        size:
                            1000,
                    },
                ];


                const result =
                    await uploadAttachment(
                        "note123",
                        "user123",
                        attachments,
                        "user"
                    );


                expect(result)
                    .toEqual(updatedNote);


                expect(
                    Note.findByIdAndUpdate
                ).toHaveBeenCalled();


                expect(
                    redisService.delByPattern
                ).toHaveBeenCalledWith(
                    notesUserPattern(
                        "user123"
                    )
                );

            }
        );


        // =====================================================
        // DELETE ATTACHMENT
        // =====================================================

        test(
            "deleteAttachment should invalidate user's notes cache",
            async () => {

                const attachment = {
                    _id: {
                        toString: () =>
                            "attachment123",
                    },

                    publicId:
                        "cloudinary/test",
                };


                const note = {
                    _id: "note123",

                    user: {
                        toString: () =>
                            "user123",
                    },

                    attachments: [
                        attachment,
                    ],

                    save: jest.fn(),
                };


                note.attachments.pull =
                    jest.fn();


                Note.findById.mockResolvedValue(
                    note
                );


                mediaService.deleteFile
                    .mockResolvedValue(
                        {}
                    );


                note.save.mockResolvedValue(
                    note
                );


                const result =
                    await deleteAttachment(
                        "note123",
                        "attachment123",
                        "user123",
                        "user"
                    );


                expect(result)
                    .toEqual(note);


                expect(
                    mediaService.deleteFile
                ).toHaveBeenCalledWith(
                    "cloudinary/test"
                );


                expect(
                    note.attachments.pull
                ).toHaveBeenCalledWith(
                    "attachment123"
                );


                expect(
                    note.save
                ).toHaveBeenCalled();


                expect(
                    redisService.delByPattern
                ).toHaveBeenCalledWith(
                    notesUserPattern(
                        "user123"
                    )
                );

            }
        );


        // =====================================================
        // GET ALL NOTES
        // =====================================================

        test(
            "getAllNotes should NOT invalidate cache on cache HIT",
            async () => {

                const cachedResult = {

                    notes: [
                        {
                            _id: "note123",
                            title: "Cached Note",
                        },
                    ],

                    pagination: {
                        totalNotes: 1,
                        currentPage: 1,
                        totalPages: 1,
                        limit: 10,
                        hasNextPage: false,
                        hasPrevPage: false,
                    },

                };


                redisService.get
                    .mockResolvedValue(
                        cachedResult
                    );


                const result =
                    await getAllNotes(
                        "user123",
                        "user",
                        1,
                        10,
                        ""
                    );


                expect(result)
                    .toEqual(cachedResult);


                expect(
                    redisService.delByPattern
                ).not.toHaveBeenCalled();


                expect(
                    redisService.del
                ).not.toHaveBeenCalled();

            }
        );

    }
);
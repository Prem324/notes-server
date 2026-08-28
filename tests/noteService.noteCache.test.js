jest.mock("../services/redisService", () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delByPattern: jest.fn(),
}));


jest.mock("../models/Note", () => ({
    findById: jest.fn(),
}));


const redisService =
    require("../services/redisService");

const Note =
    require("../models/Note");

const {
    getNoteById,
} = require("../services/noteService");


describe(
    "noteService individual note Redis cache",
    () => {

        beforeEach(() => {

            jest.clearAllMocks();

        });


        // ====================================================
        // REDIS HIT
        // ====================================================

        test(
            "should return cached note on Redis HIT",
            async () => {

                const cachedNote = {
                    _id: "note123",
                    title: "Cached Note",
                    content: "Cached content",
                    user: "user123",
                };


                redisService.get.mockResolvedValue(
                    cachedNote
                );


                const result =
                    await getNoteById(
                        "note123",
                        "user123",
                        "user"
                    );


                expect(result)
                    .toEqual(cachedNote);


                expect(
                    redisService.get
                ).toHaveBeenCalledTimes(1);


                expect(
                    redisService.get
                ).toHaveBeenCalledWith(
                    "note:note123:user123:user"
                );


                // MongoDB should NOT be queried.

                expect(
                    Note.findById
                ).not.toHaveBeenCalled();


                // Cache should NOT be rewritten.

                expect(
                    redisService.set
                ).not.toHaveBeenCalled();

            }
        );


        // ====================================================
        // REDIS MISS
        // ====================================================

        test(
            "should query MongoDB on Redis MISS and cache the note",
            async () => {

                const note = {
                    _id: "note123",
                    title: "Mongo Note",
                    content: "Mongo content",

                    user: {
                        toString: () =>
                            "user123",
                    },
                };


                redisService.get.mockResolvedValue(
                    null
                );


                Note.findById.mockResolvedValue(
                    note
                );


                const result =
                    await getNoteById(
                        "note123",
                        "user123",
                        "user"
                    );


                expect(result)
                    .toEqual(note);


                expect(
                    redisService.get
                ).toHaveBeenCalledWith(
                    "note:note123:user123:user"
                );


                expect(
                    Note.findById
                ).toHaveBeenCalledWith(
                    "note123"
                );


                expect(
                    redisService.set
                ).toHaveBeenCalledWith(
                    "note:note123:user123:user",
                    note,
                    60
                );

            }
        );


        // ====================================================
        // NOT FOUND
        // ====================================================

        test(
            "should throw 404 when note does not exist",
            async () => {

                redisService.get.mockResolvedValue(
                    null
                );


                Note.findById.mockResolvedValue(
                    null
                );


                await expect(
                    getNoteById(
                        "note123",
                        "user123",
                        "user"
                    )
                ).rejects.toMatchObject({
                    statusCode: 404,
                    message: "Note not found",
                });


                expect(
                    redisService.set
                ).not.toHaveBeenCalled();

            }
        );


        // ====================================================
        // UNAUTHORIZED USER
        // ====================================================

        test(
            "should reject unauthorized user",
            async () => {

                const note = {
                    _id: "note123",
                    title: "Private Note",

                    user: {
                        toString: () =>
                            "owner123",
                    },
                };


                redisService.get.mockResolvedValue(
                    null
                );


                Note.findById.mockResolvedValue(
                    note
                );


                await expect(
                    getNoteById(
                        "note123",
                        "user123",
                        "user"
                    )
                ).rejects.toMatchObject({
                    statusCode: 403,
                    message:
                        "Not authorized to access this note",
                });


                // Unauthorized note must NOT be cached.

                expect(
                    redisService.set
                ).not.toHaveBeenCalled();

            }
        );


        // ====================================================
        // ADMIN ACCESS
        // ====================================================

        test(
            "should allow admin to access another user's note",
            async () => {

                const note = {
                    _id: "note123",
                    title: "User Note",

                    user: {
                        toString: () =>
                            "owner123",
                    },
                };


                redisService.get.mockResolvedValue(
                    null
                );


                Note.findById.mockResolvedValue(
                    note
                );


                const result =
                    await getNoteById(
                        "note123",
                        "admin123",
                        "admin"
                    );


                expect(result)
                    .toEqual(note);


                expect(
                    redisService.set
                ).toHaveBeenCalledWith(
                    "note:note123:admin123:admin",
                    note,
                    60
                );

            }
        );

    }
);
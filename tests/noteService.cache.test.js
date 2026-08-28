jest.mock("../services/redisService", () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delByPattern: jest.fn(),
}));


jest.mock("../models/Note", () => ({
    countDocuments: jest.fn(),
    find: jest.fn(),
}));


const redisService =
    require("../services/redisService");

const Note =
    require("../models/Note");

const {
    getAllNotes,
} = require("../services/noteService");


describe("noteService Redis cache", () => {

    beforeEach(() => {

        jest.clearAllMocks();

    });


    // ========================================================
    // Redis HIT
    // ========================================================

    test(
        "should return cached notes on Redis HIT",
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


            redisService.get.mockResolvedValue(
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
                redisService.get
            ).toHaveBeenCalledTimes(1);


            // MongoDB should NOT be queried.

            expect(
                Note.countDocuments
            ).not.toHaveBeenCalled();


            expect(
                Note.find
            ).not.toHaveBeenCalled();


            // Cache should NOT be rewritten.

            expect(
                redisService.set
            ).not.toHaveBeenCalled();

        }
    );


    // ========================================================
    // Redis MISS
    // ========================================================

    test(
        "should query MongoDB and cache result on Redis MISS",
        async () => {

            redisService.get
                .mockResolvedValue(null);


            const mockNotes = [

                {
                    _id: "note123",
                    title: "MongoDB Note",
                },

            ];


            Note.countDocuments
                .mockResolvedValue(1);


            Note.find.mockReturnValue({

                populate:
                    jest.fn()
                    .mockReturnThis(),

                skip:
                    jest.fn()
                    .mockReturnThis(),

                limit:
                    jest.fn()
                    .mockReturnThis(),

                sort:
                    jest.fn()
                    .mockReturnThis(),

                lean:
                    jest.fn()
                    .mockResolvedValue(
                        mockNotes
                    ),

            });


            const result =
                await getAllNotes(
                    "user123",
                    "user",
                    1,
                    10,
                    ""
                );


            // ================================================
            // Result
            // ================================================

            expect(result).toEqual({

                notes: mockNotes,

                pagination: {

                    totalNotes: 1,
                    currentPage: 1,
                    totalPages: 1,
                    limit: 10,
                    hasNextPage: false,
                    hasPrevPage: false,

                },

            });


            // ================================================
            // Redis GET
            // ================================================

            expect(
                redisService.get
            ).toHaveBeenCalledTimes(1);


            // ================================================
            // MongoDB
            // ================================================

            expect(
                Note.countDocuments
            ).toHaveBeenCalledTimes(1);


            expect(
                Note.find
            ).toHaveBeenCalledTimes(1);


            // ================================================
            // Redis SET
            // ================================================

            expect(
                redisService.set
            ).toHaveBeenCalledWith(

                expect.any(String),

                result,

                60

            );

        }
    );


    // ========================================================
    // Cache key verification
    // ========================================================

    test(
        "should generate cache key using user, role, page, limit and search",
        async () => {

            redisService.get
                .mockResolvedValue(null);


            Note.countDocuments
                .mockResolvedValue(0);


            Note.find.mockReturnValue({

                populate:
                    jest.fn()
                    .mockReturnThis(),

                skip:
                    jest.fn()
                    .mockReturnThis(),

                limit:
                    jest.fn()
                    .mockReturnThis(),

                sort:
                    jest.fn()
                    .mockReturnThis(),

                lean:
                    jest.fn()
                    .mockResolvedValue([]),

            });


            await getAllNotes(
                "user123",
                "user",
                2,
                20,
                "JavaScript"
            );


            expect(
                redisService.get
            ).toHaveBeenCalledWith(
                "notes:user123:user:page=2:limit=20:search=javascript"
            );


            expect(
                redisService.set
            ).toHaveBeenCalledWith(
                "notes:user123:user:page=2:limit=20:search=javascript",
                expect.any(Object),
                60
            );

        }
    );


    // ========================================================
    // Different users must have different cache keys
    // ========================================================

    test(
        "should use different cache keys for different users",
        async () => {

            redisService.get
                .mockResolvedValue(null);


            Note.countDocuments
                .mockResolvedValue(0);


            Note.find.mockReturnValue({

                populate:
                    jest.fn()
                    .mockReturnThis(),

                skip:
                    jest.fn()
                    .mockReturnThis(),

                limit:
                    jest.fn()
                    .mockReturnThis(),

                sort:
                    jest.fn()
                    .mockReturnThis(),

                lean:
                    jest.fn()
                    .mockResolvedValue([]),

            });


            await getAllNotes(
                "user123",
                "user",
                1,
                10,
                ""
            );


            await getAllNotes(
                "user456",
                "user",
                1,
                10,
                ""
            );


            expect(
                redisService.get
            ).toHaveBeenNthCalledWith(
                1,
                "notes:user123:user:page=1:limit=10:search="
            );


            expect(
                redisService.get
            ).toHaveBeenNthCalledWith(
                2,
                "notes:user456:user:page=1:limit=10:search="
            );

        }
    );


    // ========================================================
    // Different roles must have different cache keys
    // ========================================================

    test(
        "should use different cache keys for different roles",
        async () => {

            redisService.get
                .mockResolvedValue(null);


            Note.countDocuments
                .mockResolvedValue(0);


            Note.find.mockReturnValue({

                populate:
                    jest.fn()
                    .mockReturnThis(),

                skip:
                    jest.fn()
                    .mockReturnThis(),

                limit:
                    jest.fn()
                    .mockReturnThis(),

                sort:
                    jest.fn()
                    .mockReturnThis(),

                lean:
                    jest.fn()
                    .mockResolvedValue([]),

            });


            await getAllNotes(
                "user123",
                "user",
                1,
                10,
                ""
            );


            await getAllNotes(
                "user123",
                "admin",
                1,
                10,
                ""
            );


            expect(
                redisService.get
            ).toHaveBeenNthCalledWith(
                1,
                "notes:user123:user:page=1:limit=10:search="
            );


            expect(
                redisService.get
            ).toHaveBeenNthCalledWith(
                2,
                "notes:user123:admin:page=1:limit=10:search="
            );

        }
    );

});
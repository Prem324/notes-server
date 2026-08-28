jest.mock("../config/redis", () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
}));


const redisConnection =
    require("../config/redis");

const redisService =
    require("../services/redisService");


describe("Redis failure handling", () => {

    beforeEach(() => {

        jest.clearAllMocks();

    });


    test("GET should return null when Redis fails", async () => {

        redisConnection.get.mockRejectedValue(
            new Error("Redis unavailable")
        );


        const result =
            await redisService.get(
                "notes:test"
            );


        expect(result)
            .toBeNull();

    });


    test("SET should not throw when Redis fails", async () => {

        redisConnection.set.mockRejectedValue(
            new Error("Redis unavailable")
        );


        await expect(
            redisService.set(
                "notes:test",
                {
                    notes: [],
                },
                60
            )
        ).resolves.not.toThrow();

    });


    test("DEL should not throw when Redis fails", async () => {

        redisConnection.del.mockRejectedValue(
            new Error("Redis unavailable")
        );


        await expect(
            redisService.del(
                "notes:test"
            )
        ).resolves.not.toThrow();

    });


    test("DEL BY PATTERN should not throw when Redis fails", async () => {

        redisConnection.keys.mockRejectedValue(
            new Error("Redis unavailable")
        );


        await expect(
            redisService.delByPattern(
                "notes:user123:*"
            )
        ).resolves.not.toThrow();

    });

});
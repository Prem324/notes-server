const redisService = require("../services/redisService");
const redisConnection = require("../config/redis");


describe("redisService", () => {

    const testKey =
        `test:redis:${Date.now()}`;


    afterAll(async () => {

        await redisService.del(testKey);

        await redisConnection.quit();

    });


    test("should set and get a value from Redis", async () => {

        const data = {
            name: "Prem",
            role: "admin",
        };


        await redisService.set(
            testKey,
            data,
            60
        );


        const result =
            await redisService.get(testKey);


        expect(result).toEqual(data);

    });


    test("should return null for missing key", async () => {

        const result =
            await redisService.get(
                `${testKey}:missing`
            );


        expect(result).toBeNull();

    });


    test("should delete a cached value", async () => {

        const data = {
            message: "cached data",
        };


        await redisService.set(
            testKey,
            data,
            60
        );


        await redisService.del(testKey);


        const result =
            await redisService.get(testKey);


        expect(result).toBeNull();

    });

});
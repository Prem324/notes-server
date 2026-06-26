const {
    setCache,
    getCache,
    deleteCache,
    deleteCacheByPrefix,
    clearCache,
} = require("../utils/cache");

describe("cache utility", () => {
    beforeEach(() => {
        clearCache();
    });

    test("should store and get cached value", () => {
        setCache("test:key", { name: "Prem" }, 60);

        const result = getCache("test:key");

        expect(result).toEqual({ name: "Prem" });
    });

    test("should return null for missing key", () => {
        const result = getCache("missing:key");

        expect(result).toBeNull();
    });

    test("should delete cached value", () => {
        setCache("test:key", "value", 60);

        deleteCache("test:key");

        expect(getCache("test:key")).toBeNull();
    });

   

    test("should expire cached value after ttl", () => {
        jest.useFakeTimers();

        setCache("test:key", "value", 1);

        jest.advanceTimersByTime(1001);

        expect(getCache("test:key")).toBeNull();

        jest.useRealTimers();
    });
});
const {
    notesListKey,
    notesUserPattern,
} = require("../utils/cacheKeys");


describe("cacheKeys", () => {

    test("should generate a unique notes list cache key", () => {

        const key = notesListKey(
            "user123",
            "user",
            1,
            10,
            "JavaScript"
        );

        expect(key).toBe(
            "notes:user123:user:page=1:limit=10:search=javascript"
        );

    });


    test("should generate different keys for different pages", () => {

        const pageOne =
            notesListKey(
                "user123",
                "user",
                1,
                10,
                ""
            );

        const pageTwo =
            notesListKey(
                "user123",
                "user",
                2,
                10,
                ""
            );

        expect(pageOne).not.toBe(pageTwo);

    });


    test("should generate different keys for different users", () => {

        const userOne =
            notesListKey(
                "user123",
                "user",
                1,
                10,
                ""
            );

        const userTwo =
            notesListKey(
                "user456",
                "user",
                1,
                10,
                ""
            );

        expect(userOne).not.toBe(userTwo);

    });


    test("should generate different keys for different roles", () => {

        const userKey =
            notesListKey(
                "user123",
                "user",
                1,
                10,
                ""
            );

        const adminKey =
            notesListKey(
                "user123",
                "admin",
                1,
                10,
                ""
            );

        expect(userKey).not.toBe(adminKey);

    });


    test("should normalize search text", () => {

        const key =
            notesListKey(
                "user123",
                "user",
                1,
                10,
                "  JavaScript  "
            );

        expect(key).toContain(
            "search=javascript"
        );

    });


    test("should generate user cache invalidation pattern", () => {

        const pattern =
            notesUserPattern("user123");

        expect(pattern).toBe(
            "notes:user123:*"
        );

    });

});
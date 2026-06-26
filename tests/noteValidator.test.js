const noteSchema =
require("../validators/noteValidator");

describe("note validator", () => {
    test("should pass with valid note data", () => {
        // =====================
        // ARRANGE
        // =====================

        const validData = {
            title: "My Note",
            content: "This is note content",
            completed: false,
        };


        // =====================
        // ACT
        // =====================

        const result = noteSchema.validate(
            validData
        );


        // =====================
        // ASSERT
        // =====================

        expect(result.error).toBeUndefined();

        expect(result.value).toEqual(
            validData
        );
    });


    test("should pass when completed is missing", () => {
        const validData = {
            title: "My Note",
            content: "This is note content",
        };

        const result = noteSchema.validate(
            validData,{convert:false},
        );

        expect(result.error).toBeUndefined();

        expect(result.value).toEqual(
            validData
        );
    });


    test("should fail when title is missing", () => {
        const invalidData = {
            content: "This is note content",
        };

        const result = noteSchema.validate(
            invalidData,{convert:false}
        );

        expect(result.error).toBeDefined();

        expect(result.error.message).toContain(
            "title"
        );
    });


    test("should fail when title is less than 3 characters", () => {
        const invalidData = {
            title: "Hi",
            content: "This is note content",
        };

        const result = noteSchema.validate(
            invalidData,{convert:false},
        );

        expect(result.error).toBeDefined();

        expect(result.error.message).toContain(
            "title"
        );
    });


    test("should fail when title is more than 100 characters", () => {
        const invalidData = {
            title: "a".repeat(101),
            content: "This is note content",
        };

        const result = noteSchema.validate(
            invalidData,{convert:false}
        );

        expect(result.error).toBeDefined();

        expect(result.error.message).toContain(
            "title"
        );
    });


    test("should fail when content is missing", () => {
        const invalidData = {
            title: "My Note",
        };

        const result = noteSchema.validate(
            invalidData
        );

        expect(result.error).toBeDefined();

        expect(result.error.message).toContain(
            "content"
        );
    });


    test("should fail when completed is not boolean", () => {
        const invalidData = {
            title: "My Note",
            content: "This is note content",
            completed: "yes",
        };

        const result = noteSchema.validate(
            invalidData,{convert:false},
        );

        expect(result.error).toBeDefined();

        expect(result.error.message).toContain(
            "completed"
        );
    });
});
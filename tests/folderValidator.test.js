const {
    createFolderSchema,
} = require("../validators/folderValidator");

describe("Folder Validator", () => {
    test("should accept a valid folder name", () => {
        const { error } = createFolderSchema.validate({
            name: "Work",
        });

        expect(error).toBeUndefined();
    });

    test("should reject missing name", () => {
        const { error } = createFolderSchema.validate({});

        expect(error).toBeDefined();
    });

    test("should reject empty name", () => {
        const { error } = createFolderSchema.validate({
            name: "",
        });

        expect(error).toBeDefined();
    });

    test("should reject folder name longer than 50 characters", () => {
        const { error } = createFolderSchema.validate({
            name: "A".repeat(51),
        });

        expect(error).toBeDefined();
    });

    test("should trim surrounding whitespace", () => {
        const { value, error } = createFolderSchema.validate({
            name: "  Work  ",
        });

        expect(error).toBeUndefined();
        expect(value.name).toBe("Work");
    });
});
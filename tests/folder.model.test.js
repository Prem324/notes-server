const mongoose = require("mongoose");

const Folder = require("../models/Folder");

describe("Folder Model", () => {
    test("should create a valid folder", async () => {
        const userId = new mongoose.Types.ObjectId();

        const folder = new Folder({
            name: "Work",
            user: userId,
        });

        const error = folder.validateSync();

        expect(error).toBeUndefined();
        expect(folder.name).toBe("Work");
        expect(folder.user.toString()).toBe(userId.toString());
    });

    test("should require name", () => {
        const userId = new mongoose.Types.ObjectId();

        const folder = new Folder({
            user: userId,
        });

        const error = folder.validateSync();

        expect(error.errors.name).toBeDefined();
    });

    test("should require user", () => {
        const folder = new Folder({
            name: "Work",
        });

        const error = folder.validateSync();

        expect(error.errors.user).toBeDefined();
    });

    test("should trim folder name", () => {
        const userId = new mongoose.Types.ObjectId();

        const folder = new Folder({
            name: "  Work  ",
            user: userId,
        });

        expect(folder.name).toBe("Work");
    });

    test("should enforce maximum folder name length", () => {
        const userId = new mongoose.Types.ObjectId();

        const folder = new Folder({
            name: "A".repeat(51),
            user: userId,
        });

        const error = folder.validateSync();

        expect(error.errors.name).toBeDefined();
    });

    test("should define unique user and name index", () => {
        const indexes = Folder.schema.indexes();

        const uniqueIndex = indexes.find(
            ([fields, options]) =>
                fields.user === 1 &&
                fields.name === 1 &&
                options?.unique === true
        );

        expect(uniqueIndex).toBeDefined();
    });
});
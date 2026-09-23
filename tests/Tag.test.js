const mongoose = require("mongoose");
const Tag = require("../models/Tag");

describe("Tag Model", () => {
    test("should create a valid tag", async () => {
        const userId = new mongoose.Types.ObjectId();

        const tag = new Tag({
            name: "javascript",
            user: userId,
        });

        const error = tag.validateSync();

        expect(error).toBeUndefined();
        expect(tag.name).toBe("javascript");
        expect(tag.user.toString()).toBe(userId.toString());
    });

    test("should require name", () => {
        const userId = new mongoose.Types.ObjectId();

        const tag = new Tag({
            user: userId,
        });

        const error = tag.validateSync();

        expect(error.errors.name).toBeDefined();
    });

    test("should require user", () => {
        const tag = new Tag({
            name: "javascript",
        });

        const error = tag.validateSync();

        expect(error.errors.user).toBeDefined();
    });

    test("should trim tag name", () => {
        const userId = new mongoose.Types.ObjectId();

        const tag = new Tag({
            name: "  javascript  ",
            user: userId,
        });

        expect(tag.name).toBe("javascript");
    });

    test("should reject tag names longer than 50 characters", () => {
        const userId = new mongoose.Types.ObjectId();

        const tag = new Tag({
            name: "a".repeat(51),
            user: userId,
        });

        const error = tag.validateSync();

        expect(error.errors.name).toBeDefined();
    });
});
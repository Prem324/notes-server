const mongoose = require("mongoose");
const NoteShare = require("../models/NoteShare");

describe("NoteShare Model", () => {
    it("should create a valid note share", async () => {
        const noteId = new mongoose.Types.ObjectId();
        const userId = new mongoose.Types.ObjectId();

        const noteShare = new NoteShare({
            note: noteId,
            user: userId,
            permission: "viewer",
        });

        const error = noteShare.validateSync();

        expect(error).toBeUndefined();
        expect(noteShare.note).toEqual(noteId);
        expect(noteShare.user).toEqual(userId);
        expect(noteShare.permission).toBe("viewer");
    });

    it("should default permission to viewer", () => {
        const noteShare = new NoteShare({
            note: new mongoose.Types.ObjectId(),
            user: new mongoose.Types.ObjectId(),
        });

        expect(noteShare.permission).toBe("viewer");
    });

    it("should reject invalid permission", () => {
        const noteShare = new NoteShare({
            note: new mongoose.Types.ObjectId(),
            user: new mongoose.Types.ObjectId(),
            permission: "admin",
        });

        const error = noteShare.validateSync();

        expect(error).toBeDefined();
        expect(error.errors.permission).toBeDefined();
    });

    it("should require note", () => {
        const noteShare = new NoteShare({
            user: new mongoose.Types.ObjectId(),
        });

        const error = noteShare.validateSync();

        expect(error).toBeDefined();
        expect(error.errors.note).toBeDefined();
    });

    it("should require user", () => {
        const noteShare = new NoteShare({
            note: new mongoose.Types.ObjectId(),
        });

        const error = noteShare.validateSync();

        expect(error).toBeDefined();
        expect(error.errors.user).toBeDefined();
    });
});
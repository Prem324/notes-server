const mongoose = require("mongoose");

const Notification = require("../models/Notification");

describe("Notification Model", () => {
    test("should create a valid notification", async () => {
        const recipientId = new mongoose.Types.ObjectId();
        const actorId = new mongoose.Types.ObjectId();
        const noteId = new mongoose.Types.ObjectId();

        const notification = new Notification({
            recipient: recipientId,
            type: "NOTE_SHARED",
            title: "Note shared with you",
            message: "A user shared a note with you.",
            actor: actorId,
            note: noteId,
            metadata: {
                permission: "viewer",
            },
        });

        const error = notification.validateSync();

        expect(error).toBeUndefined();
        expect(notification.recipient).toEqual(recipientId);
        expect(notification.type).toBe("NOTE_SHARED");
        expect(notification.title).toBe("Note shared with you");
        expect(notification.message).toBe(
            "A user shared a note with you."
        );
        expect(notification.read).toBe(false);
        expect(notification.actor).toEqual(actorId);
        expect(notification.note).toEqual(noteId);
        expect(notification.metadata).toEqual({
            permission: "viewer",
        });
    });

    test("should require recipient", () => {
        const notification = new Notification({
            type: "NOTE_SHARED",
            title: "Note shared",
            message: "A note was shared with you.",
        });

        const error = notification.validateSync();

        expect(error).toBeDefined();
        expect(error.errors.recipient).toBeDefined();
    });

    test("should require type", () => {
        const notification = new Notification({
            recipient: new mongoose.Types.ObjectId(),
            title: "Note shared",
            message: "A note was shared with you.",
        });

        const error = notification.validateSync();

        expect(error).toBeDefined();
        expect(error.errors.type).toBeDefined();
    });

    test("should require title", () => {
        const notification = new Notification({
            recipient: new mongoose.Types.ObjectId(),
            type: "NOTE_SHARED",
            message: "A note was shared with you.",
        });

        const error = notification.validateSync();

        expect(error).toBeDefined();
        expect(error.errors.title).toBeDefined();
    });

    test("should require message", () => {
        const notification = new Notification({
            recipient: new mongoose.Types.ObjectId(),
            type: "NOTE_SHARED",
            title: "Note shared",
        });

        const error = notification.validateSync();

        expect(error).toBeDefined();
        expect(error.errors.message).toBeDefined();
    });

    test("should reject unsupported notification type", () => {
        const notification = new Notification({
            recipient: new mongoose.Types.ObjectId(),
            type: "INVALID_TYPE",
            title: "Invalid",
            message: "Invalid notification",
        });

        const error = notification.validateSync();

        expect(error).toBeDefined();
        expect(error.errors.type).toBeDefined();
    });

    test("should default read to false", () => {
        const notification = new Notification({
            recipient: new mongoose.Types.ObjectId(),
            type: "COMMENT_ADDED",
            title: "New comment",
            message: "Someone commented on your note.",
        });

        expect(notification.read).toBe(false);
    });

    test("should allow notification without optional actor or note", () => {
        const notification = new Notification({
            recipient: new mongoose.Types.ObjectId(),
            type: "EXPORT_COMPLETED",
            title: "Export completed",
            message: "Your notes export is ready.",
        });

        const error = notification.validateSync();

        expect(error).toBeUndefined();
        expect(notification.actor).toBeNull();
        expect(notification.note).toBeNull();
    });

    test("should allow metadata to be omitted", () => {
        const notification = new Notification({
            recipient: new mongoose.Types.ObjectId(),
            type: "ADMIN_ACTION",
            title: "Admin action",
            message: "An administrator performed an action.",
        });

        const error = notification.validateSync();

        expect(error).toBeUndefined();
        expect(notification.metadata).toEqual({});
    });
});
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecret";
process.env.MONGO_URI = "mongodb://localhost/test";

jest.mock("../middleware/rateLimiter", () => ({
    loginLimiter: (req, res, next) => next(),
    registerLimiter: (req, res, next) => next(),
    forgotPasswordLimiter: (req, res, next) => next(),
    resetPasswordLimiter: (req, res, next) => next(),
    resendVerificationLimiter: (req, res, next) => next(),
}));

const mongoose = require("mongoose");

const Note = require("../models/Note");
const User = require("../models/User");
const NoteShare = require("../models/NoteShare");

const featureFlags = require("../config/featureFlags");
const {
    getNoteAccess,
} = require("../services/noteAccessService");

describe("noteAccessService", () => {
    let owner;
    let editor;
    let viewer;
    let other;
    let note;

    beforeAll(async () => {
        await mongoose.connect(
            process.env.MONGO_URI
        );
    });

    beforeEach(async () => {
        owner = await User.create({
            name: "Owner",
            email: `owner-${Date.now()}@test.com`,
            password: "Password123",
        });

        editor = await User.create({
            name: "Editor",
            email: `editor-${Date.now()}@test.com`,
            password: "Password123",
        });

        viewer = await User.create({
            name: "Viewer",
            email: `viewer-${Date.now()}@test.com`,
            password: "Password123",
        });

        other = await User.create({
            name: "Other",
            email: `other-${Date.now()}@test.com`,
            password: "Password123",
        });

        note = await Note.create({
            title: "Shared Note",
            content: "Test content",
            user: owner._id,
        });

        featureFlags.noteSharing = true;
    });

    afterEach(async () => {
        await NoteShare.deleteMany({});
        await Note.deleteMany({});
        await User.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    test("owner has full access", async () => {
        const access = await getNoteAccess(
            note._id,
            owner._id,
            "user"
        );

        expect(access.accessRole).toBe("owner");
        expect(access.canRead).toBe(true);
        expect(access.canEdit).toBe(true);
        expect(access.canDelete).toBe(true);
        expect(access.canShare).toBe(true);
    });

    test("admin has full access", async () => {
        const access = await getNoteAccess(
            note._id,
            other._id,
            "admin"
        );

        expect(access.accessRole).toBe("admin");
        expect(access.canRead).toBe(true);
        expect(access.canEdit).toBe(true);
        expect(access.canDelete).toBe(true);
        expect(access.canShare).toBe(true);
    });

    test("editor can read and edit but cannot delete or share", async () => {
        await NoteShare.create({
            note: note._id,
            user: editor._id,
            permission: "editor",
        });

        const access = await getNoteAccess(
            note._id,
            editor._id,
            "user"
        );

        expect(access.accessRole).toBe("editor");
        expect(access.canRead).toBe(true);
        expect(access.canEdit).toBe(true);
        expect(access.canDelete).toBe(false);
        expect(access.canShare).toBe(false);
    });

    test("viewer can read but cannot edit, delete, or share", async () => {
        await NoteShare.create({
            note: note._id,
            user: viewer._id,
            permission: "viewer",
        });

        const access = await getNoteAccess(
            note._id,
            viewer._id,
            "user"
        );

        expect(access.accessRole).toBe("viewer");
        expect(access.canRead).toBe(true);
        expect(access.canEdit).toBe(false);
        expect(access.canDelete).toBe(false);
        expect(access.canShare).toBe(false);
    });

    test("unrelated user is rejected", async () => {
        await expect(
            getNoteAccess(
                note._id,
                other._id,
                "user"
            )
        ).rejects.toMatchObject({
            statusCode: 403,
        });
    });

    test("collaborator loses access when note sharing is disabled", async () => {
        await NoteShare.create({
            note: note._id,
            user: viewer._id,
            permission: "viewer",
        });

        featureFlags.noteSharing = false;

        await expect(
            getNoteAccess(
                note._id,
                viewer._id,
                "user"
            )
        ).rejects.toMatchObject({
            statusCode: 403,
        });
    });
});
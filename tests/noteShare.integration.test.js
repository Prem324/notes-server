process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecret";
process.env.MONGO_URI = "mongodb://localhost/test";
process.env.FEATURE_NOTE_SHARING = "true";

jest.mock("../middleware/rateLimiter", () => ({
    loginLimiter: (req, res, next) => next(),
    registerLimiter: (req, res, next) => next(),
    forgotPasswordLimiter: (req, res, next) => next(),
    resetPasswordLimiter: (req, res, next) => next(),
    resendVerificationLimiter: (req, res, next) => next(),
}));

jest.mock("../services/emailService", () => ({
    sendPasswordResetEmail: jest
        .fn()
        .mockResolvedValue(true),

    sendVerificationEmail: jest
        .fn()
        .mockResolvedValue(true),
}));

const request = require("supertest");

const app = require("../app");

const User = require("../models/User");
const Note = require("../models/Note");
const NoteShare = require("../models/NoteShare");

const {
    connectTestDB,
    clearTestDB,
    closeTestDB,
} = require("./setupTestDB");

beforeAll(async () => {
    process.env.JWT_SECRET = "testsecret";
    process.env.FEATURE_NOTE_SHARING = "true";

    await connectTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

afterAll(async () => {
    await closeTestDB();
});

const registerAndLogin = async (
    name,
    email,
    password = "Password123"
) => {
    await request(app)
        .post("/api/v1/auth/register")
        .send({
            name,
            email,
            password,
        })
        .expect(201);

    await User.updateOne(
        { email },
        { emailVerified: true }
    );

    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email,
            password,
        })
        .expect(200);

    return response.body.data.accessToken;
};

const createNote = async (token) => {
    const response = await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Shared Note",
            content: "This note will be shared.",
            completed: false,
        })
        .expect(201);

    return response.body.data.note || response.body.data;
};

describe("Note Sharing Integration", () => {
    let ownerToken;
    let collaboratorToken;
    let owner;
    let collaborator;
    let note;

    beforeEach(async () => {
        const ownerEmail = `owner-${Date.now()}@example.com`;
        const collaboratorEmail =
            `collaborator-${Date.now()}@example.com`;

        ownerToken = await registerAndLogin(
            "Note Owner",
            ownerEmail
        );

        collaboratorToken = await registerAndLogin(
            "Collaborator",
            collaboratorEmail
        );

        owner = await User.findOne({
            email: ownerEmail,
        });

        collaborator = await User.findOne({
            email: collaboratorEmail,
        });

        note = await createNote(ownerToken);
    });

    describe("POST /api/v1/notes/:id/share", () => {
        it("should allow the owner to share a note", async () => {
            const response = await request(app)
                .post(`/api/v1/notes/${note._id}/share`)
                .set(
                    "Authorization",
                    `Bearer ${ownerToken}`
                )
                .send({
                    email: collaborator.email,
                    permission: "editor",
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(
                response.body.data.user.toString()
            ).toBe(collaborator._id.toString());

            expect(
                response.body.data.permission
            ).toBe("editor");

            const share = await NoteShare.findOne({
                note: note._id,
                user: collaborator._id,
            });

            expect(share).not.toBeNull();
            expect(share.permission).toBe("editor");
        });

        it("should reject sharing by a non-owner", async () => {
            await request(app)
                .post(`/api/v1/notes/${note._id}/share`)
                .set(
                    "Authorization",
                    `Bearer ${collaboratorToken}`
                )
                .send({
                    email: owner.email,
                    permission: "viewer",
                })
                .expect(404);
        });

        it("should reject nonexistent user", async () => {
            await request(app)
                .post(`/api/v1/notes/${note._id}/share`)
                .set(
                    "Authorization",
                    `Bearer ${ownerToken}`
                )
                .send({
                    email: "doesnotexist@example.com",
                    permission: "viewer",
                })
                .expect(404);
        });

        it("should reject adding the owner as collaborator", async () => {
            await request(app)
                .post(`/api/v1/notes/${note._id}/share`)
                .set(
                    "Authorization",
                    `Bearer ${ownerToken}`
                )
                .send({
                    email: owner.email,
                    permission: "viewer",
                })
                .expect(400);
        });

        it("should reject duplicate collaborator", async () => {
            await request(app)
                .post(`/api/v1/notes/${note._id}/share`)
                .set(
                    "Authorization",
                    `Bearer ${ownerToken}`
                )
                .send({
                    email: collaborator.email,
                    permission: "viewer",
                })
                .expect(201);

            await request(app)
                .post(`/api/v1/notes/${note._id}/share`)
                .set(
                    "Authorization",
                    `Bearer ${ownerToken}`
                )
                .send({
                    email: collaborator.email,
                    permission: "editor",
                })
                .expect(409);
        });

        it("should reject invalid permission", async () => {
            await request(app)
                .post(`/api/v1/notes/${note._id}/share`)
                .set(
                    "Authorization",
                    `Bearer ${ownerToken}`
                )
                .send({
                    email: collaborator.email,
                    permission: "admin",
                })
                .expect(400);
        });
    });

    describe("GET /api/v1/notes/:id/collaborators", () => {
        it("should return collaborators for the owner", async () => {
            await request(app)
                .post(`/api/v1/notes/${note._id}/share`)
                .set(
                    "Authorization",
                    `Bearer ${ownerToken}`
                )
                .send({
                    email: collaborator.email,
                    permission: "viewer",
                })
                .expect(201);

            const response = await request(app)
                .get(
                    `/api/v1/notes/${note._id}/collaborators`
                )
                .set(
                    "Authorization",
                    `Bearer ${ownerToken}`
                )
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(
                response.body.data
            ).toHaveLength(1);

            expect(
                response.body.data[0].permission
            ).toBe("viewer");

            expect(
                response.body.data[0].user.email
            ).toBe(collaborator.email);
        });

        it("should reject collaborator access to management endpoint", async () => {
            await request(app)
                .post(`/api/v1/notes/${note._id}/share`)
                .set(
                    "Authorization",
                    `Bearer ${ownerToken}`
                )
                .send({
                    email: collaborator.email,
                    permission: "editor",
                })
                .expect(201);

            await request(app)
                .get(
                    `/api/v1/notes/${note._id}/collaborators`
                )
                .set(
                    "Authorization",
                    `Bearer ${collaboratorToken}`
                )
                .expect(404);
        });
    });

    describe("PUT /api/v1/notes/:id/collaborators/:userId", () => {
        beforeEach(async () => {
            await request(app)
                .post(`/api/v1/notes/${note._id}/share`)
                .set(
                    "Authorization",
                    `Bearer ${ownerToken}`
                )
                .send({
                    email: collaborator.email,
                    permission: "viewer",
                })
                .expect(201);
        });

        it("should allow owner to update permission", async () => {
            const response = await request(app)
                .put(
                    `/api/v1/notes/${note._id}/collaborators/${collaborator._id}`
                )
                .set(
                    "Authorization",
                    `Bearer ${ownerToken}`
                )
                .send({
                    permission: "editor",
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(
                response.body.data.permission
            ).toBe("editor");

            const share = await NoteShare.findOne({
                note: note._id,
                user: collaborator._id,
            });

            expect(share.permission).toBe("editor");
        });

        it("should reject permission update by non-owner", async () => {
            await request(app)
                .put(
                    `/api/v1/notes/${note._id}/collaborators/${collaborator._id}`
                )
                .set(
                    "Authorization",
                    `Bearer ${collaboratorToken}`
                )
                .send({
                    permission: "editor",
                })
                .expect(404);
        });

        it("should reject nonexistent collaborator", async () => {
            const anotherUserId =
                new (require("mongoose").Types.ObjectId)();

            await request(app)
                .put(
                    `/api/v1/notes/${note._id}/collaborators/${anotherUserId}`
                )
                .set(
                    "Authorization",
                    `Bearer ${ownerToken}`
                )
                .send({
                    permission: "editor",
                })
                .expect(404);
        });
    });

    describe("DELETE /api/v1/notes/:id/collaborators/:userId", () => {
        beforeEach(async () => {
            await request(app)
                .post(`/api/v1/notes/${note._id}/share`)
                .set(
                    "Authorization",
                    `Bearer ${ownerToken}`
                )
                .send({
                    email: collaborator.email,
                    permission: "viewer",
                })
                .expect(201);
        });

        it("should allow owner to remove collaborator", async () => {
            await request(app)
                .delete(
                    `/api/v1/notes/${note._id}/collaborators/${collaborator._id}`
                )
                .set(
                    "Authorization",
                    `Bearer ${ownerToken}`
                )
                .expect(200);

            const share = await NoteShare.findOne({
                note: note._id,
                user: collaborator._id,
            });

            expect(share).toBeNull();
        });

        it("should reject removal by non-owner", async () => {
            await request(app)
                .delete(
                    `/api/v1/notes/${note._id}/collaborators/${collaborator._id}`
                )
                .set(
                    "Authorization",
                    `Bearer ${collaboratorToken}`
                )
                .expect(404);
        });
    });

    describe("Feature flag", () => {
        it("should reject sharing when feature is disabled", async () => {
            const featureFlags = require("../config/featureFlags");

            const originalValue =
                featureFlags.noteSharing;

            featureFlags.noteSharing = false;

            try {
                await request(app)
                    .post(
                        `/api/v1/notes/${note._id}/share`
                    )
                    .set(
                        "Authorization",
                        `Bearer ${ownerToken}`
                    )
                    .send({
                        email: collaborator.email,
                        permission: "viewer",
                    })
                    .expect(503);
            } finally {
                featureFlags.noteSharing =
                    originalValue;
            }
        });
    });
});
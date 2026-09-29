process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecret";
process.env.MONGO_URI = "mongodb://localhost/test";
process.env.FEATURE_FOLDERS = "true";

jest.mock("../middleware/rateLimiter", () => {
    return {
        loginLimiter: (req, res, next) => next(),
        registerLimiter: (req, res, next) => next(),
        forgotPasswordLimiter: (req, res, next) => next(),
    };
});

jest.mock("../services/emailService", () => ({
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

const request = require("supertest");

const app = require("../app");

const Note = require("../models/Note");
const User = require("../models/User");

const {
    connectTestDB,
    clearTestDB,
    closeTestDB,
} = require("./setupTestDB");

beforeAll(async () => {
    process.env.JWT_SECRET = "testsecret";
    await connectTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

afterAll(async () => {
    await closeTestDB();
});

const registerAndLogin = async (
    name="Prem",
    email="prem@gmail.com",
    password = "Password123"
) => {
    await request(app)
        .post("/api/v1/auth/register")
        .send({
            name,
            email,
            password,
        });

    await User.updateOne({ email }, { emailVerified: true });

    const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email,
            password,
        });

    return loginResponse.body.data.accessToken;
};

describe("Note Integration Tests", () => {
    test("POST /api/v1/notes should create note for authenticated user", async () => {
        const token = await registerAndLogin();

        const response = await request(app)
            .post("/api/v1/notes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "My Note",
                content: "This is my note content",
                completed: false,
            });

        expect(response.statusCode).toBe(201);

        expect(response.body.success).toBe(true);

        expect(response.body.data).toEqual(
            expect.objectContaining({
                title: "My Note",
                content: "This is my note content",
                completed: false,
            })
        );

        const notes = await Note.find();

        expect(notes.length).toBe(1);

        expect(notes[0].title).toBe("My Note");
    });


    test("POST /api/v1/notes should reject unauthenticated request", async () => {
        const response = await request(app)
            .post("/api/v1/notes")
            .send({
                title: "My Note",
                content: "This is my note content",
            });

        expect(response.statusCode).toBe(401);

        expect(response.body).toEqual({
            success: false,
            message: "No token provided",
        });

        const notes = await Note.find();

        expect(notes.length).toBe(0);
    });


    test("GET /api/v1/notes should return authenticated user's notes", async () => {
        const token = await registerAndLogin();

        await request(app)
            .post("/api/v1/notes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "First Note",
                content: "First content",
            });

        await request(app)
            .post("/api/v1/notes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Second Note",
                content: "Second content",
            });

        const response = await request(app)
            .get("/api/v1/notes")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.data.notes.length).toBe(2);
        expect(response.body.data.pagination).toEqual({
            totalNotes: 2,
            currentPage: 1,
            totalPages: 1,
            limit: 10,
            hasNextPage: false,
            hasPrevPage: false,
        });
    });


    test("PUT /api/v1/notes/:id should update own note", async () => {
        const token = await registerAndLogin();

        const createResponse = await request(app)
            .post("/api/v1/notes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Old Title",
                content: "Old content",
            });

        const noteId = createResponse.body.data._id;

        const response = await request(app)
            .put(`/api/v1/notes/${noteId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Updated Title",
                content: "Updated content",
                completed: true,
            });

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.data.title).toBe("Updated Title");

        const updatedNote = await Note.findById(noteId);

        expect(updatedNote.title).toBe("Updated Title");
    });


    test("DELETE /api/v1/notes/:id should delete own note", async () => {
        const token = await registerAndLogin();

        const createResponse = await request(app)
            .post("/api/v1/notes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Delete Me",
                content: "This note will be deleted",
            });

        const noteId = createResponse.body.data._id;

        const response = await request(app)
            .delete(`/api/v1/notes/${noteId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message: "Note deleted successfully",
        });

        const deletedNote = await Note.findById(noteId);

        expect(deletedNote).toBeNull();
    });


    test("PUT /api/v1/notes/:id should reject updating another user's note", async () => {
    // =====================
    // ARRANGE
    // =====================

    const userAToken = await registerAndLogin(
        "Prem",
        "prem@gmail.com"
    );

    const userBToken = await registerAndLogin(
        "Rahul",
        "rahul@gmail.com"
    );

    const createResponse = await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
            title: "User A Note",
            content: "Private note content",
        });

    const noteId = createResponse.body.data._id;


    // =====================
    // ACT
    // =====================

    const response = await request(app)
        .put(`/api/v1/notes/${noteId}`)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({
            title: "Hacked Title",
            content: "Trying to update",
        });


    // =====================
    // ASSERT
    // =====================

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
        "Not authorized to update this note"
    );

    const note = await Note.findById(noteId);

    expect(note.title).toBe("User A Note");
});


test("DELETE /api/v1/notes/:id should reject deleting another user's note", async () => {
    // =====================
    // ARRANGE
    // =====================

    const userAToken = await registerAndLogin(
        "Prem",
        "prem@gmail.com"
    );

    const userBToken = await registerAndLogin(
        "Rahul",
        "rahul@gmail.com"
    );

    const createResponse = await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
            title: "User A Note",
            content: "Private note content",
        });

    const noteId = createResponse.body.data._id;


    // =====================
    // ACT
    // =====================

    const response = await request(app)
        .delete(`/api/v1/notes/${noteId}`)
        .set("Authorization", `Bearer ${userBToken}`);


    // =====================
    // ASSERT
    // =====================

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
        "Not authorized to update this note"
    );

    const note = await Note.findById(noteId);

    expect(note).not.toBeNull();

    expect(note.title).toBe("User A Note");
});

test("GET /api/v1/notes should return pagination metadata", async () => {
    const token = await registerAndLogin();

    await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "First Note",
            content: "First content",
        });

    await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Second Note",
            content: "Second content",
        });

    const response = await request(app)
        .get("/api/v1/notes?page=1&limit=1")
        .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.data.notes.length).toBe(1);

    expect(response.body.data.pagination).toEqual({
        totalNotes: 2,
        currentPage: 1,
        totalPages: 2,
        limit: 1,
        hasNextPage: true,
        hasPrevPage: false,
    });
});

test("should create a note with a valid folder", async () => {
    const token = await registerAndLogin(
        "Prem",
        "prem-folder-create@example.com"
    );

    const folderResponse = await request(app)
        .post("/api/v1/folders")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Work",
        });

    expect(folderResponse.status).toBe(201);

    const folderId = folderResponse.body.data._id;

    const response = await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Work Note",
            content: "This note belongs to Work folder",
            folder: folderId,
        });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.folder.toString()).toBe(folderId);
});

test("should reject creating a note with another user's folder", async () => {
    const user1Token = await registerAndLogin(
        "Prem",
        "prem-folder-owner@example.com"
    );

    const user2Token = await registerAndLogin(
        "User Two",
        "prem-folder-attacker@example.com"
    );

    const folderResponse = await request(app)
        .post("/api/v1/folders")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
            name: "Private",
        });

    const folderId = folderResponse.body.data._id;

    const response = await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
            title: "Unauthorized Note",
            content: "Trying to use another user's folder",
            folder: folderId,
        });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
});

test("should create a note without a folder", async () => {
    const token = await registerAndLogin(
        "Prem",
        "prem-no-folder@example.com"
    );

    const response = await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "No Folder Note",
            content: "This note does not belong to a folder",
        });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
});


test("should update a note with a valid folder", async () => {
    const token = await registerAndLogin(
        "Prem",
        "prem-folder-update@example.com"
    );

    const folder1Response = await request(app)
        .post("/api/v1/folders")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Work",
        });

    const folder2Response = await request(app)
        .post("/api/v1/folders")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Personal",
        });

    const workFolderId = folder1Response.body.data._id;
    const personalFolderId = folder2Response.body.data._id;

    const noteResponse = await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "My Note",
            content: "Original content",
            folder: workFolderId,
        });

    expect(noteResponse.status).toBe(201);

    const noteId = noteResponse.body.data._id;

    const response = await request(app)
        .put(`/api/v1/notes/${noteId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "My Note",
            content: "Original content",
            folder: personalFolderId,
        });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.folder.toString()).toBe(
        personalFolderId
    );
});

    
  

test("should reject updating a note with another user's folder", async () => {
    const ownerToken = await registerAndLogin(
        "Prem",
        "prem-note-owner@example.com"
    );

    const otherUserToken = await registerAndLogin(
        "User Two",
        "prem-other-user@example.com"
    );

    const ownerFolderResponse = await request(app)
        .post("/api/v1/folders")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
            name: "Owner Folder",
        });

    const ownerFolderId = ownerFolderResponse.body.data._id;

    const noteResponse = await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
            title: "Owner Note",
            content: "Owner content",
        });

    const noteId = noteResponse.body.data._id;

    const otherFolderResponse = await request(app)
        .post("/api/v1/folders")
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({
            name: "Other User Folder",
        });

    const otherFolderId = otherFolderResponse.body.data._id;

    const response = await request(app)
        .put(`/api/v1/notes/${noteId}`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
            folder: otherFolderId,
        });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
});

test("should populate folder when fetching notes", async () => {
    const token = await registerAndLogin(
        "Prem",
        "prem-folder-populate@example.com"
    );

    const folderResponse = await request(app)
        .post("/api/v1/folders")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Work" });

    const folderId = folderResponse.body.data._id;

    await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Work Note",
            content: "Important work",
            folder: folderId,
        });

    const response = await request(app)
        .get("/api/v1/notes")
        .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const note = response.body.data.notes[0];

    expect(note.folder).toBeDefined();
    expect(note.folder._id.toString()).toBe(folderId);
    expect(note.folder.name).toBe("Work");
});

test("should populate folder when fetching a single note", async () => {
    const token = await registerAndLogin(
        "Prem",
        "prem-folder-single@example.com"
    );

    const folderResponse = await request(app)
        .post("/api/v1/folders")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Personal" });

    const folderId = folderResponse.body.data._id;

    const noteResponse = await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Personal Note",
            content: "Private content",
            folder: folderId,
        });

    const noteId = noteResponse.body.data._id;

    const response = await request(app)
        .get(`/api/v1/notes/${noteId}`)
        .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const note = response.body.data;

    expect(note.folder).toBeDefined();
    expect(note.folder._id.toString()).toBe(folderId);
    expect(note.folder.name).toBe("Personal");
});

test("should return populated folder when fetching notes", async () => {
    const token = await registerAndLogin(
        "Prem",
        "prem-folder-read@example.com"
    );

    const folderResponse = await request(app)
        .post("/api/v1/folders")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Work",
        });

    const folderId = folderResponse.body.data._id;

    await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Folder Note",
            content: "Note inside Work folder",
            folder: folderId,
        });

    const response = await request(app)
        .get("/api/v1/notes")
        .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    const note = response.body.data.notes[0];

    expect(note.folder).toBeDefined();
    expect(note.folder._id.toString()).toBe(folderId);
    expect(note.folder.name).toBe("Work");
});

test("should return populated folder when fetching a single note", async () => {
    const token = await registerAndLogin(
        "Prem",
        "prem-folder-single@example.com"
    );

    const folderResponse = await request(app)
        .post("/api/v1/folders")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Personal",
        });

    const folderId = folderResponse.body.data._id;

    const noteResponse = await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Personal Note",
            content: "Personal note content",
            folder: folderId,
        });

    const noteId = noteResponse.body.data._id;

    const response = await request(app)
        .get(`/api/v1/notes/${noteId}`)
        .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    const note = response.body.data;

    expect(note.folder).toBeDefined();
    expect(note.folder._id.toString()).toBe(folderId);
    expect(note.folder.name).toBe("Personal");
});

test("should remove folder from a note", async () => {
    const token = await registerAndLogin(
        "Prem",
        "prem-folder-remove@example.com"
    );

    const folderResponse = await request(app)
        .post("/api/v1/folders")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Work",
        });

    const folderId = folderResponse.body.data._id;

    const noteResponse = await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Folder Note",
            content: "Note content",
            folder: folderId,
        });

    expect(noteResponse.status).toBe(201);

    const noteId = noteResponse.body.data._id;

    const updateResponse = await request(app)
        .put(`/api/v1/notes/${noteId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Folder Note",
            content: "Note content",
            folder: null,
        });

    expect(updateResponse.status).toBe(200);

    expect(updateResponse.body.data.folder).toBeNull();
});
});

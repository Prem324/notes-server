process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecret";
process.env.MONGO_URI = "mongodb://localhost/test";

jest.mock("../middleware/rateLimiter", () => {
    return {
        loginLimiter: (req, res, next) => next(),
        registerLimiter: (req, res, next) => next(),
    };
});

const request = require("supertest");

const app = require("../app");

const Note = require("../models/Note");

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

    const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email,
            password,
        });

    return loginResponse.body.data.token;
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
        "Not authorized"
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
        "Not authorized"
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
});
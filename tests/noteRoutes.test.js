const request = require("supertest");
const app = require("../app");
const noteService = require("../services/noteService");
const uploadService = require("../services/uploadService");
const mediaService = require("../services/mediaService");


// Mock note service
jest.mock("../services/noteService");
jest.mock("../services/uploadService");
jest.mock("../services/mediaService");


// Mock auth middleware
jest.mock("../middleware/auth", () => {
    return (req, res, next) => {
        req.user = {
            id: "user123",
            role: "user",
        };

        next();
    };
});


beforeEach(() => {
    jest.clearAllMocks();
});


describe("Note Routes", () => {
    test("GET /api/v1/notes should return notes", async () => {
        // =====================
        // ARRANGE
        // =====================

        const fakeNotes = [
            {
                _id: "note1",
                title: "First Note",
                content: "First content",
                user: "user123",
            },
            {
                _id: "note2",
                title: "Second Note",
                content: "Second content",
                user: "user123",
            },
        ];

        noteService.getAllNotes.mockResolvedValue(
            fakeNotes
        );


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .get("/api/v1/notes")
            .query({
                page: "2",
                limit: "5",
                search: "test",
            });


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message:"Notes fetched successfully",
            data: fakeNotes,
        });

        expect(
            noteService.getAllNotes
        ).toHaveBeenCalledWith(
            "user123",
            "user",
            2,
            5,
            "test"
        );
    });


    test("GET /api/v1/notes should use default query values", async () => {
        // =====================
        // ARRANGE
        // =====================

        noteService.getAllNotes.mockResolvedValue([]);


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .get("/api/v1/notes");


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message:"Notes fetched successfully",
            data: [],
        });

        expect(
            noteService.getAllNotes
        ).toHaveBeenCalledWith(
            "user123",
            "user",
            1,
            10,
            ""
        );
    });


    test("POST /api/v1/notes should create note", async () => {
        // =====================
        // ARRANGE
        // =====================

        const requestBody = {
            title: "My Note",
            content: "This is note content",
            completed: false,
        };

        const fakeNote = {
            _id: "note123",
            ...requestBody,
            user: "user123",
        };

        noteService.createNote.mockResolvedValue(
            fakeNote
        );


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .post("/api/v1/notes")
            .send(requestBody);


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(201);

        expect(response.body).toEqual({
            success: true,
            message:'Note created successfully',
            data: fakeNote,
        });

        expect(
            noteService.createNote
        ).toHaveBeenCalledWith(
            requestBody,
            "user123"
        );
    });


    test("PUT /api/v1/notes/:id should update note", async () => {
        // =====================
        // ARRANGE
        // =====================

        const requestBody = {
            title: "Updated Note",
            content: "Updated content",
            completed: true,
        };

        const fakeUpdatedNote = {
            _id: "note123",
            ...requestBody,
            user: "user123",
        };

        noteService.updateNote.mockResolvedValue(
            fakeUpdatedNote
        );


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .put("/api/v1/notes/note123")
            .send(requestBody);


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message:"Note updated successfully",
            data: fakeUpdatedNote,
        });

        expect(
            noteService.updateNote
        ).toHaveBeenCalledWith(
            "note123",
            requestBody,
            "user123"
        );
    });


    test("DELETE /api/v1/notes/:id should delete note", async () => {
        // =====================
        // ARRANGE
        // =====================

        noteService.deleteNote.mockResolvedValue({
            message: "Note deleted successfully",
        });


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .delete("/api/v1/notes/note123");


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message: "Note deleted successfully",
        });

        expect(
            noteService.deleteNote
        ).toHaveBeenCalledWith(
            "note123",
            "user123"
        );
    });


    test("GET /api/v1/notes/:id/comments should return note with comments", async () => {
        // =====================
        // ARRANGE
        // =====================

        const fakeNote = {
            _id: "note123",
            title: "My Note",
            content: "Note content",
            comments: [
                {
                    _id: "comment123",
                    text: "Nice note",
                    user: {
                        name: "Prem",
                        email: "prem@gmail.com",
                    },
                },
            ],
        };

        noteService.getNoteWithComments.mockResolvedValue(
            fakeNote
        );


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .get("/api/v1/notes/note123/comments");


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message:"Note with comments fetched successfully",
            data: fakeNote,
        });

        expect(
            noteService.getNoteWithComments
        ).toHaveBeenCalledWith(
            "note123"
        );
    });


    test("DELETE /api/v1/notes/:noteId/attachments/:attachmentId should delete attachment", async () => {
        // =====================
        // ARRANGE
        // =====================

        const fakeNote = {
            _id: "note123",
            title: "My Note",
            attachments: [],
        };

        noteService.deleteAttachment.mockResolvedValue(
            fakeNote
        );


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .delete(
                "/api/v1/notes/note123/attachments/attachment123"
            );


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message:"Attachment deleted successfully",
            data: fakeNote,
        });

        expect(
            noteService.deleteAttachment
        ).toHaveBeenCalledWith(
            "note123",
            "attachment123",
            "user123"
        );
    });

    test("POST /api/v1/notes should return validation error for invalid note data", async () => {
    // =====================
    // ARRANGE
    // =====================

    const invalidBody = {
        title: "Hi",
        content: "This is note content",
    };


    // =====================
    // ACT
    // =====================

    const response = await request(app)
        .post("/api/v1/notes")
        .send(invalidBody);


    // =====================
    // ASSERT
    // =====================

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toContain("title");

    expect(noteService.createNote).not.toHaveBeenCalled();
});

test("POST /api/v1/notes/:id/attachments should upload image attachment", async () => {
    // =====================
    // ARRANGE
    // =====================

    const compressedBuffer = Buffer.from("compressed-image");

    const uploadedFile = {
        secure_url: "https://cloudinary.com/note-image.webp",
        public_id: "note-images/image123",
        bytes: 12345,
    };

    const fakeUpdatedNote = {
        _id: "note123",
        title: "My Note",
        attachments: [
            {
                url: "https://cloudinary.com/note-image.webp",
                publicId: "note-images/image123",
                fileName: "test.png",
                fileType: "image/png",
                size: 12345,
            },
        ],
    };

    uploadService.compressImage.mockResolvedValue(
        compressedBuffer
    );

    mediaService.uploadFile.mockResolvedValue(
        uploadedFile
    );

    noteService.uploadAttachment.mockResolvedValue(
        fakeUpdatedNote
    );


    // =====================
    // ACT
    // =====================

    const response = await request(app)
        .post("/api/v1/notes/note123/attachments")
        .attach(
            "attachments",
            Buffer.from("fake-image"),
            {
                filename: "test.png",
                contentType: "image/png",
            }
        );


    // =====================
    // ASSERT
    // =====================

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
        success: true,
        message:"Attachment uploaded successfully",
        data: fakeUpdatedNote,
    });

    expect(uploadService.compressImage).toHaveBeenCalled();

    expect(mediaService.uploadFile).toHaveBeenCalledWith(
        compressedBuffer,
        "note-images"
    );

    expect(noteService.uploadAttachment).toHaveBeenCalledWith(
        "note123",
        "user123",
        [
            {
                url: "https://cloudinary.com/note-image.webp",
                publicId: "note-images/image123",
                fileName: "test.png",
                fileType: "image/png",
                size: 12345,
            },
        ]
    );
});

test("POST /api/v1/notes/:id/attachments should upload document without compression", async () => {
    // =====================
    // ARRANGE
    // =====================

    const uploadedFile = {
        secure_url: "https://cloudinary.com/document.pdf",
        public_id: "note-documents/doc123",
        bytes: 5000,
    };

    const fakeUpdatedNote = {
        _id: "note123",
        title: "My Note",
        attachments: [
            {
                url: "https://cloudinary.com/document.pdf",
                publicId: "note-documents/doc123",
                fileName: "document.pdf",
                fileType: "application/pdf",
                size: 5000,
            },
        ],
    };

    mediaService.uploadFile.mockResolvedValue(
        uploadedFile
    );

    noteService.uploadAttachment.mockResolvedValue(
        fakeUpdatedNote
    );


    // =====================
    // ACT
    // =====================

    const response = await request(app)
        .post("/api/v1/notes/note123/attachments")
        .attach(
            "attachments",
            Buffer.from("fake-pdf"),
            {
                filename: "document.pdf",
                contentType: "application/pdf",
            }
        );


    // =====================
    // ASSERT
    // =====================

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
        success: true,
        message:"Attachment uploaded successfully",
        data: fakeUpdatedNote,
    });

    expect(uploadService.compressImage).not.toHaveBeenCalled();

    expect(mediaService.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        "note-documents"
    );

    expect(noteService.uploadAttachment).toHaveBeenCalledWith(
        "note123",
        "user123",
        [
            {
                url: "https://cloudinary.com/document.pdf",
                publicId: "note-documents/doc123",
                fileName: "document.pdf",
                fileType: "application/pdf",
                size: 5000,
            },
        ]
    );
});
    
test("POST /api/v1/notes/:id/attachments should return 400 when no file uploaded", async () => {
    // =====================
    // ACT
    // =====================

    const response = await request(app)
        .post("/api/v1/notes/note123/attachments");


    // =====================
    // ASSERT
    // =====================

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
        success: false,
        message: "Please upload at least one file",
    });

    expect(uploadService.compressImage).not.toHaveBeenCalled();

    expect(mediaService.uploadFile).not.toHaveBeenCalled();

    expect(noteService.uploadAttachment).not.toHaveBeenCalled();
});
});
const request = require("supertest");

const app = require("../app");

const noteService = require("../services/noteService");
const uploadService = require("../services/uploadService");
const mediaService = require("../services/mediaService");


// ======================================================
// MOCK SERVICES
// ======================================================

jest.mock("../services/noteService");
jest.mock("../services/uploadService");
jest.mock("../services/mediaService");


// ======================================================
// MOCK AUTH MIDDLEWARE
// ======================================================

jest.mock("../middleware/auth", () => {
    return (req, res, next) => {

        req.user = {
            id: "user123",
            role: "user",
        };

        next();
    };
});


// ======================================================
// REAL FILE FIXTURES
// ======================================================

// Valid PNG image
// 1 x 1 pixel PNG
const validPngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
);


// Valid PDF-like buffer with PDF magic bytes
const validPdfBuffer = Buffer.from(
    "%PDF-1.4\n" +
    "1 0 obj\n" +
    "<< /Type /Catalog /Pages 2 0 R >>\n" +
    "endobj\n" +
    "2 0 obj\n" +
    "<< /Type /Pages /Kids [] /Count 0 >>\n" +
    "endobj\n" +
    "trailer\n" +
    "<< /Root 1 0 R >>\n" +
    "%%EOF"
);


// ======================================================
// TEST SUITE
// ======================================================

describe("Note Routes", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });


    // ==================================================
    // GET NOTES
    // ==================================================

    test(
        "GET /api/v1/notes should return notes",
        async () => {

            const fakeResult = {
                notes: [
                    {
                        _id: "note123",
                        title: "My Note",
                        content: "Note content",
                    },
                ],
                pagination: {
                    page: 1,
                    limit: 10,
                    totalNotes: 1,
                    totalPages: 1,
                },
            };


            noteService.getAllNotes.mockResolvedValue(
                fakeResult
            );


            const response =
                await request(app)
                    .get("/api/v1/notes");


            expect(response.statusCode)
                .toBe(200);


            expect(response.body)
                .toEqual({
                    success: true,
                    message: "Notes fetched successfully",
                    data: fakeResult,
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
        }
    );


    // ==================================================
    // GET NOTES - DEFAULT VALUES
    // ==================================================

    test(
        "GET /api/v1/notes should use default query values",
        async () => {

            const fakeResult = {
                notes: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    totalNotes: 0,
                    totalPages: 1,
                },
            };


            noteService.getAllNotes.mockResolvedValue(
                fakeResult
            );


            const response =
                await request(app)
                    .get("/api/v1/notes");


            expect(response.statusCode)
                .toBe(200);


            expect(
                noteService.getAllNotes
            ).toHaveBeenCalledWith(
                "user123",
                "user",
                1,
                10,
                ""
            );
        }
    );


    // ==================================================
    // CREATE NOTE
    // ==================================================

    test(
        "POST /api/v1/notes should create note",
        async () => {

            const requestBody = {
                title: "My Note",
                content: "Note content",
                completed: false,
            };


            const fakeNote = {
                _id: "note123",
                title: "My Note",
                content: "Note content",
                completed: false,
            };


            noteService.createNote.mockResolvedValue(
                fakeNote
            );


            const response =
                await request(app)
                    .post("/api/v1/notes")
                    .send(requestBody);


            expect(response.statusCode)
                .toBe(201);


            expect(response.body)
                .toEqual({
                    success: true,
                    message: "Note created successfully",
                    data: fakeNote,
                });


            expect(
                noteService.createNote
            ).toHaveBeenCalledWith(
                requestBody,
                "user123"
            );
        }
    );


    // ==================================================
    // UPDATE NOTE
    // ==================================================

    test(
        "PUT /api/v1/notes/:id should update note",
        async () => {

            const requestBody = {
                title: "Updated Note",
                content: "Updated content",
                completed: true,
            };


            const fakeNote = {
                _id: "note123",
                title: "Updated Note",
                content: "Updated content",
                completed: true,
            };


            noteService.updateNote.mockResolvedValue(
                fakeNote
            );


            const response =
                await request(app)
                    .put("/api/v1/notes/note123")
                    .send(requestBody);


            expect(response.statusCode)
                .toBe(200);


            expect(response.body)
                .toEqual({
                    success: true,
                    message: "Note updated successfully",
                    data: fakeNote,
                });


            expect(
                noteService.updateNote
            ).toHaveBeenCalledWith(
                "note123",
                requestBody,
                "user123",
                "user"
            );
        }
    );


    // ==================================================
    // DELETE NOTE
    // ==================================================

    test(
        "DELETE /api/v1/notes/:id should delete note",
        async () => {

            noteService.deleteNote.mockResolvedValue();


            const response =
                await request(app)
                    .delete(
                        "/api/v1/notes/note123"
                    );


            expect(response.statusCode)
                .toBe(200);


            expect(response.body)
                .toEqual({
                    success: true,
                    message: "Note deleted successfully",
                });


            expect(
                noteService.deleteNote
            ).toHaveBeenCalledWith(
                "note123",
                "user123",
                "user"
            );
        }
    );


    // ==================================================
    // GET NOTE WITH COMMENTS
    // ==================================================

    test(
        "GET /api/v1/notes/:id/comments should return note with comments",
        async () => {

            const fakeNote = {
                _id: "note123",
                title: "My Note",
                content: "Note content",
                comments: [
                    {
                        _id: "comment123",
                        text: "Nice note",
                    },
                ],
            };


            noteService.getNoteWithComments.mockResolvedValue(
                fakeNote
            );


            const response =
                await request(app)
                    .get(
                        "/api/v1/notes/note123/comments"
                    );


            expect(response.statusCode)
                .toBe(200);


            expect(response.body)
                .toEqual({
                    success: true,
                    message:
                        "Note with comments fetched successfully",
                    data: fakeNote,
                });


            expect(
                noteService.getNoteWithComments
            ).toHaveBeenCalledWith(
                "note123"
            );
        }
    );


    // ==================================================
    // DELETE ATTACHMENT
    // ==================================================

    test(
        "DELETE /api/v1/notes/:noteId/attachments/:attachmentId should delete attachment",
        async () => {

            const fakeNote = {
                _id: "note123",
                title: "My Note",
                attachments: [],
            };


            noteService.deleteAttachment.mockResolvedValue(
                fakeNote
            );


            const response =
                await request(app)
                    .delete(
                        "/api/v1/notes/note123/attachments/attachment123"
                    );


            expect(response.statusCode)
                .toBe(200);


            expect(response.body)
                .toEqual({
                    success: true,
                    message:
                        "Attachment deleted successfully",
                    data: fakeNote,
                });


            expect(
                noteService.deleteAttachment
            ).toHaveBeenCalledWith(
                "note123",
                "attachment123",
                "user123"
            );
        }
    );


    // ==================================================
    // INVALID NOTE DATA
    // ==================================================

    test(
        "POST /api/v1/notes should return validation error for invalid note data",
        async () => {

            const invalidBody = {
                title: "Hi",
                content: "This is note content",
            };


            const response =
                await request(app)
                    .post("/api/v1/notes")
                    .send(invalidBody);


            expect(response.statusCode)
                .toBe(400);


            expect(
                response.body.success
            ).toBe(false);


            expect(
                response.body.message
            ).toContain("title");


            expect(
                noteService.createNote
            ).not.toHaveBeenCalled();
        }
    );


    // ==================================================
    // UPLOAD IMAGE ATTACHMENT
    // ==================================================

    test(
        "POST /api/v1/notes/:id/attachments should upload image attachment",
        async () => {

            // ==========================================
            // ARRANGE
            // ==========================================

            const compressedBuffer =
                Buffer.from("compressed-image");


            const uploadedFile = {

                secure_url:
                    "https://cloudinary.com/note-image.webp",

                public_id:
                    "note-images/image123",

                bytes: 12345,
            };


            const fakeUpdatedNote = {

                _id: "note123",

                title: "My Note",

                attachments: [

                    {
                        url:
                            "https://cloudinary.com/note-image.webp",

                        publicId:
                            "note-images/image123",

                        fileName:
                            "test.png",

                        fileType:
                            "image/png",

                        size:
                            12345,
                    },

                ],
            };


            uploadService.compressImage
                .mockResolvedValue(
                    compressedBuffer
                );


            mediaService.uploadFile
                .mockResolvedValue(
                    uploadedFile
                );


            noteService.uploadAttachment
                .mockResolvedValue(
                    fakeUpdatedNote
                );


            // ==========================================
            // ACT
            // ==========================================

            const response =
                await request(app)
                    .post(
                        "/api/v1/notes/note123/attachments"
                    )
                    .attach(
                        "attachments",
                        validPngBuffer,
                        {
                            filename: "test.png",
                            contentType: "image/png",
                        }
                    );


            // ==========================================
            // ASSERT
            // ==========================================

            expect(response.statusCode)
                .toBe(200);


            expect(response.body)
                .toEqual({

                    success: true,

                    message:
                        "Attachment uploaded successfully",

                    data:
                        fakeUpdatedNote,
                });


            // Image should go through Sharp

            expect(
                uploadService.compressImage
            ).toHaveBeenCalled();


            // Image should use Cloudinary image resource

            expect(
                mediaService.uploadFile
            ).toHaveBeenCalledWith(
                compressedBuffer,
                "note-images",
                "image"
            );


            expect(
                noteService.uploadAttachment
            ).toHaveBeenCalledWith(

                "note123",

                "user123",

                [
                    {
                        url:
                            "https://cloudinary.com/note-image.webp",

                        publicId:
                            "note-images/image123",

                        fileName:
                            "test.png",

                        fileType:
                            "image/png",

                        size:
                            12345,
                    },
                ]
            );
        }
    );


    // ==================================================
    // UPLOAD PDF DOCUMENT
    // ==================================================

    test(
        "POST /api/v1/notes/:id/attachments should upload document without compression",
        async () => {

            // ==========================================
            // ARRANGE
            // ==========================================

            const uploadedFile = {

                secure_url:
                    "https://cloudinary.com/document.pdf",

                public_id:
                    "note-documents/doc123",

                bytes:
                    5000,
            };


            const fakeUpdatedNote = {

                _id: "note123",

                title: "My Note",

                attachments: [

                    {
                        url:
                            "https://cloudinary.com/document.pdf",

                        publicId:
                            "note-documents/doc123",

                        fileName:
                            "document.pdf",

                        fileType:
                            "application/pdf",

                        size:
                            5000,
                    },

                ],
            };


            mediaService.uploadFile
                .mockResolvedValue(
                    uploadedFile
                );


            noteService.uploadAttachment
                .mockResolvedValue(
                    fakeUpdatedNote
                );


            // ==========================================
            // ACT
            // ==========================================

            const response =
                await request(app)
                    .post(
                        "/api/v1/notes/note123/attachments"
                    )
                    .attach(
                        "attachments",
                        validPdfBuffer,
                        {
                            filename:
                                "document.pdf",

                            contentType:
                                "application/pdf",
                        }
                    );


            // ==========================================
            // ASSERT
            // ==========================================

            expect(response.statusCode)
                .toBe(200);


            expect(response.body)
                .toEqual({

                    success: true,

                    message:
                        "Attachment uploaded successfully",

                    data:
                        fakeUpdatedNote,
                });


            // PDF must NOT be compressed

            expect(
                uploadService.compressImage
            ).not.toHaveBeenCalled();


            // PDF must use Cloudinary raw resource

            expect(
                mediaService.uploadFile
            ).toHaveBeenCalledWith(

                expect.any(Buffer),

                "note-documents",

                "raw"
            );


            expect(
                noteService.uploadAttachment
            ).toHaveBeenCalledWith(

                "note123",

                "user123",

                [
                    {
                        url:
                            "https://cloudinary.com/document.pdf",

                        publicId:
                            "note-documents/doc123",

                        fileName:
                            "document.pdf",

                        fileType:
                            "application/pdf",

                        size:
                            5000,
                    },
                ]
            );
        }
    );


    // ==================================================
    // NO FILE
    // ==================================================

    test(
        "POST /api/v1/notes/:id/attachments should return 400 when no file uploaded",
        async () => {

            const response =
                await request(app)
                    .post(
                        "/api/v1/notes/note123/attachments"
                    );


            expect(response.statusCode)
                .toBe(400);


            expect(response.body)
                .toEqual({

                    success: false,

                    message:
                        "Please upload at least one file",
                });


            expect(
                uploadService.compressImage
            ).not.toHaveBeenCalled();


            expect(
                mediaService.uploadFile
            ).not.toHaveBeenCalled();


            expect(
                noteService.uploadAttachment
            ).not.toHaveBeenCalled();
        }
    );

});
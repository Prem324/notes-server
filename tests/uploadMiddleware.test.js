const express = require("express");
const request = require("supertest");

const upload = require("../middleware/upload");

const createTestApp = () => {
    const app = express();

    app.post(
        "/upload",
        upload.array("attachments", 5),
        (req, res) => {
            res.status(200).json({
                success: true,
                filesCount: req.files.length,
                files: req.files.map((file) => ({
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    hasBuffer: Buffer.isBuffer(file.buffer),
                })),
            });
        }
    );

    // Test error handler for Multer errors
    app.use((err, req, res, next) => {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    });

    return app;
};

describe("upload middleware", () => {
    test("should accept allowed image file and store it in memory", async () => {
        // =====================
        // ARRANGE
        // =====================

        const app = createTestApp();


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .post("/upload")
            .attach(
                "attachments",
                Buffer.from("fake-image-content"),
                {
                    filename: "image.png",
                    contentType: "image/png",
                }
            );


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.filesCount).toBe(1);

        expect(response.body.files[0]).toEqual({
            originalname: "image.png",
            mimetype: "image/png",
            size: Buffer.from("fake-image-content").length,
            hasBuffer: true,
        });
    });


    test("should accept PDF file", async () => {
        // =====================
        // ARRANGE
        // =====================

        const app = createTestApp();


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .post("/upload")
            .attach(
                "attachments",
                Buffer.from("fake-pdf-content"),
                {
                    filename: "document.pdf",
                    contentType: "application/pdf",
                }
            );


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.filesCount).toBe(1);

        expect(response.body.files[0].originalname).toBe(
            "document.pdf"
        );

        expect(response.body.files[0].mimetype).toBe(
            "application/pdf"
        );

        expect(response.body.files[0].hasBuffer).toBe(true);
    });


    test("should reject unsupported file type", async () => {
        // =====================
        // ARRANGE
        // =====================

        const app = createTestApp();


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .post("/upload")
            .attach(
                "attachments",
                Buffer.from("fake-text-content"),
                {
                    filename: "notes.txt",
                    contentType: "text/plain",
                }
            );


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(400);

        expect(response.body).toEqual({
            success: false,
            message: "Only JPG, PNG, WEBP and PDF are allowed",
        });
    });


    test("should reject more than 5 files", async () => {
        // =====================
        // ARRANGE
        // =====================

        const app = createTestApp();

        let req = request(app).post("/upload");

        for (let i = 1; i <= 6; i++) {
            req = req.attach(
                "attachments",
                Buffer.from(`fake-image-${i}`),
                {
                    filename: `image${i}.png`,
                    contentType: "image/png",
                }
            );
        }


        // =====================
        // ACT
        // =====================

        const response = await req;


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "Unexpected field"
        );
    });


    test("should reject file larger than 5MB", async () => {
        // =====================
        // ARRANGE
        // =====================

        const app = createTestApp();

        const largeBuffer = Buffer.alloc(
            5 * 1024 * 1024 + 1
        );


        // =====================
        // ACT
        // =====================

        const response = await request(app)
            .post("/upload")
            .attach(
                "attachments",
                largeBuffer,
                {
                    filename: "large.png",
                    contentType: "image/png",
                }
            );


        // =====================
        // ASSERT
        // =====================

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "File too large"
        );
    });
});
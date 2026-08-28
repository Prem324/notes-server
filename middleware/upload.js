const multer = require("multer");
const path = require("path");
const AppError = require("../utils/AppError");

const allowedTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
};

const fileFilter = (req, file, cb) => {

    const extension = path
        .extname(file.originalname)
        .toLowerCase();

    const expectedMimeType =
        allowedTypes[extension];

    // Extension is not allowed
    if (!expectedMimeType) {
        return cb(
            new AppError(
                "Only JPG, PNG, WEBP and PDF files are allowed",
                400
            )
        );
    }

    // Extension and MIME type don't match
    if (file.mimetype !== expectedMimeType) {
        return cb(
            new AppError(
                "File extension does not match file type",
                400
            )
        );
    }

    cb(null, true);
};


const upload = multer({

    storage: multer.memoryStorage(),

    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5,
    },

});


module.exports = upload;
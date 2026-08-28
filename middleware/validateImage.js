const {
    validateImage,
} = require("../utils/imageSecurity");

const validateImageMiddleware = async (req, res, next) => {

    try {

        let files = [];

        if (req.file) {
            files = [req.file];
        }

        if (req.files) {
            files = Array.isArray(req.files)
                ? req.files
                : Object.values(req.files).flat();
        }

        for (const file of files) {

            if (
                file.mimetype === "image/jpeg" ||
                file.mimetype === "image/png" ||
                file.mimetype === "image/webp"
            ) {

                const metadata =
                    await validateImage(file.buffer);

                file.imageMetadata = metadata;
            }
        }

        next();

    } catch (error) {

        next(error);
    }
};

module.exports = validateImageMiddleware;
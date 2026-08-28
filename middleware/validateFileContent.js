const AppError = require("../utils/AppError");
const {
    validateFileBuffer,
} = require("../utils/fileSecurity");

const validateFileContent = async (req, res, next) => {

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

            const result =
                await validateFileBuffer(file.buffer);

            if (!result.valid) {
                return next(
                    new AppError(
                        "Invalid or unsupported file content",
                        400
                    )
                );
            }

            /*
             * Make the detected MIME type
             * available to later middleware/services.
             */
            file.detectedMimeType =
                result.mimeType;
        }

        next();

    } catch (error) {

        next(error);

    }
};

module.exports = validateFileContent;
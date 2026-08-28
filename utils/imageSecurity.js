const sharp = require("sharp");
const AppError = require("../utils/AppError");

const validateImage = async (buffer) => {

    try {

        const metadata = await sharp(buffer).metadata();

        if (!metadata.format) {
            throw new AppError(
                "Invalid image file",
                400
            );
        }

        const allowedFormats = [
            "jpeg",
            "png",
            "webp",
        ];

        if (!allowedFormats.includes(metadata.format)) {
            throw new AppError(
                "Only JPG, PNG and WEBP images are allowed",
                400
            );
        }

        return metadata;

    } catch (error) {

        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            "Invalid or corrupted image file",
            400
        );
    }
};

module.exports = {
    validateImage,
};
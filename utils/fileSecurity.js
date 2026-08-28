const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
];

async function validateFileBuffer(buffer) {

    const { fileTypeFromBuffer } =
        await import("file-type");

    const detectedType =
        await fileTypeFromBuffer(buffer);

    if (!detectedType) {
        return {
            valid: false,
            mimeType: null,
        };
    }

    if (!allowedMimeTypes.includes(detectedType.mime)) {
        return {
            valid: false,
            mimeType: detectedType.mime,
        };
    }

    return {
        valid: true,
        mimeType: detectedType.mime,
    };
}

module.exports = {
    validateFileBuffer,
};
const config = require("../config/env");

const errorHandler = (err, req, res, next) => {

    let statusCode = err.statusCode || 500;
    let message = err.message || "Server Error";


    // =========================
    // MongoDB CastError
    // =========================

    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid resource ID";
    }


    // =========================
    // Multer errors
    // =========================

    if (err.code === "LIMIT_FILE_SIZE") {
        statusCode = 400;
        message = "File size too large. Maximum size is 5MB";
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
        statusCode = 400;
        message = "Too many files uploaded or invalid file field";
    }

    if (err.code === "LIMIT_FILE_COUNT") {
        statusCode = 400;
        message = "Too many files uploaded";
    }


    // =========================
    // Log unexpected errors
    // =========================

    if (statusCode === 500) {
        console.error({
            message: err.message,
            stack: err.stack,
        });
    }


    // =========================
    // Production error message
    // =========================

    if (
        statusCode === 500 &&
        config.nodeEnv === "production"
    ) {
        message = "Something went wrong";
    }


    return res.status(statusCode).json({
        success: false,
        message,
    });
};

module.exports = errorHandler;
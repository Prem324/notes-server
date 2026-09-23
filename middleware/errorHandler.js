const config = require("../config/env");
const logger = require("../config/logger");

const errorHandler = (err, req, res, next) => {

    let statusCode = err.statusCode || 500;
    let message = err.message || "Server Error";

    const requestId = req.requestId;


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
    // Log errors
    // =========================

    if (statusCode >= 500) {

        logger.error(
            {
                requestId,

                error: {
                    name: err.name,
                    message: err.message,
                    stack: err.stack,
                },

                request: {
                    method: req.method,
                    url: req.originalUrl,
                    ip: req.ip,
                },
            },
            "Internal server error"
        );

    } else {

        logger.warn(
            {
                requestId,

                error: {
                    name: err.name,
                    message: err.message,
                },

                request: {
                    method: req.method,
                    url: req.originalUrl,
                },
            },
            "Request failed"
        );
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


    // =========================
    // Response
    // =========================

    const response = {
        success: false,
        message,
    };

    if (requestId && config.nodeEnv !== "test") {
        response.requestId = requestId;
    }

    return res.status(statusCode).json(response);
};


module.exports = errorHandler;
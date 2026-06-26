const config = require("../config/env");

const requestLogger = (req, res, next) => {
    if (config.nodeEnv === "test") {
        return next();
    }

    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;

        console.log({
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
        });
    });

    next();
};

module.exports = requestLogger;
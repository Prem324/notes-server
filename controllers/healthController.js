const mongoose = require("mongoose");

const healthCheck = (req, res) => {
    const dbState = mongoose.connection.readyState;

    const databaseStatus =
        dbState === 1 ? "connected" : "disconnected";

    const isHealthy = dbState === 1;

    return res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        status: isHealthy ? "healthy" : "unhealthy",
        message: isHealthy
            ? "Server is healthy"
            : "Database connection is unavailable",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        database: databaseStatus,
    });
};

module.exports = {
    healthCheck,
};
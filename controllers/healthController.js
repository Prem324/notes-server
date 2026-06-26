const healthCheck = (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
};

module.exports = {healthCheck,};
const app = require("./app");
const connectDB = require("./config/db");
const config = require("./config/env");
const mongoose = require("mongoose");
const {initSocket}=require("./config/socket");
const logger=require("./config/logger");

let server;

const startServer = async () => {
    await connectDB();

    server = app.listen(config.port, () => {
        logger.info(
            {
                port: config.port,
                env: config.nodeEnv,
            },
            "Server started successfully"
        );
    });

    initSocket(server);

};


const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);

    server.close(async () => {
        console.log("HTTP server closed");

        await mongoose.connection.close();

        console.log("MongoDB connection closed");

        process.exit(0);
    });
};

process.on("SIGINT", () => {
    shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    shutdown("SIGTERM");
});

startServer();
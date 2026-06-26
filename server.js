const app = require("./app");
const connectDB = require("./config/db");
const config = require("./config/env");
const mongoose = require("mongoose");
const {initSocket}=require("./config/socket");

let server;

const startServer = async () => {
    await connectDB();

    server = app.listen(config.port, () => {
        console.log(`Server running on ${config.port}`);
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
const { Server } = require("socket.io");
const config = require("./env");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: config.clientUrl,
            methods: ["GET", "POST", "PATCH", "DELETE"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        socket.on("join-note", (noteId) => {
            socket.join(`note:${noteId}`);
            console.log(`Socket ${socket.id} joined note:${noteId}`);
            console.log("Socket rooms:", socket.rooms);

        });

        socket.on("leave-note", (noteId) => {
            socket.leave(`note:${noteId}`);
            console.log(`Socket ${socket.id} left note:${noteId}`);
        });

        /*socket.on("join-export", (jobId) => {
        socket.join(`export:${jobId}`);
        console.log(`Socket ${socket.id} joined export:${jobId}`);
        });

        socket.on("leave-export", (jobId) => {
        socket.leave(`export:${jobId}`);
        console.log(`Socket ${socket.id} left export:${jobId}`);
        });*/

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }

    return io;
};

module.exports = {
    initSocket,
    getIO,
};
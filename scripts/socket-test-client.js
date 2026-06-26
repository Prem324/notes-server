const { io } = require("socket.io-client");

const noteId = "6a33735d0caa54a957492d85";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("Socket connected:", socket.id);

    socket.emit("join-note", noteId);

    console.log(`Joined room: note:${noteId}`);
});

socket.on("comment:created", (data) => {
    console.log("Real-time comment received:");
    console.log(JSON.stringify(data, null, 2));
});

socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
});

socket.onAny((event, data) => {
    console.log("Received event:", event);
    console.log(data);
});
const { Queue } = require("bullmq");
const redisConnection = require("../config/redis");

const exportQueue = new Queue("export-queue", {
    connection: redisConnection,
});

module.exports = exportQueue;
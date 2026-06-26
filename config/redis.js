const IORedis = require("ioredis");
const config = require("./env");

//console.log("Redis config:", config.redis);

const redisConnection = new IORedis({
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null,
});

module.exports = redisConnection;
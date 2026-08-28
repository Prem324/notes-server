const IORedis = require("ioredis");
const config = require("./env");

//console.log("Redis config:", config.redis);

const redisConnection = new IORedis({
    host: config.redis.host,
    port: config.redis.port,
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 1000,
    retryStrategy: () => null,
});

module.exports = redisConnection;

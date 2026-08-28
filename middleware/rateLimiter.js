const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const redisConnection = require("../config/redis");


const loginLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 5,

    standardHeaders: true,

    legacyHeaders: false,

    store: new RedisStore({
        sendCommand: (...args) =>
            redisConnection.call(...args),
    }),

    message: {
        success: false,
        message:
            "Too many login attempts. Please try again later.",
    },
});


const registerLimiter = rateLimit({

    windowMs: 60 * 60 * 1000,

    max: 3,

    standardHeaders: true,

    legacyHeaders: false,

    store: new RedisStore({
        sendCommand: (...args) =>
            redisConnection.call(...args),
    }),

    message: {
        success: false,
        message:
            "Too many registration attempts. Please try again later.",
    },
});


const forgotPasswordLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 5,

    standardHeaders: true,

    legacyHeaders: false,

    store: new RedisStore({
        sendCommand: (...args) =>
            redisConnection.call(...args),
    }),

    message: {
        success: false,
        message:
            "Too many password reset requests. Please try again later.",
    },
});


module.exports = {
    loginLimiter,
    registerLimiter,
    forgotPasswordLimiter,
};
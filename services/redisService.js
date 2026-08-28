const redisConnection = require("../config/redis");


// ============================================================
// GET
// ============================================================

const get = async (key) => {

    try {

        const value =
            await redisConnection.get(key);

        if (!value) {
            return null;
        }

        return JSON.parse(value);

    } catch (error) {

        console.error(
            "Redis GET failed:",
            error.message
        );

        return null;
    }
};


// ============================================================
// SET
// ============================================================

const set = async (
    key,
    value,
    ttl = 60
) => {

    try {

        await redisConnection.set(
            key,
            JSON.stringify(value),
            "EX",
            ttl
        );

    } catch (error) {

        console.error(
            "Redis SET failed:",
            error.message
        );
    }
};


// ============================================================
// DELETE
// ============================================================

const del = async (key) => {

    try {

        await redisConnection.del(key);

    } catch (error) {

        console.error(
            "Redis DEL failed:",
            error.message
        );
    }
};


// ============================================================
// DELETE BY PATTERN
// ============================================================

const delByPattern = async (pattern) => {

    try {

        const keys =
            await redisConnection.keys(pattern);

        if (!keys.length) {
            return;
        }

        await redisConnection.del(...keys);

    } catch (error) {

        console.error(
            "Redis pattern deletion failed:",
            error.message
        );
    }
};


module.exports = {
    get,
    set,
    del,
    delByPattern,
};
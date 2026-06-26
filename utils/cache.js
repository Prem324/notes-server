const cache = new Map();

const setCache = (key, value, ttlInSeconds = 60) => {
    const expiresAt = Date.now() + ttlInSeconds * 1000;

    cache.set(key, {
        value,
        expiresAt,
    });
};

const getCache = (key) => {
    const cachedItem = cache.get(key);

    if (!cachedItem) {
        return null;
    }

    if (Date.now() > cachedItem.expiresAt) {
        cache.delete(key);
        return null;
    }

    return cachedItem.value;
};

const deleteCache = (key) => {
    cache.delete(key);
};

const clearCache = () => {
    cache.clear();
};

module.exports = {
    setCache,
    getCache,
    deleteCache,
    clearCache,
};
const config = require("./env");

const toBoolean = (value, defaultValue = false) => {
    if (value === undefined) {
        return defaultValue;
    }

    return value === true || value === "true";
};

const featureFlags = {
    tags: toBoolean(config.features?.tags),
    noteSharing: toBoolean(config.features?.noteSharing),
    notifications: toBoolean(config.features?.notifications),
    activityTimeline: toBoolean(config.features?.activityTimeline),
};

module.exports = featureFlags;
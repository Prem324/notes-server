const featureFlags = require("../config/featureFlags");

const getFeatureFlags = (req, res) => {
    res.status(200).json({
        success: true,
        message: "Feature flags fetched successfully",
        data: featureFlags,
    });
};

module.exports = {
    getFeatureFlags,
};
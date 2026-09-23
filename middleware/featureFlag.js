const featureFlags = require("../config/featureFlags");
const FEATURE_NAMES = require("../config/featureNames"); 

const requireFeature = (featureName) => {
    return (req, res, next) => {
        if (!(featureName in featureFlags)) {
            return res.status(500).json({
                success: false,
                message: "Unknown feature flag",
                requestId: req.requestId,
            });
        }

        if (featureFlags[featureName] !== true) {
            return res.status(503).json({
                success: false,
                message: "This feature is currently unavailable",
                requestId: req.requestId,
            });
        }

        next();
    };
};

module.exports = requireFeature;
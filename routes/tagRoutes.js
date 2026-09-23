const express = require("express");

const { createTag, getTags, updateTag, deleteTag } = require("../controllers/tagController");
const auth = require("../middleware/auth");
const requireFeature = require("../middleware/featureFlag");
const asyncHandler = require("../middleware/asyncHandler");
const FEATURE_NAMES = require("../config/featureNames");

const router = express.Router();

router.post(
    "/",
    auth,
    requireFeature(FEATURE_NAMES.TAGS),
    asyncHandler(createTag)
);

router.get(
    "/",
    auth,
    requireFeature(FEATURE_NAMES.TAGS),
    asyncHandler(getTags)
);

router.put(
    "/:id",
    auth,
    requireFeature(FEATURE_NAMES.TAGS),
    asyncHandler(updateTag)
);

router.delete(
    "/:id",
    auth,
    requireFeature(FEATURE_NAMES.TAGS),
    asyncHandler(deleteTag)
);

module.exports = router;
const express = require("express");

const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validate");
const requireFeature = require("../middleware/featureFlag");

const FEATURE_NAMES = require("../config/featureNames");

const {
    createFolder,
    getFolders,
    updateFolder,
    deleteFolder,
} = require("../controllers/folderController");

const {
    createFolderSchema,
} = require("../validators/folderValidator");

const router = express.Router();

router.post(
    "/",
    auth,
    requireFeature(FEATURE_NAMES.FOLDERS),
    validate(createFolderSchema),
    asyncHandler(createFolder)
);

router.get(
    "/",
    auth,
    requireFeature(FEATURE_NAMES.FOLDERS),
    asyncHandler(getFolders)
);

router.put(
    "/:id",
    auth,
    requireFeature(FEATURE_NAMES.FOLDERS),
    validate(createFolderSchema),
    asyncHandler(updateFolder)
);

router.delete(
    "/:id",
    auth,
    requireFeature(FEATURE_NAMES.FOLDERS),
    asyncHandler(deleteFolder)
);

module.exports = router;
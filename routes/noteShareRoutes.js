const express = require("express");

const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validate");
const requireFeature = require("../middleware/featureFlag");

const FEATURE_NAMES = require("../config/featureNames");

const {
    shareNote,
    getNoteCollaborators,
    updateCollaboratorPermission,
    removeCollaborator,
} = require("../controllers/noteShareController");

const {
    shareNoteSchema,
    updatePermissionSchema,
} = require("../validators/noteShareValidator");

const router = express.Router();

router.post(
    "/:id/share",
    auth,
    requireFeature(FEATURE_NAMES.NOTE_SHARING),
    validate(shareNoteSchema),
    asyncHandler(shareNote)
);

router.get(
    "/:id/collaborators",
    auth,
    requireFeature(FEATURE_NAMES.NOTE_SHARING),
    asyncHandler(getNoteCollaborators)
);

router.put(
    "/:id/collaborators/:userId",
    auth,
    requireFeature(FEATURE_NAMES.NOTE_SHARING),
    validate(updatePermissionSchema),
    asyncHandler(updateCollaboratorPermission)
);

router.delete(
    "/:id/collaborators/:userId",
    auth,
    requireFeature(FEATURE_NAMES.NOTE_SHARING),
    asyncHandler(removeCollaborator)
);

module.exports = router;
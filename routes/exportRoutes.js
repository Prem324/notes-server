const express = require("express");
const {
    createNotesExportJob,
    getExportJobById,
} = require("../controllers/exportController");

const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.post(
    "/notes",
    auth,
    asyncHandler(createNotesExportJob)
);

router.get(
    "/:jobId",
    auth,
    asyncHandler(getExportJobById)
);

module.exports = router;
const express = require("express");

const {
    getFeatureFlags,
} = require("../controllers/configController");

const router = express.Router();

router.get("/features", getFeatureFlags);

module.exports = router;
const express = require("express");
const router = express.Router();

const {
    healthCheck,
} = require("../controllers/healthController");


/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns server health status.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy
 */
router.get("/", healthCheck);

module.exports = router;
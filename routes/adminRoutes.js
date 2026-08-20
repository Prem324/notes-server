const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validate");

const {
    getAdminDashboard,
    updateUserRole,
} = require("../controllers/adminController");

const {
    updateUserRoleSchema,
} = require("../validators/adminValidator");


/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard
 *     description: Returns admin dashboard information.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get(
    "/dashboard",
    auth,
    authorize("admin"),
    asyncHandler(getAdminDashboard)
);


/**
 * @swagger
 * /api/v1/admin/users/{userId}/role:
 *   patch:
 *     summary: Update user role
 *     description: Allows an administrator to change a user's role.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: MongoDB ID of the user
 *         schema:
 *           type: string
 *         example: 65f123456789abcdef123456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum:
 *                   - user
 *                   - admin
 *                 example: admin
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid role or invalid request
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.patch(
    "/users/:userId/role",
    auth,
    authorize("admin"),
    validate(updateUserRoleSchema),
    asyncHandler(updateUserRole)
);


module.exports = router;
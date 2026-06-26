const express=require("express");
const router=express.Router();
const auth=require("../middleware/auth");
const authorize=require("../middleware/authorize");
const asyncHandler=require("../middleware/asyncHandler");

const {notesPerUser,commentsPerUser,mostActiveUser,monthlyNotes,getMostActiveUser}=require("../controllers/analyticsController");


/**
 * @swagger
 * /api/v1/analytics/notes-per-user:
 *   get:
 *     summary: Get notes per user
 *     description: Returns total number of notes created by each user. Admin only.
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notes per user fetched successfully
 *       401:
 *         description: No token provided or invalid token
 *       403:
 *         description: Access denied
 */
router.get("/notes-per-user",auth,authorize("admin"),asyncHandler(notesPerUser));


/**
 * @swagger
 * /api/v1/analytics/comments-per-note:
 *   get:
 *     summary: Get comments per note
 *     description: Returns total number of comments for notes. Admin only.
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comments per note fetched successfully
 *       401:
 *         description: No token provided or invalid token
 *       403:
 *         description: Access denied
 */
router.get("/comments-per-note",auth,authorize("admin"),asyncHandler(commentsPerUser));


/**
 * @swagger
 * /api/v1/analytics/most-active-user:
 *   get:
 *     summary: Get most active user
 *     description: Returns the user with the highest number of notes. Admin only.
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Most active user fetched successfully
 *       401:
 *         description: No token provided or invalid token
 *       403:
 *         description: Access denied
 */
router.get("/most-active-user",auth,authorize("admin"),asyncHandler(mostActiveUser));


/**
 * @swagger
 * /api/v1/analytics/monthly-notes:
 *   get:
 *     summary: Get monthly notes count
 *     description: Returns total notes created in the current month. Admin only.
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly notes fetched successfully
 *       401:
 *         description: No token provided or invalid token
 *       403:
 *         description: Access denied
 */
router.get("/monthly-notes",auth,authorize("admin"),asyncHandler(monthlyNotes));

/**
 * @swagger
 * /api/v1/analytics/get-most-active-user:
 *   get:
 *     summary: Get most active user
 *     description: Returns the user with the highest number of notes. Admin only.
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Most active user fetched successfully
 *       401:
 *         description: No token provided or invalid token
 *       403:
 *         description: Access denied
 */
router.get("/get-most-active-user",auth,authorize("admin"),asyncHandler(getMostActiveUser));

module.exports=router;
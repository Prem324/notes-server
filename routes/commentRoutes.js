const express=require("express");
const router=express.Router();
const auth=require("../middleware/auth");
const asyncHandler=require("../middleware/asyncHandler");

const {createComment,getCommentsByNote}=require("../controllers/commentController");


/**
 * @swagger
 * /api/v1/comments/{noteId}:
 *   post:
 *     summary: Create comment
 *     description: Creates a comment on a note.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: This note is helpful
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       401:
 *         description: No token provided or invalid token
 *       404:
 *         description: Note not found
 */
router.post("/:noteId",auth,asyncHandler(createComment));


/**
 * @swagger
 * /api/v1/comments/note/{noteId}:
 *   get:
 *     summary: Get comments by note
 *     description: Returns all comments for a specific note.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Comments fetched successfully
 *       401:
 *         description: No token provided or invalid token
 */
router.get("/note/:noteId",auth,asyncHandler(getCommentsByNote));


module.exports=router;
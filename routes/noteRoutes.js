const express=require('express');
const router=express.Router();
const validate=require('../middleware/validate');
const asyncHandler=require("../middleware/asyncHandler");
const noteValidator=require("../validators/noteValidator");
const auth=require("../middleware/auth");
const upload=require("../middleware/upload");

const{
    getNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    getNoteWithComments,
    uploadAttachment,
    deleteAttachment
    
}=require("../controllers/noteController");


/**
 * @swagger
 * /api/v1/notes:
 *   get:
 *     summary: Get notes
 *     description: Returns paginated notes for the authenticated user.
 *     tags:
 *       - Notes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of notes per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: backend
 *         description: Search text for title/content
 *     responses:
 *       200:
 *         description: Notes fetched successfully
 *       401:
 *         description: No token provided or invalid token
 */
router.get("/",auth,asyncHandler(getNotes));


router.get("/:id", auth, asyncHandler(getNoteById));

/**
 * @swagger
 * /api/v1/notes:
 *   post:
 *     summary: Create note
 *     description: Creates a new note for the authenticated user.
 *     tags:
 *       - Notes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: Learn Express
 *               content:
 *                 type: string
 *                 example: Practice REST API development
 *               completed:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Note created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: No token provided or invalid token
 */
router.post("/",auth,validate(noteValidator),asyncHandler(createNote));


/**
 * @swagger
 * /api/v1/notes/{id}:
 *   put:
 *     summary: Update note
 *     description: Updates a note owned by the authenticated user.
 *     tags:
 *       - Notes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Note
 *               content:
 *                 type: string
 *                 example: Updated note content
 *               completed:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Note updated successfully
 *       400:
 *         description: Validation error or invalid resource ID
 *       401:
 *         description: No token provided or invalid token
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Note not found
 */
router.put('/:id',auth,validate(noteValidator),asyncHandler(updateNote));


/**
 * @swagger
 * /api/v1/notes/{id}:
 *   delete:
 *     summary: Delete note
 *     description: Deletes a note owned by the authenticated user.
 *     tags:
 *       - Notes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note deleted successfully
 *       401:
 *         description: No token provided or invalid token
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Note not found
 */
router.delete('/:id',auth,asyncHandler(deleteNote));

router.get("/:id/comments",auth,asyncHandler(getNoteWithComments));


/**
 * @swagger
 * /api/v1/notes/{id}/attachments:
 *   post:
 *     summary: Upload note attachments
 *     description: Uploads up to 5 note attachments. Allowed file types are JPG, PNG, WEBP, and PDF.
 *     tags:
 *       - Notes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Attachment uploaded successfully
 *       400:
 *         description: Invalid file, file too large, or no file uploaded
 *       401:
 *         description: No token provided or invalid token
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Note not found
 */
router.post("/:id/attachments",auth,upload.array("attachments",5),asyncHandler(uploadAttachment));


/**
 * @swagger
 * /api/v1/notes/{noteId}/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete note attachment
 *     description: Deletes an attachment from a note owned by the authenticated user.
 *     tags:
 *       - Notes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attachment ID
 *     responses:
 *       200:
 *         description: Attachment deleted successfully
 *       401:
 *         description: No token provided or invalid token
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Note or attachment not found
 */
router.delete("/:noteId/attachments/:attachmentId",auth,asyncHandler(deleteAttachment));

module.exports=router;
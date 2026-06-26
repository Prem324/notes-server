const express=require("express");
const router=express.Router();
const asyncHandler=require("../middleware/asyncHandler");
const auth=require("../middleware/auth");
const {getProfile,uploadProfilePicture,deleteProfilePicture}=require("../controllers/userController");

const upload=require("../middleware/upload");


/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Returns the authenticated user's profile.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       401:
 *         description: No token provided or invalid token
 *       404:
 *         description: User not found
 */
router.get("/profile",auth,asyncHandler(getProfile));


/**
 * @swagger
 * /api/v1/users/profile-picture:
 *   patch:
 *     summary: Upload profile picture
 *     description: Uploads or replaces the authenticated user's profile picture.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 *       400:
 *         description: Invalid file or file too large
 *       401:
 *         description: No token provided or invalid token
 *       404:
 *         description: User not found
 */
router.patch("/profile-picture",auth,upload.single("profilePicture"),asyncHandler(uploadProfilePicture));


/**
 * @swagger
 * /api/v1/users/profile-picture:
 *   delete:
 *     summary: Delete profile picture
 *     description: Deletes the authenticated user's profile picture.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile picture deleted successfully
 *       401:
 *         description: No token provided or invalid token
 *       404:
 *         description: User not found
 */
router.delete("/profile-picture",auth,asyncHandler(deleteProfilePicture));

module.exports=router;
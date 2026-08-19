const express=require("express");
const router=express.Router();
const validate=require("../middleware/validate");
const asyncHandler=require("../middleware/asyncHandler");
const auth=require("../middleware/auth");
const {loginLimiter,registerLimiter,forgotPasswordLimiter}=require("../middleware/rateLimiter");

const {registerSchema,loginSchema,forgotPasswordSchema,resetPasswordSchema,resendVerificationSchema}=require("../validators/authValidator");

const {
    register,
    login,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail
} = require("../controllers/authController");

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register user
 *     description: Creates a new user account.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Prem
 *               email:
 *                 type: string
 *                 example: prem@example.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post("/register",
    validate(registerSchema),
    registerLimiter,
    asyncHandler(register)
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     description: Logs in a registered user and returns a JWT token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: prem@example.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *         content:
 *          application/json:
 *              schema:
 *                  $ref: '#/components/schemas/ErrorResponse' 
 *       401:
 *          description: Invalid credentials
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/ErrorResponse'
 *  
 */
router.post("/login",
    validate(loginSchema),
    loginLimiter,
    asyncHandler(login)
);  

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get auth profile
 *     description: Returns decoded user information from the JWT token.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       401:
 *         description: No token provided or invalid token
 */
router.get("/profile",auth,(req,res)=>{
    res.json({
        success:true,
        user:req.user
    });
});

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset link if an account exists for the provided email.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: prem@example.com
 *     responses:
 *       200:
 *         description: Password reset request processed successfully
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many password reset requests
 */
router.post(
    "/forgot-password",
    forgotPasswordLimiter,
    validate(forgotPasswordSchema),
    asyncHandler(forgotPassword)
);

/**
 * @swagger
 * /api/v1/auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     description: Resets the user's password using a valid password reset token.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: Password reset token received by email.
 *         schema:
 *           type: string
 *         example: 7f8c2a1b9d4e6f...
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 maxLength: 128
 *                 example: "NewPassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired password reset token, or validation error
 */
router.post(
    "/reset-password/:token",
    validate(resetPasswordSchema),
    asyncHandler(resetPassword)
);

/**
 * @swagger
 * /api/v1/auth/verify-email/{token}:
 *   get:
 *     summary: Verify email address
 *     description: Verifies the user's email address using the verification token received by email.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: Email verification token received by email.
 *         schema:
 *           type: string
 *         example: 7f8c2a1b9d4e6f...
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired email verification token
 */
router.get(
    "/verify-email/:token",
    asyncHandler(verifyEmail)
);

/**
 * @swagger
 * /api/v1/auth/resend-verification:
 *   post:
 *     summary: Resend email verification
 *     description: Sends a new email verification link if the account exists and has not been verified.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: prem@example.com
 *     responses:
 *       200:
 *         description: Verification email request processed successfully
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many verification email requests
 */
router.post(
    "/resend-verification",
    validate(resendVerificationSchema),
    registerLimiter,
    asyncHandler(resendVerificationEmail)
);

module.exports=router;
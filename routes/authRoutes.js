const express=require("express");
const router=express.Router();
const validate=require("../middleware/validate");
const asyncHandler=require("../middleware/asyncHandler");
const auth=require("../middleware/auth");
const {loginLimiter,registerLimiter}=require("../middleware/rateLimiter");

const {registerSchema}=require("../validators/authValidator");
const {register}=require("../controllers/authController");

const {login}=require("../controllers/authController");
const {loginSchema}=require("../validators/authValidator");

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

module.exports=router;
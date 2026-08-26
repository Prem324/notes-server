process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecret";
process.env.MONGO_URI = "mongodb://localhost/test";

jest.mock("../middleware/rateLimiter", () => ({
    loginLimiter: (req, res, next) => next(),
    registerLimiter: (req, res, next) => next(),
    forgotPasswordLimiter: (req, res, next) => next(),
}));

jest.mock("../services/emailService", () => ({
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

const request = require("supertest");
const app = require("../app");

const User = require("../models/User");

const {
    connectTestDB,
    clearTestDB,
    closeTestDB,
} = require("./setupTestDB");


beforeAll(async () => {
    process.env.JWT_SECRET = "testsecret";

    await connectTestDB();
});


afterEach(async () => {
    await clearTestDB();
});


afterAll(async () => {
    await closeTestDB();
});


/*
|--------------------------------------------------------------------------
| Helper: Register + Login
|--------------------------------------------------------------------------
*/

const registerAndLogin = async (
    name,
    email,
    password = "Password123"
) => {

    await request(app)
        .post("/api/v1/auth/register")
        .send({
            name,
            email,
            password,
        });

    await User.updateOne({ email }, { emailVerified: true });

    const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email,
            password,
        });

    return loginResponse.body.data.accessToken;
};


/*
|--------------------------------------------------------------------------
| Helper: Create Admin
|--------------------------------------------------------------------------
*/

const createAdminAndLogin = async () => {

    const email = "admin@gmail.com";

    await request(app)
        .post("/api/v1/auth/register")
        .send({
            name: "Admin",
            email,
            password: "Password123",
        });

    await User.findOneAndUpdate(
        { email },
        {
            role: "admin",
            emailVerified: true,
        }
    );

    return await request(app)
        .post("/api/v1/auth/login")
        .send({
            email,
            password: "Password123",
        })
        .then(response => response.body.data.accessToken);
};


/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD
|--------------------------------------------------------------------------
*/

describe("Admin Dashboard Routes", () => {

    test(
        "GET /api/v1/admin/dashboard should allow admin",
        async () => {

            const token =
                await createAdminAndLogin();

            const response = await request(app)
                .get("/api/v1/admin/dashboard")
                .set(
                    "Authorization",
                    `Bearer ${token}`
                );

            expect(response.statusCode)
                .toBe(200);

            expect(response.body.success)
                .toBe(true);
        }
    );


    test(
        "GET /api/v1/admin/dashboard should reject normal user",
        async () => {

            const token =
                await registerAndLogin(
                    "Prem",
                    "prem@gmail.com"
                );

            const response = await request(app)
                .get("/api/v1/admin/dashboard")
                .set(
                    "Authorization",
                    `Bearer ${token}`
                );

            expect(response.statusCode)
                .toBe(403);

            expect(response.body.success)
                .toBe(false);

            expect(response.body.message)
                .toBe("Access denied");
        }
    );


    test(
        "GET /api/v1/admin/dashboard should reject unauthenticated request",
        async () => {

            const response = await request(app)
                .get("/api/v1/admin/dashboard");

            expect(response.statusCode)
                .toBe(401);

            expect(response.body.success)
                .toBe(false);
        }
    );

});


/*
|--------------------------------------------------------------------------
| GET USERS
|--------------------------------------------------------------------------
*/

describe("Admin User Routes", () => {

    test(
        "GET /api/v1/admin/users should allow admin",
        async () => {

            const token =
                await createAdminAndLogin();

            await request(app)
                .post("/api/v1/auth/register")
                .send({
                    name: "Prem",
                    email: "prem@gmail.com",
                    password: "Password123",
                });

            const response = await request(app)
                .get("/api/v1/admin/users")
                .set(
                    "Authorization",
                    `Bearer ${token}`
                );

            expect(response.statusCode)
                .toBe(200);

            expect(response.body.success)
                .toBe(true);

            expect(response.body.data)
                .toBeDefined();
        }
    );


    test(
        "GET /api/v1/admin/users should reject normal user",
        async () => {

            const token =
                await registerAndLogin(
                    "Prem",
                    "prem@gmail.com"
                );

            const response = await request(app)
                .get("/api/v1/admin/users")
                .set(
                    "Authorization",
                    `Bearer ${token}`
                );

            expect(response.statusCode)
                .toBe(403);

            expect(response.body.success)
                .toBe(false);

            expect(response.body.message)
                .toBe("Access denied");
        }
    );


    test(
        "GET /api/v1/admin/users should reject unauthenticated request",
        async () => {

            const response = await request(app)
                .get("/api/v1/admin/users");

            expect(response.statusCode)
                .toBe(401);

            expect(response.body.success)
                .toBe(false);
        }
    );

});


/*
|--------------------------------------------------------------------------
| GET USER BY ID
|--------------------------------------------------------------------------
*/

describe("Admin Get User By ID", () => {

    test(
        "GET /api/v1/admin/users/:userId should allow admin",
        async () => {

            const token =
                await createAdminAndLogin();

            const userResponse = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    name: "Prem",
                    email: "prem@gmail.com",
                    password: "Password123",
                });

            const userId =
                userResponse.body.data.id;

            const response = await request(app)
                .get(
                    `/api/v1/admin/users/${userId}`
                )
                .set(
                    "Authorization",
                    `Bearer ${token}`
                );

            expect(response.statusCode)
                .toBe(200);

            expect(response.body.success)
                .toBe(true);

            expect(response.body.data)
                .toBeDefined();
        }
    );


    test(
        "GET /api/v1/admin/users/:userId should reject normal user",
        async () => {

            const token =
                await registerAndLogin(
                    "Prem",
                    "prem@gmail.com"
                );

            const response = await request(app)
                .get(
                    "/api/v1/admin/users/000000000000000000000000"
                )
                .set(
                    "Authorization",
                    `Bearer ${token}`
                );

            expect(response.statusCode)
                .toBe(403);

            expect(response.body.message)
                .toBe("Access denied");
        }
    );

});


/*
|--------------------------------------------------------------------------
| UPDATE USER ROLE
|--------------------------------------------------------------------------
*/

describe("Admin Update User Role", () => {

    test(
        "PATCH /api/v1/admin/users/:userId/role should allow admin",
        async () => {

            const adminToken =
                await createAdminAndLogin();

            const userResponse =
                await request(app)
                    .post("/api/v1/auth/register")
                    .send({
                        name: "Prem",
                        email: "prem@gmail.com",
                        password: "Password123",
                    });

            const userId =
                userResponse.body.data.id;

            const response = await request(app)
                .patch(
                    `/api/v1/admin/users/${userId}/role`
                )
                .set(
                    "Authorization",
                    `Bearer ${adminToken}`
                )
                .send({
                    role: "admin",
                });

            expect(response.statusCode)
                .toBe(200);

            expect(response.body.success)
                .toBe(true);

            expect(response.body.message)
                .toBe(
                    "User role updated successfully"
                );

            expect(response.body.data.role)
                .toBe("admin");

            const updatedUser =
                await User.findById(userId);

            expect(updatedUser.role)
                .toBe("admin");
        }
    );


    test(
        "PATCH /api/v1/admin/users/:userId/role should reject normal user",
        async () => {

            const userToken =
                await registerAndLogin(
                    "Prem",
                    "prem@gmail.com"
                );

            const targetResponse =
                await request(app)
                    .post("/api/v1/auth/register")
                    .send({
                        name: "Rahul",
                        email: "rahul@gmail.com",
                        password: "Password123",
                    });

            const targetUserId =
                targetResponse.body.data.id;

            const response = await request(app)
                .patch(
                    `/api/v1/admin/users/${targetUserId}/role`
                )
                .set(
                    "Authorization",
                    `Bearer ${userToken}`
                )
                .send({
                    role: "admin",
                });

            expect(response.statusCode)
                .toBe(403);

            expect(response.body.success)
                .toBe(false);

            expect(response.body.message)
                .toBe("Access denied");
        }
    );


    test(
        "PATCH /api/v1/admin/users/:userId/role should reject invalid role",
        async () => {

            const adminToken =
                await createAdminAndLogin();

            const userResponse =
                await request(app)
                    .post("/api/v1/auth/register")
                    .send({
                        name: "Prem",
                        email: "prem@gmail.com",
                        password: "Password123",
                    });

            const userId =
                userResponse.body.data.id;

            const response = await request(app)
                .patch(
                    `/api/v1/admin/users/${userId}/role`
                )
                .set(
                    "Authorization",
                    `Bearer ${adminToken}`
                )
                .send({
                    role: "superadmin",
                });

            expect(response.statusCode)
                .toBe(400);

            expect(response.body.success)
                .toBe(false);
        }
    );

});


/*
|--------------------------------------------------------------------------
| DELETE USER
|--------------------------------------------------------------------------
*/

describe("Admin Delete User", () => {

    test(
        "DELETE /api/v1/admin/users/:userId should allow admin",
        async () => {

            const adminToken =
                await createAdminAndLogin();

            const userResponse =
                await request(app)
                    .post("/api/v1/auth/register")
                    .send({
                        name: "Prem",
                        email: "prem@gmail.com",
                        password: "Password123",
                    });

            const userId =
                userResponse.body.data.id;

            const response = await request(app)
                .delete(
                    `/api/v1/admin/users/${userId}`
                )
                .set(
                    "Authorization",
                    `Bearer ${adminToken}`
                );

            expect(response.statusCode)
                .toBe(200);

            expect(response.body.success)
                .toBe(true);

            const deletedUser =
                await User.findById(userId);

            expect(deletedUser)
                .toBeNull();
        }
    );


    test(
        "DELETE /api/v1/admin/users/:userId should reject normal user",
        async () => {

            const userToken =
                await registerAndLogin(
                    "Prem",
                    "prem@gmail.com"
                );

            const targetResponse =
                await request(app)
                    .post("/api/v1/auth/register")
                    .send({
                        name: "Rahul",
                        email: "rahul@gmail.com",
                        password: "Password123",
                    });

            const targetUserId =
                targetResponse.body.data.id;

            const response = await request(app)
                .delete(
                    `/api/v1/admin/users/${targetUserId}`
                )
                .set(
                    "Authorization",
                    `Bearer ${userToken}`
                );

            expect(response.statusCode)
                .toBe(403);

            expect(response.body.success)
                .toBe(false);

            expect(response.body.message)
                .toBe("Access denied");

            const user =
                await User.findById(targetUserId);

            expect(user)
                .not.toBeNull();
        }
    );


    test(
        "DELETE /api/v1/admin/users/:userId should reject deleting own admin account",
        async () => {

            const adminToken =
                await createAdminAndLogin();

            const admin =
                await User.findOne({
                    email: "admin@gmail.com",
                });

            const response = await request(app)
                .delete(
                    `/api/v1/admin/users/${admin._id}`
                )
                .set(
                    "Authorization",
                    `Bearer ${adminToken}`
                );

            expect(response.statusCode)
                .toBe(400);

            expect(response.body.success)
                .toBe(false);

            expect(response.body.message)
                .toBe(
                    "You cannot delete your own admin account"
                );

            const adminStillExists =
                await User.findById(admin._id);

            expect(adminStillExists)
                .not.toBeNull();
        }
    );

});

const User = require("../models/User");
const AppError = require("../utils/AppError");
const Note = require("../models/Note");

const getAdminDashboard = async () => {

    const totalUsers = await User.countDocuments();

    const totalNotes = await Note.countDocuments();

    const verifiedUsers = await User.countDocuments({
        emailVerified: true,
    });

    const adminUsers = await User.countDocuments({
        role: "admin",
    });

    return {
        totalUsers,
        totalNotes,
        verifiedUsers,
        adminUsers,
    };
};

const updateUserRole = async (userId, role) => {

    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(
            "User not found",
            404
        );
    }

    user.role = role;

    await user.save();

    return user;
};

const getAdminUsers = async ({
    page = 1,
    limit = 10,
    search,
    role,
    emailVerified,
}) => {

    const currentPage = Math.max(
        Number(page) || 1,
        1
    );

    const currentLimit = Math.min(
        Math.max(Number(limit) || 10, 1),
        100
    );

    const skip =
        (currentPage - 1) * currentLimit;

    const filter = {};

    // Search by name or email
    if (search) {
        filter.$or = [
            {
                name: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                email: {
                    $regex: search,
                    $options: "i",
                },
            },
        ];
    }

    // Filter by role
    if (role) {
        filter.role = role;
    }

    // Filter by email verification
    if (emailVerified !== undefined) {
        filter.emailVerified =
            emailVerified === true ||
            emailVerified === "true";
    }

    const [
        users,
        totalUsers,
    ] = await Promise.all([
        User.find(filter)
            .select(
                "_id name email emailVerified role profilePicture createdAt updatedAt"
            )
            .sort({
                createdAt: -1,
            })
            .skip(skip)
            .limit(currentLimit),

        User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(
        totalUsers / currentLimit
    );

    return {
        users,
        pagination: {
            totalUsers,
            currentPage,
            totalPages,
            limit: currentLimit,
            hasNextPage:
                currentPage < totalPages,
            hasPrevPage:
                currentPage > 1,
        },
    };
};

const getAdminUserById = async (userId) => {
    const user = await User.findById(userId)
        .select(
            "_id name email emailVerified role profilePicture createdAt updatedAt"
        );

    if (!user) {
        throw new AppError(
            "User not found",
            404
        );
    }

    return user;
};

const deleteAdminUser = async (userId, adminId) => {

    // Prevent admin from deleting themselves
    if (userId.toString() === adminId.toString()) {
        throw new AppError(
            "You cannot delete your own admin account",
            400
        );
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(
            "User not found",
            404
        );
    }

    await User.findByIdAndDelete(userId);

    return user;
};

module.exports = {
    getAdminDashboard,
    updateUserRole,
    getAdminUsers,
    getAdminUserById,
    deleteAdminUser
};
const adminService = require("../services/adminService");
const { sendSuccess } = require("../utils/apiResponse");

const getAdminDashboard = async (req, res) => {

    const stats =
        await adminService.getAdminDashboard();

    return sendSuccess(
        res,
        200,
        "Admin dashboard fetched successfully",
        {
            stats,
        }
    );
};


const updateUserRole = async (req, res) => {

    const { userId } = req.params;
    const { role } = req.body;

    const user =
        await adminService.updateUserRole(
            userId,
            role
        );

    return sendSuccess(
        res,
        200,
        "User role updated successfully",
        {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        }
    );
};

const getAdminUsers = async (req, res) => {

    const {
        page,
        limit,
        search,
        role,
        emailVerified,
    } = req.query;

    const result =
        await adminService.getAdminUsers({
            page,
            limit,
            search,
            role,
            emailVerified,
        });

    return sendSuccess(
        res,
        200,
        "Users fetched successfully",
        result
    );
};

const getAdminUserById = async (req, res) => {
    const { userId } = req.params;

    const user =
        await adminService.getAdminUserById(userId);

    return sendSuccess(
        res,
        200,
        "User fetched successfully",
        {
            user,
        }
    );
};

const deleteAdminUser = async (req, res) => {

    const { userId } = req.params;

    const adminId = req.user.id;

    await adminService.deleteAdminUser(
        userId,
        adminId
    );

    return sendSuccess(
        res,
        200,
        "User deleted successfully"
    );
};


module.exports = {
    getAdminDashboard,
    updateUserRole,
    getAdminUsers,
    getAdminUserById,
    deleteAdminUser
};
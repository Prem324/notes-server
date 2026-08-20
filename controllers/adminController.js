const adminService = require("../services/adminService");
const { sendSuccess } = require("../utils/apiResponse");

const getAdminDashboard = async (req, res) => {
    return sendSuccess(
        res,
        200,
        "Admin access granted",
        {
            user: req.user,
        }
    );
};


const updateUserRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    const user = await adminService.updateUserRole(
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


module.exports = {
    getAdminDashboard,
    updateUserRole,
};
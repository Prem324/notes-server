const User = require("../models/User");
const AppError = require("../utils/AppError");

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


module.exports = {
    updateUserRole,
};
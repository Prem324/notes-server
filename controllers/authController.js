const authService=require("../services/authService");
const {sendSuccess}=require("../utils/apiResponse");

const register=async (req,res)=>{
    const user=await authService.registerUser(req.body);
    return sendSuccess(
        res,201,"User registered successfully",
    {
        id:user._id,
        name:user.name,
        email:user.email,
    }
);
};

const login = async (req, res) => {
    const { email, password } = req.body;

    const { accessToken, refreshToken } =
        await authService.loginUser(
            email,
            password
        );

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(
        res,
        200,
        "Login successful",
        {
            accessToken,
        }
    );
};

const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    const result =
        await authService.refreshAccessToken(
            refreshToken
        );

    res.cookie(
        "refreshToken",
        result.refreshToken,
        {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",
            maxAge:
                7 * 24 * 60 * 60 * 1000,
        }
    );

    return sendSuccess(
        res,
        200,
        "Access token refreshed successfully",
        {
            accessToken: result.accessToken,
        }
    );
};

const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    await authService.logoutUser(refreshToken);

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
            process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
    });

    return sendSuccess(
        res,
        200,
        "Logout successful"
    );
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    return sendSuccess(
        res,
        200,
        result.message
    );
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const result = await authService.resetPassword(
        token,
        password
    );

    return sendSuccess(
        res,
        200,
        result.message
    );
};

const verifyEmail = async (req, res) => {
    const { token } = req.params;

    const result = await authService.verifyEmail(token);

    return sendSuccess(
        res,
        200,
        result.message
    );
};

const resendVerificationEmail = async (req, res) => {
    const { email } = req.body;

    const result =
        await authService.resendVerificationEmail(email);

    return sendSuccess(
        res,
        200,
        result.message
    );
};

module.exports={
    register,
    login,
    refresh,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail
};
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

const login=async(req,res)=>{
    const{email,password}=req.body;

    const token=await authService.loginUser(email,password);
    return sendSuccess(
        res,200,"Login successful",
        {
            token,
        }
    );
}

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

module.exports={register,login,forgotPassword,resetPassword,verifyEmail,resendVerificationEmail};
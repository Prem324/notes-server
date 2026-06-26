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

module.exports={register,login};
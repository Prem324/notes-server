const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const User=require("../models/User");
const AppError=require("../utils/AppError");
const config=require("../config/env");

const loginUser=async(email,password)=>{
    const user=await User.findOne({email}).select("+password");

    if (!user) {
        throw new AppError(
            "Invalid credentials",
            401
    )
}

    const isMatch=await bcrypt.compare(password,user.password);

    if (!isMatch) {
        throw new AppError(
            "Invalid credentials",
            401
        )
}

    const token=jwt.sign({
        id:user._id,
        role:user.role
    },
    config.jwtSecret,
    {
        expiresIn:config.jwtExpiresIn,
    }
);

return token;
};


const registerUser=async(data)=>{
    const existingUser=await User.findOne({email:data.email});
    if (existingUser) {
        throw new AppError(
            "Email already exists",
            409
        )
}

    const hashedPassword=await bcrypt.hash(data.password,10);
    return await User.create({
        name:data.name,
        email:data.email,
        password:hashedPassword
    });
};

module.exports={registerUser,loginUser};
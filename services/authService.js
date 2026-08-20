const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const crypto=require("crypto");

const User=require("../models/User");
const AppError=require("../utils/AppError");
const config=require("../config/env");
const {sendPasswordResetEmail,sendVerificationEmail}=require("./emailService");

const registerUser=async(data)=>{
    const existingUser=await User.findOne({email:data.email});
    if (existingUser) {
        throw new AppError(
            "Email already exists",
            409
        )
}

    const hashedPassword=await bcrypt.hash(
        data.password,
        10
    )

    const user = await User.create({
        name: data.name,
        email: data.email,
        password: hashedPassword
    });    

    const verificationToken=
    await generateEmailVerificationToken(user);

    await sendVerificationEmail(
        user.email,
        verificationToken
    );

    return user
};

const generateRefreshToken = () => {
    const refreshToken = crypto
        .randomBytes(64)
        .toString("hex");

    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    const refreshTokenExpires = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    return {
        refreshToken,
        refreshTokenHash,
        refreshTokenExpires,
    };
};

const loginUser=async(email,password)=>{
    const user=await User.findOne({email}).select("+password");

    if (!user) {
        throw new AppError(
            "Invalid credentials",
            401
    )
}

if (!user.emailVerified){
    throw new AppError(
        "Please verify your email before logging in",
        403
    )
}

    const isMatch=await bcrypt.compare(password,user.password);

    if (!isMatch) {
        throw new AppError(
            "Invalid credentials",
            401
        )
}

// Generate short-lived access token (JWT)
    const accessToken=jwt.sign({
        id:user._id,
        role:user.role
    },
    config.jwtSecret,
    {
        expiresIn:config.jwtExpiresIn,
    }
);
// Generate long-lived refresh token
    const {
        refreshToken,
        refreshTokenHash,
        refreshTokenExpires,
    } = generateRefreshToken();

    // Store only the hashed refresh token in the database
    user.refreshTokenHash = refreshTokenHash;
    user.refreshTokenExpires = refreshTokenExpires;

    await user.save();

    return {
        accessToken,
        refreshToken,
    };
};

const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new AppError(
            "Refresh token is required",
            401
        );
    }

    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    const user = await User.findOne({
        refreshTokenHash,
        refreshTokenExpires: {
            $gt: new Date(),
        },
    });

    if (!user) {
        throw new AppError(
            "Invalid or expired refresh token",
            401
        );
    }

    // Generate new refresh token
    const newRefreshToken = crypto
        .randomBytes(32)
        .toString("hex");

    // Hash new refresh token
    const newRefreshTokenHash = crypto
        .createHash("sha256")
        .update(newRefreshToken)
        .digest("hex");

    // Set new expiry
    const newRefreshTokenExpires = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // Replace old refresh token
    user.refreshTokenHash = newRefreshTokenHash;
    user.refreshTokenExpires = newRefreshTokenExpires;

    await user.save();

    // Generate new access token
    const accessToken = jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        config.jwtSecret,
        {
            expiresIn: "15m",
        }
    );

    return {
        accessToken,
        refreshToken: newRefreshToken,
    };
};
    
    

const logoutUser = async (refreshToken) => {
    if (!refreshToken) {
        return;
    }

    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    await User.findOneAndUpdate(
        {
            refreshTokenHash,
        },
        {
            $unset: {
                refreshTokenHash: 1,
                refreshTokenExpires: 1,
            },
        }
    );
};

const forgotPassword=async(email)=>{
    const user=await User.findOne({email});

    const genericMessage="If a user with that email exists, a password reset link has been sent to the email address provided.";

    if (!user) {
        return {
            message:genericMessage
        };
    }

    // generate token
    const resetToken=crypto
    .randomBytes(32)
    .toString("hex");

    // hash token and set to resetPasswordToken field
    const resetTokenHash=crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

    const resetPasswordTokenExpires=new Date(
        Date.now()+15*60*1000
    )

    user.resetPasswordTokenHash=resetTokenHash;
    user.resetPasswordTokenExpires=resetPasswordTokenExpires;

    await user.save();
    
    try {
        await sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
        user.resetPasswordTokenHash = undefined;
        user.resetPasswordTokenExpires = undefined;
        await user.save();
        throw error;
    }    

    return {
        message:genericMessage
    };
}    

const resetPassword = async (token, newPassword) => {
    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordTokenHash: tokenHash,
        resetPasswordTokenExpires: {
            $gt: new Date(),
        },
    }).select("+password");

    if (!user) {
        throw new AppError(
            "Invalid or expired password reset token",
            400
        );
    }

    const hashedPassword = await bcrypt.hash(
        newPassword,
        10
    );

    user.password = hashedPassword;

    user.resetPasswordTokenHash = undefined;
    user.resetPasswordTokenExpires = undefined;

    await user.save();

    return {
        message: "Password reset successfully",
    };
};

const generateEmailVerificationToken = async (user) => {
    const verificationToken = crypto
        .randomBytes(32)
        .toString("hex");

    const verificationTokenHash = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

    user.emailVerificationTokenHash = verificationTokenHash;

    user.emailVerificationTokenExpires = new Date(
        Date.now() + 15 * 60 * 1000
    );

    await user.save();

    return verificationToken;
};

const verifyEmail = async (token) => {
    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        emailVerificationTokenHash: tokenHash,
        emailVerificationTokenExpires: {
            $gt: new Date(),
        },
    });

    if (!user) {
        throw new AppError(
            "Invalid or expired email verification token",
            400
        );
    }

    user.emailVerified = true;

    user.emailVerificationTokenHash = undefined;
    user.emailVerificationTokenExpires = undefined;

    await user.save();

    return {
        message: "Email verified successfully",
    };
};

const resendVerificationEmail = async (email) => {
    const genericMessage =
        "If an account with that email exists, a verification email has been sent.";

    const user = await User.findOne({ email });

    if (!user) {
        return {
            message: genericMessage,
        };
    }

    if (user.emailVerified) {
        return {
            message: genericMessage,
        };
    }

    const verificationToken =
        await generateEmailVerificationToken(user);

    try {
        await sendVerificationEmail(
            user.email,
            verificationToken
        );
    } catch (error) {
        user.emailVerificationTokenHash = undefined;
        user.emailVerificationTokenExpires = undefined;

        await user.save();

        throw error;
    }

    return {
        message: genericMessage,
    };
};

module.exports={
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    generateEmailVerificationToken,
    verifyEmail,
    resendVerificationEmail,
    refreshAccessToken,
    logoutUser,
};
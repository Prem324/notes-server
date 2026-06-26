const User=require('../models/User');
const uploadService=require("./uploadService");
const mediaService=require("./mediaService");
const AppError=require("../utils/AppError");

const getProfile=async(userId)=>{
    return await User.findById(userId)
    .select("-password")
    .populate(
        "notes",
        "title content createdAt"
    );
};


const uploadProfilePicture=async(userId,file)=>{

    const user=await User.findById(userId);
    if(!user){
        throw new AppError("User not found",404);
    }
    const compressedBuffer=await uploadService.compressImage(file.buffer);

    const uploadedImage=await mediaService.uploadFile(compressedBuffer,"profile-pictures");

    if(user.profilePicture?.publicId){
        await mediaService.deleteFile(user.profilePicture.publicId);
    }

    user.profilePicture={
        url:uploadedImage.secure_url,
        publicId:uploadedImage.public_id,
    };

    await user.save();
    
    return user;
}

const deleteProfilePicture =
async(userId)=>{

    const user =
    await User.findById(userId);

    if(!user){
        throw new AppError(
            "User not found",404
        );
    }

    if(
        user.profilePicture?.publicId
    ){
        await mediaService.deleteFile(
            user.profilePicture.publicId
        );
    }

    user.profilePicture = null;

    await user.save();

    return user;
}


module.exports={getProfile,uploadProfilePicture,deleteProfilePicture};
const userService=require("../services/userService");
const getProfile=async(req,res)=>{
    const user=await userService.getProfile(req.user.id);

    res.status(200).json({
        success:true,
        data:user
    });
};

const uploadProfilePicture=async(req,res)=>{
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Profile picture is required",
        });
    }

    const user=
    await userService.uploadProfilePicture(
        req.user.id,
        req.file
    );

    res.status(200).json({
        success:true,
        message: "Profile picture uploaded successfully",
        data:user,
    });
};

const deleteProfilePicture =
async(req,res)=>{

    await userService
    .deleteProfilePicture(
        req.user.id
    );

    res.status(200).json({
        success:true,
        message:
        "Profile picture deleted"
    });
}

module.exports={getProfile,uploadProfilePicture,deleteProfilePicture};
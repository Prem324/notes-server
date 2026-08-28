const cloudinary =
    require("../config/cloudinary");

const {
    uploadToCloudinary
} = require("./uploadService");


const uploadFile = async (
    buffer,
    folder,
    resourceType = "image"
) => {

    return await uploadToCloudinary(
        buffer,
        folder,
        resourceType
    );
};


const deleteFile = async (publicId) => {

    return await cloudinary
        .uploader
        .destroy(publicId);
};


module.exports = {
    uploadFile,
    deleteFile,
};
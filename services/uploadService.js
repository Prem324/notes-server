const sharp=require("sharp");
const cloudinary=require("../config/cloudinary");
const streamifier=require("streamifier");


const compressImage=async(buffer)=>{
    return await sharp(buffer)
    .resize(500,500,{
        fit:"cover",
    })
    .webp({
        quality:80,
    })
    .toBuffer();
};

const uploadToCloudinary=async(buffer,folder)=>{
    return new Promise((resolve,reject)=>{
        const stream=cloudinary.uploader.upload_stream(
            {
                folder,
            },
            (error,result)=>{
                if(error) return reject(error);
                resolve(result);
            }
        );

        streamifier.createReadStream(buffer).pipe(stream);
    })
}

module.exports={compressImage,uploadToCloudinary};
const multer=require("multer");
const AppError=require("../utils/AppError");

const fileFilter=(req,file,cb)=>{
    const allowedTypes=[
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"

    ];

    if (allowedTypes.includes(file.mimetype)) {
        return cb(null, true);
    }
    
    cb(new AppError(
            "Only JPG, PNG, WEBP and PDF are allowed",400)
        );
    };


const upload=
multer({
    storage:multer.memoryStorage(),
    fileFilter,
    limits:{
        fileSize:5*1024*1024,
    }
});

module.exports=upload;
const mongoose=require("mongoose");

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        index:true
    },
    emailVerified: {
    type: Boolean,
    default: false
    },
    emailVerificationTokenHash: {
        type: String,
        select: false
    },
    emailVerificationTokenExpires: {
        type: Date,
        select: false
    },
    password:{
        type:String,
        required:true,
        select:false
    },
    resetPasswordTokenHash:{
        type:String,
        select:false
    },
    resetPasswordTokenExpires:{
        type:Date,
        select:false
    },
    profilePicture:{
        url:String,
        publicId:String,
    },
    role:{
        type:String,
        enum:[
            "user",
            "admin"
        ],
        default:"user"
    }
},{
    timestamps:true,
// Enableing Virtuals
    toJSON:{
        virtuals:true
    },
    toObject:{
        virtuals:true
    }
});

// Virtual Populate
userSchema.virtual("notes",{
    ref:"Note",
    localField:"_id",
    foreignField:"user",
});


module.exports=mongoose.model("User",userSchema);
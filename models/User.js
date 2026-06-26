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
    password:{
        type:String,
        required:true,
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
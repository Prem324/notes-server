const mongoose=require("mongoose");

const noteSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
        minlength:3,
        maxlength:100
    },
    content:{
        type:String,
        required:true,
    },
    attachments:[
        {
        url:{
            type:String,
            required:true,
        },    
        publicId:{
            type:String,
            required:true,
        },   
        fileName:{
            type:String,
            required:true 
        },   
        fileType:{
            type:String,
            reqquired:true,
        },    
        size:{
            type:Number,
            required:true,
        },    
        uploadedAt:{
            type:Date,
            default:Date.now,
        }
        }
    ],  
    completed:{
        type:Boolean,
        default:false
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        index:true
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
})

//Virtual Populate
noteSchema.virtual(
    "comments",
    {
        ref:"Comment",
        localField:"_id",
        foreignField:"note"
    }
);

//Text Index
noteSchema.index({
    title:"text",
    content:"text",
});

//Schema-level index
noteSchema.index({
    user:1,
    createdAt:-1
});


module.exports=mongoose.model("Note",noteSchema);
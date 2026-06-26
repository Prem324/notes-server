const mongoose=require("mongoose");

const commentSchema=new mongoose.Schema({
    text:{
        type:String,
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    note:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Note",
        required:true
    }
},{
    timestamps:true
});

commentSchema.index({
    note:1,
});

commentSchema.index({
    user:1,
})

module.exports=mongoose.model("Comment",commentSchema);
const Comment=require("../models/Comment");
const Note=require("../models/Note");
const { error } = require("../validators/noteValidator");
const AppError=require("../utils/AppError");

const createComment=async(text,noteId,userId)=>{
    const note=await Note.findById(noteId);

    if(!note){
        throw new AppError(
            "Note not found",
            404
        );
    }
    
    const comment = await Comment.create({
        text,
        note:noteId,
        user:userId
    });

    const populatedComment = await Comment.findById(comment._id)
        .populate("user", "name email")
        .populate("note", "title")
        .lean();

    return populatedComment;
};

const getCommentsByNote=async(noteId)=>{
    return await Comment.find({note:noteId})
    .populate(
        "user",
        "name email"
    )
    .populate(
        "note",
        "title content"
    )

    .sort({
        createdAt:-1
    })
    .lean()
}

module.exports={createComment,getCommentsByNote};
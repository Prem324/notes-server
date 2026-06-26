const commentService=require("../services/commentService");
const {sendSuccess}=require("../utils/apiResponse");
const {getIO}=require("../config/socket");

const createComment=async(req,res)=>{
    const comment=await commentService.createComment(
        req.body.text,
        req.params.noteId,
        req.user.id
    );

    try {
        const io = getIO();

        io.to(`note:${req.params.noteId}`).emit("comment:created", {
            noteId: req.params.noteId,
            comment,
        });
    } catch (error) {
        console.warn("Socket emit failed:", error.message);
    }
    return sendSuccess(
        res,201,"Comment created successfully",comment
    )
};

const getCommentsByNote=async(req,res)=>{
    const comments=await commentService.getCommentsByNote(req.params.noteId);

    return sendSuccess(
        res,200,"Comments fetched successfully",comments
    )
};

module.exports={createComment,getCommentsByNote};
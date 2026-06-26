const Note=require("../models/Note");
const Comment=require("../models/Comment");

const getNotesPerUser=async()=>{
    return await Note.aggregate([
        {
            $group:{
                _id:"$user",
                totalNotes:{
                    $sum:1,
                },
            },
        },

        {
            $lookup:{
                from:"users",
                localField:"_id",
                foreignField:"_id",
                as:"user",
            },
        },

        {
            $unwind:"$user",
        },

        {
            $project:{
                _id:0,
                userId:"$user._id",
                name:"$user.name",
                email:"$user.email",
                totalNotes:1,
            },
        },

        {
            $sort:{
                totalNotes:-1,
            },
        },
    ]);
};

const getCommentsPerNote=async()=>{
    return await Comment.aggregate([
        {
            $group:{
                _id:"$note",
                totalComments:{
                    $sum:1,
                },
            },
        },

        {
            $lookup:{
                from:"notes",
                localField:"_id",
                foreignField:"_id",
                as:"note",
            },
        },

        {
            $unwind:"$note",
        },

        {
            $project:{
                _id:0,
                noteId:"$note._id",
                title:"$note.title",
                totalComments:1,
            },
        },

        {
            $sort:{
                totalComments:-1,
            },
        },
        {
            $limit:3
        }
    ]);
};

const getMostActiveUser=async()=>{
    return await Note.aggregate([
        {
            $group:{
                _id:"$user",
                totalNotes:{
                    $sum:1,
                },
            },
        },

        {
            $lookup:{
                from:"users",
                localField:"_id",
                foreignField:"_id",
                as:"user",
            },
        },

        {
            $unwind:"$user",
        },

        
        {
            $sort:{
                totalNotes:-1,
            },
        },
        {
            $limit:1
        },
        {
            $project:{
                _id:0,
                userId:"$user._id",
                name:"$user.name",
                email:"$user.email",
                totalNotes:1,
            },
        },  
    ]);
};

const getMonthlyNotes=async()=>{
    const now=new Date();
    const startOfMonth=new Date(now.getFullYear(),now.getMonth(),1);
    const startOfNextMonth=new Date(now.getFullYear(),now.getMonth()+1,1);

    const result=await Note.aggregate([
        {
            $match:{
                createdAt:{
                    $gte:startOfMonth,
                    $lt:startOfNextMonth,
                },
            },
        },

        {
            $group:{
                _id:null,
                totalNotes:{
                    $sum:1,
                },
            },
        },
    ]);
    return result[0] || {
        totalNotes:0,
    };
};

module.exports={getNotesPerUser,getCommentsPerNote,getMostActiveUser,getMonthlyNotes}
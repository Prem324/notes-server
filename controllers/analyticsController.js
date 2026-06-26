const analyticsService=require("../services/analyticsService");
const {sendSuccess}=require("../utils/apiResponse");
const {getCache,setCache}=require("../utils/cache");

const notesPerUser=async(req,res)=>{
    const data=await analyticsService.getNotesPerUser();

    return sendSuccess(
    res,
    200,
    "Notes per user fetched successfully",
    data
);
};

const commentsPerUser=async(req,res)=>{
    const data=await analyticsService.getCommentsPerNote();

    return sendSuccess(
    res,
    200,
    "Comments per note fetched successfully",
    data
);
};

const mostActiveUser=async(req,res)=>{
    const data=await analyticsService.getMostActiveUser();

    return sendSuccess(
    res,
    200,
    "Most active user fetched successfully",
    data
);
};

const monthlyNotes=async(req,res)=>{
    const data=await analyticsService.getMonthlyNotes();

    return sendSuccess(
    res,
    200,
    "Monthly notes fetched successfully",
    data
);
};

const getMostActiveUser = async (req, res) => {
    const cacheKey = "analytics:most-active-user";

    const cachedData = getCache(cacheKey);

    if (cachedData) {
        return sendSuccess(
            res,
            200,
            "Most active user fetched successfully from cache",
            cachedData
        );
    }

    const result = await analyticsService.getMostActiveUser();

    setCache(cacheKey, result, 60);

    return sendSuccess(
        res,
        200,
        "Most active user fetched successfully from database",
        result
    );
};
module.exports={notesPerUser,commentsPerUser,mostActiveUser,monthlyNotes,getMostActiveUser};
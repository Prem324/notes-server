
const { sendSuccess } = require("../utils/apiResponse");
const {
    getActivityForNote,
} = require("../services/noteActivityService");

const getNoteActivity = async (req, res) => {
    const page = Math.max(
        parseInt(req.query.page, 10) || 1,
        1
    );

    const limit = Math.min(
        Math.max(
            parseInt(req.query.limit, 10) || 20,
            1
        ),
        50
    );

    const result = await getActivityForNote({
        noteId: req.params.id,
        userId: req.user.id,
        role: req.user.role,
        page,
        limit,
    });

    return sendSuccess(
        res,
        200,
        "Note activity fetched successfully",
        result
    );
};

module.exports = {
    getNoteActivity,
};

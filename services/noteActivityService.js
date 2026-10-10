
const mongoose = require("mongoose");

const AppError = require("../utils/AppError");
const { getNoteAccess } = require("./noteAccessService");
const { getNoteActivity } = require("./auditService");

const getActivityForNote = async ({
    noteId,
    userId,
    role,
    page = 1,
    limit = 20,
}) => {
    // Validate before MongoDB attempts to cast the ID.
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
        throw new AppError("Invalid note ID", 400);
    }

    // Reuse the application's existing authorization rules.
    await getNoteAccess(noteId, userId, role);

    // Retrieve activity only after access has been confirmed.
    return getNoteActivity({
        noteId,
        page,
        limit,
    });
};

module.exports = {
    getActivityForNote,
};

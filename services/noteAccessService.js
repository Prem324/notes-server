const mongoose = require("mongoose");
const Note = require("../models/Note");
const NoteShare = require("../models/NoteShare");
const featureFlags = require("../config/featureFlags");
const AppError = require("../utils/AppError");

const getNoteAccess = async (noteId, userId, role) => {
    const note = await Note.findById(noteId);

    if (!note) {
        throw new AppError("Note not found", 404);
    }

    // Admin has full access
    if (role === "admin") {
        return {
            note,
            accessRole: "admin",
            canRead: true,
            canEdit: true,
            canDelete: true,
            canShare: true,
        };
    }

    // Owner has full access
    if (note.user.toString() === userId.toString()) {
        return {
            note,
            accessRole: "owner",
            canRead: true,
            canEdit: true,
            canDelete: true,
            canShare: true,
        };
    }

    // If note sharing is disabled, collaborators have no access
    if (!featureFlags.noteSharing) {
        throw new AppError(
            "Not authorized to access this note",
            403
        );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError(
        "Not authorized to access this note",
        403
    );
}

const share = await NoteShare.findOne({
    note: noteId,
    user: userId,
});

    if (!share) {
        throw new AppError(
            "Not authorized to access this note",
            403
        );
    }

    if (share.permission === "editor") {
        return {
            note,
            accessRole: "editor",
            canRead: true,
            canEdit: true,
            canDelete: false,
            canShare: false,
        };
    }

    return {
        note,
        accessRole: "viewer",
        canRead: true,
        canEdit: false,
        canDelete: false,
        canShare: false,
    };
};

module.exports = {
    getNoteAccess,
};
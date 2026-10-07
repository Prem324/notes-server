const NoteShare = require("../models/NoteShare");
const Note = require("../models/Note");
const User = require("../models/User");

const findManageableNote = async ({
    noteId,
    userId,
    role,
}) => {
    if (role === "admin") {
        const note = await Note.findById(noteId);

        if (!note) {
            const error = new Error("Note not found");
            error.statusCode = 404;
            throw error;
        }

        return note;
    }

    const note = await Note.findOne({
        _id: noteId,
        user: userId,
    });

    if (!note) {
        const error = new Error("Note not found");
        error.statusCode = 404;
        throw error;
    }

    return note;
};

const shareNote = async ({
    noteId,
    ownerId,
    userId,
    permission = "viewer",
    role,
}) => {
    const note = await findManageableNote({
        noteId,
        userId: ownerId,
        role,
    });

    if (String(note.user) === String(userId)) {
        const error = new Error(
            "Note owner cannot be added as a collaborator"
        );
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findById(userId);

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    const existingShare = await NoteShare.findOne({
        note: noteId,
        user: userId,
    });

    if (existingShare) {
        const error = new Error(
            "User already has access to this note"
        );
        error.statusCode = 409;
        throw error;
    }

    return NoteShare.create({
        note: noteId,
        user: userId,
        permission,
    });
};

const getNoteCollaborators = async ({
    noteId,
    ownerId,
    role,
}) => {
    await findManageableNote({
        noteId,
        userId: ownerId,
        role,
    });

    return NoteShare.find({
        note: noteId,
    })
        .populate("user", "name email")
        .sort({ createdAt: 1 });
};

const updateCollaboratorPermission = async ({
    noteId,
    ownerId,
    userId,
    permission,
    role,
}) => {
    await findManageableNote({
        noteId,
        userId: ownerId,
        role,
    });

    const share = await NoteShare.findOne({
        note: noteId,
        user: userId,
    });

    if (!share) {
        const error = new Error(
            "Collaborator not found"
        );
        error.statusCode = 404;
        throw error;
    }

    share.permission = permission;

    await share.save();

    return share;
};

const removeCollaborator = async ({
    noteId,
    ownerId,
    userId,
    role,
}) => {
    await findManageableNote({
        noteId,
        userId: ownerId,
        role,
    });

    const share =
        await NoteShare.findOneAndDelete({
            note: noteId,
            user: userId,
        });

    if (!share) {
        const error = new Error(
            "Collaborator not found"
        );
        error.statusCode = 404;
        throw error;
    }

    return share;
};

module.exports = {
    shareNote,
    getNoteCollaborators,
    updateCollaboratorPermission,
    removeCollaborator,
};
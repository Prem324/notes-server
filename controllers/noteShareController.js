const User = require("../models/User");

const noteShareService = require("../services/noteShareService");

const { sendSuccess } = require("../utils/apiResponse");

const shareNote = async (req, res) => {
    const { email, permission } = req.body;

    const user = await User.findOne({
        email: email.toLowerCase(),
    });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
            requestId: req.requestId,
        });
    }

    const share =
        await noteShareService.shareNote({
            noteId: req.params.id,
            ownerId: req.user.id,
            userId: user._id,
            permission,
            role: req.user.role,
        });

    return sendSuccess(
        res,
        201,
        "Note shared successfully",
        share
    );
};

const getNoteCollaborators = async (
    req,
    res
) => {
    const collaborators =
        await noteShareService.getNoteCollaborators({
            noteId: req.params.id,
            ownerId: req.user.id,
            role: req.user.role,
        });

    return sendSuccess(
        res,
        200,
        "Note collaborators fetched successfully",
        collaborators
    );
};

const updateCollaboratorPermission = async (
    req,
    res
) => {
    const share =
        await noteShareService.updateCollaboratorPermission(
            {
                noteId: req.params.id,
                ownerId: req.user.id,
                userId: req.params.userId,
                permission: req.body.permission,
                role: req.user.role,
            }
        );

    return sendSuccess(
        res,
        200,
        "Collaborator permission updated successfully",
        share
    );
};

const removeCollaborator = async (
    req,
    res
) => {
    await noteShareService.removeCollaborator({
        noteId: req.params.id,
        ownerId: req.user.id,
        userId: req.params.userId,
        role: req.user.role,
    });

    return sendSuccess(
        res,
        200,
        "Collaborator removed successfully",
        null
    );
};

module.exports = {
    shareNote,
    getNoteCollaborators,
    updateCollaboratorPermission,
    removeCollaborator,
};
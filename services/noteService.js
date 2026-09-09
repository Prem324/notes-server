const Note = require("../models/Note");
const mediaService = require("./mediaService");
const auditService = require("./auditService");
const AppError = require("../utils/AppError");
const logger=require("../config/logger");

// ============================================================
// GET ALL NOTES
// ============================================================

const getAllNotes = async (
    userId,
    role,
    page,
    limit,
    search
) => {

    const query = {};

    if (role !== "admin") {
        query.user = userId;
    }

    if (search) {
        query.$text = {
            $search: search,
        };
    }

    const totalNotes =
        await Note.countDocuments(query);

    const totalPages =
        Math.ceil(totalNotes / limit);

    const notes =
        await Note.find(query)
            .populate(
                "user",
                "name email role"
            )
            .skip(
                (page - 1) * limit
            )
            .limit(limit)
            .sort({
                createdAt: -1,
            })
            .lean();

    return {

        notes,

        pagination: {

            totalNotes,

            currentPage: page,

            totalPages,

            limit,

            hasNextPage:
                page < totalPages,

            hasPrevPage:
                page > 1,

        },

    };
};


// ============================================================
// GET NOTE BY ID
// ============================================================

const getNoteById = async (
    noteId,
    userId,
    role
) => {

    const note =
        await Note.findById(noteId);

    if (!note) {

        throw new AppError(
            "Note not found",
            404
        );

    }

    if (
        role !== "admin" &&
        note.user.toString() !== userId
    ) {

        throw new AppError(
            "Not authorized to access this note",
            403
        );

    }

    return note;
};


// ============================================================
// CREATE NOTE
// ============================================================

const createNote = async (
    data,
    userId,
    auditContext = {}
) => {

    const note =
        await Note.create({
            ...data,
            user: userId,
        });

    await auditService.log({

        userId,

        action: "NOTE_CREATED",

        resource: "Note",

        resourceId: note._id,

        metadata: {
            title: note.title,
        },

        ipAddress:
            auditContext.ipAddress || null,

        userAgent:
            auditContext.userAgent || null,

    });

    return note;
};


// ============================================================
// UPDATE NOTE
// ============================================================

const updateNote = async (
    id,
    data,
    userId,
    role,
    auditContext = {}
) => {

    const note =
        await Note.findById(id);

    if (!note) {

        throw new AppError(
            "Note not found",
            404
        );

    }

    if (
        role !== "admin" &&
        note.user.toString() !== userId
    ) {

        throw new AppError(
            "Not authorized to update this note",
            403
        );

    }

    note.title =
        data.title ?? note.title;

    note.content =
        data.content ?? note.content;

    note.completed =
        data.completed ?? note.completed;

    await note.save();

    await auditService.log({

        userId,

        action: "NOTE_UPDATED",

        resource: "Note",

        resourceId: note._id,

        metadata: {
            title: note.title,
            role,
        },

        ipAddress:
            auditContext.ipAddress || null,

        userAgent:
            auditContext.userAgent || null,

    });

    return note;
};


// ============================================================
// DELETE NOTE
// ============================================================

const deleteNote = async (
    noteId,
    userId,
    role,
    auditContext = {}
) => {

    const note =
        await Note.findById(noteId);

    if (!note) {

        throw new AppError(
            "Note not found",
            404
        );

    }

    if (
        role !== "admin" &&
        note.user.toString() !== userId
    ) {

        throw new AppError(
            "Not authorized to update this note",
            403
        );

    }

    // Delete Cloudinary attachments
    if (
        note.attachments &&
        note.attachments.length > 0
    ) {

        await Promise.all(

            note.attachments.map(
                async (attachment) => {

                    try {

                        if (
                            attachment.publicId
                        ) {

                            await mediaService.deleteFile(
                                attachment.publicId
                            );

                        }

                    } catch (error) {

                        logger.error(
                            {
                                service:"Cloudinary",
                                publicId:attachment.publicId,
                                error:{
                                    message:error.message,
                                },
                            },
                            "Cloudinary file deletion failed"
                        )

                    }

                }
            )

        );

    }

    await Note.findByIdAndDelete(
        noteId
    );

    await auditService.log({

        userId,

        action: "NOTE_DELETED",

        resource: "Note",

        resourceId: noteId,

        metadata: {
            title: note.title,
            role,
        },

        ipAddress:
            auditContext.ipAddress || null,

        userAgent:
            auditContext.userAgent || null,

    });

    return {
        message:
            "Note deleted successfully",
    };
};


// ============================================================
// GET NOTE WITH COMMENTS
// ============================================================

const getNoteWithComments =
    async (noteId) => {

        const note =
            await Note.findById(
                noteId
            )
                .populate(
                    "user",
                    "name email"
                )
                .populate({
                    path: "comments",
                    populate: {
                        path: "user",
                        select: "name email",
                    },
                });

        if (!note) {

            throw new AppError(
                "Note not found",
                404
            );

        }

        return note;
    };


// ============================================================
// UPLOAD ATTACHMENT
// ============================================================

const uploadAttachment = async (
    noteId,
    userId,
    attachments,
    role,
    auditContext = {}
) => {

    const note =
        await Note.findById(noteId);

    if (!note) {

        throw new AppError(
            "Note not found",
            404
        );

    }

    if (
        role !== "admin" &&
        note.user.toString() !== userId
    ) {

        throw new AppError(
            "Not authorized to update this note",
            403
        );

    }

    const updatedNote =
        await Note.findByIdAndUpdate(
            noteId,
            {
                $push: {
                    attachments: {
                        $each: attachments,
                    },
                },
            },
            {
                new: true,
            }
        );

    await auditService.log({

        userId,

        action: "ATTACHMENT_UPLOADED",

        resource: "Note",

        resourceId: noteId,

        metadata: {

            attachmentCount:
                attachments.length,

            role,

        },

        ipAddress:
            auditContext.ipAddress || null,

        userAgent:
            auditContext.userAgent || null,

    });

    return updatedNote;
};


// ============================================================
// DELETE ATTACHMENT
// ============================================================

const deleteAttachment =
    async (
        noteId,
        attachmentId,
        userId,
        role,
        auditContext = {}
    ) => {

        const note =
            await Note.findById(noteId);

        if (!note) {

            throw new AppError(
                "Note not found",
                404
            );

        }

        if (
            role !== "admin" &&
            note.user.toString() !== userId
        ) {

            throw new AppError(
                "Not authorized to update this note",
                403
            );

        }

        const attachment =
            note.attachments.find(
                item =>
                    item._id.toString() ===
                    attachmentId
            );

        if (!attachment) {

            throw new AppError(
                "Attachment not found",
                404
            );

        }

        await mediaService.deleteFile(
            attachment.publicId
        );

        note.attachments.pull(
            attachmentId
        );

        await note.save();

        await auditService.log({

            userId,

            action: "ATTACHMENT_DELETED",

            resource: "Note",

            resourceId: noteId,

            metadata: {

                attachmentId,

                fileName:
                    attachment.fileName,

                role,

            },

            ipAddress:
                auditContext.ipAddress || null,

            userAgent:
                auditContext.userAgent || null,

        });

        return note;
    };


module.exports = {

    getAllNotes,

    getNoteById,

    createNote,

    updateNote,

    deleteNote,

    getNoteWithComments,

    uploadAttachment,

    deleteAttachment,

};
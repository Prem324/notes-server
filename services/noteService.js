const Note = require("../models/Note");
const mediaService = require("./mediaService");
const auditService = require("./auditService");
const AppError = require("../utils/AppError");
const logger=require("../config/logger");
const tagService = require("./tagService");
const folderService = require("./folderService");
const { getNoteAccess } = require("./noteAccessService");
const NoteShare = require("../models/NoteShare");
const featureFlags = require("../config/featureFlags");

// ============================================================
// GET ALL NOTES
// ============================================================

// ============================================================
// GET ALL NOTES
// ============================================================

const getAllNotes = async (
    userId,
    role,
    page,
    limit,
    search,
    tag,
    folder
) => {

    const query = {};

    // --------------------------------------------
    // User access
    // --------------------------------------------

    if (role !== "admin") {

        let accessibleNoteIds = [];

        // Owner's notes
        const ownedNotes = await Note.find(
            { user: userId },
            { _id: 1 }
        ).lean();

        accessibleNoteIds = ownedNotes.map(
            note => note._id
        );

        // Shared notes
        if (featureFlags.noteSharing) {

            const sharedNotes = await NoteShare.find(
                { user: userId },
                { note: 1 }
            ).lean();

            const sharedNoteIds = sharedNotes.map(
                share => share.note
            );

            accessibleNoteIds = [
                ...accessibleNoteIds,
                ...sharedNoteIds,
            ];
        }

        query._id = {
            $in: accessibleNoteIds,
        };
    }

    // --------------------------------------------
    // Text search
    // --------------------------------------------

    if (search) {
        query.$text = {
            $search: search,
        };
    }

    // --------------------------------------------
    // Tag filter
    // --------------------------------------------

    if (tag) {
        query.tags = tag;
    }

    // --------------------------------------------
    // Folder filter
    // --------------------------------------------

    if (folder) {
        query.folder = folder;
    }

    // --------------------------------------------
    // Count filtered notes
    // --------------------------------------------

    const totalNotes =
        await Note.countDocuments(query);

    // --------------------------------------------
    // Calculate total pages
    // --------------------------------------------

    const totalPages =
        Math.ceil(totalNotes / limit);

    // --------------------------------------------
    // Fetch notes
    // --------------------------------------------

    const notes =
        await Note.find(query)
            .populate(
                "user",
                "name email role"
            )
            .populate("tags", "name")
            .populate("folder", "name")
            .skip(
                (page - 1) * limit
            )
            .limit(limit)
            .sort({
                createdAt: -1,
            })
            .lean();

    // --------------------------------------------
    // Add access role
    // --------------------------------------------

    if (role !== "admin") {

        const noteIds = notes.map(
            note => note._id
        );

        let shares = [];

        if (featureFlags.noteSharing) {

            shares = await NoteShare.find({
                note: { $in: noteIds },
                user: userId,
            })
                .select("note permission")
                .lean();
        }

        const shareMap = new Map(
            shares.map(share => [
                share.note.toString(),
                share.permission,
            ])
        );

        notes.forEach(note => {

            if (
                note.user &&
                note.user._id.toString() ===
                userId.toString()
            ) {

                note.accessRole = "owner";

            } else {

                const permission =
                    shareMap.get(
                        note._id.toString()
                    );

                note.accessRole =
                    permission === "editor"
                        ? "editor"
                        : "viewer";
            }
        });

    } else {

        notes.forEach(note => {
            note.accessRole = "admin";
        });
    }

    // --------------------------------------------
    // Response
    // --------------------------------------------

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

    const { note, accessRole } =
        await getNoteAccess(
            noteId,
            userId,
            role
        );

    await note.populate("tags", "name");
    await note.populate("folder", "name");

    return {
        ...note.toObject(),
        accessRole,
    };
};

// ============================================================
// CREATE NOTE
// ============================================================

const createNote = async (
    data,
    userId,
    auditContext = {}
) => {

    if (data.tags !== undefined) {
        await tagService.validateUserTags({
            tagIds: data.tags,
            userId,
        });
    }

    if (data.folder !== undefined) {
    await folderService.validateUserFolder({
        folderId: data.folder,
        userId,
    });
}

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

    const {
        note,
        accessRole,
        canEdit,
    } = await getNoteAccess(
        id,
        userId,
        role
    );

    // --------------------------------------------
    // Permission check
    // --------------------------------------------

    if (!canEdit) {
        throw new AppError(
            "Not authorized to update this note",
            403
        );
    }

    // --------------------------------------------
    // Validate tags against note owner
    // --------------------------------------------

    if (data.tags !== undefined) {

        const tagOwnerId =
            note.user.toString();

        await tagService.validateUserTags({
            tagIds: data.tags,
            userId: tagOwnerId,
        });

        note.tags = data.tags;
    }

    // --------------------------------------------
    // Validate folder against note owner
    // --------------------------------------------

    if (data.folder !== undefined) {

        const folderOwnerId =
            note.user.toString();

        await folderService.validateUserFolder({
            folderId: data.folder,
            userId: folderOwnerId,
        });

        note.folder = data.folder;
    }

    // --------------------------------------------
    // Update basic fields
    // --------------------------------------------

    note.title =
        data.title ?? note.title;

    note.content =
        data.content ?? note.content;

    note.completed =
        data.completed ?? note.completed;

    await note.save();

    // --------------------------------------------
    // Audit log
    // --------------------------------------------

    await auditService.log({

        userId,

        action: "NOTE_UPDATED",

        resource: "Note",

        resourceId: note._id,

        metadata: {
            title: note.title,
            role,
            accessRole,
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

    const {
        note,
        canDelete,
        accessRole,
    } = await getNoteAccess(
        noteId,
        userId,
        role
    );

    // --------------------------------------------
    // Delete permission
    // --------------------------------------------

    if (!canDelete) {
        throw new AppError(
            "Not authorized to delete this note",
            403
        );
    }

    // --------------------------------------------
    // Delete Cloudinary attachments
    // --------------------------------------------

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
                                service: "Cloudinary",
                                publicId:
                                    attachment.publicId,
                                error: {
                                    message:
                                        error.message,
                                },
                            },
                            "Cloudinary file deletion failed"
                        );

                    }

                }
            )

        );

    }

    // --------------------------------------------
    // Delete note
    // --------------------------------------------

    await Note.findByIdAndDelete(
        noteId
    );

    // --------------------------------------------
    // Audit log
    // --------------------------------------------

    await auditService.log({

        userId,

        action: "NOTE_DELETED",

        resource: "Note",

        resourceId: noteId,

        metadata: {
            title: note.title,
            role,
            accessRole,
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

const getNoteWithComments = async (
    noteId,
    userId,
    role
) => {

    // --------------------------------------------
    // Check note access
    // --------------------------------------------

    const {
        note,
        accessRole,
    } = await getNoteAccess(
        noteId,
        userId,
        role
    );

    // --------------------------------------------
    // Populate note data
    // --------------------------------------------

    await note.populate(
        "user",
        "name email"
    );

    await note.populate({
        path: "comments",
        populate: {
            path: "user",
            select: "name email",
        },
    });

    await note.populate(
        "tags",
        "name"
    );

    await note.populate(
        "folder",
        "name"
    );

    // --------------------------------------------
    // Return note + access role
    // --------------------------------------------

    return {
        ...note.toObject(),
        accessRole,
    };
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

    const {
        note,
        canEdit,
    } = await getNoteAccess(
        noteId,
        userId,
        role
    );

    // --------------------------------------------
    // Editor or higher can upload
    // --------------------------------------------

    if (!canEdit) {
        throw new AppError(
            "Not authorized to upload attachment",
            403
        );
    }

    // --------------------------------------------
    // Add attachments
    // --------------------------------------------

    note.attachments.push(
        ...attachments
    );

    await note.save();

    // --------------------------------------------
    // Audit log
    // --------------------------------------------

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

    return note;
};


// ============================================================
// DELETE ATTACHMENT
// ============================================================

const deleteAttachment = async (
    noteId,
    attachmentId,
    userId,
    role,
    auditContext = {}
) => {

    const {
        note,
        canDelete,
    } = await getNoteAccess(
        noteId,
        userId,
        role
    );

    // --------------------------------------------
    // Only owner/admin can delete attachments
    // --------------------------------------------

    if (!canDelete) {
        throw new AppError(
            "Not authorized to delete attachment",
            403
        );
    }

    // --------------------------------------------
    // Find attachment
    // --------------------------------------------

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

    // --------------------------------------------
    // Delete from Cloudinary
    // --------------------------------------------

    await mediaService.deleteFile(
        attachment.publicId
    );

    // --------------------------------------------
    // Remove from note
    // --------------------------------------------

    note.attachments.pull(
        attachmentId
    );

    await note.save();

    // --------------------------------------------
    // Audit log
    // --------------------------------------------

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
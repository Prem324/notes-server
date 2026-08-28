const Note = require("../models/Note");
const mediaService = require("./mediaService");
const redisService = require("./redisService");
const AppError = require("../utils/AppError");

const {
    notesListKey,
    notesUserPattern,
    noteByIdKey,
} = require("../utils/cacheKeys");

const invalidateUserNotesCache = async (userId) => {

    await redisService.delByPattern(
        notesUserPattern(userId)
    );
};


// ============================================================
// GET ALL NOTES
// Redis Cache-Aside
// ============================================================

const getAllNotes = async (
    userId,
    role,
    page,
    limit,
    search
) => {

    // Generate cache key
    const cacheKey = notesListKey(
        userId,
        role,
        page,
        limit,
        search
    );


    // Check Redis
    const cachedResult =
        await redisService.get(cacheKey);


    if (cachedResult) {

        console.log(
            "Redis cache HIT:",
            cacheKey
        );

        return cachedResult;
    }


    console.log(
        "Redis cache MISS:",
        cacheKey
    );


    // MongoDB query
    const query = {};


    // Normal users see only their notes.
    // Admin sees all notes.
    if (role !== "admin") {

        query.user = userId;

    }


    // Search
    if (search) {

        query.$text = {
            $search: search,
        };

    }


    // Count notes
    const totalNotes =
        await Note.countDocuments(query);


    // Calculate pages
    const totalPages =
        Math.ceil(totalNotes / limit);


    // Fetch notes
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


    const result = {

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


    // Store in Redis
    await redisService.set(
        cacheKey,
        result,
        60
    );


    return result;
};


// ============================================================
// GET NOTE BY ID
// Redis Cache-Aside
// ============================================================

const getNoteById = async (
    noteId,
    userId,
    role
) => {

    // ========================================================
    // 1. Generate cache key
    // ========================================================

    const cacheKey =
        noteByIdKey(
            noteId,
            userId,
            role
        );


    // ========================================================
    // 2. Check Redis
    // ========================================================

    const cachedNote =
        await redisService.get(
            cacheKey
        );


    if (cachedNote) {

        console.log(
            "Redis note cache HIT:",
            cacheKey
        );

        return cachedNote;
    }


    console.log(
        "Redis note cache MISS:",
        cacheKey
    );


    // ========================================================
    // 3. Query MongoDB
    // ========================================================

    const note =
        await Note.findById(
            noteId
        );


    // ========================================================
    // 4. Check existence
    // ========================================================

    if (!note) {

        throw new AppError(
            "Note not found",
            404
        );

    }


    // ========================================================
    // 5. Authorization
    // ========================================================

    if (
        role !== "admin" &&
        note.user.toString() !== userId
    ) {

        throw new AppError(
            "Not authorized to access this note",
            403
        );

    }


    // ========================================================
    // 6. Cache authorized result
    // ========================================================

    await redisService.set(
        cacheKey,
        note,
        60
    );


    // ========================================================
    // 7. Return note
    // ========================================================

    return note;
};


// ============================================================
// CREATE NOTE
// ============================================================

const createNote = async (
    data,
    userId
) => {

    const note = await Note.create({
        ...data,
        user: userId,
    });

    await invalidateUserNotesCache(userId);

    return note;
};


// ============================================================
// UPDATE NOTE
// ============================================================

const updateNote = async (
    id,
    data,
    userId,
    role
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

    await invalidateUserNotesCache(
        note.user.toString()
    );


    return note;
};


// ============================================================
// DELETE NOTE
// ============================================================

const deleteNote = async (
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

                        console.error(
                            "Cloudinary delete failed:",
                            attachment.publicId
                        );

                    }

                }
            )

        );

    }


    await Note.findByIdAndDelete(
        noteId
    );

    await invalidateUserNotesCache(
        note.user.toString()
    );


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
    role
) => {

    const note =
        await Note.findById(
            noteId
        );


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

    await invalidateUserNotesCache(
        note.user.toString()
    );


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
        role
    ) => {

        const note =
            await Note.findById(
                noteId
            );


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

    await invalidateUserNotesCache(
        note.user.toString()
    );


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

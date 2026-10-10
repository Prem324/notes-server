const AuditLog = require("../models/AuditLog");


// ============================================================
// CREATE AUDIT LOG
// ============================================================

const log = async ({
    userId,
    action,
    resource,
    resourceId = null,
    metadata = {},
    ipAddress = null,
    userAgent = null,
}) => {

    return await AuditLog.create({
        user: userId,
        action,
        resource,
        resourceId,
        metadata,
        ipAddress,
        userAgent,
    });
};


// ============================================================
// GET ADMIN AUDIT LOGS
// ============================================================

const getAdminAuditLogs = async ({
    page = 1,
    limit = 20,
    action,
    resource,
    userId,
}) => {

    const currentPage = Math.max(
        Number(page) || 1,
        1
    );

    const currentLimit = Math.min(
        Math.max(Number(limit) || 20, 1),
        100
    );

    const skip =
        (currentPage - 1) * currentLimit;


    const filter = {};


    // Filter by action
    if (action) {
        filter.action = action;
    }


    // Filter by resource
    if (resource) {
        filter.resource = resource;
    }


    // Filter by user
    if (userId) {
        filter.user = userId;
    }


    const [
        logs,
        totalLogs,
    ] = await Promise.all([

        AuditLog.find(filter)
            .populate(
                "user",
                "name email role"
            )
            .sort({
                createdAt: -1,
            })
            .skip(skip)
            .limit(currentLimit)
            .lean(),

        AuditLog.countDocuments(filter),

    ]);


    const totalPages =
        Math.ceil(
            totalLogs / currentLimit
        );


    return {

        logs,

        pagination: {

            totalLogs,

            currentPage,

            totalPages,

            limit: currentLimit,

            hasNextPage:
                currentPage < totalPages,

            hasPrevPage:
                currentPage > 1,

        },

    };
};

// ============================================================
// GET ACTIVITY FOR A SPECIFIC NOTE
// ============================================================

const getNoteActivity = async ({
    noteId,
    page = 1,
    limit = 20,
}) => {
    const currentPage = Math.max(
        Number(page) || 1,
        1
    );

    const currentLimit = Math.min(
        Math.max(Number(limit) || 20, 1),
        50
    );

    const skip = (currentPage - 1) * currentLimit;

    // Always restrict the query to the requested note.
    const filter = {
        resource: "Note",
        resourceId: noteId,
    };

    const [logs, totalLogs] = await Promise.all([
        AuditLog.find(filter)
            .select("action createdAt")
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(currentLimit)
            .lean(),

        AuditLog.countDocuments(filter),
    ]);

    // Return only explicitly approved fields.
    const activities = logs.map((entry) => {
        const descriptions = {
            NOTE_CREATED: "Note created",
            NOTE_UPDATED: "Note updated",
            NOTE_DELETED: "Note deleted",
            ATTACHMENT_UPLOADED: "Attachment uploaded",
            ATTACHMENT_DELETED: "Attachment deleted",
        };

        return {
            id: entry._id,
            action: entry.action,
            description:
                descriptions[entry.action] || "Note activity",
            createdAt: entry.createdAt,
        };
    });

    const totalPages = Math.ceil(
        totalLogs / currentLimit
    );

    return {
        activities,
        pagination: {
            totalLogs,
            currentPage,
            totalPages,
            limit: currentLimit,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1,
        },
    };
};


module.exports = {
    log,
    getAuditLogs: getAdminAuditLogs,
    getAdminAuditLogs,
    getNoteActivity,
};

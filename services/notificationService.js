const mongoose = require("mongoose");

const Notification = require("../models/Notification");
const featureFlags = require("../config/featureFlags");
const AppError = require("../utils/AppError");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const ensureNotificationsEnabled = () => {
    if (!featureFlags.notifications) {
        throw new AppError(
            "Notifications are currently unavailable",
            503
        );
    }
};

const validateObjectId = (id, fieldName = "ID") => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(`Invalid ${fieldName}`, 400);
    }
};

const normalizePagination = ({ page, limit } = {}) => {
    const parsedPage = Number(page ?? DEFAULT_PAGE);
    const parsedLimit = Number(limit ?? DEFAULT_LIMIT);

    if (
        !Number.isInteger(parsedPage) ||
        parsedPage < 1 ||
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1
    ) {
        throw new AppError("Invalid pagination parameters", 400);
    }

    return {
        page: parsedPage,
        limit: Math.min(parsedLimit, MAX_LIMIT),
        skip: (parsedPage - 1) * Math.min(parsedLimit, MAX_LIMIT),
    };
};

/**
 * Create a notification for a recipient.
 *
 * Returns null when notifications are disabled, allowing existing
 * application operations to continue without notification side effects.
 */
const createNotification = async ({
    recipient,
    type,
    title,
    message,
    actor = null,
    note = null,
    metadata = {},
}) => {
    if (!featureFlags.notifications) {
        return null;
    }

    validateObjectId(recipient, "recipient ID");

    if (actor !== null) {
        validateObjectId(actor, "actor ID");
    }

    if (note !== null) {
        validateObjectId(note, "note ID");
    }

    return Notification.create({
        recipient,
        type,
        title,
        message,
        actor,
        note,
        metadata,
    });
};

/**
 * Fetch a recipient's notifications with pagination.
 */
const getNotifications = async (
    recipient,
    { page, limit, unreadOnly = false } = {}
) => {
    ensureNotificationsEnabled();
    validateObjectId(recipient, "recipient ID");

    const pagination = normalizePagination({ page, limit });

    const filter = { recipient };

    if (unreadOnly === true || unreadOnly === "true") {
        filter.read = false;
    }

    const [notifications, total] = await Promise.all([
        Notification.find(filter)
            .sort({ createdAt: -1, _id: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit)
            .populate("actor", "name email")
            .lean(),

        Notification.countDocuments(filter),
    ]);

    return {
        notifications,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages: Math.ceil(total / pagination.limit),
        },
    };
};

/**
 * Return the recipient's unread notification count.
 */
const getUnreadCount = async (recipient) => {
    ensureNotificationsEnabled();
    validateObjectId(recipient, "recipient ID");

    const count = await Notification.countDocuments({
        recipient,
        read: false,
    });

    return { count };
};

/**
 * Mark one notification as read.
 * A recipient can only modify their own notification.
 */
const markNotificationAsRead = async (recipient, notificationId) => {
    ensureNotificationsEnabled();
    validateObjectId(recipient, "recipient ID");
    validateObjectId(notificationId, "notification ID");

    const notification = await Notification.findOneAndUpdate(
        {
            _id: notificationId,
            recipient,
        },
        {
            $set: { read: true },
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!notification) {
        throw new AppError("Notification not found", 404);
    }

    return notification;
};

/**
 * Mark every unread notification belonging to the recipient as read.
 */
const markAllNotificationsAsRead = async (recipient) => {
    ensureNotificationsEnabled();
    validateObjectId(recipient, "recipient ID");

    const result = await Notification.updateMany(
        {
            recipient,
            read: false,
        },
        {
            $set: { read: true },
        }
    );

    return {
        modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
    };
};

/**
 * Delete one notification owned by the recipient.
 */
const deleteNotification = async (recipient, notificationId) => {
    ensureNotificationsEnabled();
    validateObjectId(recipient, "recipient ID");
    validateObjectId(notificationId, "notification ID");

    const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient,
    });

    if (!notification) {
        throw new AppError("Notification not found", 404);
    }

    return notification;
};

module.exports = {
    createNotification,
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
};
const notificationService = require("../services/notificationService");
const { sendSuccess } = require("../utils/apiResponse");

const getNotifications = async (req, res) => {
    const result = await notificationService.getNotifications(
        req.user.id,
        {
            page: req.query.page,
            limit: req.query.limit,
            unreadOnly: req.query.unreadOnly,
        }
    );

    return sendSuccess(
        res,
        200,
        "Notifications fetched successfully",
        result
    );
};

const getUnreadCount = async (req, res) => {
    const result = await notificationService.getUnreadCount(req.user.id);

    return sendSuccess(
        res,
        200,
        "Unread notification count fetched successfully",
        result
    );
};

const markNotificationAsRead = async (req, res) => {
    const notification = await notificationService.markNotificationAsRead(
        req.user.id,
        req.params.id
    );

    return sendSuccess(
        res,
        200,
        "Notification marked as read",
        notification
    );
};

const markAllNotificationsAsRead = async (req, res) => {
    const result = await notificationService.markAllNotificationsAsRead(
        req.user.id
    );

    return sendSuccess(
        res,
        200,
        "All notifications marked as read",
        result
    );
};

const deleteNotification = async (req, res) => {
    await notificationService.deleteNotification(
        req.user.id,
        req.params.id
    );

    return sendSuccess(
        res,
        200,
        "Notification deleted successfully",
        null
    );
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
};
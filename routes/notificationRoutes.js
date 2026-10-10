const express = require("express");

const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const requireFeature = require("../middleware/featureFlag");
const FEATURE_NAMES = require("../config/featureNames");

const {
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} = require("../controllers/notificationController");

const router = express.Router();

// All notification endpoints require authentication and an enabled feature.
router.use(auth);
router.use(requireFeature(FEATURE_NAMES.NOTIFICATIONS));

router.get(
    "/",
    asyncHandler(getNotifications)
);

router.get(
    "/unread-count",
    asyncHandler(getUnreadCount)
);

router.patch(
    "/read-all",
    asyncHandler(markAllNotificationsAsRead)
);

router.patch(
    "/:id/read",
    asyncHandler(markNotificationAsRead)
);

router.delete(
    "/:id",
    asyncHandler(deleteNotification)
);

module.exports = router;
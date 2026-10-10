const mongoose = require("mongoose");

const Notification = require("../models/Notification");
const featureFlags = require("../config/featureFlags");

const {
    createNotification,
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} = require("../services/notificationService");

jest.mock("../models/Notification");

describe("Notification Service", () => {
    const recipientId = new mongoose.Types.ObjectId().toString();
    const anotherRecipientId = new mongoose.Types.ObjectId().toString();
    const actorId = new mongoose.Types.ObjectId().toString();
    const noteId = new mongoose.Types.ObjectId().toString();
    const notificationId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
        featureFlags.notifications = true;
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    test("should create a notification", async () => {
        const created = { _id: notificationId, recipient: recipientId };
        Notification.create.mockResolvedValue(created);

        await expect(
            createNotification({
                recipient: recipientId,
                type: "NOTE_SHARED",
                title: "Note shared",
                message: "A note was shared with you.",
                actor: actorId,
                note: noteId,
            })
        ).resolves.toEqual(created);

        expect(Notification.create).toHaveBeenCalledWith({
            recipient: recipientId,
            type: "NOTE_SHARED",
            title: "Note shared",
            message: "A note was shared with you.",
            actor: actorId,
            note: noteId,
            metadata: {},
        });
    });

    test("should skip creation when notifications are disabled", async () => {
        featureFlags.notifications = false;

        await expect(
            createNotification({
                recipient: recipientId,
                type: "NOTE_SHARED",
                title: "Note shared",
                message: "A note was shared with you.",
            })
        ).resolves.toBeNull();

        expect(Notification.create).not.toHaveBeenCalled();
    });

    test("should reject invalid recipient IDs", async () => {
        await expect(
            createNotification({
                recipient: "invalid",
                type: "NOTE_SHARED",
                title: "Note shared",
                message: "A note was shared with you.",
            })
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(Notification.create).not.toHaveBeenCalled();
    });

    test("should fetch paginated notifications for the recipient", async () => {
        const notifications = [{ _id: notificationId, read: false }];

        const query = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(notifications),
        };

        Notification.find.mockReturnValue(query);
        Notification.countDocuments.mockResolvedValue(1);

        const result = await getNotifications(recipientId, {
            page: 1,
            limit: 20,
        });

        expect(Notification.find).toHaveBeenCalledWith({
            recipient: recipientId,
        });
        expect(query.sort).toHaveBeenCalledWith({
            createdAt: -1,
            _id: -1,
        });
        expect(query.skip).toHaveBeenCalledWith(0);
        expect(query.limit).toHaveBeenCalledWith(20);
        expect(result.notifications).toEqual(notifications);
        expect(result.pagination).toEqual({
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
        });
    });

    test("should filter unread notifications", async () => {
        const query = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]),
        };

        Notification.find.mockReturnValue(query);
        Notification.countDocuments.mockResolvedValue(0);

        await getNotifications(recipientId, { unreadOnly: true });

        expect(Notification.find).toHaveBeenCalledWith({
            recipient: recipientId,
            read: false,
        });
    });

    test("should reject invalid pagination parameters", async () => {
        await expect(
            getNotifications(recipientId, { page: 0 })
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    test("should cap pagination limit at 100", async () => {
        const query = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]),
        };

        Notification.find.mockReturnValue(query);
        Notification.countDocuments.mockResolvedValue(0);

        const result = await getNotifications(recipientId, {
            limit: 500,
        });

        expect(query.limit).toHaveBeenCalledWith(100);
        expect(result.pagination.limit).toBe(100);
    });

    test("should return unread count", async () => {
        Notification.countDocuments.mockResolvedValue(3);

        await expect(getUnreadCount(recipientId)).resolves.toEqual({
            count: 3,
        });

        expect(Notification.countDocuments).toHaveBeenCalledWith({
            recipient: recipientId,
            read: false,
        });
    });

    test("should mark the recipient's notification as read", async () => {
        const notification = { _id: notificationId, read: true };

        Notification.findOneAndUpdate.mockResolvedValue(notification);

        await expect(
            markNotificationAsRead(recipientId, notificationId)
        ).resolves.toEqual(notification);

        expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: notificationId,
                recipient: recipientId,
            },
            {
                $set: { read: true },
            },
            {
                new: true,
                runValidators: true,
            }
        );
    });

    test("should not mark another user's notification as read", async () => {
        Notification.findOneAndUpdate.mockResolvedValue(null);

        await expect(
            markNotificationAsRead(recipientId, notificationId)
        ).rejects.toMatchObject({ statusCode: 404 });

        expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: notificationId,
                recipient: recipientId,
            },
            expect.any(Object),
            expect.any(Object)
        );

        expect(anotherRecipientId).toBeDefined();
    });

    test("should mark all unread notifications as read", async () => {
        Notification.updateMany.mockResolvedValue({
            acknowledged: true,
            modifiedCount: 4,
        });

        await expect(
            markAllNotificationsAsRead(recipientId)
        ).resolves.toEqual({ modifiedCount: 4 });

        expect(Notification.updateMany).toHaveBeenCalledWith(
            {
                recipient: recipientId,
                read: false,
            },
            {
                $set: { read: true },
            }
        );
    });

    test("should delete the recipient's notification", async () => {
        const notification = { _id: notificationId };

        Notification.findOneAndDelete.mockResolvedValue(notification);

        await expect(
            deleteNotification(recipientId, notificationId)
        ).resolves.toEqual(notification);

        expect(Notification.findOneAndDelete).toHaveBeenCalledWith({
            _id: notificationId,
            recipient: recipientId,
        });
    });

    test("should not delete another user's notification", async () => {
        Notification.findOneAndDelete.mockResolvedValue(null);

        await expect(
            deleteNotification(recipientId, notificationId)
        ).rejects.toMatchObject({ statusCode: 404 });

        expect(Notification.findOneAndDelete).toHaveBeenCalledWith({
            _id: notificationId,
            recipient: recipientId,
        });
    });

    test("should reject notification listing when disabled", async () => {
        featureFlags.notifications = false;

        await expect(
            getNotifications(recipientId)
        ).rejects.toMatchObject({ statusCode: 503 });
    });

    test("should reject unread count when disabled", async () => {
        featureFlags.notifications = false;

        await expect(
            getUnreadCount(recipientId)
        ).rejects.toMatchObject({ statusCode: 503 });
    });
});
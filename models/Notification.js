const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: [
                "NOTE_SHARED",
                "COLLABORATOR_PERMISSION_UPDATED",
                "COLLABORATOR_REMOVED",
                "COMMENT_ADDED",
                "NOTE_UPDATED",
                "NOTE_DELETED",
                "ATTACHMENT_ADDED",
                "EXPORT_COMPLETED",
                "ADMIN_ACTION",
            ],
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },

        read: {
            type: Boolean,
            default: false,
            index: true,
        },

        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        note: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Note",
            default: null,
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Efficient unread-notification queries.
notificationSchema.index({
    recipient: 1,
    read: 1,
    createdAt: -1,
});

// Efficient notification history queries.
notificationSchema.index({
    recipient: 1,
    createdAt: -1,
});

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);
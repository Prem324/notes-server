const mongoose = require("mongoose");


const auditLogSchema =
    new mongoose.Schema({

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        action: {
            type: String,
            required: true,
            index: true,
        },

        resource: {
            type: String,
            required: true,
            index: true,
        },

        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        ipAddress: {
            type: String,
            default: null,
        },

        userAgent: {
            type: String,
            default: null,
        },

    }, {

        timestamps: true,

    });


/*
 * Most recent audit logs first.
 */
auditLogSchema.index({
    createdAt: -1,
});


module.exports =
    mongoose.model(
        "AuditLog",
        auditLogSchema
    );
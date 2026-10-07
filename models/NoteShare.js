const mongoose = require("mongoose");

const noteShareSchema = new mongoose.Schema(
    {
        note: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Note",
            required: true,
            index: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        permission: {
            type: String,
            enum: ["viewer", "editor"],
            required: true,
            default: "viewer",
        },

        addedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

noteShareSchema.index(
    { note: 1, user: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "NoteShare",
    noteShareSchema
);
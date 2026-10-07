const Joi = require("joi");

const shareNoteSchema = Joi.object({
    email: Joi.string()
        .trim()
        .email()
        .required(),

    permission: Joi.string()
        .valid("viewer", "editor")
        .required(),
});

const updatePermissionSchema = Joi.object({
    permission: Joi.string()
        .valid("viewer", "editor")
        .required(),
});

module.exports = {
    shareNoteSchema,
    updatePermissionSchema,
};
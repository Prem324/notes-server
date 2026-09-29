const Joi = require("joi");

const noteSchema = Joi.object({
    title: Joi.string()
        .min(3)
        .max(100)
        .required(),

    content: Joi.string()
        .required(),

    completed: Joi.boolean(),

    tags: Joi.array()
        .items(
            Joi.string().hex().length(24)
        ),
    folder: Joi.string().hex().length(24).allow(null),
});

module.exports = noteSchema;
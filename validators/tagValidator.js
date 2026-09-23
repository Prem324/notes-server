const Joi = require("joi");

const createTagSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(50)
        .required(),
});

module.exports = {
    createTagSchema,
};
const Joi=require("joi");

const registerSchema=Joi.object({
    name:Joi.string().required(),
    email:Joi.string().email().required(),
    password:Joi.string().min(6).required()
});

const loginSchema=Joi.object({
    email:Joi.string().email().required(),
    password:Joi.string()
    .min(8)
    .max(128)
    .pattern(
        new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$")
    )
    .required()
    .messages({
        "string.min":"Password must be at least 8 characters",
        "string.max":"Password must not exceed 128 characters",
        "string.pattern.base":"Password must contain uppercase, lowercase, and a number"
    })
});

module.exports={registerSchema,loginSchema};
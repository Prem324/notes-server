const Joi =require("joi");

const noteSchema=Joi.object({
    title:Joi.string()
    .min(3)
    .max(100)
    .required(),

    content:Joi.string()
    .required(),

    completed:Joi.boolean(),

})

module.exports=noteSchema
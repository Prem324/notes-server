const { createTagSchema } = require("../validators/tagValidator");
const tagService = require("../services/tagService");

const createTag = async (req, res) => {
    const { error, value } = createTagSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message,
        });
    }

    const tag = await tagService.createTag({
        name: value.name,
        userId: req.user.id,
    });

    return res.status(201).json({
        success: true,
        message: "Tag created successfully",
        data: tag,
    });
};

const getTags = async (req, res) => {
    const tags = await tagService.getTags(req.user.id);

    return res.status(200).json({
        success: true,
        message: "Tags fetched successfully",
        data: tags,
    });
};

const updateTag = async (req, res) => {
    const { error, value } = createTagSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message,
        });
    }

    const tag = await tagService.updateTag({
        tagId: req.params.id,
        name: value.name,
        userId: req.user.id,
    });

    return res.status(200).json({
        success: true,
        message: "Tag updated successfully",
        data: tag,
    });
};

const deleteTag = async (req, res) => {
    await tagService.deleteTag({
        tagId: req.params.id,
        userId: req.user.id,
    });

    return res.status(200).json({
        success: true,
        message: "Tag deleted successfully",
    });
};

module.exports = {
    createTag,
    getTags,
    updateTag,
    deleteTag,
};
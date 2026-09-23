const mongoose = require("mongoose");
const Tag = require("../models/Tag");

const validateTagId = (tagId) => {
    if (!mongoose.Types.ObjectId.isValid(tagId)) {
        const error = new Error("Invalid tag ID");
        error.statusCode = 400;
        throw error;
    }
};

const createTag = async ({ name, userId }) => {
    const existingTag = await Tag.findOne({
        name,
        user: userId,
    });

    if (existingTag) {
        const error = new Error("Tag already exists");
        error.statusCode = 409;
        throw error;
    }

    const tag = await Tag.create({
        name,
        user: userId,
    });

    return tag;
};

const getTags = async (userId) => {
    return Tag.find({
        user: userId,
    }).sort({ name: 1 });
};

const updateTag = async ({ tagId, name, userId }) => {
    validateTagId(tagId);
    const tag = await Tag.findOne({
        _id: tagId,
        user: userId,
    });

    if (!tag) {
        const error = new Error("Tag not found");
        error.statusCode = 404;
        throw error;
    }

    const existingTag = await Tag.findOne({
        _id: { $ne: tagId },
        user: userId,
        name,
    });

    if (existingTag) {
        const error = new Error("Tag already exists");
        error.statusCode = 409;
        throw error;
    }

    tag.name = name;

    await tag.save();

    return tag;
};

const deleteTag = async ({ tagId, userId }) => {
    validateTagId(tagId);
    const tag = await Tag.findOneAndDelete({
        _id: tagId,
        user: userId,
    });

    if (!tag) {
        const error = new Error("Tag not found");
        error.statusCode = 404;
        throw error;
    }

    return tag;
};

const validateUserTags = async ({ tagIds, userId }) => {
    if (!tagIds || tagIds.length === 0) {
        return [];
    }

    const uniqueTagIds = [...new Set(tagIds.map(String))];

    const tags = await Tag.find({
        _id: { $in: uniqueTagIds },
        user: userId,
    });

    if (tags.length !== uniqueTagIds.length) {
        const error = new Error("One or more tags are invalid");
        error.statusCode = 400;
        throw error;
    }

    return tags;
};

module.exports = {
    createTag,
    getTags,
    updateTag,
    deleteTag,
    validateUserTags,
};
const Folder = require("../models/Folder");

const createFolder = async ({ name, userId }) => {
    const existingFolder = await Folder.findOne({
        name,
        user: userId,
    });

    if (existingFolder) {
        const error = new Error("Folder already exists");
        error.statusCode = 409;
        throw error;
    }

    const folder = await Folder.create({
        name,
        user: userId,
    });

    return folder;
};

const getFolders = async (userId) => {
    return Folder.find({
        user: userId,
    }).sort({
        name: 1,
    });
};

const updateFolder = async ({ folderId, name, userId }) => {
    const folder = await Folder.findOne({
        _id: folderId,
        user: userId,
    });

    if (!folder) {
        const error = new Error("Folder not found");
        error.statusCode = 404;
        throw error;
    }

    const existingFolder = await Folder.findOne({
        _id: { $ne: folderId },
        user: userId,
        name,
    });

    if (existingFolder) {
        const error = new Error("Folder already exists");
        error.statusCode = 409;
        throw error;
    }

    folder.name = name;

    await folder.save();

    return folder;
};

const deleteFolder = async ({ folderId, userId }) => {
    const folder = await Folder.findOneAndDelete({
        _id: folderId,
        user: userId,
    });

    if (!folder) {
        const error = new Error("Folder not found");
        error.statusCode = 404;
        throw error;
    }

    return folder;
};

const validateUserFolder = async ({ folderId, userId }) => {
    if (!folderId) {
        return null;
    }

    const folder = await Folder.findOne({
        _id: folderId,
        user: userId,
    });

    if (!folder) {
        const error = new Error("Folder is invalid");
        error.statusCode = 400;
        throw error;
    }

    return folder;
};

module.exports = {
    createFolder,
    getFolders,
    updateFolder,
    deleteFolder,
    validateUserFolder,
};
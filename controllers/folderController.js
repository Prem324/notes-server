const folderService = require("../services/folderService");

const createFolder = async (req, res) => {
    const folder = await folderService.createFolder({
        name: req.body.name,
        userId: req.user.id,
    });

    return res.status(201).json({
        success: true,
        message: "Folder created successfully",
        data: folder,
    });
};

const getFolders = async (req, res) => {
    const folders = await folderService.getFolders(req.user.id);

    return res.status(200).json({
        success: true,
        message: "Folders fetched successfully",
        data: folders,
    });
};

const updateFolder = async (req, res) => {
    const folder = await folderService.updateFolder({
        folderId: req.params.id,
        name: req.body.name,
        userId: req.user.id,
    });

    return res.status(200).json({
        success: true,
        message: "Folder updated successfully",
        data: folder,
    });
};

const deleteFolder = async (req, res) => {
    await folderService.deleteFolder({
        folderId: req.params.id,
        userId: req.user.id,
    });

    return res.status(200).json({
        success: true,
        message: "Folder deleted successfully",
        data: null,
    });
};

module.exports = {
    createFolder,
    getFolders,
    updateFolder,
    deleteFolder,
};
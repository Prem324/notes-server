const ExportJob = require("../models/ExportJob");
const Note = require("../models/Note");
const AppError = require("../utils/AppError");

const createNotesExportJob = async (userId) => {
    const exportJob = await ExportJob.create({
        user: userId,
        status: "pending",
    });

    const notes = await Note.find({ user: userId })
        .select("title content completed createdAt updatedAt")
        .sort({ createdAt: -1 })
        .lean();

    const exportData = {
        exportedAt: new Date().toISOString(),
        totalNotes: notes.length,
        notes,
    };

    exportJob.status = "completed";
    exportJob.fileUrl = `data:application/json;base64,${Buffer.from(
        JSON.stringify(exportData, null, 2)
    ).toString("base64")}`;
    exportJob.errorMessage = null;

    await exportJob.save();

    return exportJob;
};

const getExportJobById = async (jobId, userId, role) => {
    const exportJob = await ExportJob.findById(jobId).lean();

    if (!exportJob) {
        throw new AppError("Export job not found", 404);
    }

    if (
        role !== "admin" &&
        exportJob.user.toString() !== userId.toString()
    ) {
        throw new AppError("Not authorized", 403);
    }

    return exportJob;
};

module.exports = {
    createNotesExportJob,
    getExportJobById,
};

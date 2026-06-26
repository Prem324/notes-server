const ExportJob = require("../models/ExportJob");
const exportQueue = require("../queues/exportQueue");
const AppError = require("../utils/AppError");

const createNotesExportJob = async (userId) => {
    const exportJob = await ExportJob.create({
        user: userId,
        status: "pending",
    });

    await exportQueue.add(
        "export-notes",
        {
            exportJobId: exportJob._id.toString(),
            userId: userId.toString(),
        },
        {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        }
    );

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
const exportService = require("../services/exportService");
const { sendSuccess } = require("../utils/apiResponse");

const createNotesExportJob = async (req, res) => {
    const exportJob = await exportService.createNotesExportJob(
        req.user.id
    );

    return sendSuccess(
        res,
        202,
        "Export job started",
        {
            jobId: exportJob._id,
            status: exportJob.status,
        }
    );
};

const getExportJobById = async (req, res) => {
    const exportJob = await exportService.getExportJobById(
        req.params.jobId,
        req.user.id,
        req.user.role
    );

    return sendSuccess(
        res,
        200,
        "Export job fetched successfully",
        exportJob
    );
};

module.exports = {
    createNotesExportJob,
    getExportJobById,
};
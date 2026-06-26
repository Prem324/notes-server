const { Worker } = require("bullmq");
const mongoose = require("mongoose");

const redisConnection = require("../config/redis");
const config = require("../config/env");
const ExportJob = require("../models/ExportJob");
const Note = require("../models/Note");

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    await mongoose.connect(config.mongoUri);
    console.log("Worker connected to MongoDB");
};

const exportWorker = new Worker(
    "export-queue",
    async (job) => {
        await connectDB();

        const { exportJobId, userId } = job.data;

        const exportJob = await ExportJob.findById(exportJobId);

        if (!exportJob) {
            throw new Error("Export job not found");
        }

        exportJob.status = "processing";
        await exportJob.save();

        const notes = await Note.find({ user: userId })
            .select("title content completed createdAt updatedAt")
            .sort({ createdAt: -1 })
            .lean();

        const exportData = {
            exportedAt: new Date().toISOString(),
            totalNotes: notes.length,
            notes,
        };

        // For now, we are not uploading a file yet.
        // We store JSON as a data URL style placeholder.
        // Later, this can become a real Cloudinary/S3 file URL.
        const encodedData = Buffer.from(
            JSON.stringify(exportData, null, 2)
        ).toString("base64");

        exportJob.status = "completed";
        exportJob.fileUrl = `data:application/json;base64,${encodedData}`;
        exportJob.errorMessage = null;

        await exportJob.save();

        console.log(`Export job completed: ${exportJobId}`);
    },
    {
        connection: redisConnection,
    }
);

exportWorker.on("completed", (job) => {
    console.log(`Job completed: ${job.id}`);
});

exportWorker.on("failed", async (job, err) => {
    console.error(`Job failed: ${job?.id}`, err.message);

    if (job?.data?.exportJobId) {
        await connectDB();

        await ExportJob.findByIdAndUpdate(job.data.exportJobId, {
            status: "failed",
            errorMessage: err.message,
        });
    }
});

module.exports = exportWorker;
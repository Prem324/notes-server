require("dotenv").config();

const isTest = process.env.NODE_ENV === "test";

const requiredEnvVars = [
    "JWT_SECRET",
    "MONGO_URI",
];

if (!isTest) {
    requiredEnvVars.push(
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET"
    );
}

requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
});

module.exports = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: process.env.PORT || 5000,

    mongoUri: process.env.MONGO_URI,

    redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
    },

    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
    serverUrl: process.env.SERVER_URL || "http://localhost:5000",

    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
};
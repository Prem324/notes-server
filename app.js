require("dotenv").config();
const config=require("./config/env");

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const sanitizeRequest = require("./middleware/sanitizeRequest");
const requestLogger = require("./middleware/requestLogger");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const compression = require("compression");

const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/commentRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
//const exportRoutes = require("./routes/exportRoutes");

const errorHandler = require("./middleware/errorHandler");

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({origin:config.clientUrl,credentials:true}));
app.use(compression());
app.use(express.json({limit:"100kb"}));
app.use(express.urlencoded({extended:true,limit:"100kb",}))
app.use(sanitizeRequest);
if (config.nodeEnv === "development") {
    app.use(morgan("dev"));
}
app.use(requestLogger);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API is running",
    });
});

app.use("/health", healthRoutes);

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

const API_PREFIX = "/api/v1";

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/notes`, noteRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/comments`, commentRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
//app.use(`${API_PREFIX}/exports`, exportRoutes);

app.use("/uploads", express.static("uploads"));


app.use(errorHandler);

module.exports = app;
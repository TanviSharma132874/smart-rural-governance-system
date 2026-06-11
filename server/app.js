const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const { API_V1_PREFIX } = require("./config/constants");
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const fileRoutes = require("./routes/fileRoutes");
const logger = require("./utils/logger");
const { apiRateLimiter, authRateLimiter } = require("./middlewares/rateLimitMiddleware");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", { stream: logger.stream }));
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", apiRateLimiter);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Rural Governance backend is running",
    timestamp: new Date().toISOString(),
  });
});
app.get(`${API_V1_PREFIX}/health`, (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Rural Governance backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/files", fileRoutes);
app.use(`${API_V1_PREFIX}/auth`, authRateLimiter, authRoutes);
app.use(`${API_V1_PREFIX}/complaints`, complaintRoutes);
app.use(`${API_V1_PREFIX}/certificates`, certificateRoutes);
app.use(`${API_V1_PREFIX}/emergencies`, emergencyRoutes);
app.use(`${API_V1_PREFIX}/resources`, resourceRoutes);
app.use(`${API_V1_PREFIX}/volunteers`, volunteerRoutes);
app.use(`${API_V1_PREFIX}/announcements`, announcementRoutes);
app.use(`${API_V1_PREFIX}/files`, fileRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

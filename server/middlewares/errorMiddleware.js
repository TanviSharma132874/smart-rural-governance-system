const sendError = require("../utils/errorResponse");

const notFound = (req, _res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  sendError(res, {
    statusCode,
    message,
    details: error.details || null,
    stack: process.env.NODE_ENV === "production" ? null : error.stack,
  });
};

module.exports = {
  notFound,
  errorHandler,
};

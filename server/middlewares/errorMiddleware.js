const sendError = require("../utils/errorResponse");
const logger = require("../utils/logger");

const notFound = (req, _res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, _req, res, _next) => {
  let normalizedError = error;

  if (error.name === "CastError") {
    normalizedError = {
      statusCode: 400,
      message: "Invalid resource identifier",
      details: [
        {
          field: error.path,
          message: "Provided identifier is not valid",
        },
      ],
    };
  }

  if (error.name === "ValidationError") {
    normalizedError = {
      statusCode: 400,
      message: "Validation failed",
      details: Object.values(error.errors).map((validationError) => ({
        field: validationError.path,
        message: validationError.message,
      })),
    };
  }

  if (error.name === "MulterError") {
    normalizedError = {
      statusCode: 400,
      message: "File upload validation failed",
      details: [
        {
          field: error.field || "images",
          message: error.message,
        },
      ],
    };
  }

  const statusCode = normalizedError.statusCode || 500;
  const message = normalizedError.message || "Internal server error";

  logger.error(message, {
    statusCode,
    path: _req.originalUrl,
    method: _req.method,
    details: normalizedError.details || null,
    stack: process.env.NODE_ENV === "production" ? null : normalizedError.stack,
  });

  sendError(res, {
    statusCode,
    message,
    details: normalizedError.details || null,
    stack: process.env.NODE_ENV === "production" ? null : normalizedError.stack,
  });
};

module.exports = {
  notFound,
  errorHandler,
};

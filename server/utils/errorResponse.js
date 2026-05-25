const sendError = (res, { statusCode = 500, message = "Something went wrong", details = null, stack = null }) => {
  return res.status(statusCode).json({
    success: false,
    message,
    details,
    stack,
  });
};

module.exports = sendError;

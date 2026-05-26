const sendSuccess = (res, { statusCode = 200, message = "Success", data = null, ...extra }) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...extra,
    data,
  });
};

module.exports = sendSuccess;

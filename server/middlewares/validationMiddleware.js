const { validationResult } = require("express-validator");

const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return next({
    statusCode: 422,
    message: "Validation failed",
    details: errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    })),
  });
};

module.exports = validateRequest;

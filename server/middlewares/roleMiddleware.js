const AppError = require("../utils/AppError");

const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication is required before authorization", 401));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError("You are not authorized to access this resource", 403));
  }

  next();
};

module.exports = authorize;

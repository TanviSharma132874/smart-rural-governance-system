const jwt = require("jsonwebtoken");

const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const authMiddleware = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Access denied. Token is missing.", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError("User associated with this token no longer exists", 401);
    }

    req.user = {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
      department: user.department,
      jurisdictionType: user.jurisdictionType,
      state: user.state,
      district: user.district,
      tehsil: user.tehsil,
      village: user.village,
      municipality: user.municipality,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      throw new AppError("Invalid or expired token", 401);
    }

    throw error;
  }
});

module.exports = authMiddleware;

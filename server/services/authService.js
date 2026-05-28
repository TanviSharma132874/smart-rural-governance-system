const User = require("../models/User");
const AppError = require("../utils/AppError");
const generateToken = require("../utils/generateToken");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  jurisdictionType: user.jurisdictionType,
  state: user.state,
  phone: user.phone,
  tehsil: user.tehsil,
  village: user.village,
  district: user.district,
  municipality: user.municipality,
  profileImage: user.profileImage,
  createdAt: user.createdAt,
});

const registerUser = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    throw new AppError("User already exists with this email", 409);
  }

  const user = await User.create({
    ...payload,
    email: payload.email.toLowerCase(),
  });

  const token = generateToken({
    id: user._id,
    role: user.role,
  });

  return {
    token,
    user: sanitizeUser(user),
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken({
    id: user._id,
    role: user.role,
  });

  return {
    token,
    user: sanitizeUser(user),
  };
};

const getUserProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return sanitizeUser(user);
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};

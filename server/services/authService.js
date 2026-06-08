const User = require("../models/User");
const AppError = require("../utils/AppError");
const generateToken = require("../utils/generateToken");

const ADMIN_PROVISIONABLE_ROLES = [
  "panchayatOfficer",
  "departmentOfficer",
  "districtAdmin",
  "stateAdmin",
  "superAdmin",
];

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  fatherName: user.fatherName,
  motherName: user.motherName,
  dateOfBirth: user.dateOfBirth,
  gender: user.gender,
  aadhaarNumber: user.aadhaarNumber,
  email: user.email,
  role: user.role,
  department: user.department,
  designation: user.designation,
  employeeId: user.employeeId,
  jurisdictionType: user.jurisdictionType,
  state: user.state,
  phone: user.phone,
  address: user.address,
  tehsil: user.tehsil,
  panchayat: user.panchayat,
  village: user.village,
  district: user.district,
  municipality: user.municipality,
  ward: user.ward,
  pincode: user.pincode,
  occupation: user.occupation,
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
    role: "citizen",
    department: "",
    designation: payload.designation || "",
    employeeId: payload.employeeId || "",
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

const ensureProvisioningAccess = (creator, payload) => {
  if (!ADMIN_PROVISIONABLE_ROLES.includes(payload.role)) {
    throw new AppError("Only officer and administrator roles can be provisioned through this endpoint", 400);
  }

  if (payload.role === "superAdmin" && creator.role !== "superAdmin") {
    throw new AppError("Only a super admin can provision another super admin", 403);
  }

  if (payload.role === "stateAdmin" && creator.role !== "superAdmin") {
    throw new AppError("Only a super admin can provision state admin accounts", 403);
  }

  if (creator.role === "stateAdmin") {
    if (!["districtAdmin", "panchayatOfficer", "departmentOfficer"].includes(payload.role)) {
      throw new AppError("State admins can only provision district and officer accounts", 403);
    }

    if (creator.state && payload.state && creator.state !== payload.state) {
      throw new AppError("State admins can only provision accounts within their state", 403);
    }
  }
};

const createPrivilegedUser = async (payload, creator) => {
  ensureProvisioningAccess(creator, payload);

  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    throw new AppError("User already exists with this email", 409);
  }

  const user = await User.create({
    ...payload,
    email: payload.email.toLowerCase(),
  });

  return sanitizeUser(user);
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
  createPrivilegedUser,
  loginUser,
  getUserProfile,
};

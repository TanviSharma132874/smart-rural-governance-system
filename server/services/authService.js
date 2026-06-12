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

  // Hardened identity protection: Strip any injected privileged fields
  const user = await User.create({
    name: payload.name,
    email: payload.email.toLowerCase(),
    password: payload.password,
    phone: payload.phone,
    aadhaarNumber: payload.aadhaarNumber,
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
    address: payload.address,
    state: payload.state || "Rajasthan",
    district: payload.district,
    tehsil: payload.tehsil,
    panchayat: payload.panchayat,
    village: payload.village,
    municipality: payload.municipality,
    ward: payload.ward,
    pincode: payload.pincode,
    occupation: payload.occupation,
    jurisdictionType: payload.jurisdictionType,
    fatherName: payload.fatherName,
    motherName: payload.motherName,
    role: "citizen", // Forced
    department: "",  // Forced
    designation: "", // Forced
    employeeId: "",  // Forced
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

  // Mandatory Officer Fields Check
  if (["panchayatOfficer", "departmentOfficer", "districtAdmin"].includes(payload.role)) {
    if (!payload.employeeId) throw new AppError("Employee ID is mandatory for officer provisioning", 400);
    if (!payload.designation) throw new AppError("Designation is mandatory for officer provisioning", 400);
    if (!payload.department && payload.role !== "districtAdmin") throw new AppError("Department is mandatory for officer provisioning", 400);
    if (!payload.district) throw new AppError("Jurisdiction (District) is mandatory for officer provisioning", 400);
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

const updateProfile = async (userId, payload) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Mandatory non-editable fields enforcement
  const restrictedFields = ["role", "department", "employeeId", "aadhaarNumber", "designation", "email"];
  const editableFields = ["phone", "address", "tehsil", "panchayat", "village", "municipality", "ward", "pincode", "occupation", "fatherName", "motherName"];

  editableFields.forEach((field) => {
    if (payload[field] !== undefined) {
      user[field] = payload[field];
    }
  });

  // Specifically allow email update if mandated but usually sensitive, GEMINI.md says Phone, Email, Address are editable.
  if (payload.email && payload.email !== user.email) {
    const existing = await User.findOne({ email: payload.email.toLowerCase(), _id: { $ne: userId } });
    if (existing) {
      throw new AppError("Email is already in use by another account", 409);
    }
    user.email = payload.email.toLowerCase();
  }

  await user.save();
  return sanitizeUser(user);
};

module.exports = {
  registerUser,
  createPrivilegedUser,
  loginUser,
  getUserProfile,
  updateProfile,
};

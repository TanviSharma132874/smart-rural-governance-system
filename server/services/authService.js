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
  status: user.status,
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

const ensureJurisdictionCreation = (creator, payload) => {
  if (creator.role === "districtAdmin") {
    if (payload.district !== creator.district || payload.state !== creator.state) {
      throw new AppError("District admins can only provision accounts within their assigned district and state", 403);
    }
  }

  if (creator.role === "stateAdmin") {
    if (payload.state !== creator.state) {
      throw new AppError("State admins can only provision accounts within their assigned state", 403);
    }
  }
};

const createPrivilegedUser = async (payload, creator) => {
  ensureProvisioningAccess(creator, payload);
  ensureJurisdictionCreation(creator, payload);

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

  if (user.status === "Inactive") {
    throw new AppError("Your account has been deactivated. Please contact administration.", 403);
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

  // Strict enforcement: Only Email, Phone, and Address are editable as per GEMINI.md
  const allowedUpdates = ["email", "phone", "address"];
  
  allowedUpdates.forEach((field) => {
    if (payload[field] !== undefined) {
      if (field === "email") {
        user.email = payload.email.toLowerCase();
      } else {
        user[field] = payload[field];
      }
    }
  });

  // Verify email uniqueness if updated
  if (payload.email && payload.email !== user.email) {
    const existing = await User.findOne({ email: payload.email.toLowerCase(), _id: { $ne: userId } });
    if (existing) {
      throw new AppError("Email is already in use by another account", 409);
    }
  }

  await user.save();
  return sanitizeUser(user);
};

const getUsers = async (user, filters = {}) => {
  const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const query = {};

  // Strict Jurisdiction Filtering
  if (user.role === "stateAdmin") {
    query.state = user.state;
    query.role = { $in: ["districtAdmin", "panchayatOfficer", "departmentOfficer", "citizen", "volunteer"] };
  } else if (user.role === "districtAdmin") {
    query.state = user.state;
    query.district = user.district;
    query.role = { $in: ["panchayatOfficer", "departmentOfficer", "citizen", "volunteer"] };
  } else if (user.role !== "superAdmin") {
    throw new AppError("You are not authorized to view the user registry", 403);
  }

  if (filters.role) query.role = filters.role;
  if (filters.district && user.role !== "districtAdmin") query.district = filters.district;
  if (filters.search) {
    const searchRegex = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: searchRegex }, { email: searchRegex }, { employeeId: searchRegex }];
  }

  const [totalUsers, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return {
    users: users.map(sanitizeUser),
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    },
  };
};

const ensureAdminActionAccess = (targetUser, performer) => {
  if (performer.role === "stateAdmin" && (targetUser.state !== performer.state || targetUser.role === "superAdmin" || targetUser.role === "stateAdmin")) {
    throw new AppError("State admins can only manage users within their state, excluding higher admins", 403);
  }
  if (performer.role === "districtAdmin" && (targetUser.district !== performer.district || ["superAdmin", "stateAdmin", "districtAdmin"].includes(targetUser.role))) {
    throw new AppError("District admins can only manage users within their district, excluding higher admins", 403);
  }
  if (performer.role !== "superAdmin" && performer.role !== "stateAdmin" && performer.role !== "districtAdmin") {
    throw new AppError("Unauthorized action", 403);
  }
};

const deleteUser = async (targetUserId, performer) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) throw new AppError("User not found", 404);

  ensureAdminActionAccess(targetUser, performer);

  await User.findByIdAndDelete(targetUserId);
};

const resetUserPassword = async (targetUserId, password, performer) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) throw new AppError("User not found", 404);

  ensureAdminActionAccess(targetUser, performer);

  if (!password || password.length < 6) {
    throw new AppError("Password must be at least 6 characters long", 400);
  }

  targetUser.password = password;
  await targetUser.save();
  return sanitizeUser(targetUser);
};

const updateUserStatus = async (targetUserId, status, performer) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) throw new AppError("User not found", 404);

  ensureAdminActionAccess(targetUser, performer);

  if (!["Active", "Inactive"].includes(status)) {
    throw new AppError("Invalid status value", 400);
  }

  targetUser.status = status;
  await targetUser.save();
  return sanitizeUser(targetUser);
};

const transferUser = async (targetUserId, payload, performer) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) throw new AppError("User not found", 404);

  ensureAdminActionAccess(targetUser, performer);

  if (payload.department !== undefined) {
    if (["panchayatOfficer", "departmentOfficer"].includes(targetUser.role)) {
      targetUser.department = payload.department;
    }
  }

  const jurisdictionFields = ["jurisdictionType", "state", "district", "tehsil", "panchayat", "village", "municipality", "ward", "pincode"];
  jurisdictionFields.forEach((field) => {
    if (payload[field] !== undefined) {
      targetUser[field] = payload[field];
    }
  });

  // Verify that targetUser is still within the performer's administrative scope after transfer
  if (performer.role === "districtAdmin") {
    if (targetUser.district !== performer.district || targetUser.state !== performer.state) {
      throw new AppError("District admins can only transfer users to a jurisdiction within their assigned district", 403);
    }
  }
  if (performer.role === "stateAdmin") {
    if (targetUser.state !== performer.state) {
      throw new AppError("State admins can only transfer users to a jurisdiction within their assigned state", 403);
    }
  }

  await targetUser.save();
  return sanitizeUser(targetUser);
};

module.exports = {
  registerUser,
  createPrivilegedUser,
  getUsers,
  deleteUser,
  loginUser,
  getUserProfile,
  updateProfile,
  resetUserPassword,
  updateUserStatus,
  transferUser,
};

const Volunteer = require("../models/Volunteer");
const AppError = require("../utils/AppError");
const { emitRealtimeEvent } = require("../sockets");

const formatVolunteer = (volunteer) => ({
  id: volunteer._id,
  user: volunteer.user
    ? {
        id: volunteer.user._id || volunteer.user,
        name: volunteer.user.name,
        email: volunteer.user.email,
        role: volunteer.user.role,
      }
    : null,
  name: volunteer.name,
  phone: volunteer.phone,
  district: volunteer.district,
  jurisdictionType: volunteer.jurisdictionType,
  tehsil: volunteer.tehsil,
  village: volunteer.village,
  municipality: volunteer.municipality,
  skills: volunteer.skills,
  availabilityStatus: volunteer.availabilityStatus,
  approvalStatus: volunteer.approvalStatus,
  approvedBy: volunteer.approvedBy
    ? {
        id: volunteer.approvedBy._id || volunteer.approvedBy,
        name: volunteer.approvedBy.name,
        email: volunteer.approvedBy.email,
        role: volunteer.approvedBy.role,
      }
    : null,
  assignments: (volunteer.assignments || []).map((item) => ({
    emergency: item.emergency,
    note: item.note,
    assignedAt: item.assignedAt,
  })),
  createdAt: volunteer.createdAt,
  updatedAt: volunteer.updatedAt,
});

const registerVolunteer = async (payload, user) => {
  const existing = await Volunteer.findOne({ user: user.id, isDeleted: false });

  if (existing) {
    throw new AppError("Volunteer profile already exists for this account", 400);
  }

  const skills = Array.isArray(payload.skills) ? payload.skills : [payload.skills].filter(Boolean);

  const volunteer = await Volunteer.create({
    user: user.id,
    name: payload.name || user.name,
    phone: payload.phone || user.phone || "",
    district: payload.district || user.district || "",
    jurisdictionType: payload.jurisdictionType || user.jurisdictionType || "Rural",
    tehsil: payload.tehsil || user.tehsil || "",
    village: payload.village || user.village || "",
    municipality: payload.municipality || user.municipality || "",
    skills,
    availabilityStatus: payload.availabilityStatus || "Available",
  });

  await volunteer.populate([{ path: "user", select: "name email role" }, { path: "approvedBy", select: "name email role" }]);

  return formatVolunteer(volunteer);
};

const getVolunteerProfile = async (user) => {
  const volunteer = await Volunteer.findOne({ user: user.id, isDeleted: false }).populate([{ path: "user", select: "name email role" }, { path: "approvedBy", select: "name email role" }]).lean();

  return volunteer ? formatVolunteer(volunteer) : null;
};

const getVolunteers = async (user, filters = {}) => {
  const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;
  const query = { isDeleted: false };

  if (user.role !== "superAdmin" && user.district) {
    query.district = user.district;
  }

  if (filters.skill) {
    query.skills = filters.skill;
  }

  if (filters.approvalStatus) {
    query.approvalStatus = filters.approvalStatus;
  }

  if (filters.availabilityStatus) {
    query.availabilityStatus = filters.availabilityStatus;
  }

  const [totalVolunteers, volunteers] = await Promise.all([
    Volunteer.countDocuments(query),
    Volunteer.find(query).populate([{ path: "user", select: "name email role" }, { path: "approvedBy", select: "name email role" }]).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return {
    volunteers: volunteers.map(formatVolunteer),
    pagination: {
      page,
      limit,
      totalPages: totalVolunteers === 0 ? 0 : Math.ceil(totalVolunteers / limit),
      totalVolunteers,
    },
  };
};

const approveVolunteer = async (volunteerId, payload, user) => {
  const volunteer = await Volunteer.findOne({ _id: volunteerId, isDeleted: false });

  if (!volunteer) {
    throw new AppError("Volunteer profile not found", 404);
  }

  volunteer.approvalStatus = payload.approvalStatus;
  volunteer.approvedBy = user.id;
  if (payload.approvalStatus !== "Approved") {
    volunteer.availabilityStatus = "Unavailable";
  }
  await volunteer.save();
  await volunteer.populate([{ path: "user", select: "name email role" }, { path: "approvedBy", select: "name email role" }]);

  const formatted = formatVolunteer(volunteer);
  emitRealtimeEvent(
    [
      `user:${volunteer.user?._id || volunteer.user}`,
      `district:${volunteer.district}`,
    ],
    "volunteer:approved",
    { volunteer: formatted }
  );

  return formatted;
};

const updateVolunteerAvailability = async (volunteerId, payload, user) => {
  const volunteer = await Volunteer.findOne({ _id: volunteerId, isDeleted: false });

  if (!volunteer) {
    throw new AppError("Volunteer profile not found", 404);
  }

  const isOwner = volunteer.user && volunteer.user.toString() === user.id.toString();
  const canManage = ["districtAdmin", "stateAdmin", "superAdmin"].includes(user.role);

  if (!isOwner && !canManage) {
    throw new AppError("You are not authorized to update volunteer availability", 403);
  }

  volunteer.availabilityStatus = payload.availabilityStatus;
  await volunteer.save();
  await volunteer.populate([{ path: "user", select: "name email role" }, { path: "approvedBy", select: "name email role" }]);

  return formatVolunteer(volunteer);
};

const deleteVolunteer = async (volunteerId, user) => {
  const volunteer = await Volunteer.findOne({ _id: volunteerId, isDeleted: false });

  if (!volunteer) {
    throw new AppError("Volunteer profile not found", 404);
  }

  const isOwner = volunteer.user && volunteer.user.toString() === user.id.toString();
  const canManage = ["districtAdmin", "stateAdmin", "superAdmin"].includes(user.role);

  if (!isOwner && !canManage) {
    throw new AppError("You are not authorized to archive this volunteer profile", 403);
  }

  volunteer.isDeleted = true;
  volunteer.deletedAt = new Date();
  volunteer.deletedBy = user.id;
  await volunteer.save();

  return formatVolunteer(volunteer);
};

module.exports = {
  registerVolunteer,
  getVolunteerProfile,
  getVolunteers,
  approveVolunteer,
  updateVolunteerAvailability,
  deleteVolunteer,
};

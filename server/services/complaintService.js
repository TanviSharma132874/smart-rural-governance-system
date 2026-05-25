const Complaint = require("../models/Complaint");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const OFFICER_ROLES = ["panchayatOfficer", "districtAdmin", "superAdmin"];
const STATUS_FLOW = {
  Pending: ["In Progress", "Rejected"],
  "In Progress": ["Resolved", "Rejected"],
  Resolved: [],
  Rejected: [],
};

const serializeComplaint = (complaint) => ({
  id: complaint._id,
  title: complaint.title,
  description: complaint.description,
  category: complaint.category,
  priority: complaint.priority,
  status: complaint.status,
  citizenId: complaint.citizenId,
  assignedOfficer: complaint.assignedOfficer,
  images: complaint.images,
  location: complaint.location,
  createdAt: complaint.createdAt,
  updatedAt: complaint.updatedAt,
});

const buildImagePaths = (files = []) =>
  files.map((file) => `/uploads/complaints/${file.filename}`);

const validateAssignedOfficer = async (assignedOfficerId) => {
  if (!assignedOfficerId) {
    return null;
  }

  const officer = await User.findById(assignedOfficerId);

  if (!officer) {
    throw new AppError("Assigned officer not found", 404);
  }

  if (!OFFICER_ROLES.includes(officer.role)) {
    throw new AppError("Assigned user must be a panchayat officer or admin", 400);
  }

  return officer;
};

const createComplaint = async (payload, user, files = []) => {
  if (payload.assignedOfficer) {
    throw new AppError("Citizens cannot assign officers while creating complaints", 403);
  }

  const complaint = await Complaint.create({
    title: payload.title,
    description: payload.description,
    category: payload.category,
    priority: payload.priority || "Medium",
    citizenId: user.id,
    assignedOfficer: payload.assignedOfficer || null,
    images: buildImagePaths(files),
    location: {
      address: payload.address || "",
      village: payload.village || "",
      district: payload.district || "",
      coordinates: {
        latitude: payload.latitude !== undefined ? Number(payload.latitude) : null,
        longitude: payload.longitude !== undefined ? Number(payload.longitude) : null,
      },
    },
  });

  return Complaint.findById(complaint._id)
    .populate("citizenId", "name email phone village district role")
    .populate("assignedOfficer", "name email role");
};

const getComplaints = async (user, filters = {}) => {
  const query = {};

  if (user.role === "citizen") {
    query.citizenId = user.id;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  const complaints = await Complaint.find(query)
    .populate("citizenId", "name email phone village district role")
    .populate("assignedOfficer", "name email role")
    .sort({ createdAt: -1 });

  return complaints.map(serializeComplaint);
};

const getComplaintById = async (complaintId, user) => {
  const complaint = await Complaint.findById(complaintId)
    .populate("citizenId", "name email phone village district role")
    .populate("assignedOfficer", "name email role");

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  if (user.role === "citizen" && complaint.citizenId._id.toString() !== user.id.toString()) {
    throw new AppError("You are not authorized to access this complaint", 403);
  }

  return serializeComplaint(complaint);
};

const updateComplaintStatus = async (complaintId, payload, user) => {
  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  if (!OFFICER_ROLES.includes(user.role)) {
    throw new AppError("Only officers and admins can update complaint status", 403);
  }

  if (payload.status && payload.status !== complaint.status) {
    const allowedStatuses = STATUS_FLOW[complaint.status] || [];

    if (!allowedStatuses.includes(payload.status)) {
      throw new AppError(
        `Invalid status transition from ${complaint.status} to ${payload.status}`,
        400
      );
    }

    complaint.status = payload.status;
  }

  if (payload.priority) {
    complaint.priority = payload.priority;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "assignedOfficer")) {
    if (payload.assignedOfficer) {
      const normalizedOfficerId =
        typeof payload.assignedOfficer === "string" ? payload.assignedOfficer.trim() : payload.assignedOfficer;

      await validateAssignedOfficer(normalizedOfficerId);
      complaint.assignedOfficer = normalizedOfficerId;
    } else {
      complaint.assignedOfficer = null;
    }
  }

  await complaint.save();

  return Complaint.findById(complaint._id)
    .populate("citizenId", "name email phone village district role")
    .populate("assignedOfficer", "name email role");
};

const deleteComplaint = async (complaintId, user) => {
  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  const isOwner = complaint.citizenId.toString() === user.id.toString();
  const isOfficer = OFFICER_ROLES.includes(user.role);

  if (!isOwner && !isOfficer) {
    throw new AppError("You are not authorized to delete this complaint", 403);
  }

  if (isOwner && complaint.status !== "Pending") {
    throw new AppError("Citizens can only delete complaints that are still pending", 400);
  }

  await complaint.deleteOne();
};

module.exports = {
  OFFICER_ROLES,
  STATUS_FLOW,
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  validateAssignedOfficer,
  serializeComplaint,
};

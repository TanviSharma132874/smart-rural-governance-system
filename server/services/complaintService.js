const Complaint = require("../models/Complaint");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const populateOptions = [
  { path: "citizenId", select: "name email phone role village district" },
  { path: "assignedOfficer", select: "name email phone role village district" },
];

const formatUser = (user) => {
  if (!user) {
    return null;
  }

  if (typeof user === "string") {
    return user;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    village: user.village,
    district: user.district,
  };
};

const formatComplaint = (complaint) => ({
  id: complaint._id,
  title: complaint.title,
  description: complaint.description,
  category: complaint.category,
  priority: complaint.priority,
  status: complaint.status,
  citizenId: formatUser(complaint.citizenId),
  assignedOfficer: formatUser(complaint.assignedOfficer),
  images: complaint.images,
  location: complaint.location,
  createdAt: complaint.createdAt,
  updatedAt: complaint.updatedAt,
});

const normalizeLocation = (payload = {}) => {
  const locationValue = typeof payload.location === "string" ? payload.location.trim() : "";
  const address = payload.locationAddress?.trim() || locationValue;
  const landmark = payload.landmark?.trim() || "";
  const latitude = payload.latitude !== undefined && payload.latitude !== "" ? Number(payload.latitude) : null;
  const longitude = payload.longitude !== undefined && payload.longitude !== "" ? Number(payload.longitude) : null;

  return {
    address,
    landmark,
    latitude: Number.isNaN(latitude) ? null : latitude,
    longitude: Number.isNaN(longitude) ? null : longitude,
  };
};

const normalizeImages = (files = []) => files.map((file) => `/uploads/complaints/${file.filename}`);

const createComplaint = async (payload, citizenId, files = []) => {
  const complaint = await Complaint.create({
    title: payload.title,
    description: payload.description,
    category: payload.category,
    priority: payload.priority || "Medium",
    citizenId,
    images: normalizeImages(files),
    location: normalizeLocation(payload),
  });

  await complaint.populate(populateOptions);

  return formatComplaint(complaint);
};

const getComplaints = async (user, filters = {}) => {
  const query = {};

  if (user.role === "citizen") {
    query.citizenId = user.id;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  const complaints = await Complaint.find(query).populate(populateOptions).sort({ createdAt: -1 });

  return complaints.map(formatComplaint);
};

const getComplaintById = async (complaintId, user) => {
  const complaint = await Complaint.findById(complaintId).populate(populateOptions);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  const isCitizenOwner = user.role === "citizen" && complaint.citizenId && complaint.citizenId._id.toString() === user.id.toString();
  const isAdminOrOfficer = ["panchayatOfficer", "districtAdmin", "superAdmin"].includes(user.role);

  if (!isCitizenOwner && !isAdminOrOfficer) {
    throw new AppError("You are not authorized to view this complaint", 403);
  }

  return formatComplaint(complaint);
};

const updateComplaintStatus = async (complaintId, payload) => {
  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  if (payload.status) {
    complaint.status = payload.status;
  }

  if (payload.assignedOfficer) {
    const officer = await User.findById(payload.assignedOfficer);

    if (!officer) {
      throw new AppError("Assigned officer was not found", 404);
    }

    complaint.assignedOfficer = officer._id;
  }

  await complaint.save();
  await complaint.populate(populateOptions);

  return formatComplaint(complaint);
};

const deleteComplaint = async (complaintId) => {
  const complaint = await Complaint.findByIdAndDelete(complaintId).populate(populateOptions);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  return formatComplaint(complaint);
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
};

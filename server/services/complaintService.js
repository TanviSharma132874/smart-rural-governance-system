const Complaint = require("../models/Complaint");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const OFFICER_ROLES = ["panchayatOfficer", "districtAdmin", "superAdmin"];
const STATUS_TRANSITIONS = {
  Pending: ["In Progress", "Rejected"],
  "In Progress": ["Resolved", "Rejected"],
  Resolved: [],
  Rejected: [],
};
const PRIORITY_SORT_ORDER = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

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
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildComplaintQuery = (user, filters = {}) => {
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

  if (filters.search) {
    const searchRegex = new RegExp(escapeRegex(filters.search.trim()), "i");
    query.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  return query;
};

const buildStandardSort = (sort = "latest") => {
  if (sort === "oldest") {
    return { createdAt: 1 };
  }

  return { createdAt: -1 };
};

const buildPagination = (page, limit, totalComplaints) => ({
  page,
  limit,
  totalPages: totalComplaints === 0 ? 0 : Math.ceil(totalComplaints / limit),
  totalComplaints,
});

const validateAssignedOfficer = async (assignedOfficerId) => {
  const officer = await User.findById(assignedOfficerId).lean();

  if (!officer) {
    throw new AppError("Assigned officer not found", 404);
  }

  if (!OFFICER_ROLES.includes(officer.role)) {
    throw new AppError("Assigned user must be a panchayat officer or admin", 400);
  }

  return officer;
};

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
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;
  const query = buildComplaintQuery(user, filters);
  const sort = filters.sort || "latest";

  const [totalComplaints, complaints] = await Promise.all([
    Complaint.countDocuments(query),
    sort === "priority"
      ? Complaint.aggregate([
          { $match: query },
          {
            $addFields: {
              priorityRank: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$priority", "Critical"] }, then: PRIORITY_SORT_ORDER.Critical },
                    { case: { $eq: ["$priority", "High"] }, then: PRIORITY_SORT_ORDER.High },
                    { case: { $eq: ["$priority", "Medium"] }, then: PRIORITY_SORT_ORDER.Medium },
                    { case: { $eq: ["$priority", "Low"] }, then: PRIORITY_SORT_ORDER.Low },
                  ],
                  default: 0,
                },
              },
            },
          },
          { $sort: { priorityRank: -1, createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]).then((items) => Complaint.populate(items, populateOptions))
      : Complaint.find(query)
          .populate(populateOptions)
          .sort(buildStandardSort(sort))
          .skip(skip)
          .limit(limit)
          .lean(),
  ]);

  return {
    complaints: complaints.map(formatComplaint),
    pagination: buildPagination(page, limit, totalComplaints),
  };
};

const getComplaintById = async (complaintId, user) => {
  const complaint = await Complaint.findById(complaintId).populate(populateOptions).lean();

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  const isCitizenOwner = user.role === "citizen" && complaint.citizenId && complaint.citizenId._id.toString() === user.id.toString();
  const isAdminOrOfficer = OFFICER_ROLES.includes(user.role);

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

  if (!STATUS_TRANSITIONS[complaint.status].includes(payload.status)) {
    throw new AppError(`Invalid status transition from ${complaint.status} to ${payload.status}`, 400);
  }

  complaint.status = payload.status;

  if (payload.priority) {
    complaint.priority = payload.priority;
  }

  await complaint.save();
  await complaint.populate(populateOptions);

  return formatComplaint(complaint);
};

const assignComplaint = async (complaintId, assignedOfficerId) => {
  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  await validateAssignedOfficer(assignedOfficerId);

  if (complaint.status === "Resolved" || complaint.status === "Rejected") {
    throw new AppError("Closed complaints cannot be reassigned", 400);
  }

  complaint.assignedOfficer = assignedOfficerId;

  if (complaint.status === "Pending") {
    complaint.status = "In Progress";
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
  assignComplaint,
  deleteComplaint,
};

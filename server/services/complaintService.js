const Complaint = require("../models/Complaint");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const {
  OFFICER_ROLES,
  COMPLAINT_STATUSES,
  COMPLAINT_PRIORITIES,
} = require("../config/constants");

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
const ESCALATION_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

const listPopulateOptions = [
  { path: "citizenId", select: "name email phone role village district" },
  { path: "assignedOfficer", select: "name email phone role village district" },
];

const detailPopulateOptions = [
  ...listPopulateOptions,
  { path: "statusHistory.updatedBy", select: "name email role" },
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
  jurisdictionType: complaint.jurisdictionType,
  escalationStatus: complaint.escalationStatus,
  escalatedAt: complaint.escalatedAt,
  isEscalated:
    complaint.escalationStatus === "Escalated" ||
    (!["Resolved", "Rejected"].includes(complaint.status) &&
      Date.now() - new Date(complaint.createdAt).getTime() >= 7 * 24 * 60 * 60 * 1000),
  statusHistory: (complaint.statusHistory || []).map((entry) => ({
    status: entry.status,
    updatedBy: formatUser(entry.updatedBy),
    updatedAt: entry.updatedAt,
  })),
  isDeleted: complaint.isDeleted,
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
const shouldEscalateComplaint = (complaint) =>
  complaint &&
  complaint.escalationStatus !== "Escalated" &&
  !["Resolved", "Rejected"].includes(complaint.status) &&
  Date.now() - new Date(complaint.createdAt).getTime() >= ESCALATION_THRESHOLD_MS;

const persistEscalation = async (complaintId) => {
  const escalatedComplaint = await Complaint.findOneAndUpdate(
    {
      _id: complaintId,
      isDeleted: false,
      escalationStatus: { $ne: "Escalated" },
      status: { $nin: ["Resolved", "Rejected"] },
    },
    {
      $set: {
        escalationStatus: "Escalated",
        escalatedAt: new Date(),
      },
    },
    { new: true }
  );

  if (escalatedComplaint) {
    logger.warn("Complaint escalated to district oversight", {
      complaintId: escalatedComplaint._id.toString(),
      escalatedAt: escalatedComplaint.escalatedAt?.toISOString(),
    });
  }
};

const persistEscalationsForRecords = async (complaints = []) => {
  const complaintsToEscalate = complaints.filter(shouldEscalateComplaint);

  if (complaintsToEscalate.length === 0) {
    return;
  }

  await Promise.all(complaintsToEscalate.map((complaint) => persistEscalation(complaint._id)));
};

const buildComplaintQuery = (user, filters = {}) => {
  const query = {
    isDeleted: false,
  };

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

  if (filters.jurisdictionType) {
    query.jurisdictionType = filters.jurisdictionType;
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
    jurisdictionType: payload.jurisdictionType || "Rural",
    statusHistory: [
      {
        status: COMPLAINT_STATUSES[0],
        updatedBy: citizenId,
      },
    ],
  });

  await complaint.populate(detailPopulateOptions);
  logger.info("Complaint created", {
    complaintId: complaint._id.toString(),
    citizenId: citizenId.toString(),
    priority: complaint.priority,
    status: complaint.status,
  });

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
        ]).then((items) => Complaint.populate(items, listPopulateOptions))
      : Complaint.find(query)
          .populate(listPopulateOptions)
          .sort(buildStandardSort(sort))
          .skip(skip)
          .limit(limit)
          .lean(),
  ]);

  await persistEscalationsForRecords(complaints);

  return {
    complaints: complaints.map(formatComplaint),
    pagination: buildPagination(page, limit, totalComplaints),
  };
};

const getComplaintById = async (complaintId, user) => {
  const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: false }).populate(detailPopulateOptions).lean();

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  const isCitizenOwner = user.role === "citizen" && complaint.citizenId && complaint.citizenId._id.toString() === user.id.toString();
  const isAdminOrOfficer = OFFICER_ROLES.includes(user.role);

  if (!isCitizenOwner && !isAdminOrOfficer) {
    throw new AppError("You are not authorized to view this complaint", 403);
  }

  if (shouldEscalateComplaint(complaint)) {
    await persistEscalation(complaint._id);
    complaint.escalationStatus = "Escalated";
    complaint.escalatedAt = new Date();
  }

  return formatComplaint(complaint);
};

const updateComplaintStatus = async (complaintId, payload, user) => {
  const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: false });

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  if (!STATUS_TRANSITIONS[complaint.status].includes(payload.status)) {
    throw new AppError(`Invalid status transition from ${complaint.status} to ${payload.status}`, 400);
  }

  complaint.status = payload.status;
  if (["Resolved", "Rejected"].includes(payload.status)) {
    complaint.escalationStatus = "Not Escalated";
    complaint.escalatedAt = null;
  }

  if (payload.priority) {
    complaint.priority = payload.priority;
  }

  complaint.statusHistory.push({
    status: payload.status,
    updatedBy: user.id,
  });

  await complaint.save();
  await complaint.populate(detailPopulateOptions);
  logger.info("Complaint status updated", {
    complaintId: complaint._id.toString(),
    previousStatus: complaint.statusHistory.at(-2)?.status || null,
    status: complaint.status,
    updatedBy: user.id.toString(),
  });

  return formatComplaint(complaint);
};

const assignComplaint = async (complaintId, assignedOfficerId, user) => {
  const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: false });

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
    complaint.statusHistory.push({
      status: "In Progress",
      updatedBy: user.id,
    });
  }

  await complaint.save();
  await complaint.populate(detailPopulateOptions);
  logger.info("Complaint assigned", {
    complaintId: complaint._id.toString(),
    assignedOfficerId: assignedOfficerId.toString(),
    assignedBy: user.id.toString(),
    status: complaint.status,
  });

  return formatComplaint(complaint);
};

const deleteComplaint = async (complaintId, user) => {
  const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: false });

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  complaint.isDeleted = true;
  complaint.deletedAt = new Date();
  complaint.deletedBy = user.id;

  await complaint.save();
  await complaint.populate(detailPopulateOptions);
  logger.warn("Complaint soft deleted", {
    complaintId: complaint._id.toString(),
    deletedBy: user.id.toString(),
  });

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

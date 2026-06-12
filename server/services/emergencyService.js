const Counter = require("../models/Counter");
const Emergency = require("../models/Emergency");
const Resource = require("../models/Resource");
const User = require("../models/User");
const Volunteer = require("../models/Volunteer");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const { emitRealtimeEvent } = require("../sockets");
const {
  EMERGENCY_DEPARTMENTS,
  EMERGENCY_SEVERITIES,
  EMERGENCY_STATUSES,
  EMERGENCY_TYPE_DEPARTMENTS,
  OFFICER_ROLES,
} = require("../config/constants");

const EMERGENCY_TRANSITIONS = {
  Submitted: ["Acknowledged"],
  Acknowledged: ["Assigned"],
  Assigned: ["In Progress"],
  "In Progress": ["Resolved"],
  Resolved: ["Closed"],
  Closed: [],
};

const PRIORITY_RANK = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

const listPopulateOptions = [
  { path: "citizen", select: "name email phone role district village municipality jurisdictionType" },
  { path: "assignedOfficer", select: "name email role department district village municipality" },
];

const detailPopulateOptions = [
  ...listPopulateOptions,
  { path: "statusHistory.updatedBy", select: "name email role department" },
  { path: "resourceAssignments.resource", select: "resourceType availableQuantity department district" },
  { path: "resourceAssignments.allocatedBy", select: "name email role department" },
  { path: "volunteerAssignments.volunteer", select: "name phone skills availabilityStatus approvalStatus district" },
  { path: "volunteerAssignments.assignedBy", select: "name email role department" },
];

const formatUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    department: user.department || "",
    district: user.district || "",
    village: user.village || "",
    municipality: user.municipality || "",
    jurisdictionType: user.jurisdictionType || "",
  };
};

const formatEmergency = (emergency) => ({
  id: emergency._id,
  emergencyType: emergency.emergencyType,
  title: emergency.title,
  description: emergency.description,
  location: emergency.location,
  jurisdictionType: emergency.jurisdictionType,
  state: emergency.state,
  district: emergency.district,
  tehsil: emergency.tehsil,
  village: emergency.village,
  municipality: emergency.municipality,
  images: (emergency.images || []).map((img) => img.replace(/^\/uploads\//, "/api/v1/files/")),
  severity: emergency.severity,
  priority: emergency.priority,
  incidentNumber: emergency.incidentNumber,
  peopleAffected: emergency.peopleAffected,
  contactNumber: emergency.contactNumber,
  status: emergency.status,
  citizen: formatUser(emergency.citizen),
  assignedDepartment: emergency.assignedDepartment,
  assignedOfficer: formatUser(emergency.assignedOfficer),
  resourceAssignments: (emergency.resourceAssignments || []).map((item) => ({
    resource: item.resource
      ? {
          id: item.resource._id || item.resource,
          resourceType: item.resource.resourceType || item.resourceType,
          availableQuantity: item.resource.availableQuantity,
          department: item.resource.department,
          district: item.resource.district,
        }
      : null,
    resourceType: item.resourceType,
    quantity: item.quantity,
    allocatedBy: formatUser(item.allocatedBy),
    allocatedAt: item.allocatedAt,
  })),
  volunteerAssignments: (emergency.volunteerAssignments || []).map((item) => ({
    volunteer: item.volunteer
      ? {
          id: item.volunteer._id || item.volunteer,
          name: item.volunteer.name,
          phone: item.volunteer.phone,
          skills: item.volunteer.skills || [],
          availabilityStatus: item.volunteer.availabilityStatus,
          approvalStatus: item.volunteer.approvalStatus,
          district: item.volunteer.district,
        }
      : null,
    assignedBy: formatUser(item.assignedBy),
    note: item.note,
    assignedAt: item.assignedAt,
  })),
  statusHistory: (emergency.statusHistory || []).map((item) => ({
    status: item.status,
    action: item.action,
    remarks: item.remarks,
    department: item.department,
    updatedBy: formatUser(item.updatedBy),
    updatedAt: item.updatedAt,
  })),
  acknowledgedAt: emergency.acknowledgedAt,
  responseStartedAt: emergency.responseStartedAt,
  resolvedAt: emergency.resolvedAt,
  closedAt: emergency.closedAt,
  createdAt: emergency.createdAt,
  updatedAt: emergency.updatedAt,
});

const buildPagination = (page, limit, totalItems, key = "totalItems") => ({
  page,
  limit,
  totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
  [key]: totalItems,
});

const normalizeListOptions = (filters = {}) => {
  const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);
  const requestedLimit = Number.parseInt(filters.limit, 10) || 10;
  const limit = Math.min(Math.max(requestedLimit, 1), 50);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    search: typeof filters.search === "string" ? filters.search.trim() : "",
    status: typeof filters.status === "string" ? filters.status.trim() : "",
    severity: typeof filters.severity === "string" ? filters.severity.trim() : "",
    emergencyType: typeof filters.emergencyType === "string" ? filters.emergencyType.trim() : "",
    sort: filters.sort === "oldest" ? "oldest" : filters.sort === "priority" ? "priority" : "latest",
  };
};

const buildJurisdictionQuery = (user) => {
  if (user.role === "superAdmin") {
    return {};
  }

  const query = {};

  if (user.state) {
    query.state = user.state;
  }

  if (user.role === "stateAdmin") {
    return query;
  }

  if (user.district) {
    query.district = user.district;
  }

  if (["districtAdmin"].includes(user.role)) {
    return query;
  }

  if (user.tehsil) {
    query.tehsil = user.tehsil;
  }

  if (user.jurisdictionType) {
    query.jurisdictionType = user.jurisdictionType;
  }

  if (user.jurisdictionType === "Rural" && user.village) {
    query.village = user.village;
  }

  if (user.jurisdictionType === "Urban" && user.municipality) {
    query.municipality = user.municipality;
  }

  return query;
};

const ensureJurisdictionAccess = (user, record) => {
  if (user.role === "superAdmin") {
    return;
  }

  if (user.state && record.state && user.state !== record.state) {
    throw new AppError("State jurisdiction mismatch", 403);
  }

  if (user.district && record.district && user.district !== record.district) {
    throw new AppError("District jurisdiction mismatch", 403);
  }

  if (user.tehsil && record.tehsil && user.tehsil !== record.tehsil) {
    throw new AppError("Tehsil jurisdiction mismatch", 403);
  }

  if (user.jurisdictionType === "Rural" && user.village && record.village && user.village !== record.village) {
    throw new AppError("Village jurisdiction mismatch", 403);
  }

  if (user.jurisdictionType === "Urban" && user.municipality && record.municipality && user.municipality !== record.municipality) {
    throw new AppError("Municipality jurisdiction mismatch", 403);
  }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeLocation = (payload = {}) => ({
  address: (payload.location || payload.locationAddress || "").trim(),
  landmark: (payload.landmark || "").trim(),
  latitude: payload.latitude !== undefined && payload.latitude !== "" ? Number(payload.latitude) : null,
  longitude: payload.longitude !== undefined && payload.longitude !== "" ? Number(payload.longitude) : null,
});

const normalizeImages = (files = []) => files.map((file) => `/uploads/emergencies/${file.filename}`);

const createHistoryEntry = ({ status, action, remarks, department, userId }) => ({
  status,
  action,
  remarks: remarks || "",
  department,
  updatedBy: userId,
});

const determineDepartment = (emergencyType) => {
  const departments = EMERGENCY_TYPE_DEPARTMENTS[emergencyType] || [];

  if (departments.length === 0) {
    throw new AppError("No department routing configured for this emergency type", 400);
  }

  return departments[0];
};

const nextEmergencyNumber = async () => {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { key: `SOS-${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  return `SOS-${year}-${String(counter.sequence).padStart(4, "0")}`;
};

const notifyEmergencyRooms = (emergency, event, payload) => {
  emitRealtimeEvent(
    [
      `department:${emergency.assignedDepartment}`,
      `district:${emergency.district}`,
      `user:${emergency.citizen?._id || emergency.citizen}`,
      emergency.jurisdictionType ? `jurisdiction:${emergency.jurisdictionType}` : "",
    ],
    event,
    payload
  );
};

const buildListQuery = (user, filters = {}) => {
  const options = normalizeListOptions(filters);
  const query = user.role === "citizen" ? { citizen: user.id, isDeleted: false } : { isDeleted: false, ...buildJurisdictionQuery(user) };

  if (filters.forCitizenDashboard && user.role === "citizen") {
    query.citizen = user.id;
  }

  if (user.role !== "citizen" && ["departmentOfficer", "panchayatOfficer"].includes(user.role) && user.department) {
    query.assignedDepartment = user.department;
  }

  if (options.status) {
    query.status = options.status;
  }

  if (options.severity) {
    query.severity = options.severity;
  }

  if (options.emergencyType) {
    query.emergencyType = options.emergencyType;
  }

  if (options.search) {
    const regex = new RegExp(escapeRegex(options.search), "i");
    query.$or = [{ title: regex }, { description: regex }, { "location.address": regex }];
  }

  return { query, options };
};

const buildSort = (sort) => {
  if (sort === "oldest") {
    return { createdAt: 1 };
  }

  if (sort === "priority") {
    return null;
  }

  return { createdAt: -1 };
};

const createEmergency = async (payload, user, files = []) => {
  const location = normalizeLocation(payload);

  if (!location.address) {
    throw new AppError("Location address is required", 400);
  }

  const assignedDepartment = determineDepartment(payload.emergencyType);
  const emergencyNumber = await nextEmergencyNumber();
  const emergency = await Emergency.create({
    emergencyType: payload.emergencyType,
    title: payload.title,
    description: payload.description,
    location,
    jurisdictionType: payload.jurisdictionType || user.jurisdictionType || "Rural",
    state: payload.state || user.state || "Rajasthan",
    district: payload.district || user.district || "",
    tehsil: payload.tehsil || user.tehsil || "",
    village: payload.jurisdictionType === "Rural" ? payload.village || user.village || "" : "",
    municipality: payload.jurisdictionType === "Urban" ? payload.municipality || user.municipality || "" : "",
    images: normalizeImages(files),
    severity: payload.severity || "Medium",
    priority: payload.severity || "Medium",
    incidentNumber: emergencyNumber,
    peopleAffected: Number(payload.peopleAffected) || 1,
    contactNumber: payload.contactNumber || user.phone || "",
    citizen: user.id,
    assignedDepartment,
    statusHistory: [
      createHistoryEntry({
        status: "Submitted",
        action: "SOS Request Submitted",
        remarks: payload.description,
        department: assignedDepartment,
        userId: user.id,
      }),
    ],
  });

  await emergency.populate(detailPopulateOptions);
  logger.info("Emergency created", {
    emergencyId: emergency._id.toString(),
    emergencyType: emergency.emergencyType,
    district: emergency.district,
    department: emergency.assignedDepartment,
  });

  notifyEmergencyRooms(emergency, "emergency:created", { emergency: formatEmergency(emergency) });

  return formatEmergency(emergency);
};

const getMyEmergencies = async (user, filters = {}) => {
  const { query, options } = buildListQuery(user, { ...filters, forCitizenDashboard: true });
  const [totalEmergencies, emergencies] = await Promise.all([
    Emergency.countDocuments(query),
    options.sort === "priority"
      ? Emergency.aggregate([
          { $match: query },
          {
            $addFields: {
              priorityRank: {
                $switch: {
                  branches: EMERGENCY_SEVERITIES.map((item, index) => ({
                    case: { $eq: ["$priority", item] },
                    then: PRIORITY_RANK[item],
                  })),
                  default: 0,
                },
              },
            },
          },
          { $sort: { priorityRank: -1, createdAt: -1 } },
          { $skip: options.skip },
          { $limit: options.limit },
        ]).then((items) => Emergency.populate(items, listPopulateOptions))
      : Emergency.find(query)
          .populate(listPopulateOptions)
          .sort(buildSort(options.sort))
          .skip(options.skip)
          .limit(options.limit)
          .lean(),
  ]);

  return {
    emergencies: emergencies.map(formatEmergency),
    pagination: buildPagination(options.page, options.limit, totalEmergencies, "totalEmergencies"),
  };
};

const getEmergencyDashboard = async (user, filters = {}) => {
  if (!OFFICER_ROLES.includes(user.role)) {
    throw new AppError("Only officers and admins can access the emergency dashboard", 403);
  }

  const { query, options } = buildListQuery(user, filters);
  const [totalEmergencies, emergencies] = await Promise.all([
    Emergency.countDocuments(query),
    options.sort === "priority"
      ? Emergency.aggregate([
          { $match: query },
          {
            $addFields: {
              priorityRank: {
                $switch: {
                  branches: EMERGENCY_SEVERITIES.map((item) => ({
                    case: { $eq: ["$priority", item] },
                    then: PRIORITY_RANK[item],
                  })),
                  default: 0,
                },
              },
            },
          },
          { $sort: { priorityRank: -1, createdAt: -1 } },
          { $skip: options.skip },
          { $limit: options.limit },
        ]).then((items) => Emergency.populate(items, listPopulateOptions))
      : Emergency.find(query)
          .populate(listPopulateOptions)
          .sort(buildSort(options.sort))
          .skip(options.skip)
          .limit(options.limit)
          .lean(),
  ]);

  return {
    emergencies: emergencies.map(formatEmergency),
    pagination: buildPagination(options.page, options.limit, totalEmergencies, "totalEmergencies"),
  };
};

const getEmergencyById = async (emergencyId, user) => {
  const emergency = await Emergency.findOne({ _id: emergencyId, isDeleted: false }).populate(detailPopulateOptions).lean();

  if (!emergency) {
    throw new AppError("Emergency record not found", 404);
  }

  if (user.role === "citizen" && emergency.citizen?._id.toString() !== user.id.toString()) {
    throw new AppError("You are not authorized to view this emergency request", 403);
  }

  if (user.role !== "citizen") {
    ensureJurisdictionAccess(user, emergency);

    if (["departmentOfficer", "panchayatOfficer"].includes(user.role) && user.department && user.department !== emergency.assignedDepartment) {
      throw new AppError("You are not authorized for this emergency department queue", 403);
    }
  }

  return formatEmergency(emergency);
};

const acknowledgeEmergency = async (emergencyId, payload, user) => {
  const emergency = await Emergency.findOne({ _id: emergencyId, isDeleted: false });

  if (!emergency) {
    throw new AppError("Emergency record not found", 404);
  }

  ensureJurisdictionAccess(user, emergency);

  if (["departmentOfficer", "panchayatOfficer"].includes(user.role) && user.department && user.department !== emergency.assignedDepartment) {
    throw new AppError("You are not authorized for this emergency department queue", 403);
  }

  if (!EMERGENCY_TRANSITIONS[emergency.status].includes("Acknowledged")) {
    throw new AppError(`Emergency cannot move from ${emergency.status} to Acknowledged`, 400);
  }

  emergency.status = "Acknowledged";
  emergency.assignedOfficer = user.id;
  emergency.acknowledgedAt = new Date();
  emergency.statusHistory.push(
    createHistoryEntry({
      status: "Acknowledged",
      action: "Emergency acknowledged by response team",
      remarks: payload.remarks,
      department: emergency.assignedDepartment,
      userId: user.id,
    })
  );

  await emergency.save();
  await emergency.populate(detailPopulateOptions);

  notifyEmergencyRooms(emergency, "emergency:acknowledged", { emergency: formatEmergency(emergency) });

  return formatEmergency(emergency);
};

const updateEmergencyStatus = async (emergencyId, payload, user) => {
  const emergency = await Emergency.findOne({ _id: emergencyId, isDeleted: false });

  if (!emergency) {
    throw new AppError("Emergency record not found", 404);
  }

  ensureJurisdictionAccess(user, emergency);

  if (["departmentOfficer", "panchayatOfficer"].includes(user.role) && user.department && user.department !== emergency.assignedDepartment) {
    throw new AppError("You are not authorized for this emergency department queue", 403);
  }

  if (!EMERGENCY_TRANSITIONS[emergency.status].includes(payload.status)) {
    throw new AppError(`Invalid emergency status transition from ${emergency.status} to ${payload.status}`, 400);
  }

  emergency.status = payload.status;
  emergency.statusHistory.push(
    createHistoryEntry({
      status: payload.status,
      action: `Emergency moved to ${payload.status}`,
      remarks: payload.remarks,
      department: emergency.assignedDepartment,
      userId: user.id,
    })
  );

  if (payload.status === "Assigned" && !emergency.assignedOfficer) {
    emergency.assignedOfficer = user.id;
  }

  if (payload.status === "In Progress") {
    emergency.responseStartedAt = new Date();
  }

  if (payload.status === "Resolved") {
    emergency.resolvedAt = new Date();
    // Mark Volunteers as Completed when resolved
    if (emergency.volunteerAssignments && emergency.volunteerAssignments.length > 0) {
      const volunteerIds = emergency.volunteerAssignments.map((a) => a.volunteer);
      await Volunteer.updateMany(
        { _id: { $in: volunteerIds } },
        { $set: { availabilityStatus: "Completed" } }
      );
      logger.info("Volunteers moved to 'Completed' status (SOS Resolved)", {
        emergencyId: emergency._id.toString(),
        volunteersCount: volunteerIds.length
      });
    }
  }

  if (payload.status === "Closed") {
    emergency.closedAt = new Date();
    // Release Volunteers to Available when closed
    if (emergency.volunteerAssignments && emergency.volunteerAssignments.length > 0) {
      const volunteerIds = emergency.volunteerAssignments.map((a) => a.volunteer);
      await Volunteer.updateMany(
        { _id: { $in: volunteerIds } },
        { $set: { availabilityStatus: "Available" } }
      );
      logger.info("Volunteers released to 'Available' status (SOS Closed)", {
        emergencyId: emergency._id.toString(),
        volunteersCount: volunteerIds.length
      });
    }
  }

  await emergency.save();
  await emergency.populate(detailPopulateOptions);

  logger.info("Emergency status updated", {
    emergencyId: emergency._id.toString(),
    status: emergency.status,
    updatedBy: user.id.toString(),
  });

  notifyEmergencyRooms(emergency, "emergency:updated", { emergency: formatEmergency(emergency) });

  return formatEmergency(emergency);
};

const assignResources = async (emergencyId, payload, user) => {
  const emergency = await Emergency.findOne({ _id: emergencyId, isDeleted: false });

  if (!emergency) {
    throw new AppError("Emergency record not found", 404);
  }

  ensureJurisdictionAccess(user, emergency);

  if (!Array.isArray(payload.resources) || payload.resources.length === 0) {
    throw new AppError("At least one resource allocation is required", 400);
  }

  const assignments = [];

  for (const requested of payload.resources) {
    const resource = await Resource.findOne({ _id: requested.resourceId, isDeleted: false });

    if (!resource) {
      throw new AppError("Resource not found", 404);
    }

    ensureJurisdictionAccess(user, resource);

    const quantity = Number(requested.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new AppError("Allocated quantity must be greater than zero", 400);
    }

    if (resource.availableQuantity < quantity) {
      throw new AppError(`Insufficient stock for ${resource.resourceType}`, 400);
    }

    resource.availableQuantity -= quantity;
    resource.status =
      resource.availableQuantity === 0 ? "Depleted" : resource.availableQuantity <= Math.max(1, Math.floor(resource.quantity * 0.2)) ? "Low Stock" : "Available";
    resource.auditHistory.push({
      action: "Allocated to emergency",
      quantityChange: -quantity,
      remarks: `Allocated to emergency ${emergency.title}`,
      updatedBy: user.id,
    });
    resource.allocationHistory.push({
      emergency: emergency._id,
      quantity,
      allocatedBy: user.id,
      remarks: payload.remarks || `Allocated to emergency ${emergency.title}`,
    });
    resource.lastAllocationAt = new Date();
    await resource.save();

    assignments.push({
      resource: resource._id,
      resourceType: resource.resourceType,
      quantity,
      allocatedBy: user.id,
    });

    emitRealtimeEvent(
      [`district:${resource.district}`, `department:${resource.department}`],
      "resource:updated",
      { resource: { id: resource._id, resourceType: resource.resourceType, availableQuantity: resource.availableQuantity, status: resource.status } }
    );
  }

  emergency.resourceAssignments.push(...assignments);

  if (emergency.status === "Acknowledged") {
    emergency.status = "Assigned";
    emergency.statusHistory.push(
      createHistoryEntry({
        status: "Assigned",
        action: "Resources allocated and response assigned",
        remarks: payload.remarks,
        department: emergency.assignedDepartment,
        userId: user.id,
      })
    );
  }

  await emergency.save();
  await emergency.populate(detailPopulateOptions);

  notifyEmergencyRooms(emergency, "emergency:resources-assigned", { emergency: formatEmergency(emergency) });

  return formatEmergency(emergency);
};

const assignVolunteers = async (emergencyId, payload, user) => {
  const emergency = await Emergency.findOne({ _id: emergencyId, isDeleted: false });

  if (!emergency) {
    throw new AppError("Emergency record not found", 404);
  }

  ensureJurisdictionAccess(user, emergency);

  if (!Array.isArray(payload.volunteerIds) || payload.volunteerIds.length === 0) {
    throw new AppError("At least one volunteer must be selected", 400);
  }

  for (const volunteerId of payload.volunteerIds) {
    const volunteer = await Volunteer.findOne({ _id: volunteerId, isDeleted: false });

    if (!volunteer) {
      throw new AppError("Volunteer not found", 404);
    }

    if (volunteer.approvalStatus !== "Approved") {
      throw new AppError(`Volunteer ${volunteer.name} is not approved`, 400);
    }

    if (volunteer.availabilityStatus !== "Available") {
      throw new AppError(`Volunteer ${volunteer.name} is not currently available`, 400);
    }

    ensureJurisdictionAccess(user, volunteer);

    volunteer.availabilityStatus = "Assigned";
    volunteer.assignments.push({
      emergency: emergency._id,
      note: payload.note || "",
    });
    await volunteer.save();

    emergency.volunteerAssignments.push({
      volunteer: volunteer._id,
      assignedBy: user.id,
      note: payload.note || "",
    });
  }

  await emergency.save();
  await emergency.populate(detailPopulateOptions);

  notifyEmergencyRooms(emergency, "emergency:volunteers-assigned", { emergency: formatEmergency(emergency) });

  return formatEmergency(emergency);
};

const getEmergencyAnalytics = async (user) => {
  if (!["districtAdmin", "stateAdmin", "superAdmin"].includes(user.role)) {
    throw new AppError("Only district and state administrators can view emergency analytics", 403);
  }

  const query = { isDeleted: false, ...buildJurisdictionQuery(user) };
  const [typeStats, statusStats, severityStats, recent] = await Promise.all([
    Emergency.aggregate([{ $match: query }, { $group: { _id: "$emergencyType", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Emergency.aggregate([{ $match: query }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Emergency.aggregate([{ $match: query }, { $group: { _id: "$severity", count: { $sum: 1 } } }]),
    Emergency.find(query).sort({ createdAt: -1 }).limit(6).populate(listPopulateOptions).lean(),
  ]);

  const responseTimes = recent
    .filter((item) => item.responseStartedAt)
    .map((item) => ({
      id: item._id,
      title: item.title,
      hours: Math.max(0, (new Date(item.responseStartedAt).getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60)),
    }));

  return {
    typeStats: typeStats.map((item) => ({ label: item._id, value: item.count })),
    statusStats: statusStats.map((item) => ({ label: item._id, value: item.count })),
    severityStats: severityStats.map((item) => ({ label: item._id, value: item.count })),
    responseTimes,
    recentEmergencies: recent.map(formatEmergency),
  };
};

const deleteEmergency = async (emergencyId, user) => {
  const emergency = await Emergency.findOne({ _id: emergencyId, isDeleted: false });

  if (!emergency) {
    throw new AppError("Emergency record not found", 404);
  }

  const isCitizenOwner = user.role === "citizen" && emergency.citizen.toString() === user.id.toString();
  const isAdmin = ["districtAdmin", "stateAdmin", "superAdmin"].includes(user.role);

  if (!isCitizenOwner && !isAdmin) {
    throw new AppError("You are not authorized to archive this emergency request", 403);
  }

  if (isCitizenOwner && emergency.status !== "Submitted") {
    throw new AppError("Only newly submitted SOS requests can be archived by citizens", 400);
  }

  emergency.isDeleted = true;
  emergency.deletedAt = new Date();
  emergency.deletedBy = user.id;
  await emergency.save();

  return formatEmergency(emergency);
};

module.exports = {
  createEmergency,
  getMyEmergencies,
  getEmergencyDashboard,
  getEmergencyById,
  acknowledgeEmergency,
  updateEmergencyStatus,
  assignResources,
  assignVolunteers,
  getEmergencyAnalytics,
  deleteEmergency,
};

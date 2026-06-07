const Complaint = require("../models/Complaint");
const Announcement = require("../models/Announcement");
const Certificate = require("../models/Certificate");
const Emergency = require("../models/Emergency");
const Resource = require("../models/Resource");
const Volunteer = require("../models/Volunteer");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const { emitRealtimeEvent } = require("../sockets");
const {
  OFFICER_ROLES,
  COMPLAINT_CATEGORY_DEPARTMENTS,
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
const DASHBOARD_CACHE_TTL_MS = 60 * 1000;
const dashboardCache = new Map();

const listPopulateOptions = [
  { path: "citizenId", select: "name email phone role village district municipality" },
  { path: "assignedOfficer", select: "name email phone role department village district municipality" },
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
    department: user.department,
    phone: user.phone,
    village: user.village,
    district: user.district,
    municipality: user.municipality,
  };
};

const formatComplaint = (complaint) => ({
  id: complaint._id,
  title: complaint.title,
  description: complaint.description,
  category: complaint.category,
  subcategory: complaint.subcategory,
  priority: complaint.priority,
  status: complaint.status,
  citizenId: formatUser(complaint.citizenId),
  assignedOfficer: formatUser(complaint.assignedOfficer),
  images: complaint.images,
  responsibleDepartment: complaint.responsibleDepartment,
  wardNumber: complaint.wardNumber,
  citizenRemarks: complaint.citizenRemarks,
  officerRemarks: complaint.officerRemarks,
  resolutionNotes: complaint.resolutionNotes,
  resolutionImages: complaint.resolutionImages,
  location: complaint.location,
  jurisdictionType: complaint.jurisdictionType,
  state: complaint.state,
  district: complaint.district,
  tehsil: complaint.tehsil,
  village: complaint.village,
  municipality: complaint.municipality,
  escalationStatus: complaint.escalationStatus,
  escalatedAt: complaint.escalatedAt,
  isEscalated:
    complaint.escalationStatus === "Escalated" ||
    (!["Resolved", "Rejected"].includes(complaint.status) &&
      Date.now() - new Date(complaint.createdAt).getTime() >= 7 * 24 * 60 * 60 * 1000),
  statusHistory: (complaint.statusHistory || []).map((entry) => ({
    status: entry.status,
    action: entry.action,
    remarks: entry.remarks,
    resolutionNotes: entry.resolutionNotes,
    resolutionImages: entry.resolutionImages,
    responsibleDepartment: entry.responsibleDepartment,
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

const buildJurisdiction = (payload = {}, user) => {
  const jurisdictionType = payload.jurisdictionType || user?.jurisdictionType || "Rural";

  return {
    jurisdictionType,
    state: payload.state || user?.state || "",
    district: payload.district || user?.district || "",
    tehsil: payload.tehsil || user?.tehsil || "",
    village: jurisdictionType === "Rural" ? payload.village || user?.village || "" : "",
    municipality: jurisdictionType === "Urban" ? payload.municipality || user?.municipality || "" : "",
  };
};

const normalizeImages = (files = []) => files.map((file) => `/uploads/complaints/${file.filename}`);
const determineResponsibleDepartment = (category) => COMPLAINT_CATEGORY_DEPARTMENTS[category] || "Local Administration Department";
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

  if (user.role === "districtAdmin") {
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

const ensureJurisdictionAccess = (user, complaint) => {
  if (user.role === "superAdmin") {
    return;
  }

  if (user.state && user.state !== complaint.state) {
    throw new AppError("You are not authorized for complaints outside your state jurisdiction", 403);
  }

  if (["districtAdmin", "departmentOfficer", "panchayatOfficer"].includes(user.role) && user.district && user.district !== complaint.district) {
    throw new AppError("You are not authorized for complaints outside your district jurisdiction", 403);
  }

  if (["departmentOfficer", "panchayatOfficer"].includes(user.role)) {
    if (user.tehsil && user.tehsil !== complaint.tehsil) {
      throw new AppError("You are not authorized for complaints outside your tehsil or block", 403);
    }

    if (user.jurisdictionType === "Rural" && user.village && user.village !== complaint.village) {
      throw new AppError("You are not authorized for complaints outside your village jurisdiction", 403);
    }

    if (user.jurisdictionType === "Urban" && user.municipality && user.municipality !== complaint.municipality) {
      throw new AppError("You are not authorized for complaints outside your municipality jurisdiction", 403);
    }
  }
};

const ensureDepartmentAccess = (user, complaint) => {
  if (["districtAdmin", "stateAdmin", "superAdmin"].includes(user.role)) {
    return;
  }

  if (["departmentOfficer", "panchayatOfficer"].includes(user.role) && user.department && complaint.responsibleDepartment && user.department !== complaint.responsibleDepartment) {
    throw new AppError("You are not authorized for complaints outside your department queue", 403);
  }
};

const buildComplaintQuery = (user, filters = {}) => {
  const query = {
    isDeleted: false,
  };

  if (user.role === "citizen") {
    query.citizenId = user.id;
  } else {
    Object.assign(query, buildJurisdictionQuery(user));
    if (["departmentOfficer", "panchayatOfficer"].includes(user.role) && user.department) {
      query.responsibleDepartment = user.department;
    }
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

  if (filters.subcategory) {
    query.subcategory = filters.subcategory;
  }

  if (filters.responsibleDepartment) {
    query.responsibleDepartment = filters.responsibleDepartment;
  }

  if (filters.escalationStatus) {
    query.escalationStatus = filters.escalationStatus;
  }

  if (filters.jurisdictionType) {
    query.jurisdictionType = filters.jurisdictionType;
  }

  if (filters.search) {
    const searchRegex = new RegExp(escapeRegex(filters.search.trim()), "i");
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { subcategory: searchRegex },
      { responsibleDepartment: searchRegex },
      { citizenRemarks: searchRegex },
      { resolutionNotes: searchRegex },
    ];
  }

  return query;
};

const buildCertificateDashboardQuery = (user) => {
  const query = { isDeleted: false };

  if (user.role === "citizen") {
    query.applicant = user.id;
    return query;
  }

  Object.assign(query, buildJurisdictionQuery(user));

  if (["departmentOfficer", "panchayatOfficer"].includes(user.role) && user.department) {
    query.department = user.department;
  }

  return query;
};

const buildEmergencyDashboardQuery = (user) => {
  const query = { isDeleted: false };

  if (user.role === "citizen") {
    query.citizen = user.id;
    return query;
  }

  Object.assign(query, buildJurisdictionQuery(user));

  if (["departmentOfficer", "panchayatOfficer"].includes(user.role) && user.department) {
    query.assignedDepartment = user.department;
  }

  return query;
};

const buildResourceDashboardQuery = (user) => {
  const query = { isDeleted: false };

  if (user.role !== "superAdmin" && user.state) {
    query.state = user.state;
  }

  if (["districtAdmin", "departmentOfficer", "panchayatOfficer"].includes(user.role) && user.district) {
    query.district = user.district;
  }

  if (["departmentOfficer", "panchayatOfficer"].includes(user.role) && user.department) {
    query.department = user.department;
  }

  return query;
};

const buildVolunteerDashboardQuery = (user) => {
  const query = { isDeleted: false };

  if (user.role !== "superAdmin" && user.district) {
    query.district = user.district;
  }

  return query;
};

const buildAnnouncementDashboardQuery = (user) => {
  const query = { isDeleted: false };

  if (user.role !== "superAdmin" && user.state) {
    query.state = user.state;
  }

  if (user.role !== "stateAdmin" && user.role !== "superAdmin" && user.district) {
    query.district = user.district;
  }

  if (user.role === "citizen") {
    query.status = "Published";
    query.targetAudience = { $in: ["All", "Citizens"] };
  } else if (user.role === "volunteer") {
    query.status = "Published";
    query.targetAudience = { $in: ["All", "Volunteers"] };
  }

  return query;
};

const toCountMap = (items = []) =>
  items.reduce((accumulator, item) => {
    accumulator[item._id || "Unspecified"] = item.count;
    return accumulator;
  }, {});

const toChartItems = (items = []) =>
  items.map((item) => ({
    label: item._id || "Unspecified",
    value: item.count || 0,
  }));

const readCachedDashboard = (key) => {
  const cached = dashboardCache.get(key);

  if (!cached || cached.expiresAt < Date.now()) {
    dashboardCache.delete(key);
    return null;
  }

  return cached.value;
};

const writeCachedDashboard = (key, value) => {
  dashboardCache.set(key, {
    value,
    expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
  });
};

const buildCacheKey = (user) =>
  [
    user.id?.toString(),
    user.role,
    user.department || "",
    user.state || "",
    user.district || "",
    user.tehsil || "",
    user.jurisdictionType || "",
    user.village || "",
    user.municipality || "",
  ].join("|");

const getCitizenDashboardAnalytics = async (user) => {
  const complaintQuery = buildComplaintQuery(user);
  const certificateQuery = buildCertificateDashboardQuery(user);
  const emergencyQuery = buildEmergencyDashboardQuery(user);
  const announcementQuery = buildAnnouncementDashboardQuery(user);

  const [complaintStatus, certificateStatus, emergencyStatus, recentAnnouncements] = await Promise.all([
    Complaint.aggregate([{ $match: complaintQuery }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Certificate.aggregate([{ $match: certificateQuery }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Emergency.aggregate([{ $match: emergencyQuery }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Announcement.find(announcementQuery)
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(5)
      .select("title announcementType message department publishedAt createdAt status")
      .lean(),
  ]);

  const complaintCounts = toCountMap(complaintStatus);
  const certificateCounts = toCountMap(certificateStatus);
  const emergencyCounts = toCountMap(emergencyStatus);

  return {
    role: "citizen",
    complaintStatistics: {
      total: Object.values(complaintCounts).reduce((sum, value) => sum + value, 0),
      pending: complaintCounts.Pending || 0,
      inProgress: complaintCounts["In Progress"] || 0,
      resolved: complaintCounts.Resolved || 0,
    },
    certificateStatistics: {
      total: Object.values(certificateCounts).reduce((sum, value) => sum + value, 0),
      pending: (certificateCounts.Submitted || 0) + (certificateCounts["Under Review"] || 0),
      approved: certificateCounts.Approved || 0,
      rejected: certificateCounts.Rejected || 0,
    },
    emergencyStatistics: {
      total: Object.values(emergencyCounts).reduce((sum, value) => sum + value, 0),
      active: Object.entries(emergencyCounts).reduce((sum, [status, count]) => (["Resolved", "Closed"].includes(status) ? sum : sum + count), 0),
    },
    recentAnnouncements: recentAnnouncements.map((announcement) => ({
      id: announcement._id,
      title: announcement.title,
      announcementType: announcement.announcementType,
      message: announcement.message,
      department: announcement.department,
      publishedAt: announcement.publishedAt,
      createdAt: announcement.createdAt,
      status: announcement.status,
    })),
  };
};

const getOfficerDashboardAnalytics = async (user) => {
  const complaintQuery = buildComplaintQuery(user);
  const certificateQuery = buildCertificateDashboardQuery(user);
  const emergencyQuery = buildEmergencyDashboardQuery(user);
  const resourceQuery = buildResourceDashboardQuery(user);
  const volunteerQuery = buildVolunteerDashboardQuery(user);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [assignedComplaints, departmentQueue, escalatedComplaints, certificateStatus, approvedToday, emergencyStatus, resourceUsage, volunteerStatus] =
    await Promise.all([
      Complaint.countDocuments({ ...complaintQuery, assignedOfficer: user.id }),
      Complaint.countDocuments(complaintQuery),
      Complaint.countDocuments({ ...complaintQuery, escalationStatus: "Escalated" }),
      Certificate.aggregate([{ $match: certificateQuery }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Certificate.countDocuments({ ...certificateQuery, status: "Approved", issuedAt: { $gte: today } }),
      Emergency.aggregate([{ $match: emergencyQuery }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Resource.aggregate([
        { $match: resourceQuery },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: "$quantity" },
            availableQuantity: { $sum: "$availableQuantity" },
          },
        },
      ]),
      Volunteer.aggregate([{ $match: volunteerQuery }, { $group: { _id: "$availabilityStatus", count: { $sum: 1 } } }]),
    ]);

  const certificateCounts = toCountMap(certificateStatus);
  const emergencyCounts = toCountMap(emergencyStatus);
  const volunteerCounts = toCountMap(volunteerStatus);
  const resources = resourceUsage[0] || { totalQuantity: 0, availableQuantity: 0 };

  return {
    role: "officer",
    complaintQueue: {
      assignedComplaints,
      departmentQueue,
      escalatedComplaints,
    },
    certificateQueue: {
      pendingReviews: (certificateCounts.Submitted || 0) + (certificateCounts["Under Review"] || 0),
      approvedToday,
    },
    emergencyOverview: {
      activeEmergencies: Object.entries(emergencyCounts).reduce((sum, [status, count]) => (["Resolved", "Closed"].includes(status) ? sum : sum + count), 0),
      resourceUsage: Math.max(0, (resources.totalQuantity || 0) - (resources.availableQuantity || 0)),
    },
    volunteerOverview: {
      availableVolunteers: volunteerCounts.Available || 0,
      assignedVolunteers: volunteerCounts.Assigned || 0,
    },
  };
};

const getAdminDashboardAnalytics = async (user) => {
  const complaintQuery = buildComplaintQuery(user);
  const certificateQuery = buildCertificateDashboardQuery(user);
  const emergencyQuery = buildEmergencyDashboardQuery(user);
  const resourceQuery = buildResourceDashboardQuery(user);
  const volunteerQuery = buildVolunteerDashboardQuery(user);
  const userQuery = {};

  if (user.role !== "superAdmin" && user.state) {
    userQuery.state = user.state;
  }

  if (["districtAdmin"].includes(user.role) && user.district) {
    userQuery.district = user.district;
  }

  const [userRoles, complaintsByDepartment, complaintsByStatus, complaintsByJurisdiction, certificatesByType, certificatesByStatus, emergencyStatus, resourceUsage, volunteerStatus] =
    await Promise.all([
      User.aggregate([{ $match: userQuery }, { $group: { _id: "$role", count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $match: complaintQuery }, { $group: { _id: "$responsibleDepartment", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Complaint.aggregate([{ $match: complaintQuery }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $match: complaintQuery }, { $group: { _id: "$jurisdictionType", count: { $sum: 1 } } }]),
      Certificate.aggregate([{ $match: certificateQuery }, { $group: { _id: "$certificateType", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Certificate.aggregate([{ $match: certificateQuery }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Emergency.aggregate([{ $match: emergencyQuery }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Resource.aggregate([
        { $match: resourceQuery },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: "$quantity" },
            availableQuantity: { $sum: "$availableQuantity" },
          },
        },
      ]),
      Volunteer.aggregate([{ $match: volunteerQuery }, { $group: { _id: "$availabilityStatus", count: { $sum: 1 } } }]),
    ]);

  const roleCounts = toCountMap(userRoles);
  const emergencyCounts = toCountMap(emergencyStatus);
  const volunteerCounts = toCountMap(volunteerStatus);
  const resources = resourceUsage[0] || { totalQuantity: 0, availableQuantity: 0 };
  const officers = ["panchayatOfficer", "departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"].reduce(
    (sum, role) => sum + (roleCounts[role] || 0),
    0
  );

  return {
    role: "admin",
    platformStatistics: {
      totalUsers: Object.values(roleCounts).reduce((sum, value) => sum + value, 0),
      citizens: roleCounts.citizen || 0,
      officers,
    },
    complaintAnalytics: {
      byDepartment: toChartItems(complaintsByDepartment),
      byStatus: toChartItems(complaintsByStatus),
      byJurisdiction: toChartItems(complaintsByJurisdiction),
    },
    certificateAnalytics: {
      byType: toChartItems(certificatesByType),
      byStatus: toChartItems(certificatesByStatus),
    },
    emergencyAnalytics: {
      activeCases: Object.entries(emergencyCounts).reduce((sum, [status, count]) => (["Resolved", "Closed"].includes(status) ? sum : sum + count), 0),
      resolvedCases: (emergencyCounts.Resolved || 0) + (emergencyCounts.Closed || 0),
    },
    resourceAnalytics: {
      availableResources: resources.availableQuantity || 0,
      allocatedResources: Math.max(0, (resources.totalQuantity || 0) - (resources.availableQuantity || 0)),
    },
    volunteerAnalytics: {
      registeredVolunteers: Object.values(volunteerCounts).reduce((sum, value) => sum + value, 0),
      activeVolunteers: (volunteerCounts.Available || 0) + (volunteerCounts.Assigned || 0),
    },
  };
};

const getDashboardAnalytics = async (user) => {
  const cacheKey = buildCacheKey(user);
  const cached = readCachedDashboard(cacheKey);

  if (cached) {
    return cached;
  }

  let analytics;

  if (user.role === "citizen") {
    analytics = await getCitizenDashboardAnalytics(user);
  } else if (["districtAdmin", "stateAdmin", "superAdmin"].includes(user.role)) {
    analytics = await getAdminDashboardAnalytics(user);
  } else {
    analytics = await getOfficerDashboardAnalytics(user);
  }

  writeCachedDashboard(cacheKey, analytics);
  return analytics;
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

const validateAssignedOfficer = async (assignedOfficerId, complaint) => {
  const officer = await User.findById(assignedOfficerId).lean();

  if (!officer) {
    throw new AppError("Assigned officer not found", 404);
  }

  if (!OFFICER_ROLES.includes(officer.role)) {
    throw new AppError("Assigned user must be a panchayat officer or admin", 400);
  }

  ensureJurisdictionAccess(officer, complaint);

  if (["departmentOfficer", "panchayatOfficer"].includes(officer.role) && officer.department && complaint.responsibleDepartment && officer.department !== complaint.responsibleDepartment) {
    throw new AppError("Assigned officer must belong to the responsible department", 400);
  }

  return officer;
};

const createComplaint = async (payload, user, files = []) => {
  const responsibleDepartment = determineResponsibleDepartment(payload.category);
  const complaint = await Complaint.create({
    title: payload.title,
    description: payload.description,
    category: payload.category,
    subcategory: payload.subcategory,
    priority: payload.priority || "Medium",
    citizenId: user.id,
    images: normalizeImages(files),
    responsibleDepartment,
    wardNumber: payload.wardNumber || "",
    citizenRemarks: payload.citizenRemarks || "",
    location: normalizeLocation(payload),
    ...buildJurisdiction(payload, user),
    statusHistory: [
      {
        status: COMPLAINT_STATUSES[0],
        action: "Complaint submitted by citizen",
        remarks: payload.citizenRemarks || payload.description,
        responsibleDepartment,
        updatedBy: user.id,
      },
    ],
  });

  await complaint.populate(detailPopulateOptions);
  logger.info("Complaint created", {
    complaintId: complaint._id.toString(),
    citizenId: user.id.toString(),
    responsibleDepartment,
    priority: complaint.priority,
    status: complaint.status,
  });

  const formatted = formatComplaint(complaint);
  emitRealtimeEvent(
    [
      `district:${complaint.district}`,
      `jurisdiction:${complaint.jurisdictionType}`,
      `department:${complaint.responsibleDepartment}`,
      `user:${user.id}`,
    ],
    "complaint:created",
    { complaint: formatted }
  );

  return formatted;
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

  if (!isCitizenOwner && isAdminOrOfficer) {
    ensureJurisdictionAccess(user, complaint);
    ensureDepartmentAccess(user, complaint);
  }

  if (shouldEscalateComplaint(complaint)) {
    await persistEscalation(complaint._id);
    complaint.escalationStatus = "Escalated";
    complaint.escalatedAt = new Date();
  }

  return formatComplaint(complaint);
};

const updateComplaintStatus = async (complaintId, payload, user, files = []) => {
  const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: false });

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  ensureJurisdictionAccess(user, complaint);
  ensureDepartmentAccess(user, complaint);

  if (!STATUS_TRANSITIONS[complaint.status].includes(payload.status)) {
    throw new AppError(`Invalid status transition from ${complaint.status} to ${payload.status}`, 400);
  }

  complaint.status = payload.status;
  if (["Resolved", "Rejected"].includes(payload.status)) {
    complaint.escalationStatus = "Normal";
    complaint.escalatedAt = null;
  }

  if (payload.priority) {
    complaint.priority = payload.priority;
  }

  if (payload.officerRemarks !== undefined) {
    complaint.officerRemarks = payload.officerRemarks;
  }

  if (payload.status === "Resolved") {
    complaint.resolutionNotes = payload.resolutionNotes || complaint.resolutionNotes;
    const resolutionImages = normalizeImages(files);
    if (resolutionImages.length) {
      complaint.resolutionImages = resolutionImages;
    }
  }

  complaint.statusHistory.push({
    status: payload.status,
    action: `Complaint moved to ${payload.status}`,
    remarks: payload.officerRemarks || "",
    resolutionNotes: payload.resolutionNotes || "",
    resolutionImages: payload.status === "Resolved" ? normalizeImages(files) : [],
    responsibleDepartment: complaint.responsibleDepartment,
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

  const formatted = formatComplaint(complaint);
  const rooms = [
    `user:${complaint.citizenId?._id || complaint.citizenId}`,
    `district:${complaint.district}`,
    `department:${complaint.responsibleDepartment}`,
  ];
  if (complaint.assignedOfficer) {
    rooms.push(`user:${complaint.assignedOfficer?._id || complaint.assignedOfficer}`);
  }

  emitRealtimeEvent(rooms, "complaint:updated", { complaint: formatted });
  if (payload.status === "Resolved") {
    emitRealtimeEvent(rooms, "complaint:resolved", { complaint: formatted });
  } else if (payload.status === "Rejected") {
    emitRealtimeEvent(rooms, "complaint:rejected", { complaint: formatted });
  }

  return formatted;
};

const assignComplaint = async (complaintId, assignedOfficerId, user) => {
  const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: false });

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  ensureJurisdictionAccess(user, complaint);
  ensureDepartmentAccess(user, complaint);

  await validateAssignedOfficer(assignedOfficerId, complaint);

  if (complaint.status === "Resolved" || complaint.status === "Rejected") {
    throw new AppError("Closed complaints cannot be reassigned", 400);
  }

  complaint.assignedOfficer = assignedOfficerId;
  complaint.officerRemarks = `Assigned to officer ${assignedOfficerId}`;

  if (complaint.status === "Pending") {
    complaint.status = "In Progress";
    complaint.statusHistory.push({
      status: "In Progress",
      action: "Complaint assigned and moved to in-progress queue",
      remarks: `Assigned to officer ${assignedOfficerId}`,
      responsibleDepartment: complaint.responsibleDepartment,
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

  const formatted = formatComplaint(complaint);
  emitRealtimeEvent(
    [
      `user:${complaint.citizenId?._id || complaint.citizenId}`,
      `user:${assignedOfficerId}`,
      `district:${complaint.district}`,
      `department:${complaint.responsibleDepartment}`,
    ],
    "complaint:assigned",
    { complaint: formatted }
  );

  return formatted;
};

const deleteComplaint = async (complaintId, user) => {
  const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: false });

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  ensureJurisdictionAccess(user, complaint);
  ensureDepartmentAccess(user, complaint);

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
  getDashboardAnalytics,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  deleteComplaint,
};

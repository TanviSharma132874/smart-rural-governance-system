const Announcement = require("../models/Announcement");
const AppError = require("../utils/AppError");
const { emitRealtimeEvent } = require("../sockets");

const formatUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || "",
  };
};

const formatAnnouncement = (announcement) => ({
  id: announcement._id,
  title: announcement.title,
  announcementType: announcement.announcementType,
  message: announcement.message,
  department: announcement.department,
  targetAudience: announcement.targetAudience,
  jurisdictionType: announcement.jurisdictionType,
  state: announcement.state,
  district: announcement.district,
  tehsil: announcement.tehsil,
  village: announcement.village,
  municipality: announcement.municipality,
  status: announcement.status,
  publishedBy: formatUser(announcement.publishedBy),
  publishedAt: announcement.publishedAt,
  statusHistory: (announcement.statusHistory || []).map((entry) => ({
    status: entry.status,
    action: entry.action,
    updatedBy: formatUser(entry.updatedBy),
    updatedAt: entry.updatedAt,
  })),
  createdAt: announcement.createdAt,
  updatedAt: announcement.updatedAt,
});

const buildQuery = (user, filters = {}) => {
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
  } else if (filters.status) {
    query.status = filters.status;
  }

  if (filters.announcementType) {
    query.announcementType = filters.announcementType;
  }

  return query;
};

const createAnnouncement = async (payload, user) => {
  const announcement = await Announcement.create({
    title: payload.title,
    announcementType: payload.announcementType,
    message: payload.message,
    department: payload.department || user.department,
    targetAudience: payload.targetAudience || "All",
    jurisdictionType: payload.jurisdictionType || user.jurisdictionType || "Rural",
    state: payload.state || user.state || "Rajasthan",
    district: payload.district || user.district || "",
    tehsil: payload.tehsil || user.tehsil || "",
    village: payload.village || user.village || "",
    municipality: payload.municipality || user.municipality || "",
    statusHistory: [
      {
        status: "Draft",
        action: "Announcement drafted",
        updatedBy: user.id,
      },
    ],
  });

  await announcement.populate([{ path: "publishedBy", select: "name email role department" }, { path: "statusHistory.updatedBy", select: "name email role department" }]);

  return formatAnnouncement(announcement);
};

const getAnnouncements = async (user, filters = {}) => {
  const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;
  const query = buildQuery(user, filters);

  const [totalAnnouncements, announcements] = await Promise.all([
    Announcement.countDocuments(query),
    Announcement.find(query).populate([{ path: "publishedBy", select: "name email role department" }, { path: "statusHistory.updatedBy", select: "name email role department" }]).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return {
    announcements: announcements.map(formatAnnouncement),
    pagination: {
      page,
      limit,
      totalPages: totalAnnouncements === 0 ? 0 : Math.ceil(totalAnnouncements / limit),
      totalAnnouncements,
    },
  };
};

const getAnnouncementById = async (announcementId, user) => {
  const announcement = await Announcement.findOne({ _id: announcementId, isDeleted: false }).populate([{ path: "publishedBy", select: "name email role department" }, { path: "statusHistory.updatedBy", select: "name email role department" }]).lean();

  if (!announcement) {
    throw new AppError("Announcement not found", 404);
  }

  if (["citizen", "volunteer"].includes(user.role) && announcement.status !== "Published") {
    throw new AppError("This announcement is not published yet", 403);
  }

  if (user.role === "citizen" && !["All", "Citizens"].includes(announcement.targetAudience)) {
    throw new AppError("This announcement is not available for citizen access", 403);
  }

  if (user.role === "volunteer" && !["All", "Volunteers"].includes(announcement.targetAudience)) {
    throw new AppError("This announcement is not available for volunteer access", 403);
  }

  return formatAnnouncement(announcement);
};

const publishAnnouncement = async (announcementId, payload, user) => {
  const announcement = await Announcement.findOne({ _id: announcementId, isDeleted: false });

  if (!announcement) {
    throw new AppError("Announcement not found", 404);
  }

  announcement.status = payload.status;
  announcement.statusHistory.push({
    status: payload.status,
    action: payload.status === "Published" ? "Announcement published" : "Announcement archived",
    updatedBy: user.id,
  });

  if (payload.status === "Published") {
    announcement.publishedBy = user.id;
    announcement.publishedAt = new Date();
  }

  await announcement.save();
  await announcement.populate([{ path: "publishedBy", select: "name email role department" }, { path: "statusHistory.updatedBy", select: "name email role department" }]);

  if (payload.status === "Published") {
    emitRealtimeEvent(
      [`district:${announcement.district}`, `jurisdiction:${announcement.jurisdictionType}`, `department:${announcement.department}`],
      "announcement:published",
      { announcement: formatAnnouncement(announcement) }
    );
  }

  return formatAnnouncement(announcement);
};

const deleteAnnouncement = async (announcementId, user) => {
  const announcement = await Announcement.findOne({ _id: announcementId, isDeleted: false });

  if (!announcement) {
    throw new AppError("Announcement not found", 404);
  }

  if (!["districtAdmin", "stateAdmin", "superAdmin"].includes(user.role)) {
    throw new AppError("Only administrators can archive announcements", 403);
  }

  announcement.isDeleted = true;
  announcement.deletedAt = new Date();
  announcement.deletedBy = user.id;
  await announcement.save();

  return formatAnnouncement(announcement);
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  publishAnnouncement,
  deleteAnnouncement,
};

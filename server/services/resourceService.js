const Resource = require("../models/Resource");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const { emitRealtimeEvent } = require("../sockets");
const { OFFICER_ROLES } = require("../config/constants");

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

const formatResource = (resource) => ({
  id: resource._id,
  resourceType: resource.resourceType,
  resourceCategory: resource.resourceCategory,
  quantity: resource.quantity,
  availableQuantity: resource.availableQuantity,
  status: resource.status,
  location: resource.location,
  jurisdictionType: resource.jurisdictionType,
  state: resource.state,
  district: resource.district,
  tehsil: resource.tehsil,
  village: resource.village,
  municipality: resource.municipality,
  department: resource.department,
  managedBy: formatUser(resource.managedBy),
  auditHistory: (resource.auditHistory || []).map((entry) => ({
    action: entry.action,
    quantityChange: entry.quantityChange,
    remarks: entry.remarks,
    updatedBy: formatUser(entry.updatedBy),
    updatedAt: entry.updatedAt,
  })),
  allocationHistory: (resource.allocationHistory || []).map((entry) => ({
    emergency: entry.emergency,
    quantity: entry.quantity,
    allocatedBy: formatUser(entry.allocatedBy),
    allocatedAt: entry.allocatedAt,
    remarks: entry.remarks,
  })),
  lastAllocationAt: resource.lastAllocationAt,
  createdAt: resource.createdAt,
  updatedAt: resource.updatedAt,
});

const buildQuery = (user, filters = {}) => {
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

  if (filters.resourceType) {
    query.resourceType = filters.resourceType;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  return query;
};

const createResource = async (payload, user) => {
  if (!OFFICER_ROLES.includes(user.role)) {
    throw new AppError("Only officers and admins can create resource inventory", 403);
  }

  const quantity = Number(payload.quantity);
  const availableQuantity = payload.availableQuantity !== undefined ? Number(payload.availableQuantity) : quantity;

  const resource = await Resource.create({
    resourceType: payload.resourceType,
    resourceCategory: payload.resourceCategory || payload.resourceType,
    quantity,
    availableQuantity,
    status: availableQuantity === 0 ? "Depleted" : "Available",
    location: {
      address: payload.locationAddress,
      latitude: payload.latitude !== undefined && payload.latitude !== "" ? Number(payload.latitude) : null,
      longitude: payload.longitude !== undefined && payload.longitude !== "" ? Number(payload.longitude) : null,
    },
    jurisdictionType: payload.jurisdictionType || user.jurisdictionType || "Rural",
    state: payload.state || user.state || "Rajasthan",
    district: payload.district || user.district || "",
    tehsil: payload.tehsil || user.tehsil || "",
    village: payload.jurisdictionType === "Rural" ? payload.village || user.village || "" : "",
    municipality: payload.jurisdictionType === "Urban" ? payload.municipality || user.municipality || "" : "",
    department: payload.department || user.department,
    managedBy: user.id,
    auditHistory: [
      {
        action: "Resource created",
        quantityChange: quantity,
        remarks: payload.remarks || "",
        updatedBy: user.id,
      },
    ],
  });

  await resource.populate({ path: "managedBy", select: "name email role department" });
  logger.info("Resource created", {
    resourceId: resource._id.toString(),
    type: resource.resourceType,
    district: resource.district,
  });

  emitRealtimeEvent(
    [`district:${resource.district}`, `department:${resource.department}`],
    "resource:updated",
    { resource: formatResource(resource) }
  );

  return formatResource(resource);
};

const getResources = async (user, filters = {}) => {
  const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;
  const query = buildQuery(user, filters);

  const [totalResources, resources] = await Promise.all([
    Resource.countDocuments(query),
    Resource.find(query).populate([{ path: "managedBy", select: "name email role department" }, { path: "auditHistory.updatedBy", select: "name email role department" }]).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return {
    resources: resources.map(formatResource),
    pagination: {
      page,
      limit,
      totalPages: totalResources === 0 ? 0 : Math.ceil(totalResources / limit),
      totalResources,
    },
  };
};

const updateResource = async (resourceId, payload, user) => {
  const resource = await Resource.findOne({ _id: resourceId, isDeleted: false });

  if (!resource) {
    throw new AppError("Resource not found", 404);
  }

  if (["departmentOfficer", "panchayatOfficer"].includes(user.role) && user.department && resource.department !== user.department) {
    throw new AppError("You are not authorized to manage this resource inventory", 403);
  }

  const previousAvailableQuantity = resource.availableQuantity;
  const nextQuantity = payload.quantity !== undefined ? Number(payload.quantity) : resource.quantity;
  const nextAvailable = payload.availableQuantity !== undefined ? Number(payload.availableQuantity) : resource.availableQuantity;

  resource.quantity = nextQuantity;
  resource.availableQuantity = nextAvailable;
  if (payload.resourceCategory !== undefined) {
    resource.resourceCategory = payload.resourceCategory;
  }
  resource.status = payload.status || (nextAvailable === 0 ? "Depleted" : "Available");
  resource.auditHistory.push({
    action: "Resource inventory updated",
    quantityChange: nextAvailable - previousAvailableQuantity,
    remarks: payload.remarks || "",
    updatedBy: user.id,
  });
  await resource.save();
  await resource.populate([{ path: "managedBy", select: "name email role department" }, { path: "auditHistory.updatedBy", select: "name email role department" }]);

  emitRealtimeEvent(
    [`district:${resource.district}`, `department:${resource.department}`],
    "resource:updated",
    { resource: formatResource(resource) }
  );

  return formatResource(resource);
};

const returnResource = async (resourceId, payload, user) => {
  const resource = await Resource.findOne({ _id: resourceId, isDeleted: false });

  if (!resource) {
    throw new AppError("Resource not found", 404);
  }

  // RBAC: Only Assigned Department Officer or Admins
  if (["departmentOfficer", "panchayatOfficer"].includes(user.role) && user.department && resource.department !== user.department) {
    throw new AppError("You are not authorized to return resources for this department", 403);
  }

  const allocation = resource.allocationHistory.id(payload.allocationId);

  if (!allocation) {
    throw new AppError("Allocation record not found for this resource", 404);
  }

  if (allocation.isReturned) {
    throw new AppError("This resource allocation has already been returned", 400);
  }

  // Side effects:
  // 1. Increase availableQuantity
  const quantityToReturn = allocation.quantity;
  resource.availableQuantity += quantityToReturn;

  // 2. Update allocation status
  allocation.isReturned = true;
  allocation.returnedBy = user.id;
  allocation.returnedAt = new Date();
  allocation.returnRemarks = payload.returnRemarks || "";

  // 3. Update resource overall status
  resource.status = resource.availableQuantity === 0 ? "Depleted" : resource.availableQuantity <= Math.max(1, Math.floor(resource.quantity * 0.2)) ? "Low Stock" : "Available";

  // 4. Create audit trail entry
  resource.auditHistory.push({
    action: "Resource returned",
    quantityChange: quantityToReturn,
    remarks: payload.returnRemarks || `Returned from emergency ${allocation.emergency || "N/A"}`,
    updatedBy: user.id,
  });

  await resource.save();
  await resource.populate([
    { path: "managedBy", select: "name email role department" },
    { path: "auditHistory.updatedBy", select: "name email role department" },
    { path: "allocationHistory.returnedBy", select: "name email role department" }
  ]);

  logger.info("Resource returned to inventory", {
    resourceId: resource._id.toString(),
    allocationId: payload.allocationId,
    returnedBy: user.id.toString(),
    quantityRestored: quantityToReturn,
  });

  emitRealtimeEvent(
    [`district:${resource.district}`, `department:${resource.department}`],
    "resource:updated",
    { resource: formatResource(resource) }
  );

  return formatResource(resource);
};

const deleteResource = async (resourceId, user) => {
  const resource = await Resource.findOne({ _id: resourceId, isDeleted: false });

  if (!resource) {
    throw new AppError("Resource not found", 404);
  }

  if (!["districtAdmin", "stateAdmin", "superAdmin"].includes(user.role)) {
    throw new AppError("Only administrators can archive resources", 403);
  }

  resource.isDeleted = true;
  resource.deletedAt = new Date();
  resource.deletedBy = user.id;
  await resource.save();

  return formatResource(resource);
};

module.exports = {
  createResource,
  getResources,
  updateResource,
  returnResource,
  deleteResource,
};

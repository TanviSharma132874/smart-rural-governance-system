const { body, param, query } = require("express-validator");

const { RESOURCE_TYPES, RESOURCE_STATUSES, JURISDICTION_TYPES, EMERGENCY_DEPARTMENTS } = require("../config/constants");

const resourceIdValidator = [param("id").isMongoId().withMessage("Must be a valid MongoDB ObjectId")];

const createResourceValidator = [
  body("resourceType").isIn(RESOURCE_TYPES).withMessage(`Resource type must be one of: ${RESOURCE_TYPES.join(", ")}`),
  body("resourceCategory").optional().trim().isLength({ max: 100 }).withMessage("Resource category cannot exceed 100 characters"),
  body("quantity").isInt({ min: 0 }).withMessage("Quantity must be zero or more"),
  body("availableQuantity").optional().isInt({ min: 0 }).withMessage("Available quantity must be zero or more"),
  body("locationAddress").trim().notEmpty().withMessage("Location address is required"),
  body("jurisdictionType").optional().isIn(JURISDICTION_TYPES).withMessage(`Jurisdiction type must be one of: ${JURISDICTION_TYPES.join(", ")}`),
  body("department").optional().isIn(EMERGENCY_DEPARTMENTS).withMessage(`Department must be one of: ${EMERGENCY_DEPARTMENTS.join(", ")}`),
  body("state").optional().trim(),
  body("district").optional().trim(),
  body("tehsil").optional().trim(),
  body("village").optional().trim(),
  body("municipality").optional().trim(),
  body("remarks").optional().trim().isLength({ max: 500 }).withMessage("Remarks cannot exceed 500 characters"),
];

const resourceListValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  query("resourceType").optional().isIn(RESOURCE_TYPES).withMessage(`Resource type must be one of: ${RESOURCE_TYPES.join(", ")}`),
  query("status").optional().isIn(RESOURCE_STATUSES).withMessage(`Status must be one of: ${RESOURCE_STATUSES.join(", ")}`),
];

const updateResourceValidator = [
  ...resourceIdValidator,
  body("resourceCategory").optional().trim().isLength({ max: 100 }).withMessage("Resource category cannot exceed 100 characters"),
  body("quantity").optional().isInt({ min: 0 }).withMessage("Quantity must be zero or more"),
  body("availableQuantity").optional().isInt({ min: 0 }).withMessage("Available quantity must be zero or more"),
  body("status").optional().isIn(RESOURCE_STATUSES).withMessage(`Status must be one of: ${RESOURCE_STATUSES.join(", ")}`),
  body("remarks").optional().trim().isLength({ max: 500 }).withMessage("Remarks cannot exceed 500 characters"),
];

const returnResourceValidator = [
  ...resourceIdValidator,
  body("allocationId").isMongoId().withMessage("Allocation ID is required and must be a valid MongoDB ObjectId"),
  body("returnRemarks").optional().trim().isLength({ max: 500 }).withMessage("Return remarks cannot exceed 500 characters"),
];

const addMaintenanceValidator = [
  ...resourceIdValidator,
  body("action").trim().notEmpty().withMessage("Maintenance action is required"),
  body("performedBy").optional().trim().notEmpty().withMessage("Performed by field cannot be empty"),
  body("maintenanceDate").optional().isISO8601().withMessage("Maintenance date must be a valid ISO8601 date"),
  body("nextServiceDate").optional().isISO8601().withMessage("Next service date must be a valid ISO8601 date"),
  body("remarks").optional().trim().isLength({ max: 500 }).withMessage("Remarks cannot exceed 500 characters"),
];

module.exports = {
  resourceIdValidator,
  createResourceValidator,
  resourceListValidator,
  updateResourceValidator,
  returnResourceValidator,
  addMaintenanceValidator,
};

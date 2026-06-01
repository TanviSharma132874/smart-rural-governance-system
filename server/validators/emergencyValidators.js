const { body, param, query } = require("express-validator");

const {
  EMERGENCY_TYPES,
  EMERGENCY_SEVERITIES,
  EMERGENCY_STATUSES,
  JURISDICTION_TYPES,
} = require("../config/constants");

const emergencyIdValidator = [param("id").isMongoId().withMessage("Must be a valid MongoDB ObjectId")];

const emergencyCreateValidator = [
  body("emergencyType").isIn(EMERGENCY_TYPES).withMessage(`Emergency type must be one of: ${EMERGENCY_TYPES.join(", ")}`),
  body("title").trim().isLength({ min: 3, max: 150 }).withMessage("Emergency title must be between 3 and 150 characters"),
  body("description").trim().isLength({ min: 10, max: 2000 }).withMessage("Description must be between 10 and 2000 characters"),
  body("location").optional().trim(),
  body("locationAddress").optional().trim(),
  body("severity").isIn(EMERGENCY_SEVERITIES).withMessage(`Severity must be one of: ${EMERGENCY_SEVERITIES.join(", ")}`),
  body("peopleAffected").isInt({ min: 1, max: 100000 }).withMessage("People affected must be at least 1"),
  body("contactNumber").trim().notEmpty().withMessage("Contact number is required"),
  body("jurisdictionType").optional().isIn(JURISDICTION_TYPES).withMessage(`Jurisdiction type must be one of: ${JURISDICTION_TYPES.join(", ")}`),
  body("state").optional().trim(),
  body("district").optional().trim(),
  body("tehsil").optional().trim(),
  body("village").optional().trim(),
  body("municipality").optional().trim(),
];

const emergencyListValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  query("search").optional().trim().isLength({ min: 1, max: 100 }).withMessage("Search must be between 1 and 100 characters"),
  query("status").optional().isIn(EMERGENCY_STATUSES).withMessage(`Status must be one of: ${EMERGENCY_STATUSES.join(", ")}`),
  query("severity").optional().isIn(EMERGENCY_SEVERITIES).withMessage(`Severity must be one of: ${EMERGENCY_SEVERITIES.join(", ")}`),
  query("emergencyType").optional().isIn(EMERGENCY_TYPES).withMessage(`Emergency type must be one of: ${EMERGENCY_TYPES.join(", ")}`),
  query("sort").optional().isIn(["latest", "oldest", "priority"]).withMessage("Sort must be latest, oldest, or priority"),
];

const emergencyStatusValidator = [
  ...emergencyIdValidator,
  body("status").isIn(EMERGENCY_STATUSES).withMessage(`Status must be one of: ${EMERGENCY_STATUSES.join(", ")}`),
  body("remarks").optional().trim().isLength({ max: 1000 }).withMessage("Remarks cannot exceed 1000 characters"),
];

const emergencyRemarksValidator = [
  ...emergencyIdValidator,
  body("remarks").optional().trim().isLength({ max: 1000 }).withMessage("Remarks cannot exceed 1000 characters"),
];

const resourceAssignmentValidator = [
  ...emergencyIdValidator,
  body("resources").isArray({ min: 1 }).withMessage("Resources must be a non-empty array"),
  body("resources.*.resourceId").isMongoId().withMessage("Each resourceId must be a valid MongoDB ObjectId"),
  body("resources.*.quantity").isInt({ min: 1 }).withMessage("Each resource allocation quantity must be at least 1"),
  body("remarks").optional().trim().isLength({ max: 500 }).withMessage("Remarks cannot exceed 500 characters"),
];

const volunteerAssignmentValidator = [
  ...emergencyIdValidator,
  body("volunteerIds").isArray({ min: 1 }).withMessage("volunteerIds must be a non-empty array"),
  body("volunteerIds.*").isMongoId().withMessage("Each volunteer id must be a valid MongoDB ObjectId"),
  body("note").optional().trim().isLength({ max: 300 }).withMessage("Volunteer assignment note cannot exceed 300 characters"),
];

module.exports = {
  emergencyIdValidator,
  emergencyCreateValidator,
  emergencyListValidator,
  emergencyStatusValidator,
  emergencyRemarksValidator,
  resourceAssignmentValidator,
  volunteerAssignmentValidator,
};

const { body, param, query } = require("express-validator");

const priorityValues = ["Low", "Medium", "High", "Critical"];
const statusValues = ["Pending", "In Progress", "Resolved", "Rejected"];
const sortValues = ["latest", "oldest", "priority"];
const mongoIdMessage = "Must be a valid MongoDB ObjectId";

const createComplaintValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Complaint title is required")
    .isLength({ min: 3, max: 150 })
    .withMessage("Complaint title must be between 3 and 150 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Complaint description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Complaint description must be between 10 and 2000 characters"),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Complaint category is required")
    .isLength({ max: 100 })
    .withMessage("Complaint category cannot exceed 100 characters"),
  body("priority")
    .optional()
    .isIn(priorityValues)
    .withMessage(`Priority must be one of: ${priorityValues.join(", ")}`),
  body("locationAddress").optional().trim().isString().withMessage("Location address must be a string"),
  body("landmark").optional().trim().isString().withMessage("Landmark must be a string"),
  body("latitude").optional().isFloat({ min: -90, max: 90 }).withMessage("Latitude must be a valid number"),
  body("longitude").optional().isFloat({ min: -180, max: 180 }).withMessage("Longitude must be a valid number"),
];

const complaintIdValidator = [param("id").isMongoId().withMessage(mongoIdMessage)];

const getComplaintsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100")
    .toInt(),
  query("status")
    .optional()
    .isIn(statusValues)
    .withMessage(`Status must be one of: ${statusValues.join(", ")}`),
  query("priority")
    .optional()
    .isIn(priorityValues)
    .withMessage(`Priority must be one of: ${priorityValues.join(", ")}`),
  query("category")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Category cannot exceed 100 characters"),
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search must be between 1 and 100 characters"),
  query("sort")
    .optional()
    .isIn(sortValues)
    .withMessage(`Sort must be one of: ${sortValues.join(", ")}`),
];

const updateComplaintStatusValidator = [
  ...complaintIdValidator,
  body("status")
    .exists()
    .withMessage("Status is required")
    .isIn(statusValues)
    .withMessage(`Status must be one of: ${statusValues.join(", ")}`),
  body("priority")
    .optional()
    .isIn(priorityValues)
    .withMessage(`Priority must be one of: ${priorityValues.join(", ")}`),
];

const assignComplaintValidator = [
  ...complaintIdValidator,
  body("assignedOfficer")
    .exists()
    .withMessage("Assigned officer is required")
    .isMongoId()
    .withMessage(mongoIdMessage),
];

module.exports = {
  createComplaintValidator,
  complaintIdValidator,
  getComplaintsValidator,
  updateComplaintStatusValidator,
  assignComplaintValidator,
  priorityValues,
  statusValues,
  sortValues,
};

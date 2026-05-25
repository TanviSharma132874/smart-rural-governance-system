const { body } = require("express-validator");

const priorityValues = ["Low", "Medium", "High", "Critical"];
const statusValues = ["Pending", "In Progress", "Resolved", "Rejected"];

const createComplaintValidator = [
  body("title").trim().notEmpty().withMessage("Complaint title is required"),
  body("description").trim().notEmpty().withMessage("Complaint description is required"),
  body("category").trim().notEmpty().withMessage("Complaint category is required"),
  body("priority")
    .optional()
    .isIn(priorityValues)
    .withMessage(`Priority must be one of: ${priorityValues.join(", ")}`),
  body("locationAddress").optional().trim().isString().withMessage("Location address must be a string"),
  body("landmark").optional().trim().isString().withMessage("Landmark must be a string"),
  body("latitude").optional().isFloat().withMessage("Latitude must be a number"),
  body("longitude").optional().isFloat().withMessage("Longitude must be a number"),
];

const updateComplaintStatusValidator = [
  body("status")
    .optional()
    .isIn(statusValues)
    .withMessage(`Status must be one of: ${statusValues.join(", ")}`),
  body("assignedOfficer").optional().isMongoId().withMessage("Assigned officer must be a valid user id"),
];

module.exports = {
  createComplaintValidator,
  updateComplaintStatusValidator,
  priorityValues,
  statusValues,
};

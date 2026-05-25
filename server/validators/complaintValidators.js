const { body, param, query } = require("express-validator");

const complaintStatuses = ["Pending", "In Progress", "Resolved", "Rejected"];
const complaintPriorities = ["Low", "Medium", "High", "Critical"];

const mongoIdMessage = "Must be a valid MongoDB ObjectId";

const createComplaintValidator = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ min: 5, max: 150 }),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 2000 }),
  body("category").trim().notEmpty().withMessage("Category is required").isLength({ max: 100 }),
  body("priority")
    .optional()
    .isIn(complaintPriorities)
    .withMessage(`Priority must be one of: ${complaintPriorities.join(", ")}`),
  body("assignedOfficer").optional().isMongoId().withMessage(mongoIdMessage),
  body("address").optional().trim().isLength({ max: 200 }),
  body("village").optional().trim().isLength({ max: 100 }),
  body("district").optional().trim().isLength({ max: 100 }),
  body("latitude").optional().isFloat({ min: -90, max: 90 }).withMessage("Latitude must be valid"),
  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be valid"),
];

const complaintIdValidator = [param("id").isMongoId().withMessage(mongoIdMessage)];

const getComplaintsValidator = [
  query("status")
    .optional()
    .isIn(complaintStatuses)
    .withMessage(`Status must be one of: ${complaintStatuses.join(", ")}`),
  query("priority")
    .optional()
    .isIn(complaintPriorities)
    .withMessage(`Priority must be one of: ${complaintPriorities.join(", ")}`),
  query("category").optional().trim().isLength({ max: 100 }),
];

const updateComplaintStatusValidator = [
  ...complaintIdValidator,
  body("status")
    .optional()
    .isIn(complaintStatuses)
    .withMessage(`Status must be one of: ${complaintStatuses.join(", ")}`),
  body("priority")
    .optional()
    .isIn(complaintPriorities)
    .withMessage(`Priority must be one of: ${complaintPriorities.join(", ")}`),
  body("assignedOfficer")
    .optional({ nullable: true })
    .custom((value) => value === null || value === "" || /^[a-f\d]{24}$/i.test(value))
    .withMessage(mongoIdMessage),
  body().custom((value) => {
    if (!value.status && !Object.prototype.hasOwnProperty.call(value, "assignedOfficer") && !value.priority) {
      throw new Error("At least one of status, priority or assignedOfficer must be provided");
    }

    return true;
  }),
];

module.exports = {
  complaintStatuses,
  complaintPriorities,
  createComplaintValidator,
  complaintIdValidator,
  getComplaintsValidator,
  updateComplaintStatusValidator,
};

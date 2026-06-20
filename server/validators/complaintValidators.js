const { body, param, query } = require("express-validator");
const {
  COMPLAINT_CATEGORIES,
  COMPLAINT_CATEGORY_DEPARTMENTS,
  COMPLAINT_PRIORITIES,
  COMPLAINT_SORT_OPTIONS,
  COMPLAINT_STATUSES,
  COMPLAINT_SUBCATEGORY_MAP,
  GOVERNMENT_DEPARTMENTS,
  JURISDICTION_TYPES,
} = require("../config/constants");

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
    .isIn(COMPLAINT_CATEGORIES)
    .withMessage(`Complaint category must be one of: ${COMPLAINT_CATEGORIES.join(", ")}`),
  body("subcategory")
    .trim()
    .notEmpty()
    .withMessage("Complaint subcategory is required")
    .custom((value, { req }) => {
      const allowed = COMPLAINT_SUBCATEGORY_MAP[req.body.category] || [];
      if (allowed.length && !allowed.includes(value)) {
        throw new Error(`Complaint subcategory must match the selected category`);
      }
      return true;
    }),
  body("priority")
    .optional()
    .isIn(COMPLAINT_PRIORITIES)
    .withMessage(`Priority must be one of: ${COMPLAINT_PRIORITIES.join(", ")}`),
  body("wardNumber").optional().trim().isLength({ max: 50 }).withMessage("Ward number cannot exceed 50 characters"),
  body("citizenRemarks").optional().trim().isLength({ max: 1000 }).withMessage("Citizen remarks cannot exceed 1000 characters"),
  body("jurisdictionType")
    .optional()
    .isIn(JURISDICTION_TYPES)
    .withMessage(`Jurisdiction type must be one of: ${JURISDICTION_TYPES.join(", ")}`),
  body("locationAddress").optional().trim().isString().withMessage("Location address must be a string"),
  body("landmark").optional().trim().isString().withMessage("Landmark must be a string"),
  body("latitude").optional().isFloat({ min: -90, max: 90 }).withMessage("Latitude must be a valid number"),
  body("longitude").optional().isFloat({ min: -180, max: 180 }).withMessage("Longitude must be a valid number"),
];

const complaintIdValidator = [param("id").isMongoId().withMessage(mongoIdMessage)];

const getComplaintsValidator = [
  query("page")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100")
    .toInt(),
  query("status")
    .optional({ values: "falsy" })
    .isIn(COMPLAINT_STATUSES)
    .withMessage(`Status must be one of: ${COMPLAINT_STATUSES.join(", ")}`),
  query("priority")
    .optional({ values: "falsy" })
    .isIn(COMPLAINT_PRIORITIES)
    .withMessage(`Priority must be one of: ${COMPLAINT_PRIORITIES.join(", ")}`),
  query("category")
    .optional({ values: "falsy" })
    .isIn(COMPLAINT_CATEGORIES)
    .withMessage(`Category must be one of: ${COMPLAINT_CATEGORIES.join(", ")}`),
  query("subcategory")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Subcategory cannot exceed 100 characters"),
  query("responsibleDepartment")
    .optional({ values: "falsy" })
    .isIn(GOVERNMENT_DEPARTMENTS)
    .withMessage(`Department must be one of: ${GOVERNMENT_DEPARTMENTS.join(", ")}`),
  query("escalationStatus")
    .optional({ values: "falsy" })
    .isIn(["Normal", "Escalated"])
    .withMessage("Escalation status must be Normal or Escalated"),
  query("search")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search must be between 1 and 100 characters"),
  query("sort")
    .optional({ values: "falsy" })
    .isIn(COMPLAINT_SORT_OPTIONS)
    .withMessage(`Sort must be one of: ${COMPLAINT_SORT_OPTIONS.join(", ")}`),
  query("jurisdictionType")
    .optional({ values: "falsy" })
    .isIn(JURISDICTION_TYPES)
    .withMessage(`Jurisdiction type must be one of: ${JURISDICTION_TYPES.join(", ")}`),
];

const updateComplaintStatusValidator = [
  ...complaintIdValidator,
  body("status")
    .exists()
    .withMessage("Status is required")
    .isIn(COMPLAINT_STATUSES)
    .withMessage(`Status must be one of: ${COMPLAINT_STATUSES.join(", ")}`),
  body("priority")
    .optional()
    .isIn(COMPLAINT_PRIORITIES)
    .withMessage(`Priority must be one of: ${COMPLAINT_PRIORITIES.join(", ")}`),
  body("officerRemarks").optional().trim().isLength({ max: 1000 }).withMessage("Officer remarks cannot exceed 1000 characters"),
  body("resolutionNotes").optional().trim().isLength({ max: 2000 }).withMessage("Resolution notes cannot exceed 2000 characters"),
  body("status").custom((value, { req }) => {
    if (value === "Resolved" && !req.body.resolutionNotes?.trim()) {
      throw new Error("Resolution notes are required when resolving a complaint");
    }
    return true;
  }),
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
  priorityValues: COMPLAINT_PRIORITIES,
  statusValues: COMPLAINT_STATUSES,
  sortValues: COMPLAINT_SORT_OPTIONS,
  complaintCategories: COMPLAINT_CATEGORIES,
  complaintCategoryDepartments: COMPLAINT_CATEGORY_DEPARTMENTS,
};

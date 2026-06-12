const { body } = require("express-validator");
const { GOVERNMENT_DEPARTMENTS, JURISDICTION_TYPES } = require("../config/constants");

const ADMIN_PROVISIONABLE_ROLES = [
  "panchayatOfficer",
  "departmentOfficer",
  "districtAdmin",
  "stateAdmin",
  "superAdmin",
];

const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("fatherName").optional().trim().isLength({ max: 100 }).withMessage("Father's name cannot exceed 100 characters"),
  body("motherName").optional().trim().isLength({ max: 100 }).withMessage("Mother's name cannot exceed 100 characters"),
  body("dateOfBirth").optional().isISO8601().withMessage("Date of birth must be a valid date"),
  body("gender").optional().isIn(["Male", "Female", "Other", ""]).withMessage("Gender must be Male, Female, or Other"),
  body("aadhaarNumber").optional().trim().isLength({ min: 12, max: 12 }).withMessage("Aadhaar number must be exactly 12 digits").isNumeric().withMessage("Aadhaar number must contain only digits"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .optional()
    .equals("citizen")
    .withMessage("Public registration can only create citizen accounts"),
  body("department")
    .optional({ values: "falsy" })
    .isIn([""])
    .withMessage("Department cannot be set during public registration"),
  body("jurisdictionType")
    .optional()
    .isIn(JURISDICTION_TYPES)
    .withMessage(`Jurisdiction type must be one of: ${JURISDICTION_TYPES.join(", ")}`),
  body("state").trim().notEmpty().withMessage("State is required"),
  body("phone").trim().notEmpty().withMessage("Phone is required"),
  body("address").optional().trim().isLength({ max: 250 }).withMessage("Address cannot exceed 250 characters"),
  body("district").trim().notEmpty().withMessage("District is required"),
  body("tehsil").optional().trim(),
  body("panchayat").optional().trim(),
  body("village")
    .optional()
    .custom((value, { req }) => {
      if ((req.body.jurisdictionType || "Rural") === "Rural" && !value?.trim()) {
        throw new Error("Village is required for rural jurisdiction");
      }
      return true;
    }),
  body("municipality")
    .optional()
    .custom((value, { req }) => {
      if (req.body.jurisdictionType === "Urban" && !value?.trim()) {
        throw new Error("Municipality is required for urban jurisdiction");
      }
      return true;
    }),
  body("ward").optional().trim().isLength({ max: 50 }).withMessage("Ward cannot exceed 50 characters"),
  body("pincode").optional().trim().isLength({ min: 4, max: 12 }).withMessage("Pincode must be between 4 and 12 characters"),
  body("occupation").optional().trim().isLength({ max: 100 }).withMessage("Occupation cannot exceed 100 characters"),
  body("designation").optional().trim().isLength({ max: 100 }).withMessage("Designation cannot exceed 100 characters"),
  body("employeeId").optional().trim().isLength({ max: 50 }).withMessage("Employee ID cannot exceed 50 characters"),
  body("profileImage").optional().isString().withMessage("Profile image must be a string"),
];

const createUserValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("fatherName").optional().trim().isLength({ max: 100 }).withMessage("Father's name cannot exceed 100 characters"),
  body("motherName").optional().trim().isLength({ max: 100 }).withMessage("Mother's name cannot exceed 100 characters"),
  body("dateOfBirth").optional().isISO8601().withMessage("Date of birth must be a valid date"),
  body("gender").optional().isIn(["Male", "Female", "Other", ""]).withMessage("Gender must be Male, Female, or Other"),
  body("aadhaarNumber").optional().trim().isLength({ min: 12, max: 12 }).withMessage("Aadhaar number must be exactly 12 digits").isNumeric().withMessage("Aadhaar number must contain only digits"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("role")
    .isIn(ADMIN_PROVISIONABLE_ROLES)
    .withMessage(`Role must be one of: ${ADMIN_PROVISIONABLE_ROLES.join(", ")}`),
  body("department")
    .optional()
    .isIn([...GOVERNMENT_DEPARTMENTS, ""])
    .withMessage(`Department must be one of: ${GOVERNMENT_DEPARTMENTS.join(", ")}`),
  body("jurisdictionType")
    .optional()
    .isIn(JURISDICTION_TYPES)
    .withMessage(`Jurisdiction type must be one of: ${JURISDICTION_TYPES.join(", ")}`),
  body("state").trim().notEmpty().withMessage("State is required"),
  body("phone").trim().notEmpty().withMessage("Phone is required"),
  body("address").optional().trim().isLength({ max: 250 }).withMessage("Address cannot exceed 250 characters"),
  body("district").trim().notEmpty().withMessage("District is required"),
  body("tehsil").optional().trim(),
  body("panchayat").optional().trim(),
  body("village")
    .optional()
    .custom((value, { req }) => {
      if ((req.body.jurisdictionType || "Rural") === "Rural" && !value?.trim()) {
        throw new Error("Village is required for rural jurisdiction");
      }
      return true;
    }),
  body("municipality")
    .optional()
    .custom((value, { req }) => {
      if (req.body.jurisdictionType === "Urban" && !value?.trim()) {
        throw new Error("Municipality is required for urban jurisdiction");
      }
      return true;
    }),
  body("ward").optional().trim().isLength({ max: 50 }).withMessage("Ward cannot exceed 50 characters"),
  body("pincode").optional().trim().isLength({ min: 4, max: 12 }).withMessage("Pincode must be between 4 and 12 characters"),
  body("occupation").optional().trim().isLength({ max: 100 }).withMessage("Occupation cannot exceed 100 characters"),
  body("designation").trim().notEmpty().withMessage("Designation is required for officer/admin accounts"),
  body("employeeId").optional().trim().isLength({ max: 50 }).withMessage("Employee ID cannot exceed 50 characters"),
  body("profileImage").optional().isString().withMessage("Profile image must be a string"),
].concat([
  body("department").custom((value, { req }) => {
    if (["departmentOfficer", "panchayatOfficer"].includes(req.body.role) && !value?.trim()) {
      throw new Error("Department is required for officer accounts");
    }
    return true;
  }),
]);

const loginValidator = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = {
  registerValidator,
  createUserValidator,
  loginValidator,
};

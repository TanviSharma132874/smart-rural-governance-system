const { body } = require("express-validator");
const { GOVERNMENT_DEPARTMENTS, JURISDICTION_TYPES, USER_ROLES } = require("../config/constants");

const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .optional()
    .isIn(USER_ROLES)
    .withMessage(`Role must be one of: ${USER_ROLES.join(", ")}`),
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
  body("district").trim().notEmpty().withMessage("District is required"),
  body("tehsil").optional().trim(),
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
  body("profileImage").optional().isString().withMessage("Profile image must be a string"),
];

const loginValidator = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = {
  registerValidator,
  loginValidator,
};

const { body } = require("express-validator");

const allowedRoles = ["citizen", "volunteer", "panchayatOfficer", "districtAdmin", "superAdmin"];

const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .optional()
    .isIn(allowedRoles)
    .withMessage(`Role must be one of: ${allowedRoles.join(", ")}`),
  body("phone").trim().notEmpty().withMessage("Phone is required"),
  body("village").trim().notEmpty().withMessage("Village is required"),
  body("district").trim().notEmpty().withMessage("District is required"),
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

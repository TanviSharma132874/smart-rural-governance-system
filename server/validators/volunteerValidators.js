const { body, param, query } = require("express-validator");

const { JURISDICTION_TYPES, VOLUNTEER_SKILLS, VOLUNTEER_AVAILABILITY, VOLUNTEER_APPROVAL_STATUSES } = require("../config/constants");

const volunteerIdValidator = [param("id").isMongoId().withMessage("Must be a valid MongoDB ObjectId")];

const registerVolunteerValidator = [
  body("name").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Volunteer name must be between 2 and 100 characters"),
  body("phone").optional().trim().isLength({ min: 6, max: 20 }).withMessage("Phone number must be between 6 and 20 characters"),
  body("district").optional().trim(),
  body("jurisdictionType").optional().isIn(JURISDICTION_TYPES).withMessage(`Jurisdiction type must be one of: ${JURISDICTION_TYPES.join(", ")}`),
  body("bloodGroup").optional().trim().isLength({ max: 10 }).withMessage("Blood group cannot exceed 10 characters"),
  body("experience").optional().trim().isLength({ max: 200 }).withMessage("Experience cannot exceed 200 characters"),
  body("emergencyContact").optional().trim().isLength({ max: 100 }).withMessage("Emergency contact cannot exceed 100 characters"),
  body("certifications").optional(),
  body("skills")
    .custom((value) => {
      const items = Array.isArray(value) ? value : [value];

      if (!items.filter(Boolean).length) {
        throw new Error("At least one volunteer skill is required");
      }

      if (!items.every((item) => VOLUNTEER_SKILLS.includes(item))) {
        throw new Error(`Skills must be one of: ${VOLUNTEER_SKILLS.join(", ")}`);
      }

      return true;
    }),
  body("availabilityStatus").optional().isIn(VOLUNTEER_AVAILABILITY).withMessage(`Availability must be one of: ${VOLUNTEER_AVAILABILITY.join(", ")}`),
];

const volunteerListValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  query("skill").optional().isIn(VOLUNTEER_SKILLS).withMessage(`Skill must be one of: ${VOLUNTEER_SKILLS.join(", ")}`),
  query("approvalStatus").optional().isIn(VOLUNTEER_APPROVAL_STATUSES).withMessage(`Approval status must be one of: ${VOLUNTEER_APPROVAL_STATUSES.join(", ")}`),
  query("availabilityStatus").optional().isIn(VOLUNTEER_AVAILABILITY).withMessage(`Availability must be one of: ${VOLUNTEER_AVAILABILITY.join(", ")}`),
];

const approveVolunteerValidator = [
  ...volunteerIdValidator,
  body("approvalStatus").isIn(VOLUNTEER_APPROVAL_STATUSES).withMessage(`Approval status must be one of: ${VOLUNTEER_APPROVAL_STATUSES.join(", ")}`),
];

const volunteerAvailabilityValidator = [
  ...volunteerIdValidator,
  body("availabilityStatus").isIn(VOLUNTEER_AVAILABILITY).withMessage(`Availability must be one of: ${VOLUNTEER_AVAILABILITY.join(", ")}`),
];

module.exports = {
  volunteerIdValidator,
  registerVolunteerValidator,
  volunteerListValidator,
  approveVolunteerValidator,
  volunteerAvailabilityValidator,
};

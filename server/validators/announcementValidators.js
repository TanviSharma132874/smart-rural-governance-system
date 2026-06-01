const { body, param, query } = require("express-validator");

const {
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_TYPES,
  EMERGENCY_DEPARTMENTS,
  JURISDICTION_TYPES,
} = require("../config/constants");

const announcementIdValidator = [param("id").isMongoId().withMessage("Must be a valid MongoDB ObjectId")];

const createAnnouncementValidator = [
  body("title").trim().isLength({ min: 3, max: 150 }).withMessage("Announcement title must be between 3 and 150 characters"),
  body("announcementType").isIn(ANNOUNCEMENT_TYPES).withMessage(`Announcement type must be one of: ${ANNOUNCEMENT_TYPES.join(", ")}`),
  body("message").trim().isLength({ min: 10, max: 2000 }).withMessage("Announcement message must be between 10 and 2000 characters"),
  body("department").optional().isIn(EMERGENCY_DEPARTMENTS).withMessage(`Department must be one of: ${EMERGENCY_DEPARTMENTS.join(", ")}`),
  body("targetAudience").optional().isIn(ANNOUNCEMENT_AUDIENCES).withMessage(`Audience must be one of: ${ANNOUNCEMENT_AUDIENCES.join(", ")}`),
  body("jurisdictionType").optional().isIn(JURISDICTION_TYPES).withMessage(`Jurisdiction type must be one of: ${JURISDICTION_TYPES.join(", ")}`),
  body("state").optional().trim(),
  body("district").optional().trim(),
  body("tehsil").optional().trim(),
  body("village").optional().trim(),
  body("municipality").optional().trim(),
];

const announcementListValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  query("status").optional().isIn(ANNOUNCEMENT_STATUSES).withMessage(`Status must be one of: ${ANNOUNCEMENT_STATUSES.join(", ")}`),
  query("announcementType").optional().isIn(ANNOUNCEMENT_TYPES).withMessage(`Announcement type must be one of: ${ANNOUNCEMENT_TYPES.join(", ")}`),
];

const publishAnnouncementValidator = [
  ...announcementIdValidator,
  body("status").isIn(["Published", "Archived"]).withMessage("Status must be Published or Archived"),
];

module.exports = {
  announcementIdValidator,
  createAnnouncementValidator,
  announcementListValidator,
  publishAnnouncementValidator,
};

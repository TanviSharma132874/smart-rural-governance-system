const { body, param, query } = require("express-validator");

const {
  CERTIFICATE_TYPES,
  CERTIFICATE_STATUSES,
  GOVERNMENT_DEPARTMENTS,
  JURISDICTION_TYPES,
} = require("../config/constants");

const mongoIdMessage = "Must be a valid MongoDB ObjectId";

const applyCertificateValidator = [
  body("certificateType")
    .notEmpty()
    .withMessage("Certificate type is required")
    .isIn(CERTIFICATE_TYPES)
    .withMessage(`Certificate type must be one of: ${CERTIFICATE_TYPES.join(", ")}`),
  body("department")
    .notEmpty()
    .withMessage("Department is required")
    .isIn(GOVERNMENT_DEPARTMENTS)
    .withMessage(`Department must be one of: ${GOVERNMENT_DEPARTMENTS.join(", ")}`),
  body("jurisdictionType")
    .notEmpty()
    .withMessage("Jurisdiction type is required")
    .isIn(JURISDICTION_TYPES)
    .withMessage(`Jurisdiction type must be one of: ${JURISDICTION_TYPES.join(", ")}`),
  body("state").trim().notEmpty().withMessage("State is required"),
  body("district").trim().notEmpty().withMessage("District is required"),
  body("tehsil").optional().trim(),
  body("village")
    .optional()
    .custom((value, { req }) => {
      if (req.body.jurisdictionType === "Rural" && !value?.trim()) {
        throw new Error("Village is required for rural certificates");
      }
      return true;
    }),
  body("municipality")
    .optional()
    .custom((value, { req }) => {
      if (req.body.jurisdictionType === "Urban" && !value?.trim()) {
        throw new Error("Municipality is required for urban certificates");
      }
      return true;
    }),
  body("remarks").optional().trim().isLength({ max: 1000 }).withMessage("Remarks cannot exceed 1000 characters"),
];

const certificateIdValidator = [param("id").isMongoId().withMessage(mongoIdMessage)];

const queueQueryValidator = [
  query("status")
    .optional()
    .isIn(CERTIFICATE_STATUSES)
    .withMessage(`Status must be one of: ${CERTIFICATE_STATUSES.join(", ")}`),
  query("certificateType")
    .optional()
    .isIn(CERTIFICATE_TYPES)
    .withMessage(`Certificate type must be one of: ${CERTIFICATE_TYPES.join(", ")}`),
  query("department")
    .optional()
    .isIn(GOVERNMENT_DEPARTMENTS)
    .withMessage(`Department must be one of: ${GOVERNMENT_DEPARTMENTS.join(", ")}`),
];

const reviewCertificateValidator = [
  ...certificateIdValidator,
  body("remarks")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Remarks cannot exceed 1000 characters"),
];

const updateCertificateStatusValidator = [
  ...certificateIdValidator,
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(CERTIFICATE_STATUSES)
    .withMessage(`Status must be one of: ${CERTIFICATE_STATUSES.join(", ")}`),
  body("remarks")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Remarks cannot exceed 1000 characters"),
];

module.exports = {
  applyCertificateValidator,
  certificateIdValidator,
  queueQueryValidator,
  reviewCertificateValidator,
  updateCertificateStatusValidator,
};

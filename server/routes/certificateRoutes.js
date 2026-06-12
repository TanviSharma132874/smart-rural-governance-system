const express = require("express");

const certificateController = require("../controllers/certificateController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const authorizeCertificateDepartments = require("../middlewares/departmentAuthorizationMiddleware");
const { uploadCertificateDocuments } = require("../middlewares/certificateUploadMiddleware");
const { enforceJurisdictionPayload } = require("../middlewares/jurisdictionMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const {
  applyCertificateValidator,
  certificateIdValidator,
  queueQueryValidator,
  reviewCertificateValidator,
  updateCertificateStatusValidator,
} = require("../validators/certificateValidators");

const router = express.Router();

router.get("/verify/:id", certificateIdValidator, validateRequest, certificateController.verifyCertificate);

router.use(authMiddleware);

router.post(
  "/apply",
  authorize("citizen"),
  uploadCertificateDocuments.array("documents", 6),
  applyCertificateValidator,
  validateRequest,
  authorizeCertificateDepartments(),
  enforceJurisdictionPayload,
  certificateController.applyCertificate
);
router.patch(
  "/:id/resubmit",
  authorize("citizen"),
  uploadCertificateDocuments.array("documents", 6),
  certificateIdValidator,
  validateRequest,
  certificateController.resubmitCertificate
);
router.get(
  "/my-applications",
  authorize("citizen"),
  queueQueryValidator,
  validateRequest,
  certificateController.getMyApplications
);
router.get(
  "/department-queue",
  authorize("departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  queueQueryValidator,
  validateRequest,
  certificateController.getDepartmentQueue
);
router.get(
  "/download/:id",
  authorize("citizen", "departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  certificateIdValidator,
  validateRequest,
  certificateController.downloadCertificate
);
router.get(
  "/:id",
  authorize("citizen", "departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  certificateIdValidator,
  validateRequest,
  certificateController.getCertificateById
);
router.patch(
  "/:id/review",
  authorize("departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  reviewCertificateValidator,
  validateRequest,
  certificateController.reviewCertificate
);
router.patch(
  "/:id/status",
  authorize("departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  updateCertificateStatusValidator,
  validateRequest,
  certificateController.updateCertificateStatus
);
router.delete(
  "/:id",
  authorize("citizen", "districtAdmin", "stateAdmin", "superAdmin"),
  certificateIdValidator,
  validateRequest,
  certificateController.deleteCertificate
);

module.exports = router;

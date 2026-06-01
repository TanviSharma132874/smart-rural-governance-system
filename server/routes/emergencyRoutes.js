const express = require("express");

const emergencyController = require("../controllers/emergencyController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const uploadEmergencyImages = require("../middlewares/emergencyUploadMiddleware");
const authorizeEmergencyDepartment = require("../middlewares/emergencyDepartmentMiddleware");
const { enforceJurisdictionPayload } = require("../middlewares/jurisdictionMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const {
  emergencyIdValidator,
  emergencyCreateValidator,
  emergencyListValidator,
  emergencyStatusValidator,
  emergencyRemarksValidator,
  resourceAssignmentValidator,
  volunteerAssignmentValidator,
} = require("../validators/emergencyValidators");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  authorize("citizen"),
  uploadEmergencyImages.array("images", 5),
  emergencyCreateValidator,
  validateRequest,
  enforceJurisdictionPayload,
  emergencyController.createEmergency
);
router.get("/my", authorize("citizen"), emergencyListValidator, validateRequest, emergencyController.getMyEmergencies);
router.get(
  "/dashboard",
  authorize("panchayatOfficer", "departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  emergencyListValidator,
  validateRequest,
  emergencyController.getEmergencyDashboard
);
router.get(
  "/analytics",
  authorize("districtAdmin", "stateAdmin", "superAdmin"),
  emergencyController.getEmergencyAnalytics
);
router.get(
  "/:id",
  authorize("citizen", "panchayatOfficer", "departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  emergencyIdValidator,
  validateRequest,
  emergencyController.getEmergencyById
);
router.patch(
  "/:id/acknowledge",
  authorize("panchayatOfficer", "departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  emergencyRemarksValidator,
  validateRequest,
  emergencyController.acknowledgeEmergency
);
router.patch(
  "/:id/status",
  authorize("panchayatOfficer", "departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  emergencyStatusValidator,
  validateRequest,
  authorizeEmergencyDepartment(),
  emergencyController.updateEmergencyStatus
);
router.patch(
  "/:id/resources",
  authorize("departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  resourceAssignmentValidator,
  validateRequest,
  emergencyController.assignResources
);
router.patch(
  "/:id/volunteers",
  authorize("departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  volunteerAssignmentValidator,
  validateRequest,
  emergencyController.assignVolunteers
);
router.delete(
  "/:id",
  authorize("citizen", "districtAdmin", "stateAdmin", "superAdmin"),
  emergencyIdValidator,
  validateRequest,
  emergencyController.deleteEmergency
);

module.exports = router;

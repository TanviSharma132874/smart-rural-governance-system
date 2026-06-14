const express = require("express");

const resourceController = require("../controllers/resourceController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const { enforceJurisdictionPayload } = require("../middlewares/jurisdictionMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const { createResourceValidator, resourceIdValidator, resourceListValidator, updateResourceValidator, returnResourceValidator, addMaintenanceValidator } = require("../validators/resourceValidators");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  authorize("departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  createResourceValidator,
  validateRequest,
  enforceJurisdictionPayload,
  resourceController.createResource
);
router.get(
  "/",
  authorize("departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  resourceListValidator,
  validateRequest,
  resourceController.getResources
);
router.patch(
  "/:id",
  authorize("departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  updateResourceValidator,
  validateRequest,
  resourceController.updateResource
);
router.patch(
  "/:id/return",
  authorize("departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  returnResourceValidator,
  validateRequest,
  resourceController.returnResource
);
router.post(
  "/:id/maintenance",
  authorize("departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  addMaintenanceValidator,
  validateRequest,
  resourceController.addMaintenanceRecord
);
router.delete(
  "/:id",
  authorize("districtAdmin", "stateAdmin", "superAdmin"),
  resourceIdValidator,
  validateRequest,
  resourceController.deleteResource
);

module.exports = router;

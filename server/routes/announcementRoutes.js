const express = require("express");

const announcementController = require("../controllers/announcementController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const { enforceJurisdictionPayload } = require("../middlewares/jurisdictionMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const {
  announcementIdValidator,
  createAnnouncementValidator,
  announcementListValidator,
  publishAnnouncementValidator,
} = require("../validators/announcementValidators");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  authorize("departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  createAnnouncementValidator,
  validateRequest,
  enforceJurisdictionPayload,
  announcementController.createAnnouncement
);
router.get(
  "/",
  authorize("citizen", "volunteer", "departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  announcementListValidator,
  validateRequest,
  announcementController.getAnnouncements
);
router.get(
  "/:id",
  authorize("citizen", "volunteer", "departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  announcementIdValidator,
  validateRequest,
  announcementController.getAnnouncementById
);
router.patch(
  "/:id/publish",
  authorize("departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  publishAnnouncementValidator,
  validateRequest,
  announcementController.publishAnnouncement
);
router.delete(
  "/:id",
  authorize("districtAdmin", "stateAdmin", "superAdmin"),
  announcementIdValidator,
  validateRequest,
  announcementController.deleteAnnouncement
);

module.exports = router;

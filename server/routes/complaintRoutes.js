const express = require("express");

const complaintController = require("../controllers/complaintController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const uploadComplaintImages = require("../middlewares/uploadMiddleware");
const {
  createComplaintValidator,
  complaintIdValidator,
  getComplaintsValidator,
  updateComplaintStatusValidator,
  assignComplaintValidator,
} = require("../validators/complaintValidators");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  authorize("citizen"),
  uploadComplaintImages.array("images", 5),
  createComplaintValidator,
  validateRequest,
  complaintController.createComplaint
);

router.get(
  "/",
  authMiddleware,
  authorize("citizen", "panchayatOfficer", "departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  getComplaintsValidator,
  validateRequest,
  complaintController.getComplaints
);

router.get(
  "/dashboard-analytics",
  authMiddleware,
  authorize("citizen", "panchayatOfficer", "departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  complaintController.getDashboardAnalytics
);

router.patch(
  "/:id/status",
  authMiddleware,
  authorize("panchayatOfficer", "departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  uploadComplaintImages.array("resolutionImages", 5),
  updateComplaintStatusValidator,
  validateRequest,
  complaintController.updateComplaintStatus
);

router.patch(
  "/:id/assign",
  authMiddleware,
  authorize("panchayatOfficer", "departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  assignComplaintValidator,
  validateRequest,
  complaintController.assignComplaint
);

router.get(
  "/:id",
  authMiddleware,
  authorize("citizen", "panchayatOfficer", "departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  complaintIdValidator,
  validateRequest,
  complaintController.getComplaintById
);

router.delete(
  "/:id",
  authMiddleware,
  authorize("districtAdmin", "stateAdmin", "superAdmin"),
  complaintIdValidator,
  validateRequest,
  complaintController.deleteComplaint
);

module.exports = router;

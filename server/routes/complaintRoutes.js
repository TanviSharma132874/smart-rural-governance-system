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
  authorize("citizen", "panchayatOfficer", "districtAdmin", "superAdmin"),
  getComplaintsValidator,
  validateRequest,
  complaintController.getComplaints
);

router.patch(
  "/:id/status",
  authMiddleware,
  authorize("panchayatOfficer", "districtAdmin", "superAdmin"),
  updateComplaintStatusValidator,
  validateRequest,
  complaintController.updateComplaintStatus
);

router.patch(
  "/:id/assign",
  authMiddleware,
  authorize("panchayatOfficer", "districtAdmin", "superAdmin"),
  assignComplaintValidator,
  validateRequest,
  complaintController.assignComplaint
);

router.get(
  "/:id",
  authMiddleware,
  authorize("citizen", "panchayatOfficer", "districtAdmin", "superAdmin"),
  complaintIdValidator,
  validateRequest,
  complaintController.getComplaintById
);

router.delete(
  "/:id",
  authMiddleware,
  authorize("districtAdmin", "superAdmin"),
  complaintIdValidator,
  validateRequest,
  complaintController.deleteComplaint
);

module.exports = router;

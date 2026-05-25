const express = require("express");

const complaintController = require("../controllers/complaintController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const uploadComplaintImages = require("../middlewares/uploadMiddleware");
const {
  createComplaintValidator,
  updateComplaintStatusValidator,
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

router.get(
  "/:id",
  authMiddleware,
  authorize("citizen", "panchayatOfficer", "districtAdmin", "superAdmin"),
  complaintController.getComplaintById
);

router.delete(
  "/:id",
  authMiddleware,
  authorize("districtAdmin", "superAdmin"),
  complaintController.deleteComplaint
);

module.exports = router;

const express = require("express");

const complaintController = require("../controllers/complaintController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const { uploadComplaintImages } = require("../middlewares/uploadMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const {
  createComplaintValidator,
  complaintIdValidator,
  getComplaintsValidator,
  updateComplaintStatusValidator,
} = require("../validators/complaintValidators");

const router = express.Router();

router.use(authMiddleware);

router
  .route("/")
  .post(
    authorize("citizen"),
    uploadComplaintImages.array("images", 5),
    createComplaintValidator,
    validateRequest,
    complaintController.createComplaint
  )
  .get(getComplaintsValidator, validateRequest, complaintController.getComplaints);

router.get("/:id", complaintIdValidator, validateRequest, complaintController.getComplaintById);
router.patch(
  "/:id/status",
  authorize("panchayatOfficer", "districtAdmin", "superAdmin"),
  updateComplaintStatusValidator,
  validateRequest,
  complaintController.updateComplaintStatus
);
router.delete("/:id", complaintIdValidator, validateRequest, complaintController.deleteComplaint);

module.exports = router;

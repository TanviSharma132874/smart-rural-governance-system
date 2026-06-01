const express = require("express");

const volunteerController = require("../controllers/volunteerController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const {
  volunteerIdValidator,
  registerVolunteerValidator,
  volunteerListValidator,
  approveVolunteerValidator,
  volunteerAvailabilityValidator,
} = require("../validators/volunteerValidators");

const router = express.Router();

router.use(authMiddleware);

router.post("/register", authorize("citizen", "volunteer"), registerVolunteerValidator, validateRequest, volunteerController.registerVolunteer);
router.get("/me", authorize("citizen", "volunteer"), volunteerController.getVolunteerProfile);
router.get(
  "/",
  authorize("departmentOfficer", "panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"),
  volunteerListValidator,
  validateRequest,
  volunteerController.getVolunteers
);
router.patch(
  "/:id/approve",
  authorize("districtAdmin", "stateAdmin", "superAdmin"),
  approveVolunteerValidator,
  validateRequest,
  volunteerController.approveVolunteer
);
router.patch(
  "/:id/availability",
  authorize("citizen", "volunteer", "districtAdmin", "stateAdmin", "superAdmin"),
  volunteerAvailabilityValidator,
  validateRequest,
  volunteerController.updateVolunteerAvailability
);
router.delete(
  "/:id",
  authorize("citizen", "volunteer", "districtAdmin", "stateAdmin", "superAdmin"),
  volunteerIdValidator,
  validateRequest,
  volunteerController.deleteVolunteer
);

module.exports = router;

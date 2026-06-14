const express = require("express");

const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const { enforceJurisdictionPayload } = require("../middlewares/jurisdictionMiddleware");
const { registerValidator, createUserValidator, loginValidator, updateProfileValidator } = require("../validators/authValidators");

const router = express.Router();

router.post("/register", registerValidator, validateRequest, authController.register);
router.post("/login", loginValidator, validateRequest, authController.login);
router.get("/profile", authMiddleware, authController.getProfile);
router.patch("/profile", authMiddleware, updateProfileValidator, validateRequest, authController.updateProfile);
router.get("/", authMiddleware, authorize("districtAdmin", "stateAdmin", "superAdmin"), authController.getUsers);
router.delete("/:id", authMiddleware, authorize("districtAdmin", "stateAdmin", "superAdmin"), authController.deleteUser);
router.post(
  "/users",
  authMiddleware,
  authorize("districtAdmin", "stateAdmin", "superAdmin"),
  createUserValidator,
  validateRequest,
  enforceJurisdictionPayload,
  authController.createUser
);
router.patch(
  "/users/:id/reset-password",
  authMiddleware,
  authorize("districtAdmin", "stateAdmin", "superAdmin"),
  authController.resetUserPassword
);
router.patch(
  "/users/:id/status",
  authMiddleware,
  authorize("districtAdmin", "stateAdmin", "superAdmin"),
  authController.updateUserStatus
);
router.patch(
  "/users/:id/transfer",
  authMiddleware,
  authorize("districtAdmin", "stateAdmin", "superAdmin"),
  authController.transferUser
);

module.exports = router;

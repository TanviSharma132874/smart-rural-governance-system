const express = require("express");

const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const { registerValidator, createUserValidator, loginValidator } = require("../validators/authValidators");

const router = express.Router();

router.post("/register", registerValidator, validateRequest, authController.register);
router.post("/login", loginValidator, validateRequest, authController.login);
router.get("/profile", authMiddleware, authController.getProfile);
router.post(
  "/users",
  authMiddleware,
  authorize("stateAdmin", "superAdmin"),
  createUserValidator,
  validateRequest,
  authController.createUser
);

module.exports = router;

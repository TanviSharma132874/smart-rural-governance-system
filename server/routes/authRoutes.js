const express = require("express");

const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const { registerValidator, loginValidator } = require("../validators/authValidators");

const router = express.Router();

router.post("/register", registerValidator, validateRequest, authController.register);
router.post("/login", loginValidator, validateRequest, authController.login);
router.get("/profile", authMiddleware, authController.getProfile);

module.exports = router;

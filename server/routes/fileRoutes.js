const express = require("express");
const fileController = require("../controllers/fileController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @route   GET /api/v1/files/:category/:filename
 * @desc    Get uploaded file with authorization check
 * @access  Private
 */
router.get("/:category/:filename", authMiddleware, fileController.getFile);

module.exports = router;

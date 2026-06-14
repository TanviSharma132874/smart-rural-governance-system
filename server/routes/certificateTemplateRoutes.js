const express = require("express");
const certificateTemplateController = require("../controllers/certificateTemplateController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("/", authMiddleware, certificateTemplateController.getTemplates);
router.get("/:code", authMiddleware, certificateTemplateController.getTemplateByCode);
router.post("/", authMiddleware, authorize("superAdmin", "stateAdmin"), certificateTemplateController.createTemplate);

module.exports = router;

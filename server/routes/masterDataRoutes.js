const express = require("express");
const masterDataController = require("../controllers/masterDataController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/states", authMiddleware, masterDataController.getStates);
router.get("/districts/:stateId", authMiddleware, masterDataController.getDistricts);
router.get("/tehsils/:districtId", authMiddleware, masterDataController.getTehsils);
router.get("/panchayats/:tehsilId", authMiddleware, masterDataController.getPanchayats);
router.get("/villages/:panchayatId", authMiddleware, masterDataController.getVillages);
router.get("/municipalities/:districtId", authMiddleware, masterDataController.getMunicipalities);
router.get("/wards/:municipalityId", authMiddleware, masterDataController.getWards);

module.exports = router;

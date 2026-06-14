const State = require("../models/State");
const District = require("../models/District");
const Tehsil = require("../models/Tehsil");
const Panchayat = require("../models/Panchayat");
const Village = require("../models/Village");
const Municipality = require("../models/Municipality");
const Ward = require("../models/Ward");

const asyncHandler = require("../utils/asyncHandler");
const sendSuccess = require("../utils/apiResponse");

const getStates = asyncHandler(async (req, res) => {
  const states = await State.find().sort({ name: 1 });
  sendSuccess(res, { statusCode: 200, data: { states } });
});

const getDistricts = asyncHandler(async (req, res) => {
  const districts = await District.find({ stateId: req.params.stateId }).sort({ name: 1 });
  sendSuccess(res, { statusCode: 200, data: { districts } });
});

const getTehsils = asyncHandler(async (req, res) => {
  const tehsils = await Tehsil.find({ districtId: req.params.districtId }).sort({ name: 1 });
  sendSuccess(res, { statusCode: 200, data: { tehsils } });
});

const getPanchayats = asyncHandler(async (req, res) => {
  const panchayats = await Panchayat.find({ tehsilId: req.params.tehsilId }).sort({ name: 1 });
  sendSuccess(res, { statusCode: 200, data: { panchayats } });
});

const getVillages = asyncHandler(async (req, res) => {
  const villages = await Village.find({ panchayatId: req.params.panchayatId }).sort({ name: 1 });
  sendSuccess(res, { statusCode: 200, data: { villages } });
});

const getMunicipalities = asyncHandler(async (req, res) => {
  const municipalities = await Municipality.find({ districtId: req.params.districtId }).sort({ name: 1 });
  sendSuccess(res, { statusCode: 200, data: { municipalities } });
});

const getWards = asyncHandler(async (req, res) => {
  const wards = await Ward.find({ municipalityId: req.params.municipalityId }).sort({ name: 1 });
  sendSuccess(res, { statusCode: 200, data: { wards } });
});

module.exports = {
  getStates,
  getDistricts,
  getTehsils,
  getPanchayats,
  getVillages,
  getMunicipalities,
  getWards,
};

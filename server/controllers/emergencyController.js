const asyncHandler = require("../utils/asyncHandler");
const sendSuccess = require("../utils/apiResponse");
const emergencyService = require("../services/emergencyService");

const createEmergency = asyncHandler(async (req, res) => {
  const emergency = await emergencyService.createEmergency(req.body, req.user, req.files);

  sendSuccess(res, {
    statusCode: 201,
    message: "Emergency SOS created successfully",
    data: { emergency },
  });
});

const getMyEmergencies = asyncHandler(async (req, res) => {
  const { emergencies, pagination } = await emergencyService.getMyEmergencies(req.user, req.query);

  sendSuccess(res, {
    statusCode: 200,
    message: "Citizen emergency requests fetched successfully",
    pagination,
    data: { emergencies },
  });
});

const getEmergencyDashboard = asyncHandler(async (req, res) => {
  const { emergencies, pagination } = await emergencyService.getEmergencyDashboard(req.user, req.query);

  sendSuccess(res, {
    statusCode: 200,
    message: "Emergency dashboard fetched successfully",
    pagination,
    data: { emergencies },
  });
});

const getEmergencyById = asyncHandler(async (req, res) => {
  const emergency = await emergencyService.getEmergencyById(req.params.id, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Emergency record fetched successfully",
    data: { emergency },
  });
});

const acknowledgeEmergency = asyncHandler(async (req, res) => {
  const emergency = await emergencyService.acknowledgeEmergency(req.params.id, req.body, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Emergency acknowledged successfully",
    data: { emergency },
  });
});

const updateEmergencyStatus = asyncHandler(async (req, res) => {
  const emergency = await emergencyService.updateEmergencyStatus(req.params.id, req.body, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Emergency workflow updated successfully",
    data: { emergency },
  });
});

const assignResources = asyncHandler(async (req, res) => {
  const emergency = await emergencyService.assignResources(req.params.id, req.body, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Emergency resources assigned successfully",
    data: { emergency },
  });
});

const assignVolunteers = asyncHandler(async (req, res) => {
  const emergency = await emergencyService.assignVolunteers(req.params.id, req.body, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Emergency volunteers assigned successfully",
    data: { emergency },
  });
});

const getEmergencyAnalytics = asyncHandler(async (req, res) => {
  const analytics = await emergencyService.getEmergencyAnalytics(req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Emergency analytics fetched successfully",
    data: analytics,
  });
});

const deleteEmergency = asyncHandler(async (req, res) => {
  const emergency = await emergencyService.deleteEmergency(req.params.id, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Emergency request archived successfully",
    data: { emergency },
  });
});

module.exports = {
  createEmergency,
  getMyEmergencies,
  getEmergencyDashboard,
  getEmergencyById,
  acknowledgeEmergency,
  updateEmergencyStatus,
  assignResources,
  assignVolunteers,
  getEmergencyAnalytics,
  deleteEmergency,
};

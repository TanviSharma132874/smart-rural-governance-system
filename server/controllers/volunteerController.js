const asyncHandler = require("../utils/asyncHandler");
const sendSuccess = require("../utils/apiResponse");
const volunteerService = require("../services/volunteerService");

const registerVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await volunteerService.registerVolunteer(req.body, req.user);

  sendSuccess(res, {
    statusCode: 201,
    message: "Volunteer profile submitted successfully",
    data: { volunteer },
  });
});

const getVolunteerProfile = asyncHandler(async (req, res) => {
  const volunteer = await volunteerService.getVolunteerProfile(req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Volunteer profile fetched successfully",
    data: { volunteer },
  });
});

const getVolunteers = asyncHandler(async (req, res) => {
  const { volunteers, pagination } = await volunteerService.getVolunteers(req.user, req.query);

  sendSuccess(res, {
    statusCode: 200,
    message: "Volunteer roster fetched successfully",
    pagination,
    data: { volunteers },
  });
});

const approveVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await volunteerService.approveVolunteer(req.params.id, req.body, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Volunteer approval updated successfully",
    data: { volunteer },
  });
});

const updateVolunteerAvailability = asyncHandler(async (req, res) => {
  const volunteer = await volunteerService.updateVolunteerAvailability(req.params.id, req.body, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Volunteer availability updated successfully",
    data: { volunteer },
  });
});

const deleteVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await volunteerService.deleteVolunteer(req.params.id, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Volunteer profile archived successfully",
    data: { volunteer },
  });
});

module.exports = {
  registerVolunteer,
  getVolunteerProfile,
  getVolunteers,
  approveVolunteer,
  updateVolunteerAvailability,
  deleteVolunteer,
};

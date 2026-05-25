const asyncHandler = require("../utils/asyncHandler");
const complaintService = require("../services/complaintService");
const sendSuccess = require("../utils/apiResponse");

const createComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.createComplaint(req.body, req.user, req.files);

  sendSuccess(res, {
    statusCode: 201,
    message: "Complaint created successfully",
    data: { complaint: complaintService.serializeComplaint(complaint) },
  });
});

const getComplaints = asyncHandler(async (req, res) => {
  const complaints = await complaintService.getComplaints(req.user, req.query);

  sendSuccess(res, {
    statusCode: 200,
    message: "Complaints fetched successfully",
    data: { complaints },
  });
});

const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await complaintService.getComplaintById(req.params.id, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Complaint fetched successfully",
    data: { complaint },
  });
});

const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = await complaintService.updateComplaintStatus(req.params.id, req.body, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Complaint updated successfully",
    data: { complaint: complaintService.serializeComplaint(complaint) },
  });
});

const deleteComplaint = asyncHandler(async (req, res) => {
  await complaintService.deleteComplaint(req.params.id, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Complaint deleted successfully",
  });
});

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
};

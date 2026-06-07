const asyncHandler = require("../utils/asyncHandler");
const sendSuccess = require("../utils/apiResponse");
const complaintService = require("../services/complaintService");

const createComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.createComplaint(req.body, req.user, req.files);

  sendSuccess(res, {
    statusCode: 201,
    message: "Complaint created successfully",
    data: { complaint },
  });
});

const getComplaints = asyncHandler(async (req, res) => {
  const result = await complaintService.getComplaints(req.user, req.query);

  sendSuccess(res, {
    statusCode: 200,
    message: "Complaints fetched successfully",
    pagination: result.pagination,
    data: result.complaints,
  });
});

const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const analytics = await complaintService.getDashboardAnalytics(req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Dashboard analytics fetched successfully",
    data: analytics,
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
  const complaint = await complaintService.updateComplaintStatus(req.params.id, req.body, req.user, req.files);

  sendSuccess(res, {
    statusCode: 200,
    message: "Complaint updated successfully",
    data: { complaint },
  });
});

const assignComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.assignComplaint(req.params.id, req.body.assignedOfficer, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Complaint assigned successfully",
    data: { complaint },
  });
});

const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.deleteComplaint(req.params.id, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Complaint archived successfully",
    data: { complaint },
  });
});

module.exports = {
  createComplaint,
  getComplaints,
  getDashboardAnalytics,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  deleteComplaint,
};

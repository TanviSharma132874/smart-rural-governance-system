const asyncHandler = require("../utils/asyncHandler");
const sendSuccess = require("../utils/apiResponse");
const announcementService = require("../services/announcementService");

const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.createAnnouncement(req.body, req.user);

  sendSuccess(res, {
    statusCode: 201,
    message: "Announcement created successfully",
    data: { announcement },
  });
});

const getAnnouncements = asyncHandler(async (req, res) => {
  const { announcements, pagination } = await announcementService.getAnnouncements(req.user, req.query);

  sendSuccess(res, {
    statusCode: 200,
    message: "Announcements fetched successfully",
    pagination,
    data: { announcements },
  });
});

const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await announcementService.getAnnouncementById(req.params.id, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Announcement fetched successfully",
    data: { announcement },
  });
});

const publishAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.publishAnnouncement(req.params.id, req.body, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Announcement workflow updated successfully",
    data: { announcement },
  });
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.deleteAnnouncement(req.params.id, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Announcement archived successfully",
    data: { announcement },
  });
});

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  publishAnnouncement,
  deleteAnnouncement,
};

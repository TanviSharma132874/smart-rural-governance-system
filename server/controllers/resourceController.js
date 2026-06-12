const asyncHandler = require("../utils/asyncHandler");
const sendSuccess = require("../utils/apiResponse");
const resourceService = require("../services/resourceService");

const createResource = asyncHandler(async (req, res) => {
  const resource = await resourceService.createResource(req.body, req.user);

  sendSuccess(res, {
    statusCode: 201,
    message: "Resource inventory created successfully",
    data: { resource },
  });
});

const getResources = asyncHandler(async (req, res) => {
  const { resources, pagination } = await resourceService.getResources(req.user, req.query);

  sendSuccess(res, {
    statusCode: 200,
    message: "Resources fetched successfully",
    pagination,
    data: { resources },
  });
});

const updateResource = asyncHandler(async (req, res) => {
  const resource = await resourceService.updateResource(req.params.id, req.body, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Resource inventory updated successfully",
    data: { resource },
  });
});

const returnResource = asyncHandler(async (req, res) => {
  const resource = await resourceService.returnResource(req.params.id, req.body, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Resource returned successfully",
    data: { resource },
  });
});

const deleteResource = asyncHandler(async (req, res) => {
  const resource = await resourceService.deleteResource(req.params.id, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Resource inventory archived successfully",
    data: { resource },
  });
});

module.exports = {
  createResource,
  getResources,
  updateResource,
  returnResource,
  deleteResource,
};

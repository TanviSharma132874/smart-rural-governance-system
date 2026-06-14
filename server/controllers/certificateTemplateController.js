const CertificateTemplate = require("../models/CertificateTemplate");
const asyncHandler = require("../utils/asyncHandler");
const sendSuccess = require("../utils/apiResponse");
const AppError = require("../utils/AppError");

const createTemplate = asyncHandler(async (req, res) => {
  const template = await CertificateTemplate.create(req.body);
  sendSuccess(res, { statusCode: 201, message: "Template created", data: { template } });
});

const getTemplates = asyncHandler(async (req, res) => {
  const templates = await CertificateTemplate.find({ isActive: true });
  sendSuccess(res, { statusCode: 200, message: "Templates fetched", data: { templates } });
});

const getTemplateByCode = asyncHandler(async (req, res) => {
  const template = await CertificateTemplate.findOne({ code: req.params.code.toUpperCase(), isActive: true });
  if (!template) throw new AppError("Template not found", 404);
  sendSuccess(res, { statusCode: 200, message: "Template fetched", data: { template } });
});

module.exports = { createTemplate, getTemplates, getTemplateByCode };

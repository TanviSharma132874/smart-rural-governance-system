const asyncHandler = require("../utils/asyncHandler");
const sendSuccess = require("../utils/apiResponse");
const certificateService = require("../services/certificateService");

const applyCertificate = asyncHandler(async (req, res) => {
  const certificate = await certificateService.applyCertificate(req.body, req.user, req.files);

  sendSuccess(res, {
    statusCode: 201,
    message: "Certificate application submitted successfully",
    data: { certificate },
  });
});

const getMyApplications = asyncHandler(async (req, res) => {
  const { certificates, pagination } = await certificateService.getMyApplications(req.user, req.query);

  sendSuccess(res, {
    statusCode: 200,
    message: "Certificate applications fetched successfully",
    data: { certificates },
    pagination,
  });
});

const getDepartmentQueue = asyncHandler(async (req, res) => {
  const { certificates, pagination } = await certificateService.getDepartmentQueue(req.user, req.query);

  sendSuccess(res, {
    statusCode: 200,
    message: "Department queue fetched successfully",
    data: { certificates },
    pagination,
  });
});

const getCertificateById = asyncHandler(async (req, res) => {
  const certificate = await certificateService.getCertificateById(req.params.id, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Certificate application fetched successfully",
    data: { certificate },
  });
});

const reviewCertificate = asyncHandler(async (req, res) => {
  const certificate = await certificateService.reviewCertificate(req.params.id, req.body, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Certificate moved to review successfully",
    data: { certificate },
  });
});

const updateCertificateStatus = asyncHandler(async (req, res) => {
  const certificate = await certificateService.updateCertificateStatus(req.params.id, req.body, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Certificate workflow updated successfully",
    data: { certificate },
  });
});

const verifyCertificate = asyncHandler(async (req, res) => {
  const payload = await certificateService.verifyCertificate(req.params.id);

  sendSuccess(res, {
    statusCode: 200,
    message: "Certificate verification fetched successfully",
    data: payload,
  });
});

const downloadCertificate = asyncHandler(async (req, res) => {
  const { filename, pdfBuffer } = await certificateService.downloadCertificate(req.params.id, req.user);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(pdfBuffer);
});

const deleteCertificate = asyncHandler(async (req, res) => {
  const certificate = await certificateService.deleteCertificate(req.params.id, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "Certificate application archived successfully",
    data: { certificate },
  });
});

module.exports = {
  applyCertificate,
  getMyApplications,
  getDepartmentQueue,
  getCertificateById,
  reviewCertificate,
  updateCertificateStatus,
  verifyCertificate,
  downloadCertificate,
  deleteCertificate,
};

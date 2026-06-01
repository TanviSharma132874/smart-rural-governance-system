const Certificate = require("../models/Certificate");
const Counter = require("../models/Counter");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const { buildCertificatePdfBuffer } = require("./pdfService");
const { generateCertificateVerificationAssets } = require("./qrCodeService");
const {
  CERTIFICATE_TYPE_DEPARTMENTS,
  OFFICER_ROLES,
} = require("../config/constants");

const CERTIFICATE_TRANSITIONS = {
  Submitted: ["Under Review"],
  "Under Review": ["Approved", "Rejected"],
  Approved: [],
  Rejected: [],
};
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const listPopulateOptions = [
  { path: "applicant", select: "name email phone role department jurisdictionType state district tehsil village municipality" },
  { path: "approvedBy", select: "name email role department" },
];

const detailPopulateOptions = [
  ...listPopulateOptions,
  { path: "statusHistory.updatedBy", select: "name email role department" },
];

const formatUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || "",
    jurisdictionType: user.jurisdictionType || "",
    state: user.state || "",
    district: user.district || "",
    tehsil: user.tehsil || "",
    village: user.village || "",
    municipality: user.municipality || "",
  };
};

const formatCertificate = (certificate) => ({
  id: certificate._id,
  applicant: formatUser(certificate.applicant),
  certificateType: certificate.certificateType,
  department: certificate.department,
  jurisdictionType: certificate.jurisdictionType,
  state: certificate.state,
  district: certificate.district,
  tehsil: certificate.tehsil,
  village: certificate.village,
  municipality: certificate.municipality,
  status: certificate.status,
  uploadedDocuments: certificate.uploadedDocuments,
  remarks: certificate.remarks,
  approvedBy: formatUser(certificate.approvedBy),
  issuedAt: certificate.issuedAt,
  applicationNumber: certificate.applicationNumber,
  qrCode: certificate.qrCode,
  digitalSignature: certificate.digitalSignature,
  departmentSeal: certificate.departmentSeal,
  verificationUrl: certificate.verificationUrl,
  isDeleted: certificate.isDeleted,
  statusHistory: (certificate.statusHistory || []).map((entry) => ({
    status: entry.status,
    action: entry.action,
    remarks: entry.remarks,
    department: entry.department,
    updatedBy: formatUser(entry.updatedBy),
    updatedAt: entry.updatedAt,
  })),
  createdAt: certificate.createdAt,
  updatedAt: certificate.updatedAt,
});

const buildPagination = (page, limit, totalItems, key = "totalItems") => ({
  page,
  limit,
  totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
  [key]: totalItems,
});

const nextApplicationNumber = async () => {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { key: `CERT-${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  return `CERT-${year}-${String(counter.sequence).padStart(4, "0")}`;
};

const buildJurisdiction = (payload, user) => {
  const jurisdictionType = payload.jurisdictionType || user.jurisdictionType || "Rural";

  return {
    jurisdictionType,
    state: payload.state || user.state || "Rajasthan",
    district: payload.district || user.district || "",
    tehsil: payload.tehsil || user.tehsil || "",
    village: jurisdictionType === "Rural" ? payload.village || user.village || "" : "",
    municipality: jurisdictionType === "Urban" ? payload.municipality || user.municipality || "" : "",
  };
};

const buildJurisdictionQuery = (user) => {
  if (user.role === "superAdmin") {
    return {};
  }

  const query = {};

  if (user.state) {
    query.state = user.state;
  }

  if (user.role === "stateAdmin") {
    return query;
  }

  if (user.district) {
    query.district = user.district;
  }

  if (user.role === "districtAdmin") {
    return query;
  }

  if (user.tehsil) {
    query.tehsil = user.tehsil;
  }

  if (user.jurisdictionType) {
    query.jurisdictionType = user.jurisdictionType;
  }

  if (user.jurisdictionType === "Rural" && user.village) {
    query.village = user.village;
  }

  if (user.jurisdictionType === "Urban" && user.municipality) {
    query.municipality = user.municipality;
  }

  return query;
};

const ensureJurisdictionAccess = (user, certificate) => {
  if (user.role === "superAdmin") {
    return;
  }

  if (user.state && user.state !== certificate.state) {
    throw new AppError("You are not authorized for certificates outside your state jurisdiction", 403);
  }

  if (["districtAdmin", "departmentOfficer", "panchayatOfficer"].includes(user.role) && user.district && user.district !== certificate.district) {
    throw new AppError("You are not authorized for certificates outside your district jurisdiction", 403);
  }

  if (["departmentOfficer", "panchayatOfficer"].includes(user.role)) {
    if (user.tehsil && user.tehsil !== certificate.tehsil) {
      throw new AppError("You are not authorized for certificates outside your tehsil or block", 403);
    }

    if (user.jurisdictionType === "Rural" && user.village && user.village !== certificate.village) {
      throw new AppError("You are not authorized for certificates outside your village jurisdiction", 403);
    }

    if (user.jurisdictionType === "Urban" && user.municipality && user.municipality !== certificate.municipality) {
      throw new AppError("You are not authorized for certificates outside your municipality jurisdiction", 403);
    }
  }
};

const ensureDepartmentAccess = (user, certificateType, department) => {
  const allowedDepartments = CERTIFICATE_TYPE_DEPARTMENTS[certificateType] || [];

  if (!allowedDepartments.includes(department)) {
    throw new AppError("Certificate type and department mapping is invalid", 400);
  }

  if (["departmentOfficer", "panchayatOfficer"].includes(user.role) && user.department !== department) {
    throw new AppError("You are not authorized for this department queue", 403);
  }
};

const normalizeDocuments = (files = []) => files.map((file) => `/uploads/certificates/${file.filename}`);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeListOptions = (filters = {}) => {
  const page = Math.max(Number.parseInt(filters.page, 10) || DEFAULT_PAGE, 1);
  const requestedLimit = Number.parseInt(filters.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
  const search = typeof filters.search === "string" ? filters.search.trim() : "";
  const status = typeof filters.status === "string" ? filters.status.trim() : "";
  const certificateType = typeof filters.certificateType === "string" ? filters.certificateType.trim() : "";
  const department = typeof filters.department === "string" ? filters.department.trim() : "";
  const sort = filters.sort === "oldest" ? "oldest" : "latest";

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    search,
    status,
    certificateType,
    department,
    sort,
  };
};

const addListFiltersToQuery = (query, options) => {
  if (options.status) {
    query.status = options.status;
  }

  if (options.certificateType) {
    query.certificateType = options.certificateType;
  }

  if (options.department) {
    query.department = options.department;
  }

  if (options.search) {
    const searchRegex = new RegExp(escapeRegex(options.search), "i");
    query.$or = [
      { applicationNumber: searchRegex },
      { certificateType: searchRegex },
      { remarks: searchRegex },
    ];
  }

  return query;
};

const createHistoryEntry = ({ status, action, remarks, department, userId }) => ({
  status,
  action,
  remarks: remarks || "",
  department,
  updatedBy: userId,
});

const applyCertificate = async (payload, user, files = []) => {
  ensureDepartmentAccess({ role: "departmentOfficer", department: payload.department }, payload.certificateType, payload.department);
  const applicationNumber = await nextApplicationNumber();
  const certificate = await Certificate.create({
    applicant: user.id,
    certificateType: payload.certificateType,
    department: payload.department,
    ...buildJurisdiction(payload, user),
    uploadedDocuments: normalizeDocuments(files),
    remarks: payload.remarks || "",
    applicationNumber,
    statusHistory: [
      createHistoryEntry({
        status: "Submitted",
        action: "Application Submitted",
        remarks: payload.remarks,
        department: payload.department,
        userId: user.id,
      }),
    ],
  });

  await certificate.populate(detailPopulateOptions);
  logger.info("Certificate application submitted", {
    certificateId: certificate._id.toString(),
    applicationNumber,
    applicantId: user.id.toString(),
  });

  return formatCertificate(certificate);
};

const getMyApplications = async (user, filters = {}) => {
  const options = normalizeListOptions(filters);
  const query = addListFiltersToQuery(
    {
      applicant: user.id,
      isDeleted: false,
    },
    options
  );

  const [totalApplications, certificates] = await Promise.all([
    Certificate.countDocuments(query),
    Certificate.find(query)
      .populate(listPopulateOptions)
      .sort({ createdAt: options.sort === "oldest" ? 1 : -1 })
      .skip(options.skip)
      .limit(options.limit)
      .lean(),
  ]);

  return {
    certificates: certificates.map(formatCertificate),
    pagination: buildPagination(options.page, options.limit, totalApplications, "totalApplications"),
  };
};

const getDepartmentQueue = async (user, filters = {}) => {
  const options = normalizeListOptions(filters);
  const query = {
    isDeleted: false,
    ...buildJurisdictionQuery(user),
  };

  if (["departmentOfficer", "panchayatOfficer"].includes(user.role) && user.department) {
    query.department = user.department;
  }

  addListFiltersToQuery(query, options);

  const [totalCertificates, certificates] = await Promise.all([
    Certificate.countDocuments(query),
    Certificate.find(query)
      .populate(listPopulateOptions)
      .sort({ createdAt: options.sort === "oldest" ? 1 : -1 })
      .skip(options.skip)
      .limit(options.limit)
      .lean(),
  ]);

  return {
    certificates: certificates.map(formatCertificate),
    pagination: buildPagination(options.page, options.limit, totalCertificates, "totalCertificates"),
  };
};

const getCertificateById = async (certificateId, user) => {
  const certificate = await Certificate.findOne({ _id: certificateId, isDeleted: false })
    .populate(detailPopulateOptions)
    .lean();

  if (!certificate) {
    throw new AppError("Certificate application not found", 404);
  }

  if (user.role === "citizen") {
    if (certificate.applicant?._id.toString() !== user.id.toString()) {
      throw new AppError("You are not authorized to view this certificate", 403);
    }

    return formatCertificate(certificate);
  }

  if (!OFFICER_ROLES.includes(user.role)) {
    throw new AppError("You are not authorized to view this certificate", 403);
  }

  ensureJurisdictionAccess(user, certificate);

  if (["departmentOfficer", "panchayatOfficer"].includes(user.role) && user.department !== certificate.department) {
    throw new AppError("You are not authorized for this department certificate", 403);
  }

  return formatCertificate(certificate);
};

const reviewCertificate = async (certificateId, payload, user) => {
  const certificate = await Certificate.findOne({ _id: certificateId, isDeleted: false });

  if (!certificate) {
    throw new AppError("Certificate application not found", 404);
  }

  ensureJurisdictionAccess(user, certificate);
  ensureDepartmentAccess(user, certificate.certificateType, certificate.department);

  if (!CERTIFICATE_TRANSITIONS[certificate.status].includes("Under Review")) {
    throw new AppError(`Certificate cannot move from ${certificate.status} to Under Review`, 400);
  }

  certificate.status = "Under Review";
  certificate.remarks = payload.remarks || certificate.remarks;
  certificate.statusHistory.push(
    createHistoryEntry({
      status: "Under Review",
      action: "Department Review Started",
      remarks: payload.remarks,
      department: certificate.department,
      userId: user.id,
    })
  );

  await certificate.save();
  await certificate.populate(detailPopulateOptions);
  logger.info("Certificate moved to review", {
    certificateId: certificate._id.toString(),
    reviewedBy: user.id.toString(),
  });

  return formatCertificate(certificate);
};

const updateCertificateStatus = async (certificateId, payload, user) => {
  const certificate = await Certificate.findOne({ _id: certificateId, isDeleted: false });

  if (!certificate) {
    throw new AppError("Certificate application not found", 404);
  }

  ensureJurisdictionAccess(user, certificate);
  ensureDepartmentAccess(user, certificate.certificateType, certificate.department);

  if (!CERTIFICATE_TRANSITIONS[certificate.status].includes(payload.status)) {
    throw new AppError(`Invalid certificate status transition from ${certificate.status} to ${payload.status}`, 400);
  }

  certificate.status = payload.status;
  certificate.remarks = payload.remarks || certificate.remarks;
  certificate.statusHistory.push(
    createHistoryEntry({
      status: payload.status,
      action: payload.status === "Approved" ? "Certificate Approved" : "Certificate Rejected",
      remarks: payload.remarks,
      department: certificate.department,
      userId: user.id,
    })
  );

  if (payload.status === "Approved") {
    const verificationAssets = await generateCertificateVerificationAssets({
      certificateId: certificate._id.toString(),
    });

    certificate.approvedBy = user.id;
    certificate.issuedAt = new Date();
    certificate.qrCode = verificationAssets.qrCode;
    certificate.verificationUrl = verificationAssets.verificationUrl;
    certificate.digitalSignature = `${user.name || "Officer"} (${user.department || certificate.department})`;
    certificate.departmentSeal = `${certificate.department} Official Seal`;
  } else {
    certificate.approvedBy = undefined;
    certificate.issuedAt = undefined;
    certificate.qrCode = "";
    certificate.verificationUrl = "";
    certificate.digitalSignature = "";
    certificate.departmentSeal = "";
  }

  await certificate.save();
  await certificate.populate(detailPopulateOptions);
  logger.info("Certificate status updated", {
    certificateId: certificate._id.toString(),
    status: certificate.status,
    updatedBy: user.id.toString(),
  });

  return formatCertificate(certificate);
};

const verifyCertificate = async (certificateId) => {
  const certificate = await Certificate.findOne({ _id: certificateId, isDeleted: false })
    .populate(detailPopulateOptions)
    .lean();

  if (!certificate) {
    throw new AppError("Certificate not found for verification", 404);
  }

  return {
    verified: certificate.status === "Approved",
    certificate: formatCertificate(certificate),
  };
};

const downloadCertificate = async (certificateId, user) => {
  const certificate = await Certificate.findOne({ _id: certificateId, isDeleted: false })
    .populate(detailPopulateOptions)
    .lean();

  if (!certificate) {
    throw new AppError("Certificate application not found", 404);
  }

  if (certificate.status !== "Approved") {
    throw new AppError("Only approved certificates can be downloaded", 400);
  }

  const isCitizenOwner = user.role === "citizen" && certificate.applicant?._id.toString() === user.id.toString();

  if (!isCitizenOwner && !OFFICER_ROLES.includes(user.role)) {
    throw new AppError("You are not authorized to download this certificate", 403);
  }

  if (OFFICER_ROLES.includes(user.role)) {
    ensureJurisdictionAccess(user, certificate);
  }

  const pdfBuffer = await buildCertificatePdfBuffer(certificate);

  return {
    filename: `${certificate.applicationNumber}.pdf`,
    pdfBuffer,
  };
};

const deleteCertificate = async (certificateId, user) => {
  const certificate = await Certificate.findOne({ _id: certificateId, isDeleted: false });

  if (!certificate) {
    throw new AppError("Certificate application not found", 404);
  }

  const isCitizenOwner = user.role === "citizen" && certificate.applicant.toString() === user.id.toString();
  const isAdmin = ["districtAdmin", "stateAdmin", "superAdmin"].includes(user.role);

  if (!isCitizenOwner && !isAdmin) {
    throw new AppError("You are not authorized to archive this certificate", 403);
  }

  if (isCitizenOwner && certificate.status !== "Submitted") {
    throw new AppError("Citizens can only archive applications that are still submitted", 400);
  }

  certificate.isDeleted = true;
  certificate.deletedAt = new Date();
  certificate.deletedBy = user.id;

  await certificate.save();
  await certificate.populate(detailPopulateOptions);
  logger.warn("Certificate application archived", {
    certificateId: certificate._id.toString(),
    archivedBy: user.id.toString(),
  });

  return formatCertificate(certificate);
};

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

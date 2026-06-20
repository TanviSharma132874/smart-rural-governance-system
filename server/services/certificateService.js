const Certificate = require("../models/Certificate");
const CertificateTemplate = require("../models/CertificateTemplate");
const Counter = require("../models/Counter");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const { logAction } = require("../utils/auditLogger");
const { buildCertificatePdfBuffer } = require("./pdfService");
const { generateCertificateVerificationAssets } = require("./qrCodeService");
const { emitRealtimeEvent } = require("../sockets");
const { OFFICER_ROLES } = require("../config/constants");
const notificationService = require("./notificationService");

const CERTIFICATE_TRANSITIONS = {
  Submitted: ["Under Review"],
  "Under Review": ["Correction Required", "Approved", "Rejected"],
  "Correction Required": ["Resubmitted"],
  Resubmitted: ["Under Review"],
  Approved: ["Issued"],
  Issued: [],
  Rejected: [],
};
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const listPopulateOptions = [
  { path: "applicant", select: "name email phone role department jurisdictionType state district tehsil village municipality aadhaarNumber dateOfBirth gender fatherName motherName address ward pincode occupation" },
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
    aadhaarNumber: user.aadhaarNumber ? `XXXX-XXXX-${user.aadhaarNumber.slice(-4)}` : "",
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    fatherName: user.fatherName,
    motherName: user.motherName,
    address: user.address,
    ward: user.ward,
    pincode: user.pincode,
    occupation: user.occupation,
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
  panchayat: certificate.panchayat,
  village: certificate.village,
  municipality: certificate.municipality,
  ward: certificate.ward,
  status: certificate.status,
  uploadedDocuments: (certificate.uploadedDocuments || []).map((doc) => {
    const docObj = typeof doc.toObject === "function" ? doc.toObject() : doc;
    return {
      ...docObj,
      path: docObj.path ? docObj.path.replace(/^\/uploads\//, "/api/v1/files/") : "",
    };
  }),
  certificateDetails: certificate.certificateDetails || {},
  currentVersion: certificate.currentVersion,
  correctionRequest: certificate.correctionRequest,
  expiryDate: certificate.expiryDate,
  certificateNumber: certificate.certificateNumber,
  remarks: certificate.remarks,
  approvedBy: formatUser(certificate.approvedBy),
  issuedAt: certificate.issuedAt,
  applicationNumber: certificate.applicationNumber,
  qrCode: certificate.qrCode,
  digitalSignature: certificate.digitalSignature,
  verificationUrl: certificate.verificationUrl,
  isDeleted: certificate.isDeleted,
  statusHistory: (certificate.statusHistory || []).map((entry) => ({
    status: entry.status,
    action: entry.action,
    remarks: entry.remarks,
    department: entry.department,
    updatedBy: formatUser(entry.updatedBy),
    updatedAt: entry.updatedAt,
    version: entry.version,
    detailsSnapshot: entry.detailsSnapshot,
    documentsSnapshot: entry.documentsSnapshot,
  })),
  createdAt: certificate.createdAt,
  updatedAt: certificate.updatedAt,
});

const nextApplicationNumber = async () => {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { key: `CERT-APP-${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  return `APP-${year}-${String(counter.sequence).padStart(6, "0")}`;
};

const nextCertificateNumber = async (type) => {
  const code = type.split(" ").map(w => w[0]).join("").toUpperCase();
  const counter = await Counter.findOneAndUpdate(
    { key: `CERT-NUM-${code}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  return `${code}-${new Date().getFullYear()}-${String(counter.sequence).padStart(6, "0")}`;
};

const applyCertificate = async (payload, user, files = []) => {
  const template = await CertificateTemplate.findOne({ code: payload.certificateType, isActive: true });
  if (!template) {
    throw new AppError("Invalid or inactive certificate type selected", 400);
  }

  const department = template.department;
  const applicationNumber = await nextApplicationNumber();

  // Citizen Identity Source of Truth (Auto-Fill)
  const userData = await User.findById(user.id);
  if (!userData) throw new AppError("User profile not found", 404);

  let certificateDetails = {};
  if (payload.certificateDetails) {
    try {
      certificateDetails = typeof payload.certificateDetails === "string" ? JSON.parse(payload.certificateDetails) : payload.certificateDetails;
    } catch (_error) {
      throw new AppError("Certificate details payload is invalid", 400);
    }
  }

  // Validate dynamic fields against template
  template.fields.forEach(field => {
    if (field.required && !certificateDetails[field.name]) {
      throw new AppError(`Missing mandatory field: ${field.label}`, 400);
    }
  });

  // Multi-document mapping with categories
  const uploadedDocuments = files.map((file, index) => {
    const category = Array.isArray(payload.documentCategories) ? payload.documentCategories[index] : (payload.documentCategories || "General Supporting");
    return {
      name: file.originalname,
      path: `/uploads/certificates/${file.filename}`,
      category: category,
      verified: false,
    };
  });

  // Validate required documents with multi-document support
  // Ensure each mandatory requirement is satisfied by a distinct file
  const availableUploads = [...uploadedDocuments];
  template.requiredDocuments.forEach((req) => {
    if (req.mandatory) {
      const index = availableUploads.findIndex((u) => u.category === req.category);
      if (index === -1) {
        throw new AppError(`Mandatory document missing: ${req.label || req.category}`, 400);
      }
      // Consume this upload so it cannot satisfy another requirement
      availableUploads.splice(index, 1);
    }
  });

  const certificate = await Certificate.create({
    applicant: user.id,
    certificateType: template.name,
    department,
    jurisdictionType: userData.jurisdictionType,
    state: userData.state,
    district: userData.district,
    tehsil: userData.tehsil,
    panchayat: userData.panchayat,
    village: userData.village,
    municipality: userData.municipality,
    ward: userData.ward,
    applicationNumber,
    certificateDetails,
    uploadedDocuments,
    status: "Submitted",
    currentVersion: 1,
    statusHistory: [
      {
        status: "Submitted",
        action: "Initial Application Submission",
        remarks: payload.remarks || "New application",
        department,
        updatedBy: user.id,
        version: 1,
        detailsSnapshot: certificateDetails,
        documentsSnapshot: uploadedDocuments.map(d => d.path),
      },
    ],
  });

  await certificate.populate(detailPopulateOptions);
  
  const formatted = formatCertificate(certificate);
  emitRealtimeEvent(
    [`user:${user.id}`, `district:${certificate.district}`, `department:${certificate.department}`],
    "certificate:submitted",
    { certificate: formatted }
  );

  return formatted;
};

const applyCorrection = async (certificateId, payload, user, files = []) => {
  const certificate = await Certificate.findOne({ _id: certificateId, isDeleted: false });
  if (!certificate) throw new AppError("Original certificate not found", 404);

  if (certificate.applicant.toString() !== user.id.toString()) {
    throw new AppError("You can only apply for corrections on your own certificates", 403);
  }

  const nextVersion = certificate.currentVersion + 1;

  let certificateDetails = {};
  if (payload.requestedChanges) {
    try {
      certificateDetails = typeof payload.requestedChanges === "string" ? JSON.parse(payload.requestedChanges) : payload.requestedChanges;
    } catch (_error) {
      certificateDetails = { changes: payload.requestedChanges };
    }
  }

  const uploadedDocuments = files.map((file, index) => {
    const category = Array.isArray(payload.documentCategories) ? payload.documentCategories[index] : (payload.documentCategories || "Correction Support");
    return {
      name: file.originalname,
      path: `/uploads/certificates/${file.filename}`,
      category: category,
      verified: false,
    };
  });

  certificate.status = "Submitted";
  certificate.currentVersion = nextVersion;
  certificate.correctionRequest = {
    reasonForChange: payload.reasonForChange,
    requestedChanges: payload.requestedChanges,
    previousCertificateNumber: certificate.certificateNumber || certificate.applicationNumber,
  };
  
  // Update details with changes
  certificate.certificateDetails = { ...certificate.certificateDetails, ...certificateDetails };
  certificate.uploadedDocuments = [...certificate.uploadedDocuments, ...uploadedDocuments];

  certificate.statusHistory.push({
    status: "Submitted",
    action: `Correction Application (v${nextVersion})`,
    remarks: payload.reasonForChange,
    department: certificate.department,
    updatedBy: user.id,
    version: nextVersion,
    detailsSnapshot: certificate.certificateDetails,
    documentsSnapshot: certificate.uploadedDocuments.map(d => d.path),
  });

  await certificate.save();
  await certificate.populate(detailPopulateOptions);

  try {
    await notificationService.createRoomNotification({
      targetRoom: `department:${certificate.department}`,
      sender: user.id,
      type: "Certificate",
      action: "CorrectionSubmitted",
      title: "Certificate Correction Submitted",
      message: `A correction request has been submitted for certificate "${certificate.certificateNumber || certificate.applicationNumber}".`,
      metadata: {
        entityId: certificate._id,
        entityType: "Certificate",
      },
      priority: "Medium",
    });
  } catch (error) {
    logger.error(`Notification failed for Certificate Correction Submitted: ${error.message}`);
  }

  const formatted = formatCertificate(certificate);
  emitRealtimeEvent(
    [`user:${user.id}`, `district:${certificate.district}`, `department:${certificate.department}`],
    "certificate:updated",
    { certificate: formatted }
  );

  return formatted;
};

const resubmitCertificate = async (certificateId, payload, user, files = []) => {
  const certificate = await Certificate.findOne({ _id: certificateId, isDeleted: false });

  if (!certificate) throw new AppError("Certificate application not found", 404);
  if (certificate.applicant.toString() !== user.id.toString()) throw new AppError("Unauthorized", 403);
  if (certificate.status !== "Correction Required") throw new AppError("Invalid status for resubmission", 400);

  if (payload.certificateDetails) {
    try {
      const details = typeof payload.certificateDetails === "string" ? JSON.parse(payload.certificateDetails) : payload.certificateDetails;
      certificate.certificateDetails = { ...certificate.certificateDetails, ...details };
    } catch (_error) { throw new AppError("Invalid details", 400); }
  }

  const newDocs = files.map((file, index) => {
    const category = Array.isArray(payload.documentCategories) ? payload.documentCategories[index] : (payload.documentCategories || "Resubmission");
    return {
      name: file.originalname,
      path: `/uploads/certificates/${file.filename}`,
      category: category,
      verified: false,
    };
  });

  certificate.uploadedDocuments = [...certificate.uploadedDocuments, ...newDocs];
  certificate.status = "Resubmitted";
  certificate.statusHistory.push({
    status: "Resubmitted",
    action: "Resubmission by Citizen",
    remarks: payload.remarks || "Resubmitted",
    department: certificate.department,
    updatedBy: user.id,
    version: certificate.currentVersion,
    detailsSnapshot: certificate.certificateDetails,
    documentsSnapshot: certificate.uploadedDocuments.map(d => d.path),
  });

  await certificate.save();
  await certificate.populate(detailPopulateOptions);

  try {
    await notificationService.createRoomNotification({
      targetRoom: `department:${certificate.department}`,
      sender: user.id,
      type: "Certificate",
      action: "Resubmitted",
      title: "Certificate Application Resubmitted",
      message: `Certificate application "${certificate.applicationNumber}" has been resubmitted by the citizen.`,
      metadata: {
        entityId: certificate._id,
        entityType: "Certificate",
      },
      priority: "Medium",
    });
  } catch (error) {
    logger.error(`Notification failed for Certificate Resubmitted: ${error.message}`);
  }

  const formatted = formatCertificate(certificate);
  emitRealtimeEvent(
    [`user:${user.id}`, `district:${certificate.district}`, `department:${certificate.department}`],
    "certificate:updated",
    { certificate: formatted }
  );

  return formatted;
};

const getMyApplications = async (user, filters = {}) => {
  const options = typeof filters === "string" ? { page: 1, limit: 10 } : filters;
  const page = Math.max(Number.parseInt(options.page, 10) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number.parseInt(options.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const query = { applicant: user.id, isDeleted: false };
  if (options.status) query.status = options.status;
  if (options.certificateType) query.certificateType = options.certificateType;

  const [totalApplications, certificates] = await Promise.all([
    Certificate.countDocuments(query),
    Certificate.find(query)
      .populate(listPopulateOptions)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    certificates: certificates.map(formatCertificate),
    pagination: { page, limit, totalPages: Math.ceil(totalApplications / limit), totalApplications },
  };
};

const getDepartmentQueue = async (user, filters = {}) => {
  const page = Math.max(Number.parseInt(filters.page, 10) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const query = { isDeleted: false };
  if (user.role !== "superAdmin") {
    if (user.state) query.state = user.state;
    if (user.district && user.role !== "stateAdmin") query.district = user.district;
    if (["departmentOfficer", "panchayatOfficer"].includes(user.role)) {
      query.department = user.department;
      if (user.tehsil) query.tehsil = user.tehsil;
      if (user.village) query.village = user.village;
      if (user.municipality) query.municipality = user.municipality;
    }
  }

  if (filters.status) query.status = filters.status;
  if (filters.certificateType) query.certificateType = filters.certificateType;

  const [totalCertificates, certificates] = await Promise.all([
    Certificate.countDocuments(query),
    Certificate.find(query)
      .populate(listPopulateOptions)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    certificates: certificates.map(formatCertificate),
    pagination: { page, limit, totalPages: Math.ceil(totalCertificates / limit), totalCertificates },
  };
};

const getCertificateById = async (certificateId, user) => {
  const certificate = await Certificate.findOne({ _id: certificateId, isDeleted: false })
    .populate(detailPopulateOptions)
    .lean();

  if (!certificate) throw new AppError("Certificate not found", 404);
  
  if (user.role === "citizen" && certificate.applicant?._id.toString() !== user.id.toString()) {
    throw new AppError("Unauthorized", 403);
  }

  return formatCertificate(certificate);
};

const verifyCertificate = async (certificateId) => {
  const certificate = await Certificate.findOne({ _id: certificateId, isDeleted: false })
    .populate(detailPopulateOptions)
    .lean();

  if (!certificate) throw new AppError("Certificate not found", 404);

  return formatCertificate(certificate);
};

const reviewCertificate = async (certificateId, payload, user) => {
  const certificate = await Certificate.findOne({ _id: certificateId, isDeleted: false });
  if (!certificate) throw new AppError("Certificate not found", 404);

  if (certificate.status !== "Submitted" && certificate.status !== "Resubmitted") {
    throw new AppError("Only new or resubmitted applications can be moved to review", 400);
  }

  certificate.status = "Under Review";
  certificate.remarks = payload.remarks || "Moved to review";
  
  certificate.statusHistory.push({
    status: "Under Review",
    action: "Moved to Review",
    remarks: payload.remarks,
    department: user.department || certificate.department,
    updatedBy: user.id,
    version: certificate.currentVersion,
    detailsSnapshot: certificate.certificateDetails,
    documentsSnapshot: certificate.uploadedDocuments.map(d => d.path),
  });

  await certificate.save();
  await certificate.populate(detailPopulateOptions);

  const formatted = formatCertificate(certificate);
  emitRealtimeEvent(
    [`user:${certificate.applicant._id}`, `district:${certificate.district}`, `department:${certificate.department}`],
    "certificate:updated",
    { certificate: formatted }
  );

  return formatted;
};

const updateCertificateStatus = async (certificateId, payload, user) => {
  const certificate = await Certificate.findOne({ _id: certificateId, isDeleted: false });
  if (!certificate) throw new AppError("Not found", 404);

  if (!CERTIFICATE_TRANSITIONS[certificate.status].includes(payload.status)) {
    throw new AppError(`Invalid transition from ${certificate.status} to ${payload.status}`, 400);
  }

  const previousStatus = certificate.status;
  
  // Safe Correction Rejection Logic: 
  // If an officer rejects a correction request for an already issued certificate,
  // revert it to Issued status instead of terminal Rejected.
  let action = "";
  if (payload.status === "Rejected" && certificate.certificateNumber) {
    certificate.status = "Issued";
    certificate.remarks = payload.remarks || "Correction request denied - Original certificate remains valid.";
    action = "Correction Request Denied - Original Certificate Maintained";
  } else {
    certificate.status = payload.status;
    certificate.remarks = payload.remarks || certificate.remarks;
    action = `Workflow Update: ${certificate.status}`;
  }

  if (payload.status === "Approved") {
    certificate.approvedBy = user.id;
    certificate.issuedAt = new Date();
    
    // Archive current number if this is a correction (version > 1 or number exists)
    if (certificate.certificateNumber) {
      certificate.previousCertificateNumbers.push(certificate.certificateNumber);
    }

    certificate.certificateNumber = await nextCertificateNumber(certificate.certificateType);
    certificate.expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3); // 3 years default

    const verificationAssets = await generateCertificateVerificationAssets({
      certificateNumber: certificate.certificateNumber,
    });

    certificate.qrCode = verificationAssets.qrCode;
    certificate.verificationUrl = verificationAssets.verificationUrl;
    certificate.digitalSignature = `${user.name} (${user.department})`;

    certificate.status = "Issued";
    action = `Workflow Update: ${certificate.status}`;
  }

  certificate.statusHistory.push({
    status: certificate.status,
    action: action,
    remarks: payload.remarks,
    department: certificate.department,
    updatedBy: user.id,
    version: certificate.currentVersion,
    detailsSnapshot: certificate.certificateDetails,
    documentsSnapshot: certificate.uploadedDocuments.map(d => d.path),
  });

  await certificate.save();
  await certificate.populate(detailPopulateOptions);

  // Send notification if certificate was issued (moved to Issued status)
  if (certificate.status === "Issued" && previousStatus !== "Issued") {
    try {
      await notificationService.createPrivateNotification({
        recipient: certificate.applicant._id,
        type: "Certificate",
        action: "Issued",
        title: "Certificate Issued",
        message: `Your ${certificate.certificateType} certificate has been approved and issued. You can now download it.`,
        metadata: {
          entityId: certificate._id,
          entityType: "Certificate",
        },
        priority: "High",
      });
    } catch (error) {
      logger.error(`Notification failed for Certificate Issued: ${error.message}`);
      // Non-blocking failure; workflow continues
    }
  }

  // Send notification if correction is required
  if (certificate.status === "Correction Required" && previousStatus !== "Correction Required") {
    try {
      await notificationService.createPrivateNotification({
        recipient: certificate.applicant._id,
        type: "Certificate",
        action: "Correction Required",
        title: "Correction Required: Certificate",
        message: `Action required: Your application for ${certificate.certificateType} (${certificate.applicationNumber}) requires corrections. Remarks: ${certificate.remarks}`,
        metadata: {
          entityId: certificate._id,
          entityType: "Certificate",
        },
        priority: "High",
      });
    } catch (error) {
      logger.error(`Notification failed for Certificate Correction Required: ${error.message}`);
      // Non-blocking failure; workflow continues
    }
  }

  // Send notification if certificate was rejected
  if (certificate.status === "Rejected" && previousStatus !== "Rejected") {
    try {
      await notificationService.createPrivateNotification({
        recipient: certificate.applicant._id,
        type: "Certificate",
        action: "Rejected",
        title: "Certificate Application Rejected",
        message: `Your application for ${certificate.certificateType} (${certificate.applicationNumber}) has been rejected. Remarks: ${certificate.remarks}`,
        metadata: {
          entityId: certificate._id,
          entityType: "Certificate",
        },
        priority: "High",
      });
    } catch (error) {
      logger.error(`Notification failed for Certificate Rejected: ${error.message}`);
      // Non-blocking failure; workflow continues
    }
  }

  const formatted = formatCertificate(certificate);
  emitRealtimeEvent(
    [`user:${certificate.applicant._id}`, `district:${certificate.district}`, `department:${certificate.department}`],
    "certificate:updated",
    { certificate: formatted }
  );

  return formatted;
};

const downloadCertificate = async (certificateId, user) => {
  const certificate = await Certificate.findOne({ _id: certificateId, isDeleted: false }).populate(detailPopulateOptions).lean();
  if (!certificate || certificate.status !== "Issued") throw new AppError("Not issued", 404);

  const pdfBuffer = await buildCertificatePdfBuffer(certificate);
  return { filename: `${certificate.certificateNumber}.pdf`, pdfBuffer };
};

const deleteCertificate = async (certificateId, user) => {
  const certificate = await Certificate.findOne({ _id: certificateId, isDeleted: false });
  if (!certificate) throw new AppError("Not found", 404);

  certificate.isDeleted = true;
  certificate.deletedAt = new Date();
  certificate.deletedBy = user.id;
  await certificate.save();

  return formatCertificate(certificate);
};

const verifyCertificatePublic = async (identifier) => {
  const mongoose = require("mongoose");
  
  // Search by current number OR any historical number
  let query = {
    $or: [
      { certificateNumber: identifier },
      { previousCertificateNumbers: identifier }
    ],
    isDeleted: false
  };
  
  // Backward compatibility: If not found by number, try by MongoDB ID
  let certificate = await Certificate.findOne(query)
    .populate({ path: "applicant", select: "name" })
    .lean();

  if (!certificate && mongoose.Types.ObjectId.isValid(identifier)) {
    certificate = await Certificate.findOne({ _id: identifier, isDeleted: false })
      .populate({ path: "applicant", select: "name" })
      .lean();
  }

  if (!certificate) {
    return { status: "Invalid", message: "No such certificate found in our registry." };
  }

  const now = new Date();
  const isExpired = certificate.expiryDate && new Date(certificate.expiryDate) < now;

  return {
    status: isExpired ? "Expired" : certificate.status,
    applicationNumber: certificate.applicationNumber,
    certificateNumber: certificate.certificateNumber,
    certificateType: certificate.certificateType,
    issuedTo: certificate.applicant?.name,
    issuedAt: certificate.issuedAt,
    expiryDate: certificate.expiryDate,
    department: certificate.department,
    district: certificate.district,
    isValid: !isExpired && certificate.status === "Issued",
  };
};

module.exports = {
  applyCertificate,
  applyCorrection,
  resubmitCertificate,
  getMyApplications,
  getDepartmentQueue,
  getCertificateById,
  verifyCertificate,
  reviewCertificate,
  updateCertificateStatus,
  downloadCertificate,
  deleteCertificate,
  verifyCertificatePublic,
};

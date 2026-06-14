const path = require("path");
const fs = require("fs");
const Certificate = require("../models/Certificate");
const Complaint = require("../models/Complaint");
const Emergency = require("../models/Emergency");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Serves an uploaded file if the user is authorized.
 * Authorization logic:
 * - superAdmin & stateAdmin: Global access.
 * - citizen: Must be the owner of the record associated with the file.
 * - officers: Must have jurisdictional (district) and departmental matching for the record.
 */
const getFile = asyncHandler(async (req, res, next) => {
  const { category, filename } = req.params;
  const user = req.user;

  // 1. Validate category
  const validCategories = ["certificates", "complaints", "emergencies"];
  if (!validCategories.includes(category)) {
    return next(new AppError("Invalid file category", 400));
  }

  // 2. Sanitize filename and prevent path traversal
  if (!/^[a-zA-Z0-9._-]+$/.test(filename) || filename.includes("..")) {
    return next(new AppError("Security violation: Invalid filename format detected", 400));
  }

  // 3. Define the absolute file path on disk
  const filePath = path.resolve(__dirname, "..", "uploads", category, filename);

  // 4. Check if file exists physically
  if (!fs.existsSync(filePath)) {
    return next(new AppError("File not found on server", 404));
  }

  // 5. Bypass authorization for top-level administrators
  if (["superAdmin", "stateAdmin"].includes(user.role)) {
    return res.sendFile(filePath);
  }

  // 6. Authorization Check (Reverse Lookup in Database)
  const dbPath = `/uploads/${category}/${filename}`;
  let authorized = false;

  if (category === "certificates") {
    const certificate = await Certificate.findOne({
      "uploadedDocuments.path": dbPath,
      isDeleted: false,
    });
    
    if (certificate) {
      if (user.role === "citizen") {
        authorized = certificate.applicant.toString() === user.id.toString();
      } else {
        // Officer/Admin Check: State + District Jurisdiction
        const sameState = !user.state || user.state === certificate.state;
        const sameDistrict = !user.district || user.district === certificate.district;
        const sameDept = ["districtAdmin"].includes(user.role) || user.department === certificate.department;
        authorized = sameState && sameDistrict && sameDept;
      }
    }
  } else if (category === "complaints") {
    const complaint = await Complaint.findOne({
      $or: [
        { images: dbPath },
        { resolutionImages: dbPath },
        { "statusHistory.resolutionImages": dbPath },
      ],
      isDeleted: false,
    });
    
    if (complaint) {
      if (user.role === "citizen") {
        authorized = complaint.citizenId.toString() === user.id.toString();
      } else {
        const sameState = !user.state || user.state === complaint.state;
        const sameDistrict = !user.district || user.district === complaint.district;
        const sameDept = ["districtAdmin"].includes(user.role) || user.department === complaint.responsibleDepartment;
        authorized = sameState && sameDistrict && sameDept;
      }
    }
  } else if (category === "emergencies") {
    const emergency = await Emergency.findOne({
      images: dbPath,
      isDeleted: false,
    });
    
    if (emergency) {
      if (user.role === "citizen") {
        authorized = emergency.citizen.toString() === user.id.toString();
      } else {
        const sameState = !user.state || user.state === emergency.state;
        const sameDistrict = !user.district || user.district === emergency.district;
        const sameDept = ["districtAdmin"].includes(user.role) || user.department === emergency.assignedDepartment;
        authorized = sameState && sameDistrict && sameDept;
      }
    }
  }

  if (authorized) {
    return res.sendFile(filePath);
  }

  return next(new AppError("You are not authorized to access this sensitive document", 403));
});

module.exports = { getFile };

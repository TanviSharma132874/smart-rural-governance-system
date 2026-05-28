const AppError = require("../utils/AppError");
const { CERTIFICATE_TYPE_DEPARTMENTS } = require("../config/constants");

const authorizeCertificateDepartments = () => (req, _res, next) => {
  const { certificateType, department } = req.body;

  if (!certificateType || !department) {
    return next();
  }

  const allowedDepartments = CERTIFICATE_TYPE_DEPARTMENTS[certificateType] || [];

  if (!allowedDepartments.includes(department)) {
    return next(new AppError("Selected department is not authorized for this certificate type", 400));
  }

  if (["departmentOfficer", "panchayatOfficer"].includes(req.user.role) && req.user.department !== department) {
    return next(new AppError("You are not authorized for this department", 403));
  }

  return next();
};

module.exports = authorizeCertificateDepartments;

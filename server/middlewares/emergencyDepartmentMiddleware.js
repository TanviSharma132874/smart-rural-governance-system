const AppError = require("../utils/AppError");
const { EMERGENCY_TYPE_DEPARTMENTS, EMERGENCY_DEPARTMENTS } = require("../config/constants");

const authorizeEmergencyDepartment = () => (req, _res, next) => {
  const department = req.body.department || req.body.assignedDepartment || req.user.department;
  const emergencyType = req.body.emergencyType;

  if (department && !EMERGENCY_DEPARTMENTS.includes(department)) {
    return next(new AppError("Selected department is not part of the emergency response system", 400));
  }

  if (emergencyType) {
    const allowedDepartments = EMERGENCY_TYPE_DEPARTMENTS[emergencyType] || [];

    if (allowedDepartments.length > 0 && department && !allowedDepartments.includes(department)) {
      return next(new AppError("Selected department is not authorized for this emergency type", 400));
    }
  }

  if (["departmentOfficer", "panchayatOfficer"].includes(req.user.role) && department && req.user.department && req.user.department !== department) {
    return next(new AppError("You are not authorized for this emergency department", 403));
  }

  return next();
};

module.exports = authorizeEmergencyDepartment;

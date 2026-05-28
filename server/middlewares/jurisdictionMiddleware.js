const AppError = require("../utils/AppError");

const enforceJurisdictionPayload = (req, _res, next) => {
  const { jurisdictionType, district, state, tehsil, village, municipality } = req.body;

  if (!jurisdictionType || !district || !state) {
    return next();
  }

  if (["departmentOfficer", "panchayatOfficer"].includes(req.user.role)) {
    if (req.user.state && req.user.state !== state) {
      return next(new AppError("State jurisdiction mismatch", 403));
    }

    if (req.user.district && req.user.district !== district) {
      return next(new AppError("District jurisdiction mismatch", 403));
    }

    if (req.user.tehsil && tehsil && req.user.tehsil !== tehsil) {
      return next(new AppError("Tehsil jurisdiction mismatch", 403));
    }

    if (jurisdictionType === "Rural" && req.user.village && village && req.user.village !== village) {
      return next(new AppError("Village jurisdiction mismatch", 403));
    }

    if (jurisdictionType === "Urban" && req.user.municipality && municipality && req.user.municipality !== municipality) {
      return next(new AppError("Municipality jurisdiction mismatch", 403));
    }
  }

  return next();
};

module.exports = {
  enforceJurisdictionPayload,
};

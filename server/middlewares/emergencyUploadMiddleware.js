const fs = require("fs");
const path = require("path");

const multer = require("multer");

const AppError = require("../utils/AppError");

const uploadDir = path.join(__dirname, "..", "uploads", "emergencies");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, extension).replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${safeName}${extension}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new AppError("Only image uploads are allowed for emergencies", 400));
  }

  return cb(null, true);
};

const uploadEmergencyImages = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

module.exports = uploadEmergencyImages;

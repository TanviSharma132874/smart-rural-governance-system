const fs = require("fs");
const path = require("path");
const multer = require("multer");

const AppError = require("../utils/AppError");

const uploadDir = path.join(__dirname, "..", "uploads", "certificates");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const safeName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    cb(null, `${Date.now()}-${safeName || "document"}${extension}`);
  },
});

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const fileFilter = (_req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new AppError("Only PDF, JPG, PNG, and WEBP documents are allowed", 400));
  }

  return cb(null, true);
};

const uploadCertificateDocuments = multer({
  storage,
  fileFilter,
  limits: {
    files: 6,
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  uploadCertificateDocuments,
};

const fs = require("fs");
const path = require("path");
const multer = require("multer");

const AppError = require("../utils/AppError");

const complaintUploadDir = path.join(__dirname, "..", "uploads", "complaints");

const ensureComplaintUploadDir = () => {
  fs.mkdirSync(complaintUploadDir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureComplaintUploadDir();
    cb(null, complaintUploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const safeName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    cb(null, `${Date.now()}-${safeName || "complaint"}${extension}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new AppError("Only image uploads are allowed", 400));
  }

  return cb(null, true);
};

const uploadComplaintImages = multer({
  storage,
  fileFilter,
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = uploadComplaintImages;

const fs = require("fs");
const path = require("path");
const multer = require("multer");

const AppError = require("../utils/AppError");

const complaintsUploadDir = path.join(__dirname, "..", "uploads", "complaints");
const maxComplaintImages = Number(process.env.MAX_COMPLAINT_IMAGES) || 5;
const maxComplaintImageSizeMb = Number(process.env.MAX_COMPLAINT_IMAGE_SIZE_MB) || 5;

if (!fs.existsSync(complaintsUploadDir)) {
  fs.mkdirSync(complaintsUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, complaintsUploadDir);
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
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  return cb(new AppError("Only image uploads are allowed for complaints", 400));
};

const uploadComplaintImages = multer({
  storage,
  fileFilter,
  limits: {
    files: maxComplaintImages,
    fileSize: maxComplaintImageSizeMb * 1024 * 1024,
  },
});

module.exports = {
  uploadComplaintImages,
};

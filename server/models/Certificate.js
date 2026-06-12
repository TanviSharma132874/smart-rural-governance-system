const mongoose = require("mongoose");

const {
  CERTIFICATE_TYPES,
  CERTIFICATE_STATUSES,
  GOVERNMENT_DEPARTMENTS,
  JURISDICTION_TYPES,
} = require("../config/constants");

const certificateHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: CERTIFICATE_STATUSES,
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    department: {
      type: String,
      enum: GOVERNMENT_DEPARTMENTS,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const certificateSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Applicant is required"],
      index: true,
    },
    certificateType: {
      type: String,
      enum: CERTIFICATE_TYPES,
      required: [true, "Certificate type is required"],
      index: true,
    },
    department: {
      type: String,
      enum: GOVERNMENT_DEPARTMENTS,
      required: [true, "Department is required"],
      index: true,
    },
    jurisdictionType: {
      type: String,
      enum: JURISDICTION_TYPES,
      required: [true, "Jurisdiction type is required"],
      index: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      index: true,
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
      index: true,
    },
    tehsil: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    village: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    municipality: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    status: {
      type: String,
      enum: CERTIFICATE_STATUSES,
      default: "Submitted",
      index: true,
    },
    uploadedDocuments: {
      type: [String],
      default: [],
    },
    certificateDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Remarks cannot exceed 1000 characters"],
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    issuedAt: {
      type: Date,
      default: null,
    },
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    qrCode: {
      type: String,
      default: "",
    },
    digitalSignature: {
      type: String,
      default: "",
    },
    departmentSeal: {
      type: String,
      default: "",
    },
    verificationUrl: {
      type: String,
      default: "",
    },
    statusHistory: {
      type: [certificateHistorySchema],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

certificateSchema.index({ uploadedDocuments: 1 });
certificateSchema.index({ department: 1, status: 1, district: 1 });
certificateSchema.index({ applicant: 1, status: 1, createdAt: -1 });
certificateSchema.index({ jurisdictionType: 1, district: 1, tehsil: 1, village: 1, municipality: 1 });

module.exports = mongoose.model("Certificate", certificateSchema);

const mongoose = require("mongoose");

const {
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_AUDIENCES,
  EMERGENCY_DEPARTMENTS,
  JURISDICTION_TYPES,
} = require("../config/constants");

const announcementHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ANNOUNCEMENT_STATUSES,
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
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
  { _id: false }
);

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    announcementType: {
      type: String,
      enum: ANNOUNCEMENT_TYPES,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    department: {
      type: String,
      enum: EMERGENCY_DEPARTMENTS,
      required: true,
    },
    targetAudience: {
      type: String,
      enum: ANNOUNCEMENT_AUDIENCES,
      default: "All",
    },
    jurisdictionType: {
      type: String,
      enum: JURISDICTION_TYPES,
      required: true,
      default: "Rural",
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    tehsil: {
      type: String,
      trim: true,
      default: "",
    },
    village: {
      type: String,
      trim: true,
      default: "",
    },
    municipality: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ANNOUNCEMENT_STATUSES,
      default: "Draft",
      index: true,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    statusHistory: {
      type: [announcementHistorySchema],
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
  { timestamps: true }
);

announcementSchema.index({ status: 1, district: 1, createdAt: -1 });
announcementSchema.index({ announcementType: 1, department: 1 });

module.exports = mongoose.model("Announcement", announcementSchema);

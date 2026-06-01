const mongoose = require("mongoose");

const { VOLUNTEER_SKILLS, VOLUNTEER_AVAILABILITY, VOLUNTEER_APPROVAL_STATUSES, JURISDICTION_TYPES } = require("../config/constants");

const volunteerAssignmentHistorySchema = new mongoose.Schema(
  {
    emergency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Emergency",
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const volunteerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    jurisdictionType: {
      type: String,
      enum: JURISDICTION_TYPES,
      required: true,
      default: "Rural",
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
    skills: {
      type: [String],
      enum: VOLUNTEER_SKILLS,
      default: [],
    },
    availabilityStatus: {
      type: String,
      enum: VOLUNTEER_AVAILABILITY,
      default: "Available",
    },
    approvalStatus: {
      type: String,
      enum: VOLUNTEER_APPROVAL_STATUSES,
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignments: {
      type: [volunteerAssignmentHistorySchema],
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

volunteerSchema.index({ district: 1, approvalStatus: 1, availabilityStatus: 1 });
volunteerSchema.index({ skills: 1 });

module.exports = mongoose.model("Volunteer", volunteerSchema);

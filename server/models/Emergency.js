const mongoose = require("mongoose");

const {
  EMERGENCY_TYPES,
  EMERGENCY_SEVERITIES,
  EMERGENCY_STATUSES,
  EMERGENCY_DEPARTMENTS,
  JURISDICTION_TYPES,
  RESOURCE_TYPES,
} = require("../config/constants");

const locationSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    landmark: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const emergencyHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: EMERGENCY_STATUSES,
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
      enum: EMERGENCY_DEPARTMENTS,
      default: null,
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

const resourceAssignmentSchema = new mongoose.Schema(
  {
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
    },
    resourceType: {
      type: String,
      enum: RESOURCE_TYPES,
      required: true,
    },
    quantity: {
      type: Number,
      min: 1,
      required: true,
    },
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    allocatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const volunteerAssignmentSchema = new mongoose.Schema(
  {
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Volunteer",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const emergencySchema = new mongoose.Schema(
  {
    emergencyType: {
      type: String,
      enum: EMERGENCY_TYPES,
      required: [true, "Emergency type is required"],
    },
    title: {
      type: String,
      required: [true, "Emergency title is required"],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, "Emergency description is required"],
      trim: true,
      maxlength: 2000,
    },
    location: {
      type: locationSchema,
      required: true,
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
    images: {
      type: [String],
      default: [],
    },
    severity: {
      type: String,
      enum: EMERGENCY_SEVERITIES,
      required: true,
      default: "Medium",
    },
    priority: {
      type: String,
      enum: EMERGENCY_SEVERITIES,
      required: true,
      default: "Medium",
    },
    incidentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    peopleAffected: {
      type: Number,
      min: 1,
      default: 1,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: EMERGENCY_STATUSES,
      default: "Submitted",
      index: true,
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedDepartment: {
      type: String,
      enum: EMERGENCY_DEPARTMENTS,
      required: true,
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resourceAssignments: {
      type: [resourceAssignmentSchema],
      default: [],
    },
    volunteerAssignments: {
      type: [volunteerAssignmentSchema],
      default: [],
    },
    statusHistory: {
      type: [emergencyHistorySchema],
      default: [],
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    responseStartedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
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

emergencySchema.index({ images: 1 });
emergencySchema.index({ emergencyType: 1, status: 1, district: 1 });
emergencySchema.index({ assignedDepartment: 1, status: 1, createdAt: -1 });
emergencySchema.index({ jurisdictionType: 1, district: 1, tehsil: 1, village: 1, municipality: 1 });
emergencySchema.index({ priority: 1, createdAt: -1 });
emergencySchema.index({ title: "text", description: "text", "location.address": "text" });

module.exports = mongoose.model("Emergency", emergencySchema);

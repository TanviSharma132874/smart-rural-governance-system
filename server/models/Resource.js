const mongoose = require("mongoose");

const { RESOURCE_TYPES, RESOURCE_STATUSES, JURISDICTION_TYPES, EMERGENCY_DEPARTMENTS } = require("../config/constants");

const resourceAuditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    quantityChange: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
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

const resourceAllocationSchema = new mongoose.Schema(
  {
    emergency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Emergency",
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
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
    remarks: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    resourceType: {
      type: String,
      enum: RESOURCE_TYPES,
      required: true,
    },
    resourceCategory: {
      type: String,
      default: "",
      trim: true,
    },
    quantity: {
      type: Number,
      min: 0,
      required: true,
    },
    availableQuantity: {
      type: Number,
      min: 0,
      required: true,
    },
    status: {
      type: String,
      enum: RESOURCE_STATUSES,
      default: "Available",
    },
    location: {
      address: {
        type: String,
        required: true,
        trim: true,
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
    department: {
      type: String,
      enum: EMERGENCY_DEPARTMENTS,
      required: true,
    },
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    auditHistory: {
      type: [resourceAuditSchema],
      default: [],
    },
    allocationHistory: {
      type: [resourceAllocationSchema],
      default: [],
    },
    lastAllocationAt: {
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
  { timestamps: true }
);

resourceSchema.index({ resourceType: 1, district: 1, status: 1 });
resourceSchema.index({ department: 1, jurisdictionType: 1, district: 1 });

module.exports = mongoose.model("Resource", resourceSchema);

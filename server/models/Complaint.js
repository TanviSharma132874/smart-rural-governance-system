const mongoose = require("mongoose");
const { COMPLAINT_PRIORITIES, COMPLAINT_STATUSES, JURISDICTION_TYPES, GOVERNMENT_DEPARTMENTS } = require("../config/constants");

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      default: "",
      trim: true,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    resolutionNotes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    resolutionImages: {
      type: [String],
      default: [],
    },
    responsibleDepartment: {
      type: String,
      enum: [...GOVERNMENT_DEPARTMENTS, ""],
      default: "",
      trim: true,
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

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
      minlength: [3, "Complaint title must be at least 3 characters long"],
      maxlength: [150, "Complaint title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
      minlength: [10, "Complaint description must be at least 10 characters long"],
    },
    category: {
      type: String,
      required: [true, "Complaint category is required"],
      trim: true,
    },
    subcategory: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Complaint subcategory cannot exceed 100 characters"],
    },
    priority: {
      type: String,
      enum: COMPLAINT_PRIORITIES,
      default: "Medium",
    },
    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      default: "Pending",
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Citizen reference is required"],
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    images: {
      type: [String],
      default: [],
    },
    responsibleDepartment: {
      type: String,
      enum: [...GOVERNMENT_DEPARTMENTS, ""],
      default: "",
      trim: true,
      index: true,
    },
    wardNumber: {
      type: String,
      default: "",
      trim: true,
      maxlength: [50, "Ward number cannot exceed 50 characters"],
    },
    citizenRemarks: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Citizen remarks cannot exceed 1000 characters"],
    },
    officerRemarks: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Officer remarks cannot exceed 1000 characters"],
    },
    resolutionNotes: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Resolution notes cannot exceed 2000 characters"],
    },
    resolutionImages: {
      type: [String],
      default: [],
    },
    location: {
      address: {
        type: String,
        default: "",
        trim: true,
      },
      landmark: {
        type: String,
        default: "",
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
      default: "Rural",
      index: true,
    },
    state: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    district: {
      type: String,
      trim: true,
      default: "",
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
    escalationStatus: {
      type: String,
      enum: ["Normal", "Escalated"],
      default: "Normal",
      index: true,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
    statusHistory: {
      type: [statusHistorySchema],
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

complaintSchema.index({ status: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ citizenId: 1 });
complaintSchema.index({ assignedOfficer: 1 });
complaintSchema.index({ responsibleDepartment: 1, status: 1, district: 1 });
complaintSchema.index({ category: 1, status: 1, priority: 1 });
complaintSchema.index({ title: "text", description: "text" });
complaintSchema.index({ state: 1, district: 1, tehsil: 1, village: 1, municipality: 1 });

module.exports = mongoose.model("Complaint", complaintSchema);

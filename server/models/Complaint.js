const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters long"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Complaint category is required"],
      trim: true,
      maxlength: [100, "Category cannot exceed 100 characters"],
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
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
    location: {
      address: {
        type: String,
        trim: true,
        default: "",
      },
      village: {
        type: String,
        trim: true,
        default: "",
      },
      district: {
        type: String,
        trim: true,
        default: "",
      },
      coordinates: {
        latitude: {
          type: Number,
          default: null,
        },
        longitude: {
          type: Number,
          default: null,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Complaint", complaintSchema);

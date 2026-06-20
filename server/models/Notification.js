const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    targetRoom: {
      type: String,
      index: true,
      default: null,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: ["Complaint", "Certificate", "Emergency", "Announcement", "Volunteer", "System"],
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    metadata: {
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      entityType: {
        type: String,
        enum: ["Complaint", "Certificate", "Emergency", "Announcement", "Volunteer", "User"],
        default: null,
      },
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    read: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      index: { expires: 0 }, // TTL Index: record expires at the specific Date in this field
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user inbox performance
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Index for room-based broadcast performance
notificationSchema.index({ targetRoom: 1, createdAt: -1 });

// Index for cleanup/audit by entity
notificationSchema.index({ "metadata.entityId": 1, "metadata.entityType": 1 });

module.exports = mongoose.model("Notification", notificationSchema);

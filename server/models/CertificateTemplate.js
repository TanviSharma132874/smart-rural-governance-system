const mongoose = require("mongoose");

const certificateTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fields: [
      {
        name: String,
        label: String,
        fieldType: { 
          type: String, 
          enum: ["text", "number", "date", "select", "textarea"],
          default: "text"
        },
        required: { type: Boolean, default: false },
        options: [String],
        placeholder: String,
      }
    ],
    requiredDocuments: [
      {
        category: {
          type: String,
          enum: ["Identity Proof", "Address Proof", "Income Proof", "Age Proof", "Medical Certificate", "Affidavit", "Previous Certificate", "Other"],
          required: true
        },
        label: String,
        mandatory: { type: Boolean, default: true },
      }
    ],
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CertificateTemplate", certificateTemplateSchema);

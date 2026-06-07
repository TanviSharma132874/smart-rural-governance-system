const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { GOVERNMENT_DEPARTMENTS, JURISDICTION_TYPES, USER_ROLES } = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    fatherName: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Father's name cannot exceed 100 characters"],
    },
    motherName: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Mother's name cannot exceed 100 characters"],
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
      trim: true,
    },
    aadhaarNumber: {
      type: String,
      default: "",
      trim: true,
      maxlength: [20, "Aadhaar number cannot exceed 20 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "citizen",
    },
    department: {
      type: String,
      enum: [...GOVERNMENT_DEPARTMENTS, ""],
      default: "",
      trim: true,
    },
    jurisdictionType: {
      type: String,
      enum: JURISDICTION_TYPES,
      default: "Rural",
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      default: "Rajasthan",
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
      maxlength: [250, "Address cannot exceed 250 characters"],
    },
    tehsil: {
      type: String,
      default: "",
      trim: true,
    },
    panchayat: {
      type: String,
      default: "",
      trim: true,
    },
    village: {
      type: String,
      default: "",
      trim: true,
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
    },
    municipality: {
      type: String,
      default: "",
      trim: true,
    },
    ward: {
      type: String,
      default: "",
      trim: true,
    },
    pincode: {
      type: String,
      default: "",
      trim: true,
      maxlength: [12, "Pincode cannot exceed 12 characters"],
    },
    occupation: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Occupation cannot exceed 100 characters"],
    },
    designation: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Designation cannot exceed 100 characters"],
    },
    employeeId: {
      type: String,
      default: "",
      trim: true,
      maxlength: [50, "Employee ID cannot exceed 50 characters"],
    },
    profileImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.path("village").validate(function validateVillage(value) {
  if (this.jurisdictionType === "Rural" && !value) {
    return false;
  }

  return true;
}, "Village is required for rural jurisdiction");

userSchema.path("municipality").validate(function validateMunicipality(value) {
  if (this.jurisdictionType === "Urban" && !value) {
    return false;
  }

  return true;
}, "Municipality is required for urban jurisdiction");

userSchema.pre("save", async function save(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);

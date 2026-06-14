const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/User");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const seedSuperAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is undefined. Check your .env file.");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    const email = "superadmin@governance.gov.in";
    const existing = await User.findOne({ email });

    if (existing) {
      console.log("Super Admin already exists. Skipping seed.");
      process.exit(0);
    }

    await User.create({
      name: "System Super Admin",
      email,
      password: "SuperSecretPassword123!", // Should be changed immediately
      role: "superAdmin",
      phone: "0000000000",
      aadhaarNumber: "000000000000",
      state: "Central",
      district: "System",
      jurisdictionType: "Urban",
      municipality: "Central System",
      designation: "System Administrator",
      employeeId: "SA-001",
    });

    console.log("Super Admin provisioned successfully.");
    console.log("Email: " + email);
    console.log("Password: SuperSecretPassword123!");
    
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedSuperAdmin();

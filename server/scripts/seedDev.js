const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/User");
const { DEFAULT_SUPER_ADMIN_EMAIL } = require("../config/constants");
const { seedTemplatesOnly } = require("./seedTemplates");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const users = [
  {
    name: "System Super Admin",
    email: DEFAULT_SUPER_ADMIN_EMAIL,
    password: "Welcome@123",
    role: "superAdmin",
    phone: "9000000001",
    aadhaarNumber: "100000000001",
    state: "Rajasthan",
    district: "Jaipur",
    jurisdictionType: "Urban",
    municipality: "Jaipur Central",
    designation: "System Administrator",
    employeeId: "SA-001",
    status: "Active",
  },
  {
    name: "State Administrator",
    email: "stateadmin@governance.gov.in",
    password: "Welcome@123",
    role: "stateAdmin",
    phone: "9000000002",
    aadhaarNumber: "100000000002",
    state: "Rajasthan",
    district: "Jaipur",
    jurisdictionType: "Urban",
    municipality: "Rajasthan State Secretariat",
    designation: "State Secretary",
    employeeId: "ST-001",
    status: "Active",
  },
  {
    name: "District Administrator",
    email: "districtadmin@governance.gov.in",
    password: "Welcome@123",
    role: "districtAdmin",
    phone: "9000000003",
    aadhaarNumber: "100000000003",
    state: "Rajasthan",
    district: "Jaipur",
    jurisdictionType: "Urban",
    municipality: "Jaipur Municipal Corporation",
    designation: "District Collector",
    employeeId: "DT-001",
    status: "Active",
  },
  {
    name: "Department Officer",
    email: "officer@governance.gov.in",
    password: "Welcome@123",
    role: "departmentOfficer",
    department: "Health & Medical Services",
    phone: "9000000004",
    aadhaarNumber: "100000000004",
    state: "Rajasthan",
    district: "Jaipur",
    jurisdictionType: "Urban",
    municipality: "Jaipur Municipal Corporation",
    designation: "Chief Medical Officer",
    employeeId: "DO-001",
    status: "Active",
  },
  {
    name: "Panchayat Officer",
    email: "panchayat@governance.gov.in",
    password: "Welcome@123",
    role: "panchayatOfficer",
    department: "Local Administration Department",
    phone: "9000000005",
    aadhaarNumber: "100000000005",
    state: "Rajasthan",
    district: "Jaipur",
    jurisdictionType: "Rural",
    tehsil: "Amber",
    panchayat: "Kukas",
    village: "Kukas",
    designation: "Gram Sevak",
    employeeId: "PO-001",
    status: "Active",
  },
  {
    name: "Demo Citizen",
    email: "citizen@example.com",
    password: "Welcome@123",
    role: "citizen",
    phone: "9000000006",
    aadhaarNumber: "100000000006",
    state: "Rajasthan",
    district: "Jaipur",
    jurisdictionType: "Rural",
    tehsil: "Amber",
    panchayat: "Kukas",
    village: "Kukas",
    address: "House No. 123, Main Street",
    pincode: "302028",
    status: "Active",
  },
  {
    name: "Demo Volunteer",
    email: "volunteer@example.com",
    password: "Welcome@123",
    role: "volunteer",
    phone: "9000000007",
    aadhaarNumber: "100000000007",
    state: "Rajasthan",
    district: "Jaipur",
    jurisdictionType: "Urban",
    municipality: "Jaipur Municipal Corporation",
    ward: "Ward 45",
    address: "Block B, Tech Park Area",
    pincode: "302001",
    status: "Active",
  },
];

const seedDevData = async () => {
  if (process.env.NODE_ENV === "production") {
    console.error("CRITICAL: Cannot run dev seed in production environment!");
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is undefined. Check your .env file.");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for dev seeding...");

    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`User ${userData.email} already exists. Skipping.`);
        continue;
      }
      await User.create(userData);
      console.log(`Provisioned ${userData.role}: ${userData.email}`);
    }

    console.log("\nProvisioning certificate templates...");
    await seedTemplatesOnly();

    console.log("\nDev seeding completed successfully.");
    console.log("Common Password: Welcome@123");
    
    process.exit(0);
  } catch (error) {
    console.error("Dev seeding failed:", error.message);
    process.exit(1);
  }
};

seedDevData();

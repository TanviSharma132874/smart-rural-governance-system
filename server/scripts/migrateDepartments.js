const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const User = require("../models/User");
const Complaint = require("../models/Complaint");
const Certificate = require("../models/Certificate");
const Emergency = require("../models/Emergency");
const Resource = require("../models/Resource");
const Announcement = require("../models/Announcement");

const DEPARTMENT_MAPPING = {
  "Health Department": "Health & Medical Services",
  "Police Department": "Police & Public Safety",
  "Fire Department": "Fire & Emergency Services",
  "Municipal Corporation": "Local Administration Department",
  "Panchayat Emergency Team": "Local Administration Department",
};

const migrateCollection = async (Model, fieldName, historyFieldName = null) => {
  console.log(`Migrating ${Model.modelName}...`);
  
  const entries = Object.entries(DEPARTMENT_MAPPING);
  let totalUpdated = 0;

  for (const [oldValue, newValue] of entries) {
    // Update main field
    const result = await Model.updateMany(
      { [fieldName]: oldValue },
      { $set: { [fieldName]: newValue } }
    );
    totalUpdated += result.modifiedCount;

    // Update history field if exists
    if (historyFieldName) {
      // Note: We use the historyFieldName provided (which is the name of the field INSIDE the array)
      const historyResult = await Model.updateMany(
        { [`statusHistory.${historyFieldName}`]: oldValue },
        { $set: { [`statusHistory.$[elem].${historyFieldName}`]: newValue } },
        { arrayFilters: [{ [`elem.${historyFieldName}`]: oldValue }] }
      );
      totalUpdated += historyResult.modifiedCount;
    }
  }

  console.log(`Finished ${Model.modelName}. Total updates: ${totalUpdated}`);
  return totalUpdated;
};

const runMigration = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/smart-rural-governance";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for migration.");

    let grandTotal = 0;

    // 1. Users
    grandTotal += await migrateCollection(User, "department");

    // 2. Complaints
    grandTotal += await migrateCollection(Complaint, "responsibleDepartment", "responsibleDepartment");

    // 3. Certificates
    grandTotal += await migrateCollection(Certificate, "department", "department");

    // 4. Emergencies
    grandTotal += await migrateCollection(Emergency, "assignedDepartment", "department");

    // 5. Resources
    grandTotal += await migrateCollection(Resource, "department");

    // 6. Announcements
    grandTotal += await migrateCollection(Announcement, "department");

    console.log(`\nMigration complete. Grand total of documents updated: ${grandTotal}`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();

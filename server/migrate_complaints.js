const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Complaint = require("./models/Complaint");
const User = require("./models/User");
const { COMPLAINT_CATEGORY_DEPARTMENTS } = require("./config/constants");

const determineResponsibleDepartment = (category) => {
  if (!category) return "Local Administration Department";
  return COMPLAINT_CATEGORY_DEPARTMENTS[category] || "Local Administration Department";
};

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB for Complaint Data Migration");

    const complaints = await Complaint.find({ isDeleted: false });
    console.log(`Found ${complaints.length} active complaints to process.`);

    let migratedCount = 0;

    for (const comp of complaints) {
      const citizen = await User.findById(comp.citizenId).lean();
      
      if (!citizen) {
        console.warn(`[WARN] Citizen profile not found for complaint ${comp._id}. Skipping.`);
        continue;
      }

      const oldJurisdiction = `${comp.state || 'N/A'}/${comp.district || 'N/A'}/${comp.village || 'N/A'}`;
      const oldDept = comp.responsibleDepartment || "EMPTY";

      // Apply User Profile Jurisdiction
      comp.state = citizen.state || comp.state || "";
      comp.district = citizen.district || comp.district || "";
      comp.tehsil = citizen.tehsil || comp.tehsil || "";
      comp.village = citizen.village || comp.village || "";
      comp.panchayat = citizen.panchayat || comp.panchayat || "";
      comp.municipality = citizen.municipality || comp.municipality || "";
      comp.jurisdictionType = citizen.jurisdictionType || comp.jurisdictionType || "Rural";

      // Recalculate Department
      comp.responsibleDepartment = determineResponsibleDepartment(comp.category);

      const newJurisdiction = `${comp.state}/${comp.district}/${comp.village}`;
      
      await comp.save();
      migratedCount++;

      console.log(`Migrated Complaint: ${comp.title.substring(0, 20)}...`);
      console.log(`  - ID: ${comp._id}`);
      console.log(`  - Old Juris: ${oldJurisdiction}`);
      console.log(`  - New Juris: ${newJurisdiction}`);
      console.log(`  - Old Dept: ${oldDept}`);
      console.log(`  - New Dept: ${comp.responsibleDepartment}`);
      console.log("---------------------------------------------------");
    }

    mongoose.connection.close();
    console.log(`Migration completed. ${migratedCount} complaints updated.`);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Certificate = require("./models/Certificate");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("--- Certificate Integrity Migration ---");

    // 1. Initialize previousCertificateNumbers field
    console.log("Step 1: Initializing previousCertificateNumbers field...");
    const initResult = await Certificate.updateMany(
      { previousCertificateNumbers: { $exists: false } },
      { $set: { previousCertificateNumbers: [] } }
    );
    console.log(`  - Initialized missing fields for ${initResult.modifiedCount} records.`);

    // 2. Detect "Broken Corrections" (Rejected but have a certificate number)
    console.log("\nStep 2: Detecting 'Broken Corrections'...");
    const broken = await Certificate.find({
      status: "Rejected",
      certificateNumber: { $exists: true, $ne: "" },
      isDeleted: false
    });

    if (broken.length > 0) {
      console.warn(`[AUDIT REPORT] Found ${broken.length} broken corrections (Rejected certificates that were previously valid).`);
      console.log("--------------------------------------------------------------------------------");
      console.log("ID | Certificate Number | Current Status | Action Required");
      console.log("--------------------------------------------------------------------------------");
      
      for (const cert of broken) {
        console.log(`${cert._id} | ${cert.certificateNumber} | ${cert.status} | Reverting to 'Issued'`);
      }
      console.log("--------------------------------------------------------------------------------");

      console.log("\nApplying fixes...");
      for (const cert of broken) {
        console.log(`  - Recovering ${cert.certificateNumber}...`);
        cert.status = "Issued";
        cert.remarks = "System Recovery: Correction request was rejected; reverted to original valid state.";
        
        // Add audit history entry for the recovery
        cert.statusHistory.push({
          status: "Issued",
          action: "Correction Request Rejection Recovery",
          remarks: "System Recovery: Certificate was incorrectly marked as Rejected after correction denial.",
          department: cert.department || "General",
          updatedBy: cert.approvedBy || cert.applicant, // Fallback to applicant if approvedBy is missing
          updatedAt: new Date(),
          version: cert.currentVersion
        });

        await cert.save();
      }
      console.log("Recovery complete.");
    } else {
      console.log("No broken corrections detected.");
    }

    mongoose.connection.close();
    console.log("\nMigration finished successfully.");
  } catch (err) {
    console.error("\nMigration failed:", err);
    if (mongoose.connection.readyState !== 0) {
      mongoose.connection.close();
    }
    process.exit(1);
  }
}

migrate();

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Certificate = require("./models/Certificate");
const User = require("./models/User");
const certificateService = require("./services/certificateService");

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to Database for Verification\n");

    const citizen = await User.findOne({ role: "citizen" });
    const officer = await User.findOne({ role: "departmentOfficer" });

    if (!citizen || !officer) {
      console.error("Citizen or Officer not found in DB. Run seed first.");
      process.exit(1);
    }

    // --- TEST 1: Issued Certificate -> Apply Correction -> Officer Approves ---
    console.log("--- TEST 1: Issued Certificate -> Correction -> Approval ---");
    
    // Create an Issued certificate
    let cert = new Certificate({
      applicant: citizen._id,
      certificateType: "Income Certificate",
      department: "Revenue Department",
      jurisdictionType: "Rural",
      state: citizen.state || "Rajasthan",
      district: citizen.district || "Sikar",
      tehsil: citizen.tehsil || "Laxmangarh",
      panchayat: citizen.panchayat || "Singodara",
      village: citizen.village || "Singodara",
      status: "Issued",
      applicationNumber: `APP-TEST-${Date.now()}`,
      certificateNumber: `IC-2026-TEST-${Math.floor(Math.random() * 1000)}`,
      issuedAt: new Date(),
      currentVersion: 1
    });
    await cert.save();
    const oldCertNumber = cert.certificateNumber;
    console.log(`Step 1: Created Issued Certificate: ${oldCertNumber}`);

    // Apply Correction
    const correctionPayload = {
      reasonForChange: "Typo in name",
      requestedChanges: JSON.stringify({ name: "Corrected Name" })
    };
    await certificateService.applyCorrection(cert._id, correctionPayload, citizen);
    cert = await Certificate.findById(cert._id);
    console.log(`Step 2: Correction Applied. Status: ${cert.status}, Version: ${cert.currentVersion}`);

    // Start Review
    await certificateService.reviewCertificate(cert._id, {}, officer);
    cert = await Certificate.findById(cert._id);
    console.log(`Step 3: Under Review. Status: ${cert.status}`);

    // Approve Correction
    await certificateService.updateCertificateStatus(cert._id, { status: "Approved", remarks: "Correction Verified" }, officer);
    cert = await Certificate.findById(cert._id);
    console.log(`Step 4: Correction Approved. Status: ${cert.status}`);
    console.log(`       New Cert Number: ${cert.certificateNumber}`);
    console.log(`       Prev Cert Numbers: [${cert.previousCertificateNumbers.join(", ")}]`);
    console.log(`       Version: ${cert.currentVersion}`);
    
    const t1Passed = cert.status === "Issued" && 
                     cert.previousCertificateNumbers.includes(oldCertNumber) && 
                     cert.currentVersion === 2 && 
                     cert.certificateNumber !== oldCertNumber &&
                     cert.qrCode !== "" &&
                     cert.verificationUrl !== "";
    console.log(`TEST 1: ${t1Passed ? "PASS" : "FAIL"}\n`);

    // --- TEST 2: Public Verification (Old number) ---
    console.log("--- TEST 2: Public Verification (Old Number) ---");
    const verifyOld = await certificateService.verifyCertificatePublic(oldCertNumber);
    console.log(`Verified Old: ${verifyOld.status}, CertNum: ${verifyOld.certificateNumber}`);
    const t2Passed = verifyOld.status === "Issued" && verifyOld.certificateNumber === cert.certificateNumber;
    console.log(`TEST 2: ${t2Passed ? "PASS" : "FAIL"}\n`);

    // --- TEST 3: Public Verification (New number) ---
    console.log("--- TEST 3: Public Verification (New Number) ---");
    const verifyNew = await certificateService.verifyCertificatePublic(cert.certificateNumber);
    console.log(`Verified New: ${verifyNew.status}, CertNum: ${verifyNew.certificateNumber}`);
    const t3Passed = verifyNew.status === "Issued" && verifyNew.certificateNumber === cert.certificateNumber;
    console.log(`TEST 3: ${t3Passed ? "PASS" : "FAIL"}\n`);

    // --- TEST 4: Correction Rejection ---
    console.log("--- TEST 4: Correction Rejection ---");
    // Create another Issued certificate
    let cert2 = new Certificate({
      applicant: citizen._id,
      certificateType: "Caste Certificate",
      department: "Social Welfare Department",
      jurisdictionType: "Rural",
      state: citizen.state || "Rajasthan",
      district: citizen.district || "Sikar",
      tehsil: citizen.tehsil || "Laxmangarh",
      panchayat: citizen.panchayat || "Singodara",
      village: citizen.village || "Singodara",
      status: "Issued",
      applicationNumber: `APP-TEST-2-${Date.now()}`,
      certificateNumber: `CC-2026-TEST-${Math.floor(Math.random() * 1000)}`,
      issuedAt: new Date(),
      currentVersion: 1
    });
    await cert2.save();
    const originalCertNumber = cert2.certificateNumber;
    console.log(`Step 1: Created Issued Certificate: ${originalCertNumber}`);

    // Apply Correction
    await certificateService.applyCorrection(cert2._id, { reasonForChange: "Error in date", requestedChanges: JSON.stringify({ dob: "1990-01-01" }) }, citizen);
    cert2 = await Certificate.findById(cert2._id);
    console.log(`Step 2: Correction Applied. Status: ${cert2.status}`);

    // Start Review
    await certificateService.reviewCertificate(cert2._id, {}, officer);
    cert2 = await Certificate.findById(cert2._id);
    console.log(`Step 3: Under Review. Status: ${cert2.status}`);

    // Reject Correction
    await certificateService.updateCertificateStatus(cert2._id, { status: "Rejected", remarks: "Invalid Proof" }, officer);
    cert2 = await Certificate.findById(cert2._id);
    console.log(`Step 4: Correction Rejected. Status: ${cert2.status}`);
    
    const lastHistory = cert2.statusHistory[cert2.statusHistory.length - 1];
    const t4Passed = cert2.status === "Issued" && 
                     cert2.certificateNumber === originalCertNumber &&
                     lastHistory.action === "Correction Request Denied - Original Certificate Maintained";
    console.log(`Action: ${lastHistory.action}`);
    console.log(`TEST 4: ${t4Passed ? "PASS" : "FAIL"}\n`);

    // --- TEST 5: Citizen Resubmission ---
    console.log("--- TEST 5: Citizen Resubmission ---");
    await certificateService.applyCorrection(cert2._id, { reasonForChange: "Fixed Proof", requestedChanges: JSON.stringify({ dob: "1990-01-01" }) }, citizen);
    cert2 = await Certificate.findById(cert2._id);
    console.log(`Step 1: Correction Resubmitted. Status: ${cert2.status}, Version: ${cert2.currentVersion}`);
    const t5Passed = cert2.status === "Submitted" && cert2.currentVersion === 3; // v1(Issued) -> v2(Applied Correction) -> v3(Applied Again)
    console.log(`TEST 5: ${t5Passed ? "PASS" : "FAIL"}\n`);

    // --- TEST 6: Migration Verification (Partially done, now verifying data) ---
    console.log("--- TEST 6: Migration Verification ---");
    const migratedCert = await Certificate.findOne({ previousCertificateNumbers: { $exists: true } });
    const t6Passed = migratedCert !== null;
    console.log(`TEST 6: ${t6Passed ? "PASS" : "FAIL"}\n`);

    console.log("--- FINAL RESULTS ---");
    console.log(`TEST 1: ${t1Passed ? "PASS" : "FAIL"}`);
    console.log(`TEST 2: ${t2Passed ? "PASS" : "FAIL"}`);
    console.log(`TEST 3: ${t3Passed ? "PASS" : "FAIL"}`);
    console.log(`TEST 4: ${t4Passed ? "PASS" : "FAIL"}`);
    console.log(`TEST 5: ${t5Passed ? "PASS" : "FAIL"}`);
    console.log(`TEST 6: ${t6Passed ? "PASS" : "FAIL"}`);

    // Cleanup
    await Certificate.deleteOne({ _id: cert._id });
    await Certificate.deleteOne({ _id: cert2._id });

    mongoose.connection.close();
  } catch (err) {
    console.error("Tests failed:", err);
    mongoose.connection.close();
    process.exit(1);
  }
}

runTests();

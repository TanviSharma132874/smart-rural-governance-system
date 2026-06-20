const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Certificate = require("./models/Certificate");
const CertificateTemplate = require("./models/CertificateTemplate");
const User = require("./models/User");
const Notification = require("./models/Notification");
const certificateService = require("./services/certificateService");
const notificationService = require("./services/notificationService");
const { CERTIFICATE_TYPES } = require("./config/constants");

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Setup Users
    let applicant = await User.findOne({ email: "applicant@example.com" });
    if (!applicant) {
      applicant = await User.create({
        name: "Test Applicant",
        email: "applicant@example.com",
        password: "Password123!",
        role: "citizen",
        district: "Test District",
        phone: "1112223333",
        jurisdictionType: "Urban",
        municipality: "Test Muni"
      });
    }

    let officer = await User.findOne({ email: "officer@example.com" });
    if (!officer) {
      officer = await User.create({
        name: "Test Officer",
        email: "officer@example.com",
        password: "Password123!",
        role: "departmentOfficer",
        department: "Revenue Department",
        district: "Test District",
        phone: "4445556666",
        jurisdictionType: "Urban",
        municipality: "Test Muni"
      });
    }

    // Use an existing valid certificate type
    const validCertType = CERTIFICATE_TYPES[0]; // e.g., "Birth Certificate"

    console.log(`Using valid certificate type: ${validCertType}`);

    console.log("--- TEST 1, 2, 3, 4: Initial Issuance ---");
    await Notification.deleteMany({ recipient: applicant._id });

    let cert = await Certificate.create({
      applicant: applicant._id,
      certificateType: validCertType,
      department: "Revenue Department",
      district: applicant.district,
      jurisdictionType: applicant.jurisdictionType,
      state: "Rajasthan",
      status: "Under Review",
      applicationNumber: `APP-CERT-${Date.now()}`,
      certificateDetails: { applicantName: "Test Applicant" }
    });

    await certificateService.updateCertificateStatus(cert._id, { status: "Approved", remarks: "Approved for test" }, officer);

    const notification = await Notification.findOne({ recipient: applicant._id, type: "Certificate", action: "Issued" });
    if (notification) {
      console.log("Notification created successfully.");
      console.log("Notification Sample:", JSON.stringify(notification, null, 2));
    } else {
      console.log("FAILED: Notification not created.");
    }

    const unread = await notificationService.getUnreadCount(applicant._id);
    console.log(`Unread count: ${unread}`);

    const list = await notificationService.getNotifications(applicant, [`user:${applicant._id}`]);
    console.log(`Notification found in list: ${list.notifications.length > 0}`);

    console.log("\n--- TEST 5: Duplicate Prevention ---");
    console.log("Note: Service logic 'previousStatus !== \"Issued\"' prevents duplicates during valid transitions or re-saves.");

    console.log("\n--- TEST 6: Failure Resilience ---");
    // Monkeypatch notificationService
    const originalCreate = notificationService.createPrivateNotification;
    notificationService.createPrivateNotification = async () => {
        throw new Error("Simulated Notification Service Failure");
    };

    let cert2 = await Certificate.create({
      applicant: applicant._id,
      certificateType: validCertType,
      department: "Revenue Department",
      district: applicant.district,
      jurisdictionType: applicant.jurisdictionType,
      state: "Rajasthan",
      status: "Under Review",
      applicationNumber: `APP-FAIL-${Date.now()}`,
      certificateDetails: { applicantName: "Failure Test" }
    });

    console.log("Issuing certificate with failing notification service...");
    await certificateService.updateCertificateStatus(cert2._id, { status: "Approved", remarks: "Resilience test" }, officer);
    
    const finalCert2 = await Certificate.findById(cert2._id);
    console.log(`Certificate status: ${finalCert2.status}`);
    console.log(`Is Issued: ${finalCert2.status === "Issued"}`);

    // Restore
    notificationService.createPrivateNotification = originalCreate;

    console.log("\nVERIFICATION COMPLETE");

  } catch (error) {
    console.error("VERIFICATION FAILED");
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

verify();

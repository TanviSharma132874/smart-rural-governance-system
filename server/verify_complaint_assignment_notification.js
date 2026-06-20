const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Complaint = require("./models/Complaint");
const User = require("./models/User");
const Notification = require("./models/Notification");
const complaintService = require("./services/complaintService");
const notificationService = require("./services/notificationService");
const { GOVERNMENT_DEPARTMENTS } = require("./config/constants");

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const jurisdiction = {
        district: "Assignment District",
        jurisdictionType: "Urban",
        municipality: "Assignment Municipality",
        state: "Rajasthan"
    };

    const validDept = GOVERNMENT_DEPARTMENTS[0]; // e.g., "Civil Registration Department"

    // 1. Setup Participants
    let citizen = await User.findOne({ email: "citizen_assign@example.com" });
    if (!citizen) {
      citizen = await User.create({
        name: "Assign Citizen",
        email: "citizen_assign@example.com",
        password: "Password123!",
        role: "citizen",
        phone: "1111111111",
        ...jurisdiction
      });
    }

    let officer1 = await User.findOne({ email: "officer1@example.com" });
    if (!officer1) {
      officer1 = await User.create({
        name: "Officer One",
        email: "officer1@example.com",
        password: "Password123!",
        role: "departmentOfficer",
        department: validDept,
        phone: "2222222222",
        ...jurisdiction
      });
    }

    let officer2 = await User.findOne({ email: "officer2@example.com" });
    if (!officer2) {
      officer2 = await User.create({
        name: "Officer Two",
        email: "officer2@example.com",
        password: "Password123!",
        role: "departmentOfficer",
        department: validDept,
        phone: "3333333333",
        ...jurisdiction
      });
    }

    let admin = await User.findOne({ role: "superAdmin" });

    // 2. Clear state
    await Notification.deleteMany({ recipient: { $in: [citizen._id, officer1._id, officer2._id] } });

    console.log("--- TEST 1: Initial Assignment ---");
    let complaint = await Complaint.create({
      title: "Broken Streetlight",
      description: "Streetlight not working near park",
      category: "Street Lights",
      priority: "Medium",
      citizenId: citizen._id,
      responsibleDepartment: validDept,
      status: "Pending",
      ...jurisdiction
    });

    await complaintService.assignComplaint(complaint._id, officer1._id, admin);
    
    const citizenNote1 = await Notification.findOne({ recipient: citizen._id, action: "Assigned" });
    const officer1Note1 = await Notification.findOne({ recipient: officer1._id, action: "Assigned" });
    
    console.log(`Citizen notified: ${!!citizenNote1}`);
    console.log(`Officer 1 notified: ${!!officer1Note1}`);
    if (citizenNote1) console.log("Citizen Note Sample:", JSON.stringify(citizenNote1, null, 2));
    if (officer1Note1) console.log("Officer Note Sample:", JSON.stringify(officer1Note1, null, 2));

    console.log("\n--- TEST 2: Reassignment to Different Officer ---");
    await Notification.deleteMany({ recipient: { $in: [citizen._id, officer1._id, officer2._id] } });
    await complaintService.assignComplaint(complaint._id, officer2._id, admin);

    const citizenNote2 = await Notification.findOne({ recipient: citizen._id, action: "Assigned" });
    const officer1Note2 = await Notification.findOne({ recipient: officer1._id, action: "Assigned" });
    const officer2Note2 = await Notification.findOne({ recipient: officer2._id, action: "Assigned" });

    console.log(`Citizen notified of change: ${!!citizenNote2}`);
    console.log(`Old Officer notified: ${!!officer1Note2}`);
    console.log(`New Officer notified: ${!!officer2Note2}`);

    console.log("\n--- TEST 3: Assign to Same Officer (Duplicate Protection) ---");
    await Notification.deleteMany({ recipient: { $in: [citizen._id, officer1._id, officer2._id] } });
    await complaintService.assignComplaint(complaint._id, officer2._id, admin);

    const citizenNote3 = await Notification.findOne({ recipient: citizen._id, action: "Assigned" });
    const officer2Note3 = await Notification.findOne({ recipient: officer2._id, action: "Assigned" });

    console.log(`Citizen notified: ${!!citizenNote3}`);
    console.log(`Officer 2 notified again (Should be false): ${!!officer2Note3}`);

    console.log("\n--- TEST 5: Failure Resilience ---");
    const originalCreate = notificationService.createPrivateNotification;
    notificationService.createPrivateNotification = async () => {
        throw new Error("Simulated Notification Failure");
    };

    let complaint2 = await Complaint.create({
        title: "Pothole",
        description: "Big pothole on main road",
        category: "Roads",
        citizenId: citizen._id,
        responsibleDepartment: validDept,
        status: "Pending",
        ...jurisdiction
    });

    console.log("Assigning with failing notification service...");
    await complaintService.assignComplaint(complaint2._id, officer1._id, admin);
    const finalComplaint2 = await Complaint.findById(complaint2._id);
    console.log(`Assigned Officer in DB: ${finalComplaint2.assignedOfficer}`);
    console.log(`Assignment Succeeded: ${finalComplaint2.assignedOfficer.toString() === officer1._id.toString()}`);

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

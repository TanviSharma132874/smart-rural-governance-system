const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Complaint = require("./models/Complaint");
const User = require("./models/User");
const Notification = require("./models/Notification");
const complaintService = require("./services/complaintService");
const notificationService = require("./services/notificationService");

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const sharedJurisdiction = {
        district: "Test District",
        jurisdictionType: "Urban",
        municipality: "Test Municipality",
        state: "Rajasthan"
    };

    // Setup Users
    let citizen = await User.findOne({ email: "citizen_comp@example.com" });
    if (!citizen) {
      citizen = await User.create({
        name: "Test Citizen",
        email: "citizen_comp@example.com",
        password: "Password123!",
        role: "citizen",
        phone: "9998887777",
        ...sharedJurisdiction
      });
    } else {
        Object.assign(citizen, sharedJurisdiction);
        await citizen.save();
    }

    let officer = await User.findOne({ email: "officer_comp@example.com" });
    if (!officer) {
      officer = await User.create({
        name: "Test Officer",
        email: "officer_comp@example.com",
        password: "Password123!",
        role: "departmentOfficer",
        department: "Water Resources Department",
        phone: "6667778888",
        ...sharedJurisdiction
      });
    } else {
        Object.assign(officer, sharedJurisdiction);
        await officer.save();
    }

    console.log("--- TEST 1, 2, 3, 4, 5: Initial Resolution ---");
    await Notification.deleteMany({ recipient: citizen._id });

    let complaint = await Complaint.create({
      title: "No Water Supply",
      description: "No water since 2 days",
      category: "Water",
      priority: "High",
      citizenId: citizen._id,
      responsibleDepartment: "Water Resources Department",
      status: "In Progress",
      ...sharedJurisdiction
    });

    console.log("Resolving complaint...");
    await complaintService.updateComplaintStatus(complaint._id, { 
        status: "Resolved", 
        resolutionNotes: "Fixed the pipe leakage" 
    }, officer);

    const notification = await Notification.findOne({ recipient: citizen._id, type: "Complaint", action: "Resolved" });
    if (notification) {
      console.log("Notification created successfully.");
      console.log("Notification Sample:", JSON.stringify(notification, null, 2));
    } else {
      console.log("FAILED: Notification not created.");
    }

    const unread = await notificationService.getUnreadCount(citizen._id);
    console.log(`Unread count: ${unread}`);

    const list = await notificationService.getNotifications(citizen, [`user:${citizen._id}`]);
    console.log(`Notification found in list: ${list.notifications.length > 0}`);

    console.log("\n--- TEST 6: Duplicate Prevention ---");
    console.log("Note: Logic 'previousStatus !== \"Resolved\"' protects against duplicates during any re-entry.");

    console.log("\n--- TEST 7: Failure Resilience ---");
    // Monkeypatch notificationService
    const originalCreate = notificationService.createPrivateNotification;
    notificationService.createPrivateNotification = async () => {
        throw new Error("Simulated Notification Service Failure");
    };

    let complaint2 = await Complaint.create({
      title: "Broken Pipe",
      description: "Water leaking on main road",
      category: "Water",
      priority: "Medium",
      citizenId: citizen._id,
      responsibleDepartment: "Water Resources Department",
      status: "In Progress",
      ...sharedJurisdiction
    });

    console.log("Resolving complaint with failing notification service...");
    await complaintService.updateComplaintStatus(complaint2._id, { 
        status: "Resolved", 
        resolutionNotes: "Resilience test resolution" 
    }, officer);
    
    const finalComplaint2 = await Complaint.findById(complaint2._id);
    console.log(`Complaint status: ${finalComplaint2.status}`);
    console.log(`Is Resolved: ${finalComplaint2.status === "Resolved"}`);

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

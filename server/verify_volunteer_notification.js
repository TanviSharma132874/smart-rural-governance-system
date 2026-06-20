const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Volunteer = require("./models/Volunteer");
const User = require("./models/User");
const Notification = require("./models/Notification");
const volunteerService = require("./services/volunteerService");
const notificationService = require("./services/notificationService");

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. Find or create a user and a volunteer profile
    let testUser = await User.findOne({ email: "test_volunteer@example.com" });
    if (!testUser) {
      testUser = await User.create({
        name: "Test Volunteer",
        email: "test_volunteer@example.com",
        password: "Password123!",
        role: "citizen",
        district: "Test District",
        phone: "1234567890",
        jurisdictionType: "Urban",
        municipality: "Test Municipality"
      });
    }

    let adminUser = await User.findOne({ email: "admin@governance.gov.in" });
    if (!adminUser) {
       adminUser = await User.create({
        name: "Admin User",
        email: "admin@governance.gov.in",
        password: "Password123!",
        role: "superAdmin",
        district: "Test District",
        phone: "0987654321",
        jurisdictionType: "Urban",
        municipality: "Test Municipality"
      });
    }

    let volunteer = await Volunteer.findOne({ user: testUser._id });
    if (!volunteer) {
      volunteer = await Volunteer.create({
        user: testUser._id,
        name: testUser.name,
        phone: testUser.phone,
        district: "Test District",
        skills: ["Rescue"],
        approvalStatus: "Pending"
      });
    } else {
        // Reset status for test
        volunteer.approvalStatus = "Pending";
        await volunteer.save();
    }

    console.log(`Volunteer ID: ${volunteer._id}`);
    console.log(`Recipient User ID: ${testUser._id}`);

    // 2. Clear previous notifications for this user to have a clean count
    await Notification.deleteMany({ recipient: testUser._id });

    // 3. Approve the volunteer
    console.log("Approving volunteer...");
    await volunteerService.approveVolunteer(volunteer._id, { approvalStatus: "Approved" }, { id: adminUser._id, role: adminUser.role });

    // 4. Verify Notification Document
    const notification = await Notification.findOne({ recipient: testUser._id, type: "Volunteer" });
    if (!notification) {
      throw new Error("Notification document was NOT created");
    }
    console.log("Notification Document Sample:", JSON.stringify(notification, null, 2));

    // 5. Verify Unread Count
    const unreadCount = await notificationService.getUnreadCount(testUser._id);
    console.log(`Unread Count: ${unreadCount}`);

    // 6. Verify List Retrieval
    const result = await notificationService.getNotifications({ id: testUser._id }, [`user:${testUser._id}`]);
    console.log("API List Response Sample (Data):", JSON.stringify(result.notifications, null, 2));

    console.log("\nVERIFICATION RESULT: PASS");

  } catch (error) {
    console.error("VERIFICATION RESULT: FAIL");
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

verify();

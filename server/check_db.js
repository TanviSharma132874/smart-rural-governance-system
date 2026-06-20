const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const Complaint = require("./models/Complaint");

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const complaintsCount = await Complaint.countDocuments({ isDeleted: false });
    console.log("Total Complaints:", complaintsCount);

    const sampleComplaint = await Complaint.findOne({ isDeleted: false });
    console.log("Sample Complaint:", JSON.stringify(sampleComplaint, null, 2));

    const officer = await User.findOne({ role: { $ne: "citizen" } });
    console.log("Sample Officer:", JSON.stringify(officer, null, 2));

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

check();

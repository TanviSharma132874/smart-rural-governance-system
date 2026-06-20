const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Complaint = require("./models/Complaint");
const User = require("./models/User");

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const all = await Complaint.find({ isDeleted: false }).lean();
    console.log("Detailed DB Scan:");
    all.forEach(c => {
      console.log(`ID: ${c._id}, State: '${c.state}', Dist: '${c.district}', Village: '${c.village}', Dept: '${c.responsibleDepartment}'`);
    });

    const officers = await User.find({ role: { $in: ["panchayatOfficer", "departmentOfficer"] } }).lean();
    console.log("\nOfficer Profiles:");
    officers.forEach(o => {
      console.log(`Role: ${o.role}, Name: ${o.name}, Dept: '${o.department}', State: '${o.state}', Dist: '${o.district}', Village: '${o.village}'`);
    });

    mongoose.connection.close();
  } catch (err) { console.error(err); }
}

check();

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Complaint = require("./server/models/Complaint");

dotenv.config({ path: path.resolve(__dirname, "server/.env") });

const checkComplaints = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await Complaint.countDocuments({ isDeleted: false });
    const complaints = await Complaint.find({ isDeleted: false }).limit(5);
    
    console.log(`Total Complaints (non-deleted): ${count}`);
    complaints.forEach(c => {
      console.log(`- ${c.title} | Status: ${c.status} | Dept: ${c.responsibleDepartment} | Dist: ${c.district} | Vill: ${c.village} | Mun: ${c.municipality}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkComplaints();

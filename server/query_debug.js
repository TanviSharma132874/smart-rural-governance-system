const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Complaint = require("./models/Complaint");
const User = require("./models/User");
const complaintService = require("./services/complaintService");

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const meena = await User.findOne({ name: "Meena Rathore", role: "panchayatOfficer" }).lean();
    const comp = await Complaint.findOne({ village: "Hingona" }).lean();

    console.log("Officer:", { name: meena.name, state: meena.state, dist: meena.district, village: meena.village, jType: meena.jurisdictionType });
    console.log("Complaint:", { id: comp._id, state: comp.state, dist: comp.district, village: comp.village, jType: comp.jurisdictionType });

    // Mock query building
    const query = { isDeleted: false };
    if (meena.state) query.state = meena.state;
    if (meena.district) query.district = meena.district;
    if (meena.jurisdictionType) query.jurisdictionType = meena.jurisdictionType;
    if (meena.village) query.village = meena.village;

    console.log("Generated Query:", query);
    const count = await Complaint.countDocuments(query);
    console.log("Count for this query:", count);

    mongoose.connection.close();
  } catch (err) { console.error(err); }
}

debug();

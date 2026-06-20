const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Complaint = require("./models/Complaint");
const User = require("./models/User");
const complaintService = require("./services/complaintService");

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const all = await Complaint.find({ isDeleted: false }).lean();
    console.log("A. Total Complaints:", all.length);

    const empty = {
      state: all.filter(c => !c.state).length,
      district: all.filter(c => !c.district).length,
      tehsil: all.filter(c => !c.tehsil).length,
      panchayat: all.filter(c => !c.panchayat).length,
      village: all.filter(c => !c.village).length,
    };
    console.log("B. Empty Counts:", JSON.stringify(empty, null, 2));

    // Targeted Simulation: Meena Rathore (Panchayat Officer for Hingona)
    const meena = await User.findOne({ name: "Meena Rathore", role: "panchayatOfficer" }).lean();
    if (meena) {
        console.log(`\nSimulation: ${meena.name} (Panchayat Officer, Hingona/Jaipur/Rajasthan)`);
        const result = await complaintService.getComplaints(meena, { page: 1, limit: 10 });
        console.log("- All Cases Visible:", result.pagination.totalComplaints);
        console.log("- Records Match Location:", result.complaints.every(c => c.village === "Hingona"));
    }

    // Targeted Simulation: Anita Sharma (Revenue Department Officer)
    const anita = await User.findOne({ name: "Anita Sharma", role: "departmentOfficer" }).lean();
    if (anita) {
        console.log(`\nSimulation: ${anita.name} (Dept Officer, ${anita.department}, Hingona)`);
        const result = await complaintService.getComplaints(anita, { page: 1, limit: 10 });
        console.log("- Cases Assigned to Dept:", result.pagination.totalComplaints);
    }

    mongoose.connection.close();
  } catch (err) { console.error(err); }
}

verify();

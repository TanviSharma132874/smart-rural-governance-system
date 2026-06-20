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
    
    // Select the Officer for Hingona specifically
    const hingonaOfficer = await User.findOne({ village: "Hingona", role: "panchayatOfficer" }).lean();
    if (!hingonaOfficer) {
        console.error("Critical: Could not find Hingona Panchayat Officer in DB");
        return;
    }

    console.log(`\nVerified Simulation: ${hingonaOfficer.name} (Panchayat Officer)`);
    console.log(`Targeting: ${hingonaOfficer.state} / ${hingonaOfficer.district} / ${hingonaOfficer.village}`);

    const result = await complaintService.getComplaints(hingonaOfficer, { page: 1, limit: 10 });
    console.log("- Total Complaints Found:", result.pagination.totalComplaints);
    
    result.complaints.forEach(c => {
        console.log(`  * [${c.status}] ${c.title} (Dept: ${c.responsibleDepartment})`);
    });

    // Select the Department Officer (Anita)
    const anita = await User.findOne({ name: "Anita Sharma", role: "departmentOfficer" }).lean();
    console.log(`\nVerified Simulation: ${anita.name} (Dept Officer, ${anita.department})`);
    
    const dResult = await complaintService.getComplaints(anita, { page: 1, limit: 10 });
    console.log("- Complaints in Anita's Queue:", dResult.pagination.totalComplaints);

    mongoose.connection.close();
  } catch (err) { console.error(err); }
}

verify();

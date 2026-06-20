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

    // Simulation Setup
    const sampleOfficer = await User.findOne({ role: "panchayatOfficer" }).lean();
    const sampleDeptOfficer = await User.findOne({ role: "departmentOfficer" }).lean();

    if (sampleOfficer) {
        const pUser = { 
            id: sampleOfficer._id, 
            role: sampleOfficer.role, 
            state: sampleOfficer.state, 
            district: sampleOfficer.district, 
            tehsil: sampleOfficer.tehsil, 
            village: sampleOfficer.village,
            jurisdictionType: sampleOfficer.jurisdictionType 
        };
        const pResult = await complaintService.getComplaints(pUser, { page: 1, limit: 10 });
        const pReview = await complaintService.getComplaints(pUser, { status: "Pending", page: 1, limit: 10 });
        console.log("C. Panchayat Officer (", sampleOfficer.name, ") Simulation:");
        console.log("- All Cases:", pResult.pagination.totalComplaints);
        console.log("- Review Queue (Pending):", pReview.pagination.totalComplaints);
    } else {
        console.log("C. Panchayat Officer simulation skipped (No user found)");
    }

    if (sampleDeptOfficer) {
        const dUser = { 
            id: sampleDeptOfficer._id, 
            role: sampleDeptOfficer.role, 
            department: sampleDeptOfficer.department,
            state: sampleDeptOfficer.state, 
            district: sampleDeptOfficer.district, 
            tehsil: sampleDeptOfficer.tehsil, 
            jurisdictionType: sampleDeptOfficer.jurisdictionType 
        };
        const dResult = await complaintService.getComplaints(dUser, { page: 1, limit: 10 });
        const dReso = await complaintService.getComplaints(dUser, { status: "Reviewed", page: 1, limit: 10 });
        console.log("D. Department Officer (", sampleDeptOfficer.name, ") Simulation:");
        console.log("- All Cases:", dResult.pagination.totalComplaints);
        console.log("- Resolution Queue (Reviewed):", dReso.pagination.totalComplaints);
    } else {
        console.log("D. Department Officer simulation skipped (No user found)");
    }

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

verify();

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Certificate = require("./models/User").modelName === 'User' ? require("./models/Certificate") : require("./models/Certificate");

async function audit() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB for QR Audit");

    const all = await Certificate.find({ isDeleted: false }).lean();
    
    const missingNumber = all.filter(c => c.status === "Issued" && (!c.certificateNumber || c.certificateNumber === "N/A"));
    const usingIdInUrl = all.filter(c => c.verificationUrl && c.verificationUrl.includes("/verify/certificate/") && !c.verificationUrl.includes(c.certificateNumber));
    const issued = all.filter(c => c.status === "Issued");

    console.log("Audit Results:");
    console.log("- Total Certificates:", all.length);
    console.log("- Issued Certificates:", issued.length);
    console.log("- Missing Certificate Number (Issued):", missingNumber.length);
    console.log("- Verification URL using MongoDB ID:", usingIdInUrl.length);
    
    usingIdInUrl.forEach(c => {
      console.log(`  * ID: ${c._id}, Num: ${c.certificateNumber}, URL: ${c.verificationUrl}`);
    });

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

audit();

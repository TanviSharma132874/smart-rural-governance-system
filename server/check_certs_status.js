const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Certificate = require("./models/Certificate");

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const certificates = await Certificate.find({ isDeleted: false }).lean();
    console.log(`Found ${certificates.length} certificates`);

    certificates.forEach(c => {
      console.log(`- ID: ${c._id}, Type: ${c.certificateType}, Number: ${c.certificateNumber || 'N/A'}, Status: ${c.status}, VerificationURL: ${c.verificationUrl || 'N/A'}`);
    });

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

check();

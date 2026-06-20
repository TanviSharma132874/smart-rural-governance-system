const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Certificate = require("./models/Certificate");
const Counter = require("./models/Counter");

const nextCertificateNumber = async (type) => {
  const code = type.split(" ").map(w => w[0]).join("").toUpperCase();
  const counter = await Counter.findOneAndUpdate(
    { key: `CERT-NUM-${code}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  return `${code}-${new Date().getFullYear()}-${String(counter.sequence).padStart(6, "0")}`;
};

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB for migration");

    const certificates = await Certificate.find({ 
      status: "Issued", 
      certificateNumber: { $in: [null, "", "N/A"] },
      isDeleted: false 
    });

    console.log(`Found ${certificates.length} issued certificates missing numbers`);

    for (const cert of certificates) {
      const number = await nextCertificateNumber(cert.certificateType);
      cert.certificateNumber = number;
      await cert.save();
      console.log(`Updated Certificate ${cert._id} with number ${number}`);
    }

    mongoose.connection.close();
    console.log("Migration completed");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrate();

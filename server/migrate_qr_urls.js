const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Certificate = require("./models/Certificate");
const { generateCertificateVerificationAssets } = require("./services/qrCodeService");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB for QR Migration");

    const certificates = await Certificate.find({ 
      status: "Issued", 
      isDeleted: false 
    });

    console.log(`Found ${certificates.length} issued certificates to migrate.`);

    for (const cert of certificates) {
      const oldUrl = cert.verificationUrl;
      
      // Regenerate assets using the existing certificateNumber
      const { qrCode, verificationUrl } = await generateCertificateVerificationAssets({
        certificateNumber: cert.certificateNumber
      });

      cert.verificationUrl = verificationUrl;
      cert.qrCode = qrCode;

      await cert.save();
      
      console.log(`Migrated ${cert.certificateNumber}:`);
      console.log(`  - Old URL: ${oldUrl}`);
      console.log(`  - New URL: ${verificationUrl}`);
    }

    mongoose.connection.close();
    console.log("QR Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();

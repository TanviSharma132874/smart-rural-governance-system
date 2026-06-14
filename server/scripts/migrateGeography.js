const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const { LOCATION_HIERARCHY } = require("../config/locationRegistry");

const State = require("../models/State");
const District = require("../models/District");
const Tehsil = require("../models/Tehsil");
const Panchayat = require("../models/Panchayat");
const Village = require("../models/Village");
const Municipality = require("../models/Municipality");
const Ward = require("../models/Ward");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI is undefined.");

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for geographic migration...");

    for (const [stateName, districts] of Object.entries(LOCATION_HIERARCHY)) {
      const state = await State.findOneAndUpdate(
        { name: stateName },
        { name: stateName, code: stateName.substring(0, 2).toUpperCase() },
        { upsert: true, new: true }
      );
      console.log(`Migrated State: ${stateName}`);

      for (const [districtName, districtData] of Object.entries(districts)) {
        const district = await District.findOneAndUpdate(
          { name: districtName, stateId: state._id },
          { name: districtName, code: districtName.substring(0, 3).toUpperCase(), stateId: state._id },
          { upsert: true, new: true }
        );
        console.log(`  Migrated District: ${districtName}`);

        if (districtData.Tehsils) {
          for (const [tehsilName, tehsilData] of Object.entries(districtData.Tehsils)) {
            const tehsil = await Tehsil.findOneAndUpdate(
              { name: tehsilName, districtId: district._id },
              { name: tehsilName, districtId: district._id },
              { upsert: true, new: true }
            );
            console.log(`    Migrated Tehsil: ${tehsilName}`);

            if (tehsilData.type === "Rural") {
              if (tehsilData.Panchayats) {
                for (const panchayatName of tehsilData.Panchayats) {
                  const panchayat = await Panchayat.findOneAndUpdate(
                    { name: panchayatName, tehsilId: tehsil._id },
                    { name: panchayatName, tehsilId: tehsil._id },
                    { upsert: true, new: true }
                  );
                  console.log(`      Migrated Panchayat: ${panchayatName}`);

                  if (tehsilData.Villages) {
                    for (const villageName of tehsilData.Villages) {
                      await Village.findOneAndUpdate(
                        { name: villageName, panchayatId: panchayat._id },
                        { name: villageName, panchayatId: panchayat._id },
                        { upsert: true, new: true }
                      );
                    }
                  }
                }
              }
            } else if (tehsilData.type === "Urban") {
              if (tehsilData.Municipalities) {
                for (const municipalityName of tehsilData.Municipalities) {
                  const municipality = await Municipality.findOneAndUpdate(
                    { name: municipalityName, districtId: district._id },
                    { name: municipalityName, districtId: district._id },
                    { upsert: true, new: true }
                  );
                  console.log(`      Migrated Municipality: ${municipalityName}`);

                  if (tehsilData.Wards) {
                    for (const wardName of tehsilData.Wards) {
                      await Ward.findOneAndUpdate(
                        { name: wardName, municipalityId: municipality._id },
                        { name: wardName, municipalityId: municipality._id },
                        { upsert: true, new: true }
                      );
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log("Geographic migration completed.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
};

migrate();

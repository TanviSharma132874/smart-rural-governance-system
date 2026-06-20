const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const citizen = await User.findById("6a1fcf37ef5b6a9365d8cb6c");
    console.log("Citizen Profile:", JSON.stringify(citizen, null, 2));

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

check();

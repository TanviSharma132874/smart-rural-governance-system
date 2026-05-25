const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI?.trim();

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    if (error.message?.toLowerCase().includes("authentication failed")) {
      throw new Error(
        "MongoDB authentication failed. Check the Atlas database username/password and confirm that the user exists for this cluster."
      );
    }

    throw error;
  }
};

module.exports = connectDB;

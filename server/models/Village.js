const mongoose = require("mongoose");

const villageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  panchayatId: { type: mongoose.Schema.Types.ObjectId, ref: "Panchayat", required: true },
});

villageSchema.index({ name: 1, panchayatId: 1 }, { unique: true });

module.exports = mongoose.model("Village", villageSchema);

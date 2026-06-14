const mongoose = require("mongoose");

const municipalitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: "District", required: true },
});

municipalitySchema.index({ name: 1, districtId: 1 }, { unique: true });

module.exports = mongoose.model("Municipality", municipalitySchema);

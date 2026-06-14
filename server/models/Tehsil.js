const mongoose = require("mongoose");

const tehsilSchema = new mongoose.Schema({
  name: { type: String, required: true },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: "District", required: true },
});

tehsilSchema.index({ name: 1, districtId: 1 }, { unique: true });

module.exports = mongoose.model("Tehsil", tehsilSchema);

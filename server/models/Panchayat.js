const mongoose = require("mongoose");

const panchayatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tehsilId: { type: mongoose.Schema.Types.ObjectId, ref: "Tehsil", required: true },
});

panchayatSchema.index({ name: 1, tehsilId: 1 }, { unique: true });

module.exports = mongoose.model("Panchayat", panchayatSchema);

const mongoose = require("mongoose");

const districtSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: "State", required: true },
});

districtSchema.index({ name: 1, stateId: 1 }, { unique: true });

module.exports = mongoose.model("District", districtSchema);

const mongoose = require("mongoose");

const wardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  municipalityId: { type: mongoose.Schema.Types.ObjectId, ref: "Municipality", required: true },
});

wardSchema.index({ name: 1, municipalityId: 1 }, { unique: true });

module.exports = mongoose.model("Ward", wardSchema);

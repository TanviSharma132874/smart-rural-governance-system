const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true },
});

module.exports = mongoose.model("State", stateSchema);

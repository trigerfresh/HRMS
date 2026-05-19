// models/Charge.js
const mongoose = require("mongoose");

const chargeSchema = new mongoose.Schema({
  chargesType: {
    type: String,
    required: true,
  },
  labelToDisplay: {
    type: String,
  },
  active: { type: Number, default: 0 },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  created_on: { type: Date, default: Date.now },
  modified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  modified_on: { type: Date },
  disabled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  disabled_on: { type: Date },
});

module.exports = mongoose.model("Charge", chargeSchema);

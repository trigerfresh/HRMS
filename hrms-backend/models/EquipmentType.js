const mongoose = require("mongoose");

const EquipmentTypeSchema = new mongoose.Schema({
  equipmentType: { type: String, required: true, unique: true },
  rate: { type: Number },
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

module.exports = mongoose.model("EquipmentType", EquipmentTypeSchema);

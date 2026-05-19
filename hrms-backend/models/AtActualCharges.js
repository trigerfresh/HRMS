const mongoose = require("mongoose");

const AtActualChargesSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SiteDetail",
    required: true,
  },
  clientCode: { type: String, required: true },
  attendanceMonth: { type: String },
  attendanceYear: { type: String },
  attendanceType: {
    type: String,
  },
  typeOfServ: { type: String },
  totalNos: { type: String },
  costPerHead: { type: String },
  total: { type: String },
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

module.exports = mongoose.model("AtActualCharges", AtActualChargesSchema);

const mongoose = require("mongoose");

const ChargesByRankSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SiteDetail",
  },
  empType: { type: String },
  hours: { type: Number, default: 0 },
  nos: { type: Number, default: 0 },
  basic: { type: Number, default: 0 },
  hra: { type: Number, default: 0 },
  da: { type: Number, default: 0 },
  specialAllowance: { type: Number, default: 0 },
  otherAllowance: { type: Number, default: 0 },
  lww: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  costPerHeadGross: { type: Number, default: 0 },
  serviceChargesType: { type: String },
  serviceCharges: { type: Number, default: 0 },
  perDayRate: { type: Number, default: 0 },
  otRate: { type: Number, default: 0 },
  leaveWages: { type: Number, default: 0 },
  uniformWashing: { type: Number, default: 0 },
  anyOther: { type: Number, default: 0 },
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

module.exports = mongoose.model("ChargesByRank", ChargesByRankSchema);

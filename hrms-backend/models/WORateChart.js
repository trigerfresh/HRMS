const mongoose = require("mongoose");

const WORateChartSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
  },
  woType: { type: String },
  size: { type: Number },
  fromWt: { type: String },
  toWt: { type: String },
  type: { type: String },
  equipmentType: { type: String },
  examPer: { type: Number },
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

module.exports = mongoose.model("WORateChart", WORateChartSchema);

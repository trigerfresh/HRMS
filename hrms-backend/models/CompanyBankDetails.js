const mongoose = require("mongoose");

const CompanyBankDetailsSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  bankName: { type: String, required: true },
  accountNo: { type: String, required: true },
  accountType: { type: String },
  branchCity: { type: String },
  address: { type: String },
  swift: { type: String },
  micr: { type: String },
  ifsc: { type: String },
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

module.exports = mongoose.model("CompanyBankDetails", CompanyBankDetailsSchema);

const mongoose = require("mongoose");

const VendorsMasterSchema = new mongoose.Schema({
  vendorName: { type: String, required: true },
  emailId: { type: String, unique: true },
  contactNo: { type: Number },
  address: { type: String },
  state: { type: String },
  stateCode: { type: String },
  contactablePersonName: { type: String },
  contactablePersonPanNo: { type: String },
  gstNo: { type: String },
  accountNo: { type: String },
  bankName: { type: String },
  ifscCode: { type: String },
  branchName: { type: String },
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

module.exports = mongoose.model("VendorsMaster", VendorsMasterSchema);

const mongoose = require("mongoose");

const BankDetailSchema = new mongoose.Schema(
  {
    bankName: String,
    accountNo: String,
    ifscCode: String,
    branch: String,
    city: String, // This will be `bankCity` from frontend
    micrCode: String,
  },
  { _id: false }
);

const ClientSchema = new mongoose.Schema(
  {
    // Main Details
    companyName: { type: String, required: true, unique: true },
    contactPersonName: { type: String },
    contactNo: { type: String },
    emailId: { type: String, required: true, unique: true },
    address: { type: String }, // Main client address
    city: { type: String }, // Main client city
    state: { type: String }, // Main client state
    pincode: { type: String },
    gstStateCode: { type: String },
    gstNo: { type: String },
    sacCode: { type: String },
    billingCompany: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    companyBankName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyBankDetails",
    },
    otherInfo: { type: String },
    termsAndConditions: { type: String },
    bankDetails: BankDetailSchema,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", ClientSchema);

// models/Bill.js
const mongoose = require("mongoose");

const BillSchema = new mongoose.Schema(
  {
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
    invoiceNo: { type: String, unique: true },
    invoiceDate: { type: Date },
    invoiceMonth: { type: Number },
    invoiceYear: { type: Number },
    invoiceFrom: { type: Date },
    invoiceTo: { type: Date },
    autoNo: { type: Number },
    totalNos: { type: Number },
    totalCostWithoutGST: { type: Number },
    cgst: { type: Number },
    cgstPerc: { type: Number },
    sgst: { type: Number },
    sgstPerc: { type: Number },
    igst: { type: Number },
    igstPerc: { type: Number },
    finalAmount: { type: Number },
    status: { type: String },
    costPerHeadBill: { type: Number },
    billingType: { type: String },
    monthDays: { type: Number },
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

module.exports = mongoose.model("Bill", BillSchema);

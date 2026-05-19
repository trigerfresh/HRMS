const mongoose = require("mongoose");

const OrdersSchema = new mongoose.Schema(
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
    employeeName: { type: String },
    employeeCode: { type: String },
    type: { type: String },
    invoiceNo: { type: String },
    invoiceDate: { type: Date },
    invoiceMonth: { type: Number },
    invoiceYear: { type: Number },
    invoiceFrom: { type: Date },
    invoiceTo: { type: Date },
    autoNo: { type: Number },
    totalNos: { type: Number },
    costPerHead: { type: Number },
    status: { type: String },
    typeOfServ: { type: String },
    charges: { type: String },
    total: { type: Number },
    noOfDays: { type: String },
    sacCode: { type: Number },
    tbDate: { type: String },
    tbFrom: { type: String },
    tbTo: { type: String },
    tbVehicleNo: { type: String },
    tbWeight: { type: String },
    tbInvoiceNo: { type: String },
    lrNo: { type: String },
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

module.exports = mongoose.model("Orders", OrdersSchema);

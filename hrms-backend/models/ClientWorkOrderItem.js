const mongoose = require("mongoose");

const PackageSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true,
    min: 0,
  },
});

const ClientWorkOrderItemSchema = new mongoose.Schema({
  cliWorkOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClientWorkOrder",
  },
  itemNo: { type: String },
  containerNo: { type: String },
  size: { type: String },
  invoiceNo: { type: String },
  vehichleNo: { type: String },
  destuffPkgs: { type: String },
  destuffWgt: { type: String },
  exam: { type: String },
  remarks: { type: String },
  hours: { type: String },
  cbm: { type: String },
  sealNo: { type: String },
  arrivalDate: { type: Date },
  allowPkg: { type: String },
  allowWgt: { type: String },
  exporterName: { type: String },
  status: { type: String },
  equipmentType: [
    {
      value: String,
      label: String,
    },
  ],
  gang: [
    {
      value: String,
      label: String,
    },
  ],
  totalCargoPkg: [PackageSchema],
  totalCargoWgt: [PackageSchema],
  totalCargoPkgSum: { type: Number, default: 0 },
  totalCargoWgtSum: { type: Number, default: 0 },
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
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  approved_on: { type: Date },
  rejected_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  rejected_on: { type: Date },
  disabled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  disabled_on: { type: Date },
});

module.exports = mongoose.model(
  "ClientWorkOrderItem",
  ClientWorkOrderItemSchema,
);

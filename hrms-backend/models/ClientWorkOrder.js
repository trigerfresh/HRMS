const mongoose = require("mongoose");

const ClientWorkOrderSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  workOrderType: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrderType" },
  // workOrderType: { type: String },
  workOrderNo: { type: String },
  workOrderDate: { type: Date },
  igmNo: { type: String },
  importerName: { type: String },
  chaName: { type: String },
  vendor: { type: String },
  // invoiceStatus: { type: String, default: "Pending" },
  totalCargoPkg: { type: Number, default: 0 },
  totalCargoWgt: { type: Number, default: 0 },
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

module.exports = mongoose.model("ClientWorkOrder", ClientWorkOrderSchema);

const mongoose = require("mongoose");

const PaymentHistorySchema = new mongoose.Schema({
  billNo: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", required: true },
  paidAmount: { type: Number },
  taxType: { type: String },
  taxPercent: { type: Number },
  taxPaid: { type: String },
  transactionType: { type: String },
  transactionID: { type: String },
  bankName: { type: String },
  uid: { type: String },
  paymentDate: { type: Date },
  tds: { type: Number },
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

module.exports = mongoose.model("PaymentHistory", PaymentHistorySchema);

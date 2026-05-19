const mongoose = require("mongoose");

const SaleBillPaymentHistorySchema = new mongoose.Schema({
  billNo: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", required: true },
  paidAmount: { type: Number },
  transactionType: { type: String },
  transactionID: { type: String },
  bankName: { type: String },
  uid: { type: String },
  receivedDate: { type: Date },
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

module.exports = mongoose.model(
  "SaleBillPaymentHistory",
  SaleBillPaymentHistorySchema,
);

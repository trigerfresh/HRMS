const mongoose = require("mongoose");

const PurchaseBillsProductSchema = new mongoose.Schema({
  purchaseBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PurchaseBills",
  },
  productName: { type: String },
  hsn: { type: String },
  quantity: { type: Number },
  rate: { type: Number },
  amount: { type: Number },
  discount: { type: Number },
  discountAmt: { type: Number },
  discountedAmt: { type: Number },
  CGST: { type: Number },
  SGST: { type: Number },
  IGST: { type: Number },
  cgstAmt: { type: Number },
  sgstAmt: { type: Number },
  igstAmt: { type: Number },
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
  "PurchaseBillsProduct",
  PurchaseBillsProductSchema,
);

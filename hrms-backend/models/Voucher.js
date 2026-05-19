const mongoose = require('mongoose');

const VoucherSchema = new mongoose.Schema({
  voucherNo: { type: String, required: true },
  paymentDate: { type: Date, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  gang: String,
  type: String,
  mode: String,
  particulars: [{ name: String, amount: Number }],
  totalPaid: Number,
  company: String,
  bank: String,
  status: { type: String, enum: ['approved', 'pending', 'cancelled'], default: 'pending' },
  createdBy: String
}, { timestamps: true });

module.exports = mongoose.model('Voucher', VoucherSchema);

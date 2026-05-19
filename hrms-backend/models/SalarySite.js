const mongoose = require('mongoose');
const SalarySiteSchema = new mongoose.Schema({
  clientName: String,
  clientCode: String,
  monthYear: String,
  totalEarning: Number,
  advance: Number,
  pt: Number,
  pf: Number,
  esic: Number,
  uniform: Number,
  other: Number,
  netPayable: Number,
  totalInvoiceAmount: Number,
}, { timestamps: true });
module.exports = mongoose.model('SalarySite', SalarySiteSchema);

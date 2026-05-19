// hrms-backend/models/Branch.js (Full Updated Code)
const mongoose = require('mongoose')

const BranchSchema = new mongoose.Schema({
  branchName: { type: String, required: true },
  areaName: { type: String },
  email: {
    type: String,
    // unique: true, sparse: true
  }, // unique but allows null
  costingMethod: { type: String, default: 'FIFO' },
  defSalesAccount: { type: String },
  defBranchDispAccount: { type: String },
  address: { type: String },
  pincode: { type: String },
  contactNo: { type: String },
  defPurchaseAccount: { type: String },
  defBranchRecvAccount: { type: String },

  // IMPORTANT: Array of company IDs
  companyId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
  ],
  active: { type: Number, default: 0 },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  created_on: { type: Date, default: Date.now },
  modified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  modified_on: { type: Date },
  disabled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  disabled_on: { type: Date },
})

// To ensure branchName is unique within the same company (Advanced)
// BranchSchema.index({ branchName: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.model('Branch', BranchSchema)

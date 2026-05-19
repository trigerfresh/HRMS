const mongoose = require('mongoose')

const CompanySchema = new mongoose.Schema({
  // === हा बदल सर्वात महत्त्वाचा आहे ===
  companyName: {
    type: String,
    required: true,
    unique: true, // unique आता companyName वर आहे
  },

  // 'name' नावाचे फील्ड इथे कुठेही नसावे

  contactPersonName: { type: String },
  emailId: {
    type: String,
    required: true,
    unique: true,
  },
  address: { type: String },
  country: { type: String },
  regionState: { type: String },
  city: { type: String },
  pincode: { type: String },
  stateCode: { type: String },
  contactNo: { type: String },
  logo: { type: String },
  gstNo: { type: String },
  website: { type: String },
  currency: { type: String, default: 'INR' },
  financialYearFrom: { type: String },
  financialYearTo: { type: String },
  cinNo: { type: String },
  vatTin: { type: String },
  cstTin: { type: String },
  iec: { type: String },
  invoicePrefix: { type: String },
  termsAndCond: { type: String },
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

/* ✅ THIS IS REQUIRED — otherwise virtual won't come in response */
CompanySchema.set('toObject', { virtuals: true })
CompanySchema.set('toJSON', { virtuals: true })

CompanySchema.virtual('bankDetails', {
  ref: 'CompanyBankDetails',
  localField: '_id',
  foreignField: 'company',
  justOne: true, // 👈 only first record
  options: {
    sort: { created_on: 1 }, // 👈 first bank
    match: { active: 0 },
  },
})

module.exports = mongoose.model('Company', CompanySchema)

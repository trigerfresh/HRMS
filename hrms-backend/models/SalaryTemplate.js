// models/SalaryTemplate.js
const mongoose = require('mongoose');

const earningDeductionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rate: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  from: { type: Date },
  to: { type: Date },
  calculateOn: { type: String },
  select: { type: String },
  compare: { type: String }
}, { _id: false });

const salaryTemplateSchema = new mongoose.Schema({
  templateName: { 
    type: String, 
    required: true,
    trim: true
  },
  rank: { 
    type: String, 
    required: true,
    trim: true
  },
  grossSalary: { 
    type: Number, 
    required: true
  },
  basicSalary: { 
    type: Number, 
    required: true
  },
  perDaySalary: { 
    type: Number
  },
  hra: { 
    type: Number,
    default: 0
  },
  earnings: [earningDeductionSchema],
  deductions: [earningDeductionSchema]
}, { 
  timestamps: true 
});

// Calculate perDaySalary before saving
salaryTemplateSchema.pre('save', function(next) {
  if (this.grossSalary && !this.perDaySalary) {
    this.perDaySalary = this.grossSalary / 30; // Assuming 30 days in a month
  }
  next();
});

module.exports = mongoose.model('SalaryTemplate', salaryTemplateSchema);
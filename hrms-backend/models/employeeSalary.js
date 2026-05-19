const mongoose = require('mongoose');
const EmployeeSalarySchema = new mongoose.Schema({
  employeeName: String,
  employeeCode: String,
  rank: String,
  monthYear: String,
  totalEarning: Number,
  totalDeduction: Number,
  netPayable: Number
}, { timestamps: true });
module.exports = mongoose.model('EmployeeSalary', EmployeeSalarySchema);

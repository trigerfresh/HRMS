const EmployeeSalary = require('../models/employeeSalary');
const SalarySite = require('../models/SalarySite');

exports.listByEmployee = async (req, res) => {
  let filter = {};
  if (req.query.search) {
    filter['employeeName'] = { $regex: req.query.search, $options: 'i' };
  }
  if (req.query.from && req.query.to) {
    filter.createdAt = { $gte: new Date(req.query.from), $lte: new Date(req.query.to) };
  }
  const salaries = await EmployeeSalary.find(filter).sort({ createdAt: -1 });
  res.json(salaries);
};

exports.listBySite = async (req, res) => {
  let filter = {};
  if (req.query.search) filter['clientName'] = { $regex: req.query.search, $options: 'i' };
  if (req.query.month) filter['monthYear'] = { $regex: req.query.month, $options: 'i' };
  if (req.query.year) filter['monthYear'] = { $regex: req.query.year, $options: 'i' };
  const list = await SalarySite.find(filter).sort({ createdAt: -1 });
  // Totals for header
  const summary = list.reduce((acc, r) => {
    acc.totalSites += 1;
    acc.totalSalary += r.totalEarning || 0;
    acc.deduction += r.pt + r.pf + r.esic + r.uniform + r.other || 0;
    acc.netPayable += r.netPayable || 0;
    acc.totalInvoiceAmount += r.totalInvoiceAmount || 0;
    return acc;
  }, {totalSites:0,totalSalary:0,deduction:0,netPayable:0,totalInvoiceAmount:0,totalSalaryPaid:0,totalSalaryUnpaid:0});
  res.json({ rows: list, summary });
};
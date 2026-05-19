const WagesSheet = require('../models/WagesSheet');
const path = require('path');

exports.uploadSheet = async (req, res) => {
  const { client, siteName, clientCode, month, year } = req.body;
  if (!req.file) return res.status(400).json({ message: "File not found" });
  const tableName = req.file.filename.split('.')[0];
  const monthYear = `${month}-${year}`;
  const uploadedAt = new Date().toLocaleString('en-GB');
  await WagesSheet.create({
    tableName, client, siteName, clientCode, monthYear, uploadedAt, filePath: req.file.path, status: "pending"
  });
  res.json({ message: "Wages sheet uploaded successfully" });
};

exports.listSheets = async (req, res) => {
  const data = await WagesSheet.find().sort({ uploadedAt: -1 });
  res.json(data);
};

exports.downloadSheet = async (req, res) => {
  const rec = await WagesSheet.findById(req.params.id);
  if (!rec) return res.status(404).json({ message: 'Not found' });
  res.download(path.resolve(rec.filePath), rec.tableName + '.xlsx');
};

exports.deleteSheet = async (req, res) => {
  await WagesSheet.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};

exports.approveSheet = async (req, res) => {
  await WagesSheet.findByIdAndUpdate(req.params.id, { status: "approved" });
  res.json({ message: "Approved" });
};

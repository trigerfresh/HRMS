const mongoose = require('mongoose');

const manpowerAttendanceSchema = new mongoose.Schema({
  clientCode: Number,
  name: String,
  day: Number,
  month: String,
  year: Number,
  shift: String,
  inTime: String,
  outTime: String,
  count: Number,
  rate: Number,
  supervisior: String,
  gangName: String,
  otHours: Number,
  otRate: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ManpowerAttendance', manpowerAttendanceSchema);

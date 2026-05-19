const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  clientCode: { type: String, required: true },
  employeeName: { type: String, required: true },
  employeeCode: { type: String, required: true },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SiteDetail",
    required: true,
  },
  designation: { type: String },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  attendance: {
    type: Map, // Store daily attendance as key-value pairs (day: status)
    of: String, // e.g., { '1': 'P', '2': 'A', '3': 'PP', ... }
  },
  totalPresentDays: { type: Number, default: 0 },
  totalAbsentDays: { type: Number, default: 0 },
  totalWeekOffs: { type: Number, default: 0 },
  totalWeekOffsPaid: { type: Number, default: 0 },
  totalOTHour: { type: Number, default: 0 },
  totalOT: { type: Number, default: 0 },
  totalHalfDays: { type: Number, default: 0 },
  totalCL: { type: Number, default: 0 },
  totalPL: { type: Number, default: 0 },
  totalSL: { type: Number, default: 0 },
  totalHolidays: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  attendanceType: {
    type: String,
    enum: ["Day", "Night", "Both"],
    default: "Both",
  },
  remark: { type: String },
  invoiceStatus: { type: String, default: "Pending" },
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

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;

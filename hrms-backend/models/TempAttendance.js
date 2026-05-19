const mongoose = require("mongoose");

const TempAttendanceSchema = new mongoose.Schema({
  clientCode: { type: String },
  employeeName: { type: String },
  employeeCode: { type: String }, // Assuming employee code is numeric
  siteName: { type: String },
  designation: { type: String }, // e.g., JUNIOR EXECUTIVE
  month: { type: String }, // e.g., "09" for September
  year: { type: String }, // e.g., 2025
  attendance: {
    type: Map, // Store daily attendance as key-value pairs (day: status)
    of: String, // e.g., { '1': 'P', '2': 'A', '3': 'PP', ... }
  },
  // totalOT: { type: Number, default: 0 }, // Total Overtime (e.g., 'P1', 'PP', 'PPP')
  // totalOff: { type: Number, default: 0 }, // Total Weekly Off (e.g., 'W')
  // totalND: { type: Number, default: 0 }, // Total Normal Duty (e.g., 'P')
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
  error: {
    type: String,
  },
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

TempAttendanceSchema.methods.calculateTotals = function () {
  let nd = 0;
  let ot = 0;
  let othr = 0;
  let holiday = 0;
  let hf = 0;
  let cl = 0;
  let sl = 0;
  let pl = 0;
  let weekoff = 0;
  let weekoffpaid = 0;
  let ab = 0;

  for (const dayStatus of this.attendance.values()) {
    const status = dayStatus.toUpperCase();
    switch (status) {
      case "P":
        this.totalPresentDays = nd++;
        break;
      case "A":
        this.totalAbsentDays = ab++;
        break;
      case "W":
        this.totalWeekOffs = weekoff++;
        break;
      case "WP":
        this.totalWeekOffsPaid = weekoffpaid++;
        break;
      case "P1":
        this.totalPresentDays = nd++;
        this.totalOTHour = othr++;
        break;
      case "PP":
        this.totalPresentDays = nd++;
        this.totalOT = ot++;
        break;
      case "PPP":
        this.totalPresentDays = nd++;
        ot += 2;
        this.totalOT = ot;
        break;
      case "HF":
        this.totalHalfDays = hf++;
        break;
      case "D":
        this.totalPresentDays = nd++;
        break;
      case "N":
        this.totalPresentDays = nd++;
        break;
      case "H":
        this.totalHolidays = holiday++;
        break;
      case "CL":
        this.totalCL = cl++;
        break;
      case "PL":
        this.totalPL = pl++;
        break;
      case "SL":
        this.totalSL = sl++;
        break;
      default:
        break;
    }
    // 'A' (Absent), 'D' (Day), 'N' (Night) don't directly add to ND/OT/Off counts for display purposes
    // console.log(
    //   nd,
    //   ot,
    //   othr,
    //   holiday,
    //   hf,
    //   cl,
    //   sl,
    //   pl,
    //   weekoff,
    //   weekoffpaid,
    //   ab
    // );
  }

  this.totalPresentDays = nd;
  this.totalAbsentDays = ab;
  this.totalWeekOffs = weekoff;
  this.totalWeekOffsPaid = weekoffpaid;
  this.totalOT = ot;
  this.totalOTHour = othr;
  this.totalHalfDays = hf;
  this.totalCL = cl;
  this.totalSL = sl;
  this.totalPL = pl;
  this.totalHolidays = holiday;
  // this.totalND = nd;
  // this.totalOT = ot;
  // this.totalOff = off;
  // this.totalPresentDays = nd + ot; // Total P + OT
  this.total = nd + ot + weekoff + holiday + weekoffpaid + pl + cl + sl;
};

const Attendance = mongoose.model("TempAttendance", TempAttendanceSchema);

module.exports = Attendance;

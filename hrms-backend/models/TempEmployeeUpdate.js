const mongoose = require("mongoose");

const TempEmployeeUpdateSchema = new mongoose.Schema(
  {
    employeeCode: String,
    firstName: String,
    middleName: String,
    lastName: String,
    dateOfBirth: String,
    gender: String,
    dateOfJoining: String,
    designation: String,
    father: String,
    presentAddress: String,
    presentCity: String,
    presentState: String,
    presentPincode: String,
    presentCountry: String,
    presentPhone1: String,
    emailId: String,
    panCardNo: String,
    aadharCardNo: String,
    esisNo: String,
    esisDate: String,
    uanNo: String,
    uanDate: String,
    basicSalary: String,
    bankAccountNo: String,
    bankIfsc: String,
    error: String,

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
  },
  { timestamps: true }
);

module.exports = mongoose.model("TempEmployeeUpdate", TempEmployeeUpdateSchema);

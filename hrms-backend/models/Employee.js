const mongoose = require("mongoose");

const EmergencyContactSchema = new mongoose.Schema({
  contactPerson: { type: String },
  mobile: { type: String },
  relation: { type: String },
  email: { type: String },
  active: { type: Number, default: 0 },
  disabled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  disabled_on: { type: Date },
});

const EducationDocumentSchema = new mongoose.Schema({
  documentType: { type: String },
  // passingYear: { type: String },
  // documentName: { type: String },
  imagePath: { type: String },
  status: { type: String },
  remark: { type: String },
  active: { type: Number, default: 0 },
  disabled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  disabled_on: { type: Date },
});

const FamilyNomineeSchema = new mongoose.Schema({
  initial: { type: String },
  relativeName: { type: String },
  gender: { type: String },
  relation: { type: String },
  dob: { type: Date },
  age: { type: Number },
  isMinor: { type: Boolean, default: false },
  guardianName: { type: String },
  address: { type: String },
  contactNo: { type: String },
  emailId: { type: String },
  sharePF: { type: Number },
  shareESIC: { type: Number },
  active: { type: Number, default: 0 },
  disabled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  disabled_on: { type: Date },
});

const PreviousEmploymentSchema = new mongoose.Schema({
  companyName: { type: String },
  designation: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  pincode: { type: String },
  joinedDate: { type: Date },
  lastWorkingDate: { type: Date },
  annualCTC: { type: Number },
  monthlyCTC: { type: Number },
  reportingTo: { type: String },
  reportingToDesignation: { type: String },
  email: { type: String },
  contact: { type: String },
  grossIncomePrevEmpl: { type: Number },
  grossTDSDeducted: { type: Number },
  grossPT: { type: Number },
  totalPTDeducted: { type: Number },
  active: { type: Number, default: 0 },
  disabled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  disabled_on: { type: Date },
});

const BankDetailSchema = new mongoose.Schema({
  accountHolderName: { type: String },
  cardNo: { type: String },
  bankName: { type: String },
  bankAccountNo: { type: String },
  bankAddress: { type: String },
  city: { type: String },
  state: { type: String },
  ifscCode: { type: String },
  micrCode: { type: String },
  cancelledChequeImagePath: { type: String },
  monthlySalary: { type: Number },
});

const SeparationDetailSchema = new mongoose.Schema({
  separationType: { type: String },
  separationReason: { type: String },
  dateOfSeparation: { type: Date },
  noticePeriodDays: { type: Number },
  lastWorkingDate: { type: Date },
  handoverGivenTo: { type: String },
});

const EmployeeSchema = new mongoose.Schema({
  // Employee Details
  employeeCode: { type: String, unique: true, required: true },
  initial: { type: String },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  gender: { type: String },
  dateOfBirth: { type: Date },
  dateOfJoining: { type: Date },
  emailId: { type: String, unique: true, sparse: true, required: true },
  salaryGenerationFromDate: { type: Date },
  salaryGenerationToDate: { type: Date },
  father: { type: String },
  designation: { type: String },
  department: { type: String },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  location: { type: mongoose.Schema.Types.ObjectId, ref: "SiteDetail" },
  reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reportingUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  gangName: { type: String },

  // Contact Details
  presentAddress: {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String },
    phone1: { type: String },
    phone2: { type: String },
  },
  permanentAddress: {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String },
    phone1: { type: String },
    phone2: { type: String },
  },
  emergencyContacts: [EmergencyContactSchema],

  // Personal Details
  maritalStatus: { type: String },
  marriageDate: { type: Date },
  cast: { type: String },
  category: { type: String },
  nativePlace: { type: String },
  bloodGroup: { type: String },
  languageKnown: [{ type: String }],
  hobbies: [{ type: String }],
  drivingLicenseNo: { type: String },
  panCardNo: { type: String },
  aadharCardNo: { type: String },
  passportNo: { type: String },
  pfNo: { type: String },
  passportValidDate: { type: Date },
  uanNo: { type: String },
  uanDate: { type: Date },
  esisNo: { type: String },
  esisDate: { type: Date },

  educationalDocuments: [EducationDocumentSchema],
  familyNomineeDetails: [FamilyNomineeSchema],

  // Previous Employment Details
  previousEmployments: [PreviousEmploymentSchema],

  // Account Details
  bankDetails: BankDetailSchema,

  // Separation Details
  separationDetails: SeparationDetailSchema,

  // Audit Fields
  status: { type: String, default: "Working" },
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

// Static method to get the next employee code
EmployeeSchema.statics.getNextEmployeeCode = async function () {
  const lastEmployee = await this.findOne({}, {}, { sort: { createdAt: -1 } });

  if (!lastEmployee) {
    return "1"; // Starting code if no employees exist
  }

  // Extract the numeric part of the employee code
  const lastCode = lastEmployee.employeeCode;
  const numericPart = parseInt(lastCode);

  if (isNaN(numericPart)) {
    // If the code isn't a simple number, find the highest numeric value
    const allEmployees = await this.find({});
    let maxCode = 0;

    allEmployees.forEach((emp) => {
      const codeNum = parseInt(emp.employeeCode);
      if (!isNaN(codeNum) && codeNum > maxCode) {
        maxCode = codeNum;
      }
    });

    return (maxCode + 1).toString();
  }

  return (numericPart + 1).toString();
};

module.exports = mongoose.model("Employee", EmployeeSchema);

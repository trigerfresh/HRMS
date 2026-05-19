const mongoose = require("mongoose");

const TempEmployeeSchema = new mongoose.Schema(
  {
    // EMPLOYEE DETAIL (19 columns)
    employeeCode: String,
    clientCode: String,
    initial: String,
    firstName: String,
    middleName: String,
    lastName: String,
    gender: String,
    dob: String,
    joiningDate: String,
    emailId: String,
    salaryGenerationFromDate: String,
    salaryGenerationToDate: String,
    father: String,
    designation: String,
    department: String,
    reportingManager: String,
    reportingUser: String,
    gangName: String,

    // CONTACT DETAIL – PRESENT ADDRESS (7)
    presentAddress: String,
    presentCity: String,
    presentState: String,
    presentPincode: String,
    presentCountry: String,
    presentPhone1: String,
    presentPhone2: String,

    // CONTACT DETAIL – PERMANENT ADDRESS (7)
    permanentAddress: String,
    permanentCity: String,
    permanentState: String,
    permanentPincode: String,
    permanentCountry: String,
    permanentPhone1: String,
    permanentPhone2: String,

    // EMERGENCY CONTACT DETAILS (4)
    emergencyContactPerson: String,
    emergencyMobile: String,
    emergencyRelation: String,
    emergencyEmail: String,

    // PERSONAL DETAILS (25)
    maritalStatus: String,
    marriageDate: String,
    cast: String,
    category: String,
    nativePlace: String,
    bloodGroup: String,
    drivingLicenseNo: String,
    panCardNo: String,
    aadharCardNo: String,
    passportNo: String,
    passportValidDate: String,
    pfNo: String,
    esisNo: String,
    esisDate: String,
    uanNo: String,
    uanDate: String,
    language1: String,
    language2: String,
    language3: String,
    language4: String,
    language5: String,
    hobby1: String,
    hobby2: String,
    hobby3: String,
    hobby4: String,

    // EDUCATIONAL DETAILS (5)
    educationDocumentType: String,
    educationDocumentName: String,
    educationImagePath: String,
    educationStatus: String,
    educationRemark: String,

    // FAMILY & NOMINEE DETAILS (13)
    familyInitial: String,
    relativeName: String,
    familyGender: String,
    familyRelation: String,
    familyDob: String,
    familyAge: String,
    isMinor: String,
    guardianName: String,
    familyAddress: String,
    familyContactNo: String,
    familyEmailId: String,
    sharePfPercent: String,
    shareEsicPercent: String,

    // PREVIOUS EMPLOYEE DETAILS (19)
    prevCompanyName: String,
    prevDesignation: String,
    prevAddress: String,
    prevCity: String,
    prevState: String,
    prevCountry: String,
    prevPincode: String,
    prevJoinedDate: String,
    prevLastWorkingDate: String,
    prevAnnualCtcRupees: String,
    prevMonthlyCtc: String,
    prevReportingTo: String,
    prevReportingDesignation: String,
    prevEmail: String,
    prevContact: String,
    prevGrossIncome: String,
    prevGrossTdsDeducted: String,
    prevGrossPT: String,
    prevTotalPtDeducted: String,

    // BANK DETAILS (10)
    accountHolderName: String,
    cardNo: String,
    bankName: String,
    bankAccountNo: String,
    bankAddress: String,
    bankCity: String,
    bankState: String,
    bankIfsc: String,
    bankMicr: String,
    cancelledChequeImage: String,

    // SEPARATION DETAILS (6)
    separationType: String,
    separationReason: String,
    dateOfSeparation: String,
    noticePeriod: String,
    lastWorkingDate: String,
    handoverGivenTo: String,

    error: String,

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
  },
  { timestamps: true }
);

module.exports = mongoose.model("TempEmployee", TempEmployeeSchema);

const Attendance = require("../models/Attendance");
const TempAttendance = require("../models/TempAttendance");
const xlsx = require("xlsx");
const Employee = require("../models/Employee"); // Assuming you have an Employee model
const mongoose = require("mongoose");
const SiteDetail = require("../models/SiteDetail");
const ChargesByRank = require("../models/ChargesByRank");
const OtherCharges = require("../models/OtherCharges");
const EmpWages = require("../models/EmpWages");
const AtActualCharges = require("../models/AtActualCharges");
const Bill = require("../models/Bill");
const modelFunctions = require("../models/empWagesFunctions");
const Orders = require("../models/Orders");

// --- Attendance Template Download ---
exports.downloadAttendanceTemplate = (req, res) => {
  try {
    const wb = xlsx.utils.book_new();
    const ws_data = [
      [
        "SR NO",
        "CLIENT CODE",
        "EMPLOYEE NAME",
        "EMPLOYEE CODE",
        "SITE NAME",
        "DESIGNATION/RANK",
        "MONTH",
        "YEAR",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20",
        "21",
        "22",
        "23",
        "24",
        "25",
        "26",
        "27",
        "28",
        "29",
        "30",
        "31",
      ],
      // No sample data row here
    ];

    const ws = xlsx.utils.aoa_to_sheet(ws_data);
    xlsx.utils.book_append_sheet(wb, ws, "AttendanceData");

    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    // Random 10-digit number
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `Attendance_Template_${randomNumber}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error downloading attendance template:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Bulk Upload Attendance ---
exports.bulkUploadAttendance = async (req, res) => {
  //   console.log("Received file:", req.file?.originalname);
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded." });
    }
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const attendanceRecords = xlsx.utils.sheet_to_json(worksheet);
    // console.log("Parsed records:", attendanceRecords);

    let uploadedCount = 0;
    const userId = req.user?.id;

    for (const record of attendanceRecords) {
      try {
        const dailyAttendance = new Map();
        for (let i = 1; i <= 31; i++) {
          const dayKey = String(i);
          if (record[dayKey] !== undefined && record[dayKey] !== null) {
            dailyAttendance.set(dayKey, String(record[dayKey]));
          }
        }

        const newAttendance = new TempAttendance({
          clientCode: record["CLIENT CODE"],
          employeeName: record["EMPLOYEE NAME"],
          employeeCode: record["EMPLOYEE CODE"],
          siteName: record["SITE NAME"],
          designation: record["DESIGNATION/RANK"],
          month: record["MONTH"],
          year: record["YEAR"],
          attendance: dailyAttendance,
          attendanceType: req.body.attendanceType || "Both",
          created_by: userId,
        });
        newAttendance.calculateTotals();
        // console.log(newAttendance);
        await newAttendance.save();
        uploadedCount++;
      } catch (err) {
        console.error("Error saving record:", err.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Atttendance data uploaded successfully",
      uploadedCount: uploadedCount,
    });
  } catch (error) {
    console.error("Error in bulk upload:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Verify Attendance Upload ---
exports.verifyAttendanceUpload = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tempAttend = await TempAttendance.find({});
    const results = [];
    const successAttend = [];

    if (!tempAttend.length) {
      return res.status(400).json({
        success: false,
        message: "No Data found",
      });
    }
    // console.log(tempAttend);
    for (const temp of tempAttend) {
      let errors = [];
      // ---------------- VALIDATIONS ----------------
      if (!temp.clientCode) errors.push("Client Code is required");
      if (!temp.employeeCode) errors.push("Employee Code is required");
      if (!temp.designation) errors.push("Designation is required");
      if (!temp.month) errors.push("Month is required");
      if (!temp.year) errors.push("Year is required");

      let site;
      if (temp.clientCode) {
        site = await SiteDetail.findOne({
          clientCode: temp.clientCode,
        });
        // console.log("site", site.clientId, site._id);

        if (!site)
          errors.push(
            `Site with client code: ${temp.clientCode} is not found.`
          );
      }

      // Convert error array → string
      const errorString = errors.join(", ");

      // ---------------- SAVE ERRORS INSIDE TempEmployee ----------------
      if (errors.length > 0) {
        await TempAttendance.findByIdAndUpdate(
          temp._id,
          {
            error: errorString,
          },
          { session }
        );

        results.push({
          tempId: temp._id,
          errors: errorString,
        });

        continue;
      }

      const attendData = {
        clientCode: temp.clientCode || "",
        employeeName: temp.employeeName || "",
        employeeCode: temp.employeeCode || "",
        siteId: site?._id || "",
        designation: temp.designation || "",
        month: temp.month || 1,
        year: temp.year || 1,
        attendance: temp.attendance || "",
        totalPresentDays: temp.totalPresentDays || 0,
        totalAbsentDays: temp.totalAbsentDays || 0,
        totalWeekOffs: temp.totalWeekOffs || 0,
        totalWeekOffsPaid: temp.totalWeekOffsPaid || 0,
        totalOTHour: temp.totalOTHour || 0,
        totalOT: temp.totalOT || 0,
        totalHalfDays: temp.totalHalfDays || 0,
        totalCL: temp.totalCL || 0,
        totalPL: temp.totalPL || 0,
        totalSL: temp.totalSL || 0,
        totalHolidays: temp.totalHolidays || 0,
        total: temp.total || 0,
        attendanceType: temp.attendanceType || "",

        created_by: temp.created_by,
      };
      const data = new Attendance(attendData);
      await data.save({ session });
      successAttend.push(data);
      // console.log(data);
      // Remove temp from TempEmployee
      await TempAttendance.findByIdAndDelete(temp._id, { session });
    }

    // console.log(results);
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Verification completed! All rows are saved.",
      results: results.length > 0,
      createdCount: successAttend.length,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Verify Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.downloadUploadErrorTemplate = async (req, res) => {
  try {
    const failedRows = await TempAttendance.find({});

    if (!failedRows.length) {
      return res
        .status(404)
        .json({ success: false, message: "No failed rows found." });
    }

    // console.log(failedRows);
    // EXCEL HEADERS
    const headers = [
      "SR NO",
      "CLIENT CODE",
      "EMPLOYEE NAME",
      "EMPLOYEE CODE",
      "SITE NAME",
      "DESIGNATION/RANK",
      "MONTH",
      "YEAR",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "20",
      "21",
      "22",
      "23",
      "24",
      "25",
      "26",
      "27",
      "28",
      "29",
      "30",
      "31",
      "ERROR",
    ];

    const mapTempToRow = (e, index) => {
      const row = [];

      // SR NO
      row.push(index + 1);

      // Basic Columns
      row.push(e.clientCode || "");
      row.push(e.employeeName || "");
      row.push(e.employeeCode || "");
      row.push(e.siteName || "");
      row.push(e.designation || "");
      row.push(e.month || "");
      row.push(e.year || "");

      // Attendance (1–31)
      for (let day = 1; day <= 31; day++) {
        const val = e.attendance?.get(String(day)) || ""; // get() because it's a Map
        row.push(val);
      }

      // Error Message
      row.push(e.error || "");

      return row;
    };

    const tempRows = failedRows.map((temp, index) => mapTempToRow(temp, index));

    // console.log(tempRows);

    const sheetData = [headers, ...tempRows];

    // CREATE EXCEL
    const worksheet = xlsx.utils.aoa_to_sheet(sheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "ViewUploadedData");

    // 10-digit random number
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `AttendanceData_${randomNumber}.xlsx`;

    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await TempAttendance.deleteMany({});

    return res.send(excelBuffer);
  } catch (error) {
    console.error("DOWNLOAD EMPLOYEE EXCEL ERROR:", error);
    return res.status(500).json({ message: "Failed to download Excel" });
  }
};

// --- Get All Attendance Records with Search/Filter ---
exports.getAllAttendance = async (req, res) => {
  try {
    const { searchFields, month, year } = req.query;
    let attMatch = { active: 0 };
    let siteMatch = {};

    // Handle search fields
    if (searchFields) {
      let fields = [];
      try {
        fields = JSON.parse(searchFields);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid searchFields JSON",
        });
      }

      fields.forEach((item) => {
        if (!item?.keyword) return;

        //   SITE FILTERS
        if (item.field === "siteName") {
          siteMatch["site.siteName"] = new RegExp(item.keyword, "i");
        } else if (item.field === "contactPerson") {
          siteMatch["site.contactPersonName"] = new RegExp(item.keyword, "i");
        } else if (item.field === "contactPersonEmail") {
          siteMatch["site.emailId"] = new RegExp(item.keyword, "i");
        }

        //   ATTENDANCE FILTERS
        else {
          attMatch[item.field] = new RegExp(item.keyword, "i");
        }
      });
    }

    if (month) {
      attMatch.month = Number(month);
    }

    if (year) {
      attMatch.year = Number(year);
    }

    // console.log(query);

    const attendanceData = await Attendance.aggregate([
      { $match: attMatch },

      {
        $lookup: {
          from: "sitedetails",
          localField: "siteId",
          foreignField: "_id",
          as: "siteId",
        },
      },
      { $unwind: { path: "$siteId", preserveNullAndEmptyArrays: true } },
      ...(Object.keys(siteMatch).length ? [{ $match: siteMatch }] : []),

      {
        $lookup: {
          from: "clients",
          localField: "siteId.clientId",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },

      {
        $sort: {
          year: -1,
          month: -1,
          created_on: -1,
        },
      },
    ]);

    // console.log(attendanceData);
    res.status(200).json({
      success: true,
      count: attendanceData.length,
      data: attendanceData,
    });
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPrintData = async (req, res) => {
  try {
    const { siteId, month, year, attendanceType } = req.query;

    if (!siteId || !month || !year || !attendanceType) {
      return res.status(400).json({
        success: false,
        message: "Missing required query parameters",
      });
    }
    const printRecords = await Attendance.find({
      siteId,
      month,
      year,
      attendanceType,
    })
      .populate("created_by", "name")
      .populate({
        path: "siteId",
        select: "siteName ",
        populate: {
          path: "clientId",
          select: "companyName",
          populate: {
            path: "billingCompany",
            select: "companyName address city state pinCode emailId contactNo",
          },
        },
      });

    const first = printRecords[0];
    const siteDetails = first.siteId;
    const clientDetails = siteDetails.clientId;
    const billingCompanyDetails = clientDetails?.billingCompany;

    // console.log(printRecords);
    res.status(200).json({
      success: true,
      rec: printRecords,
      siteDetails,
      clientDetails,
      billingCompanyDetails,
    });
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getEmpWages = async (req, res) => {
  try {
    const { siteId, month, year, attendanceType } = req.query;

    if (!siteId || !month || !year || !attendanceType) {
      return res.status(400).json({
        success: false,
        message: "Missing required query parameters",
      });
    }

    const siteObjectId = new mongoose.Types.ObjectId(siteId);

    const empWages = await EmpWages.find({
      siteId: siteObjectId,
      attendanceMonth: String(month),
      attendanceYear: String(year),
      attendanceType,
    })
      .populate({
        path: "clientId",
        select:
          "companyName address contactPersonName sacCode gstNo billingCompany",
        populate: {
          path: "billingCompany",
          select:
            "companyName address city state pinCode emailId contactNo gstNo invoicePrefix",
        },
      })
      .populate({
        path: "siteId",
        select:
          "siteName clientId contactPersonName emailId address contactNo billWithoutRank cgst sgst igst roundOffAmount",
      })
      .lean();

    if (empWages.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No records found" });
    }

    const first = empWages[0];
    const billingType = first.billingType;
    const clientDetails = first.clientId;
    const billingCompanyDetails = first.clientId?.billingCompany;
    const siteDetails = first.siteId;
    const billWithoutRank = siteDetails.billWithoutRank;

    const empRows = first;

    let finalData = {};

    if (!billWithoutRank) {
      if (billingType !== "ROKADA") {
        finalData.order_info = await modelFunctions.getEmpWagesForOrderInfo(
          siteObjectId,
          month,
          year,
          attendanceType
        );
      } else {
        finalData.order_info =
          await modelFunctions.getEmpWagesForOrderInfoRokada(
            siteObjectId,
            month,
            year,
            attendanceType
          );
      }

      finalData.order_info_pf = (
        await modelFunctions.getEmpWagesPF(
          siteObjectId,
          month,
          year,
          attendanceType
        )
      ).map((item) => ({ ...item, label: "PF Charges" }));

      finalData.order_info_pt = (
        await modelFunctions.getEmpWagesPT(
          siteObjectId,
          month,
          year,
          attendanceType
        )
      ).map((item) => ({ ...item, label: "PT Charges" }));

      finalData.order_info_ot = (
        await modelFunctions.getEmpWagesOT(
          siteObjectId,
          month,
          year,
          attendanceType
        )
      ).map((item) => ({ ...item, label: "OT Charges" }));

      finalData.order_info_esic = (
        await modelFunctions.getEmpWagesESIC(
          siteObjectId,
          month,
          year,
          attendanceType
        )
      ).map((item) => ({ ...item, label: "ESIC Charges" }));

      finalData.order_info_bonus = (
        await modelFunctions.getEmpWagesBonus(
          siteObjectId,
          month,
          year,
          attendanceType
        )
      ).map((item) => ({ ...item, label: "Bonus" }));

      finalData.order_info_service_charges = (
        await modelFunctions.getEmpWagesServiceCharges(
          siteObjectId,
          month,
          year,
          attendanceType
        )
      ).map((item) => ({ ...item, label: "Service Charges" }));

      finalData.atactual_charges = (
        await modelFunctions.getATActualChargesBySite(
          siteObjectId,
          month,
          year,
          attendanceType
        )
      ).map((item) => ({ ...item, label: "At Actual Charges" }));
    } else {
      finalData.order_info =
        await modelFunctions.getEmpWagesForBillingWithoutRank(
          siteObjectId,
          month,
          year,
          attendanceType
        );

      finalData.order_info_service_charges = (
        await modelFunctions.getEmpWagesServiceCharges(
          siteObjectId,
          month,
          year,
          attendanceType
        )
      ).map((item) => ({ ...item, label: "Service Charges" }));
    }

    // console.log(finalData.order_info);
    res.status(200).json({
      success: true,
      clientDetails,
      billingCompanyDetails,
      siteDetails,
      empRows,
      ...finalData,
    });
  } catch (err) {
    console.error("Error fetching EmpWages:", err);
    res.status(500).json({
      success: false,
      message: "Fetching records failed",
      error: err.message,
    });
  }
};

// --- Delete Attendance Record ---
exports.deleteAttendance = async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;
    // console.log(ids, userId);
    await Attendance.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          active: 1,
          disabled_on: new Date(),
          disabled_by: userId,
        },
      }
    );

    res.json({
      message: "Attendance group soft-deleted",
      deletedCount: ids.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Deleting records failed!" });
  }
};

const roundValue = (value, decimalPoint) => {
  const v = Number(value || 0);
  if (!isFinite(v)) return 0;
  return Number(v.toFixed(decimalPoint));
};

const calculateWorkingDays = (month, year, includeSunday) => {
  const monthDays = new Date(year, month, 0).getDate();
  if (includeSunday) return monthDays;
  let sundays = 0;
  for (let d = 1; d <= monthDays; d++) {
    const dt = new Date(year, month - 1, d);
    if (dt.getDay() === 0) sundays++;
  }
  return monthDays - sundays;
};

const getAdditionalCharges = async (siteId, type) => {
  return await OtherCharges.find({ siteId, typeOfServ: type }).lean();
};

const calculatePT = async (siteId, gross, gender) => {
  if (gender && gender.toLowerCase() === "female") {
    return 0;
  }

  const ptRules = await OtherCharges.find({
    siteId,
    typeOfServ: "P.T.",
  }).lean();

  if (!ptRules || !ptRules.length) {
    return 0;
  }

  let pt = 0;
  const g = parseFloat(gross);

  for (const rule of ptRules) {
    const op = rule.calcOperation;
    const comp = rule.amountToCompare;

    if (op === "between") {
      if (comp && comp.includes("-")) {
        const [min, max] = comp.split("-").map((v) => parseFloat(v.trim()));
        if (g > min && g < max) {
          pt = Number(rule.charges);
          break;
        }
      }
      continue;
    }

    const compVal = parseFloat(comp);

    switch (op) {
      case "equal to":
        if (g === compVal) pt = rule.charges;
        break;

      case "greater than":
        if (g > compVal) pt = rule.charges;
        break;

      case "greater than or equal to":
        if (g >= compVal) pt = rule.charges;
        break;

      case "less than":
        if (g < compVal) pt = rule.charges;
        break;

      case "less than or equal to":
        if (g <= compVal) pt = rule.charges;
        break;
    }

    if (pt > 0) break;
  }

  return pt || 0;
};

const safeNumber = (v) =>
  v === undefined || v === null || v === "" ? 0 : Number(v);

exports.generateInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { approveInvRec, monthDaysForBilling } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(approveInvRec) || approveInvRec.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "No Data found" });
    }

    const month = Number(approveInvRec[0].month);
    const year = Number(approveInvRec[0].year);
    const attendanceType = approveInvRec[0].attendanceType;
    const siteId = approveInvRec[0].siteId._id;
    const clientName = approveInvRec[0].client.companyName;
    const includeSunday = monthDaysForBilling === "With Sunday";

    for (const data of approveInvRec) {
      if (data._id) {
        await EmpWages.deleteOne({
          siteId,
          attendanceType,
          attendanceMonth: String(month),
          attendanceYear: String(year),
        }).session(session);
        await AtActualCharges.deleteOne({
          siteId,
          attendanceType,
          attendanceMonth: String(month),
          attendanceYear: String(year),
        }).session(session);
      }
    }

    const noOfDaysInMonth = calculateWorkingDays(month, year, includeSunday);
    const siteData = await SiteDetail.findById({ _id: siteId }).lean();
    if (!siteData) {
      throw new Error("SiteDetail not found for siteId: " + siteId);
    }
    const siteDetails = siteData;

    const decimalPoint = siteDetails.roundOffAmount ? 0 : 2;
    const nonComplianceSite = !!siteDetails.nonComplianceSite;
    // console.log(nonComplianceSite, decimalPoint);

    // create invoice number
    const lastCount = await Bill.countDocuments().session(session);
    const lastInvoice = lastCount + 1;
    const currentYear = new Date().getFullYear();
    const nextYearShort = String(currentYear + 1).slice(-2);
    const invoiceNo = `SV / ${lastInvoice} / ${currentYear}-${nextYearShort}`;

    // console.log(
    //   month,
    //   year,
    //   attendanceType,
    //   noOfDaysInMonth,
    //   approveInvRec[0].siteId,
    //   // siteData,
    //   decimalPoint,
    //   invoiceNo
    // );

    const wagesToInsert = [];
    const actualChargesToInsert = [];
    // const billLines = [];

    for (const data of approveInvRec) {
      const chargesByRank = await ChargesByRank.findOne({
        siteId,
        empType: data.designation,
      }).lean();

      // Employee details (we need gender for PT/ESIC logic)
      const empDoc = await Employee.findOne(
        {
          employeeCode: data.employeeCode,
        },
        { gender: 1 }
      ).lean();

      // console.log(chargesByRank, empDoc);

      const totalPresentDays = safeNumber(data.totalPresentDays);
      const totalAbsentDays = safeNumber(data.totalAbsentDays);
      const totalWeekOffs = safeNumber(data.totalWeekOffs);
      const totalWeekOffsPaid = safeNumber(data.totalWeekOffsPaid);
      const totalHalfDays = safeNumber(data.totalHalfDays);
      const totalCL = safeNumber(data.totalCL);
      const totalPL = safeNumber(data.totalPL);
      const totalSL = safeNumber(data.totalSL);
      const totalHolidays = safeNumber(data.totalHolidays);
      const totalOTHour = safeNumber(data.totalOTHour);
      const totalOT = safeNumber(data.totalOT);

      const wages = {
        siteId: siteId,
        clientId: siteDetails.clientId,
        clientCode: siteDetails.clientCode,
        clientName,
        attendanceMonth: String(month),
        attendanceYear: String(year),
        attendanceType: attendanceType,
        employeeId: empDoc ? empDoc._id : null,
        employeeCode: data.employeeCode,
        employeeName: data.employeeName,
        designation: data.designation,
        monthDays: noOfDaysInMonth,
        presentDays: 0,
        paidHoliday: 0,
        netDays: 0,
        otDays: 0,
      };

      // Attendance / days calculations
      wages.paidHoliday = roundValue(totalHolidays, decimalPoint);
      wages.totalHoliday = wages.paidHoliday;
      wages.totalPL = roundValue(totalPL, decimalPoint);
      wages.totalCL = roundValue(totalCL, decimalPoint);
      wages.totalSL = roundValue(totalSL, decimalPoint);

      const halfDayFraction = roundValue(totalHalfDays / 2, decimalPoint);
      wages.halfDays = roundValue(halfDayFraction, decimalPoint);

      let netDays =
        Number(totalPresentDays) +
        Number(totalWeekOffs) +
        Number(totalWeekOffsPaid) +
        halfDayFraction +
        wages.totalCL +
        wages.totalPL +
        wages.totalSL +
        wages.totalHoliday;

      wages.presentDays = roundValue(
        Number(totalPresentDays) + halfDayFraction,
        decimalPoint
      );
      wages.absentDays = roundValue(totalAbsentDays, decimalPoint);
      wages.weeklyOff = roundValue(totalWeekOffs, decimalPoint);
      wages.paidLeaves = roundValue(totalWeekOffsPaid, decimalPoint);
      wages.netDays = roundValue(netDays, decimalPoint);
      wages.otDays = roundValue(totalOT, decimalPoint);

      let perDayRate = 0;
      if (chargesByRank && chargesByRank.perDayRate) {
        perDayRate = safeNumber(chargesByRank.perDayRate);
      }

      let basic = 0;
      if (perDayRate && perDayRate > 0) {
        basic = roundValue(perDayRate * wages.netDays, decimalPoint);
      } else if (chargesByRank && chargesByRank.basic) {
        basic = roundValue(safeNumber(chargesByRank.basic), decimalPoint);
      } else {
        basic = 0;
      }
      wages.basic = basic;

      const hra = roundValue(
        safeNumber(chargesByRank ? chargesByRank.hra : 0),
        decimalPoint
      );
      wages.hra = hra;

      const vda = roundValue(
        safeNumber(chargesByRank ? chargesByRank.da : 0),
        decimalPoint
      );
      wages.vda = vda;

      wages.basicVda = roundValue(basic + vda, decimalPoint);

      const specialAllow = roundValue(
        safeNumber(chargesByRank ? chargesByRank.specialAllowance : 0),
        decimalPoint
      );

      const otherAllow = roundValue(
        safeNumber(chargesByRank ? chargesByRank.otherAllowance : 0),
        decimalPoint
      );

      const lww = roundValue(
        safeNumber(chargesByRank ? chargesByRank.lww : 0),
        decimalPoint
      );

      wages.specialAllow = specialAllow;
      wages.otherAllow = otherAllow;
      wages.lww = lww;

      let bonus = 0;

      const bonusArr = await getAdditionalCharges(siteId, "BONUS");
      // console.log(bonusArr, bonusArr && bonusArr.length);
      if (bonusArr && bonusArr.length) {
        const b = bonusArr[0];
        if (b.chargesType === "Rs") {
          bonus = safeNumber(b.charges);
        } else {
          if (perDayRate && perDayRate > 0) {
            bonus = roundValue(
              (basic * safeNumber(b.charges)) / 100,
              decimalPoint
            );
          } else {
            const netBasicDa = (basic / noOfDaysInMonth) * netDays;
            bonus = roundValue(
              (netBasicDa * safeNumber(b.charges)) / 100,
              decimalPoint
            );
          }
        }
      }

      if (chargesByRank && chargesByRank.bonus && chargesByRank.bonus > 0) {
        bonus = roundValue(chargesByRank.bonus, decimalPoint);
      }
      wages.bonus = bonus;

      wages.fixedLeaveWages = roundValue(
        safeNumber(chargesByRank ? chargesByRank.leaveWages : 0),
        decimalPoint
      );

      wages.fixedUniformWages = roundValue(
        safeNumber(chargesByRank ? chargesByRank.uniformWashing : 0),
        decimalPoint
      );

      wages.anyOther = roundValue(
        safeNumber(chargesByRank ? chargesByRank.anyOther : 0),
        decimalPoint
      );

      if (perDayRate && perDayRate > 0) {
        wages.gross = roundValue(perDayRate, decimalPoint);
      } else {
        const gross =
          wages.basicVda +
          wages.hra +
          wages.specialAllow +
          wages.otherAllow +
          wages.lww +
          wages.bonus +
          wages.fixedLeaveWages +
          wages.fixedUniformWages +
          wages.anyOther;
        wages.gross = roundValue(gross, decimalPoint);
      }

      let otRate = 0;
      const otRateArr = await getAdditionalCharges(siteId, "OT");
      if (chargesByRank && chargesByRank.otRate) {
        otRate = safeNumber(chargesByRank.otRate);
      } else if ((!otRate || otRate === 0) && otRateArr && otRateArr.length) {
        otRate = safeNumber(otRateArr[0].charges);
      }
      wages.otRate = roundValue(otRate, decimalPoint);

      if (perDayRate && perDayRate > 0) {
        wages.earnedBasic = roundValue(
          perDayRate * wages.netDays,
          decimalPoint
        );

        const hraRateArr = await getAdditionalCharges(siteId, "HRA");
        if (hraRateArr && hraRateArr.length) {
          const h = hraRateArr[0];
          if (h.chargesType === "Rs") {
            wages.earnedHra = roundValue(h.charges, decimalPoint);
            wages.earnedBasicDa = 0;
          } else {
            wages.earnedHra = roundValue(
              (wages.earnedBasic * h.charges) / 100,
              decimalPoint
            );
            wages.earnedBasicDa = 0;
          }
        } else {
          wages.earnedHra = 0;
        }

        wages.earnedGross = roundValue(
          wages.earnedBasic + (wages.earnedBasicDa || 0) + wages.earnedHra,
          decimalPoint
        );
        // console.log(wages.earnedGross);

        wages.perDayRate = roundValue(perDayRate, decimalPoint);

        wages.basic = wages.earnedGross;
      } else {
        wages.earnedBasic = roundValue(
          (wages.basic / wages.monthDays) * wages.netDays,
          decimalPoint
        );
        wages.earnedDa = roundValue(
          (wages.vda / wages.monthDays) * wages.netDays,
          decimalPoint
        );
        wages.earnedBasicDa = roundValue(
          wages.earnedDa + wages.earnedBasic,
          decimalPoint
        );
      }
      wages.earnedSpecialAllow = roundValue(
        (wages.specialAllow / wages.monthDays) * wages.netDays,
        decimalPoint
      );
      wages.earnedHra = roundValue(
        (wages.hra / wages.monthDays) * wages.netDays,
        decimalPoint
      );
      wages.earnedOtherAllow = roundValue(
        (wages.otherAllow / wages.monthDays) * wages.netDays,
        decimalPoint
      );
      wages.earnedLww = roundValue(
        (wages.lww / wages.monthDays) * wages.netDays,
        decimalPoint
      );

      wages.earnedBonus =
        perDayRate && perDayRate > 0
          ? roundValue(bonus, decimalPoint)
          : roundValue((bonus / wages.monthDays) * wages.netDays, decimalPoint);

      wages.earnedLeaveWages = roundValue(
        (wages.fixedLeaveWages / wages.monthDays) * wages.netDays,
        decimalPoint
      );
      wages.earnedUniformWages = roundValue(
        (wages.fixedUniformWages / wages.monthDays) * wages.netDays,
        decimalPoint
      );
      wages.earnedAnyOther = roundValue(
        (wages.anyOther / wages.monthDays) * wages.netDays,
        decimalPoint
      );

      wages.earnedOtWages = 0;
      const overtimeUnits = wages.otDays;
      if (otRate && otRate > 0) {
        if (siteDetails.multiplyOTHours) {
          const empHours = safeNumber(chargesByRank ? chargesByRank.hours : 0);
          wages.earnedOtWages = roundValue(
            otRate * overtimeUnits * (empHours || 1),
            decimalPoint
          );
        } else {
          wages.earnedOtWages = roundValue(
            otRate * overtimeUnits,
            decimalPoint
          );
        }
      } else if (otRateArr && otRateArr.length) {
        if (otRateArr[0].calcOn === "AT ACTUAL") {
          wages.earnedOtWages = roundValue(otRate, decimalPoint);
        } else {
          wages.earnedOtWages = roundValue(
            otRate * overtimeUnits,
            decimalPoint
          );
        }
      } else {
        if (overtimeUnits > 0) {
          wages.earnedOtWages = roundValue(
            (wages.gross / 8) * overtimeUnits,
            decimalPoint
          );
        }
      }

      if (perDayRate && perDayRate > 0) {
        if (wages.earnedOtWages && wages.earnedOtWages > 0) {
          wages.earnedGross = roundValue(
            wages.earnedBasic +
              (wages.earnedBasicDa || 0) +
              wages.earnedHra +
              wages.earnedOtWages,
            decimalPoint
          );
        }
      } else {
        if (siteDetails.calculateEarnedGrossWithoutOT) {
          wages.earnedGross = roundValue(
            (wages.earnedBasicDa || 0) +
              (wages.earnedSpecialAllow || 0) +
              (wages.earnedHra || 0) +
              (wages.earnedOtherAllow || 0) +
              (wages.earnedLww || 0) +
              (wages.earnedBonus || 0) +
              (wages.earnedLeaveWages || 0) +
              (wages.earnedUniformWages || 0) +
              (wages.earnedAnyOther || 0),
            decimalPoint
          );
        } else {
          wages.earnedGross = roundValue(
            (wages.earnedBasicDa || 0) +
              (wages.earnedSpecialAllow || 0) +
              (wages.earnedHra || 0) +
              (wages.earnedOtherAllow || 0) +
              (wages.earnedLww || 0) +
              (wages.earnedBonus || 0) +
              (wages.earnedLeaveWages || 0) +
              (wages.earnedUniformWages || 0) +
              (wages.earnedAnyOther || 0) +
              (wages.earnedOtWages || 0),
            decimalPoint
          );
        }
      }

      let deductPf = 0;
      let empPf = 0;
      wages.pfWages = 0;

      const pfArr = await getAdditionalCharges(siteId, "P.F.");
      if (pfArr && pfArr.length) {
        const pfChoice = siteDetails.pfWagesCalculatedOn || "GROSS";
        if (pfChoice === "GROSS")
          wages.pfWages = roundValue(wages.earnedGross, decimalPoint);
        else if (pfChoice === "BASIC")
          wages.pfWages = roundValue(wages.earnedBasic, decimalPoint);
        else if (pfChoice === "GROSS-HRA")
          wages.pfWages = roundValue(
            wages.earnedGross - wages.earnedHra,
            decimalPoint
          );
        else if (pfChoice === "BASIC+SPECIAL ALLOW")
          wages.pfWages = roundValue(
            (wages.earnedBasicDa || 0) + (wages.earnedSpecialAllow || 0),
            decimalPoint
          );
        else if (pfChoice === "BASIC+DA")
          wages.pfWages = roundValue(wages.earnedBasicDa || 0, decimalPoint);
        else if (pfChoice === "BASIC+DA+SPECIAL ALLOW+OTHER ALLOW")
          wages.pfWages = roundValue(
            (wages.earnedBasicDa || 0) +
              (wages.earnedSpecialAllow || 0) +
              (wages.earnedOtherAllow || 0),
            decimalPoint
          );
        else wages.pfWages = roundValue(wages.earnedGross, decimalPoint);

        const pfObj = pfArr[0];
        if (pfObj.chargesType === "Rs") {
          deductPf = roundValue(pfObj.charges, decimalPoint);
        } else {
          deductPf = roundValue(
            (wages.pfWages * pfObj.charges) / 100,
            decimalPoint
          );
        }
        empPf = deductPf;
      }

      const empPfArr = await getAdditionalCharges(siteId, "EMP PF");
      if (empPfArr && empPfArr.length) {
        let empPfWagesArr = 0;
        const pfChoice = siteDetails.pfWagesCalculatedOn || "GROSS";
        if (pfChoice === "GROSS")
          empPfWagesArr = roundValue(wages.earnedGross, decimalPoint);
        else if (pfChoice === "BASIC")
          empPfWagesArr = siteDetails.perDayRate
            ? roundValue(wages.earnedBasic, decimalPoint)
            : roundValue(wages.earnedBasicDa || 0, decimalPoint);
        else if (pfChoice === "GROSS-HRA")
          empPfWagesArr = roundValue(
            wages.earnedGross - wages.earnedHra,
            decimalPoint
          );
        else if (pfChoice === "GROSS-HRA-BONUS")
          empPfWagesArr = roundValue(
            wages.earnedGross - wages.earnedHra - wages.earnedBonus,
            decimalPoint
          );
        else if (pfChoice === "BASIC+SPECIAL ALLOW")
          empPfWagesArr = roundValue(
            wages.earnedBasicDa + wages.earnedSpecialAllow,
            decimalPoint
          );
        else if (pfChoice === "BASIC+OTHER ALLOW")
          empPfWagesArr = roundValue(
            wages.earnedBasicDa + wages.earnedOtherAllow,
            decimalPoint
          );
        else if (pfChoice === "BASIC+DA")
          empPfWagesArr = roundValue(wages.earnedBasicDa, decimalPoint);
        else if (pfChoice === "BASIC+DA+SPECIAL ALLOW+OTHER ALLOW")
          empPfWagesArr = roundValue(
            wages.earnedBasicDa +
              wages.earnedSpecialAllow +
              wages.earnedOtherAllow,
            decimalPoint
          );
        wages.pfWages = roundValue(empPfWagesArr, decimalPoint);

        let tmpDeductPf = 0;
        for (const rule of empPfArr) {
          if (rule.chargesType === "Rs") {
            tmpDeductPf = roundValue(rule.charges, decimalPoint);
          } else {
            let matchBase = 0;
            if (rule.calcOn === "PF Wages") matchBase = wages.pfWages;
            else if (rule.calcOn === "Amount to compare")
              matchBase = rule.amountToCompare;
            else if (rule.calcOn === "On Gross Salary")
              matchBase = wages.earnedGross;
            else if (rule.calcOn === "BASIC") matchBase = wages.earnedBasic;
            else if (rule.calcOn === "BASIC+DA")
              matchBase = wages.earnedBasicDa;

            const op = rule.calcOperation;
            const comp = rule.amountToCompare;
            let condition = false;
            if (!op) condition = true;
            else if (op === "equal to" && wages.pfWages == comp)
              condition = true;
            else if (op === "greater than or equal to" && wages.pfWages >= comp)
              condition = true;
            else if (op === "greater than" && wages.pfWages > comp)
              condition = true;
            else if (op === "less than" && wages.pfWages < comp)
              condition = true;
            else if (op === "less than or equal to" && wages.pfWages <= comp)
              condition = true;

            if (condition) {
              tmpDeductPf = roundValue(
                (matchBase * rule.charges) / 100,
                decimalPoint
              );
            }
          }
        }
        deductPf = tmpDeductPf;
      }

      const cmpPfArr = await getAdditionalCharges(siteId, "CMP PF");
      if (cmpPfArr && cmpPfArr.length) {
        let companyPfWagesArr = 0;
        const pfChoice = siteDetails.pfWagesCalculatedOn || "GROSS";
        if (pfChoice === "GROSS")
          companyPfWagesArr = roundValue(wages.earnedGross, decimalPoint);
        else if (pfChoice === "BASIC")
          companyPfWagesArr = siteDetails.perDayRate
            ? roundValue(wages.earnedBasic, decimalPoint)
            : roundValue(wages.earnedBasicDa || 0, decimalPoint);
        else if (pfChoice === "GROSS-HRA")
          companyPfWagesArr = roundValue(
            wages.earnedGross - wages.earnedHra,
            decimalPoint
          );
        else if (pfChoice === "GROSS-HRA-BONUS")
          companyPfWagesArr = roundValue(
            wages.earnedGross - wages.earnedHra - wages.earnedBonus,
            decimalPoint
          );
        else if (pfChoice === "BASIC+SPECIAL ALLOW")
          companyPfWagesArr = roundValue(
            wages.earnedBasicDa + wages.earnedSpecialAllow,
            decimalPoint
          );
        else if (pfChoice === "BASIC+OTHER ALLOW")
          companyPfWagesArr = roundValue(
            wages.earnedBasicDa + wages.earnedOtherAllow,
            decimalPoint
          );
        else if (pfChoice === "BASIC+DA")
          companyPfWagesArr = roundValue(wages.earnedBasicDa, decimalPoint);
        else if (pfChoice === "BASIC+DA+SPECIAL ALLOW+OTHER ALLOW")
          companyPfWagesArr = roundValue(
            wages.earnedBasicDa +
              wages.earnedSpecialAllow +
              wages.earnedOtherAllow,
            decimalPoint
          );
        wages.pfWages = roundValue(companyPfWagesArr, decimalPoint);

        let tmpEmpPf = 0;
        for (const rule of cmpPfArr) {
          if (rule.chargesType === "Rs") {
            tmpEmpPf = roundValue(rule.charges, decimalPoint);
          } else {
            let matchBase = 0;
            if (rule.calcOn === "PF Wages") matchBase = wages.pfWages;
            else if (rule.calcOn === "Amount to compare")
              matchBase = rule.amountToCompare;
            else if (rule.calcOn === "On Gross Salary")
              matchBase = wages.earnedGross;
            else if (rule.calcOn === "BASIC") matchBase = wages.earnedBasic;
            else if (rule.calcOn === "BASIC+DA")
              matchBase = wages.earnedBasicDa;

            const op = rule.calcOperation;
            const comp = rule.amountToCompare;
            let condition = false;
            if (!op) condition = true;
            else if (op === "equal to" && wages.pfWages == comp)
              condition = true;
            else if (op === "greater than or equal to" && wages.pfWages >= comp)
              condition = true;
            else if (op === "greater than" && wages.pfWages > comp)
              condition = true;
            else if (op === "less than" && wages.pfWages < comp)
              condition = true;
            else if (op === "less than or equal to" && wages.pfWages <= comp)
              condition = true;

            if (condition) {
              tmpEmpPf = roundValue(
                (matchBase * rule.charges) / 100,
                decimalPoint
              );
            }
          }
        }
        empPf = tmpEmpPf;
      }

      wages.deductPf = roundValue(deductPf, decimalPoint);
      wages.empPf = roundValue(empPf, decimalPoint);

      const deductPt = await calculatePT(
        siteId,
        wages.earnedGross,
        empDoc ? empDoc.gender : null
      );
      // console.log(deductPt, siteId, wages.earnedGross, empDoc.gender, "PT");
      wages.deductPt = roundValue(deductPt, decimalPoint);

      let deductEsic = 0;
      let empEsic = 0;
      wages.esicWages = 0;

      const esicArr = await getAdditionalCharges(siteId, "ESIC");
      if (esicArr && esicArr.length) {
        const esicChoice = siteDetails.ESICWagesCalculatedOn || "GROSS";
        if (esicChoice === "GROSS")
          wages.esicWages = roundValue(wages.earnedGross, decimalPoint);
        else if (esicChoice === "BASIC")
          wages.esicWages = roundValue(wages.earnedBasicDa || 0, decimalPoint);
        else if (esicChoice === "GROSS-OTHER ALLOW")
          wages.esicWages = roundValue(
            wages.earnedGross - wages.earnedOtherAllow,
            decimalPoint
          );

        const esicObj = esicArr[0];
        if (esicObj.chargesType === "Rs") {
          deductEsic = roundValue(esicObj.charges, decimalPoint);
        } else {
          let companyEsicMatch = 0;
          if (esicObj.calcOn === "ESIC Wages")
            companyEsicMatch = wages.esicWages;
          else if (esicObj.calcOn === "GROSS-OTHER+OT AMT")
            companyEsicMatch = roundValue(
              wages.earnedGross - wages.earnedOtherAllow + wages.earnedOtWages,
              decimalPoint
            );
          deductEsic = roundValue(
            (companyEsicMatch * esicObj.charges) / 100,
            decimalPoint
          );
        }
      }

      const empEsicArr = await getAdditionalCharges(siteId, "EMP ESIC");
      if (empEsicArr && empEsicArr.length) {
        const cap = empEsicArr[0].amountToCompare;
        if (wages.earnedGross > cap && cap) wages.esicWages = cap;
        else {
          const esicChoice = siteDetails.ESICWagesCalculatedOn || "GROSS";
          if (esicChoice === "GROSS")
            wages.esicWages = roundValue(wages.earnedGross, decimalPoint);
          else if (esicChoice === "BASIC")
            wages.esicWages = roundValue(
              wages.earnedBasicDa || 0,
              decimalPoint
            );
          else if (esicChoice === "GROSS-OTHER ALLOW")
            wages.esicWages = roundValue(
              wages.earnedGross - wages.earnedOtherAllow,
              decimalPoint
            );
          else if (esicChoice === "BASIC+HRA")
            wages.esicWages = roundValue(
              (wages.earnedBasicDa || 0) + wages.earnedHra,
              decimalPoint
            );
        }

        for (const rule of empEsicArr) {
          let empEsicMatch = 0;
          if (rule.calcOn === "ESIC Wages") empEsicMatch = wages.esicWages;
          else if (rule.calcOn === "Amount to compare")
            empEsicMatch = rule.amountToCompare;
          else if (rule.calcOn === "BASIC")
            empEsicMatch = roundValue(
              (wages.earnedBasicDa || 0) + (wages.earnedHra || 0),
              decimalPoint
            );
          else if (rule.calcOn === "On Gross Salary")
            empEsicMatch = roundValue(wages.earnedGross, decimalPoint);

          const op = rule.calcOperation;
          const comp = rule.amountToCompare;
          let condition = false;
          if (!op) condition = true;
          else if (op === "equal to" && empEsicMatch == comp) condition = true;
          else if (op === "greater than or equal to" && empEsicMatch >= comp)
            condition = true;
          else if (op === "greater than" && empEsicMatch > comp)
            condition = true;
          else if (op === "less than" && empEsicMatch < comp) condition = true;
          else if (op === "less than or equal to" && empEsicMatch <= comp)
            condition = true;

          if (rule.calcOn === "GROSS-OTHER+OT AMT") {
            deductEsic = roundValue(
              ((wages.earnedGross - wages.earnedOtherAllow) * rule.charges) /
                100 +
                (wages.earnedOtWages * rule.charges) / 100,
              decimalPoint
            );
          }

          if (condition) {
            deductEsic = roundValue(
              (empEsicMatch * rule.charges) / 100,
              decimalPoint
            );
          }
        }
      }

      const cmpEsicArr = await getAdditionalCharges(siteId, "CMP ESIC");
      let companyEsic = 0;
      if (cmpEsicArr && cmpEsicArr.length) {
        const esicChoice = siteDetails.ESICWagesCalculatedOn || "GROSS";
        if (esicChoice === "GROSS")
          wages.esicWages = roundValue(wages.earnedGross, decimalPoint);
        else if (esicChoice === "BASIC")
          wages.esicWages = roundValue(wages.earnedBasicDa || 0, decimalPoint);
        else if (esicChoice === "GROSS-OTHER ALLOW")
          wages.esicWages = roundValue(
            wages.earnedGross - wages.earnedOtherAllow,
            decimalPoint
          );
        else if (esicChoice === "BASIC+HRA")
          wages.esicWages = roundValue(
            (wages.earnedBasicDa || 0) + wages.earnedHra,
            decimalPoint
          );

        for (const rule of cmpEsicArr) {
          let companyEsicMatch = 0;
          if (rule.calcOn === "ESIC Wages") companyEsicMatch = wages.esicWages;
          else if (rule.calcOn === "Amount to compare")
            companyEsicMatch = rule.amountToCompare;
          else if (rule.calcOn === "BASIC")
            companyEsicMatch = roundValue(
              (wages.earnedBasicDa || 0) + (wages.earnedHra || 0),
              decimalPoint
            );
          else if (rule.calcOn === "On Gross Salary")
            companyEsicMatch = roundValue(wages.earnedGross, decimalPoint);

          const op = rule.calcOperation;
          const comp = rule.amountToCompare;
          let condition = false;
          if (!op) condition = true;
          else if (op === "equal to" && companyEsicMatch == comp)
            condition = true;
          else if (
            op === "greater than or equal to" &&
            companyEsicMatch >= comp
          )
            condition = true;
          else if (op === "greater than" && companyEsicMatch > comp)
            condition = true;
          else if (op === "less than" && companyEsicMatch < comp)
            condition = true;
          else if (op === "less than or equal to" && companyEsicMatch <= comp)
            condition = true;

          if (condition) {
            companyEsic = roundValue(
              (companyEsicMatch * rule.charges) / 100,
              decimalPoint
            );
          }
        }
      }

      wages.deductEsic = roundValue(deductEsic, decimalPoint);
      wages.empEsic = roundValue(companyEsic, decimalPoint);

      const lwfArr = await getAdditionalCharges(siteId, "MLWF");

      wages.deductLwf =
        lwfArr && lwfArr.length
          ? roundValue(lwfArr[0].charges, decimalPoint)
          : 0;

      const loanArr = await getAdditionalCharges(siteId, "LOAN");

      wages.deductLoan =
        loanArr && loanArr.length
          ? roundValue(loanArr[0].charges, decimalPoint)
          : 0;

      const idArr = await getAdditionalCharges(siteId, "ID");

      wages.deductId =
        idArr && idArr.length ? roundValue(idArr[0].charges, decimalPoint) : 0;

      const recoveryArr = await getAdditionalCharges(siteId, "RECOVERY");

      wages.deductRecovery =
        recoveryArr && recoveryArr.length
          ? roundValue(recoveryArr[0].charges, decimalPoint)
          : 0;

      const installArr = await getAdditionalCharges(siteId, "INSTALLMENTS");

      wages.deductInstallment =
        installArr && installArr.length
          ? roundValue(installArr[0].charges, decimalPoint)
          : 0;

      // wages.deductUniform = 0;
      // wages.deductOther = 0;
      // wages.deductAdvance = 0;

      const uniformArr = await getAdditionalCharges(siteId, "UNIFORM");

      wages.deductUniform =
        uniformArr && uniformArr.length
          ? roundValue(uniformArr[0].charges, decimalPoint)
          : 0;

      const otherArr = await getAdditionalCharges(siteId, "OTHER");

      wages.deductOther =
        otherArr && otherArr.length
          ? roundValue(otherArr[0].charges, decimalPoint)
          : 0;

      const advArr = await getAdditionalCharges(siteId, "ADVANCE");

      wages.deductAdvance =
        advArr && advArr.length
          ? roundValue(advArr[0].charges, decimalPoint)
          : 0;

      const totalDeduction = roundValue(
        (wages.deductPf || 0) +
          (wages.deductPt || 0) +
          (wages.deductEsic || 0) +
          (wages.deductLwf || 0) +
          (wages.deductLoan || 0) +
          (wages.deductUniform || 0) +
          (wages.deductId || 0) +
          (wages.deductRecovery || 0) +
          (wages.deductInstallment || 0) +
          (wages.deductOther || 0) +
          (wages.deductAdvance || 0),
        decimalPoint
      );

      wages.totalDeduction = totalDeduction;
      wages.netTakeHome = roundValue(
        (wages.earnedGross || 0) - totalDeduction,
        decimalPoint
      );
      wages.salaryPayable = wages.netTakeHome;

      wages.empPf = roundValue(empPf, decimalPoint);
      wages.empEsic = roundValue(companyEsic, decimalPoint);
      wages.empLwf = 0;
      wages.empGratuty = 0;

      if (chargesByRank && chargesByRank.uniformWashing) {
        if (siteDetails.calculateUniformDays) {
          wages.empAnyOther = roundValue(
            (chargesByRank.uniformWashing / wages.monthDays) * wages.netDays,
            decimalPoint
          );
        } else {
          wages.empAnyOther = roundValue(
            chargesByRank.uniformWashing,
            decimalPoint
          );
        }
      } else wages.empAnyOther = 0;

      wages.empCtc = roundValue(
        (wages.earnedGross || 0) +
          (wages.empPf || 0) +
          (wages.empEsic || 0) +
          (wages.empLwf || 0) +
          (wages.empGratuty || 0) +
          (wages.empAnyOther || 0),
        decimalPoint
      );

      let serviceCharges = 0;
      const svcArr = await getAdditionalCharges(siteId, "Service Charges");
      if (chargesByRank && chargesByRank.serviceChargesType === "Rs") {
        if (chargesByRank.serviceCharges > 0) {
          serviceCharges = roundValue(
            wages.netDays * chargesByRank.serviceCharges,
            decimalPoint
          );
        }
      } else if (chargesByRank && chargesByRank.serviceChargesType === "%") {
        if (chargesByRank.serviceCharges > 0) {
          serviceCharges = roundValue(
            (wages.empCtc * chargesByRank.serviceCharges) / 100,
            decimalPoint
          );
        }
      } else {
        if (svcArr && svcArr.length) {
          if (svcArr[0].calcOn === "AT ACTUAL")
            serviceCharges = roundValue(svcArr[0].charges, decimalPoint);
        }
      }
      wages.empServiceCharges = serviceCharges;

      if (siteDetails.CTCCalculate === "NET SALARY+TOTAL CONTRIBUTION+BONUS") {
        wages.empIctc = roundValue(
          (wages.earnedGross || 0) +
            (wages.empPf || 0) +
            (wages.earnedBonus || 0) +
            (wages.empLwf || 0),
          decimalPoint
        );
      } else {
        wages.empIctc = roundValue(
          (wages.empCtc || 0) + (wages.empServiceCharges || 0),
          decimalPoint
        );
      }

      const cgst = safeNumber(siteDetails.cgst || 0);
      const sgst = safeNumber(siteDetails.sgst || 0);
      const igst = safeNumber(siteDetails.igst || 0);
      wages.CGST = roundValue((wages.empIctc * cgst) / 100, decimalPoint);
      wages.SGST = roundValue((wages.empIctc * sgst) / 100, decimalPoint);
      wages.IGST = roundValue((wages.empIctc * igst) / 100, decimalPoint);

      const totalGstPerc = cgst + sgst + igst;
      const totalGst = roundValue(
        (wages.empIctc * totalGstPerc) / 100,
        decimalPoint
      );
      wages.empGst = totalGst;
      wages.empInvoiceAmount = roundValue(
        totalGst + wages.empIctc,
        decimalPoint
      );

      wages.totalNos = 1;
      wages.billingType = "Daily Attendance";
      wages.created_by = userId;

      wagesToInsert.push(wages);

      // add bill line (example)
      // billLines.push({
      //   description: `${wages.employeeName} - ${wages.designation}`,
      //   amount: wages.empIctc,
      //   cgst,
      //   sgst,
      //   igst,
      //   total: wages.empInvoiceAmount,
      // });
    }

    const atActualChagesArr = await OtherCharges.find({
      siteId,
      calcOn: "AT ACTUAL",
    }).lean();
    // console.log(atActualChagesArr);

    for (const act of atActualChagesArr) {
      const actualCharge = {
        siteId,
        clientId: siteDetails.clientId,
        clientCode: siteDetails.clientCode,
        attendanceMonth: String(month),
        attendanceYear: String(year),
        attendanceType,
        typeOfServ: act.typeOfServ,
        totalNos: 0,
        costPerHead: 0,
        total: act.charges,
        created_by: userId,
      };
      actualChargesToInsert.push(actualCharge);
    }

    if (wagesToInsert.length > 0) {
      // Use insertMany with session for performance
      await EmpWages.insertMany(wagesToInsert, { session });
      // console.log(wagesToInsert[0]);
    }

    if (actualChargesToInsert.length > 0) {
      // console.log(actualChargesToInsert[0]);
      await AtActualCharges.insertMany(actualChargesToInsert, { session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Invoice generated successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error generating invoice:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

function formatDateForExcel(val) {
  if (!val && val !== 0) return "";
  if (val instanceof Date && !isNaN(val.getTime())) {
    const d = val;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  return String(val);
}

exports.saveBillsAndOrders = async (req, res) => {
  // console.log(req.body);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      clientDetails,
      siteDetails,
      empRows,
      queryParams,
      order_info,
      order_info_pf,
      order_info_pt,
      order_info_ot,
      order_info_esic,
      order_info_bonus,
      order_info_service_charges,
      atactual_charges,
      grossAmount,
    } = req.body;
    const invoicePrefix = clientDetails?.billingCompany?.invoicePrefix;
    // console.log(invoicePrefix);

    if (!order_info) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required data" });
    }

    const currentYear = new Date().getFullYear();
    const nextYearShort = String(currentYear + 1).slice(-2);
    let billData = await Bill.findOne({}, { autoNo: 1 })
      .sort({ created_on: -1 })
      .session(session);

    let invoiceNo, lastInvoice;
    if (billData) {
      lastInvoice = billData.autoNo + 1;
      invoiceNo = `${
        invoicePrefix || "SV"
      } / ${lastInvoice} / ${currentYear}-${nextYearShort}`;
    } else {
      const lastCount = await Bill.countDocuments().session(session);
      lastInvoice = lastCount + 1;
      invoiceNo = `${
        invoicePrefix || "SV"
      } / ${lastInvoice} / ${currentYear}-${nextYearShort}`;
    }

    let invoiceMonth = empRows.attendanceMonth;
    let invoiceYear = empRows.attendanceYear;
    let invoiceDate = new Date();

    let invoiceFrom = new Date(Date.UTC(invoiceYear, invoiceMonth - 1, 1));
    let invoiceTo = new Date(Date.UTC(invoiceYear, invoiceMonth, 0));

    const ordersToInsert = [];

    const extraArrays = {
      order_info_pf,
      order_info_pt,
      order_info_ot,
      order_info_esic,
      order_info_bonus,
      order_info_service_charges,
      atactual_charges,
    };

    for (const [key, arr] of Object.entries(extraArrays)) {
      if (!arr || arr.length === 0) continue;
      // console.log(arr, "exA");
      if (arr[0].total > 0) {
        const order = {
          clientId: clientDetails._id,
          siteId: siteDetails._id,
          type: arr[0].label,
          invoiceNo,
          invoiceDate,
          invoiceMonth,
          invoiceYear,
          invoiceFrom,
          invoiceTo,
          autoNo: lastInvoice,
          totalNos: arr[0].total_nos,
          total: arr[0].total,
          sacCode: clientDetails.sacCode,
          created_by: req.user.id,
        };

        ordersToInsert.push(order);
      }
    }
    for (const row of order_info) {
      if (!row._id) continue;
      // console.log(row, "oi");
      const order = {
        clientId: clientDetails._id,
        siteId: siteDetails._id,
        type: row.rank,
        invoiceNo,
        invoiceDate,
        invoiceMonth,
        invoiceYear,
        invoiceFrom,
        invoiceTo,
        autoNo: lastInvoice,
        totalNos: row.totaldays,
        costPerHead: row.gross,
        total: row.total,
        sacCode: clientDetails.sacCode,
        created_by: req.user.id,
      };

      ordersToInsert.push(order);
    }

    if (ordersToInsert.length > 0) {
      // console.log(ordersToInsert);
      await Orders.insertMany(ordersToInsert, { session });
    }

    const cgst = safeNumber(siteDetails.cgst || 0);
    const sgst = safeNumber(siteDetails.sgst || 0);
    const igst = safeNumber(siteDetails.igst || 0);
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let finalAmount = grossAmount;
    const decimalPoint = siteDetails.roundOffAmount ? 0 : 2;
    // console.log(cgst, sgst, igst, decimalPoint);

    if (cgst > 0 && sgst > 0) {
      cgstAmount = roundValue((grossAmount * (cgst || 0)) / 100, decimalPoint);
      sgstAmount = roundValue((grossAmount * (sgst || 0)) / 100, decimalPoint);
      finalAmount = roundValue(
        grossAmount + cgstAmount + sgstAmount,
        decimalPoint
      );
    } else {
      igstAmount = roundValue((grossAmount * (igst || 0)) / 100, decimalPoint);
      finalAmount = roundValue(grossAmount + igstAmount, decimalPoint);
    }

    const bill = {
      clientId: clientDetails._id,
      siteId: siteDetails._id,
      invoiceNo,
      invoiceDate,
      invoiceMonth,
      invoiceYear,
      invoiceFrom,
      invoiceTo,
      autoNo: lastInvoice,
      totalCostWithoutGST: grossAmount,
      cgstPerc: cgst,
      cgst: cgstAmount,
      sgstPerc: sgst,
      sgst: sgstAmount,
      igstPerc: igst,
      igst: igstAmount,
      finalAmount,
      billingType: empRows.billingType,
      created_by: req.user.id,
    };

    const billDoc = new Bill(bill);
    // console.log(billDoc);
    await billDoc.save({ session });

    const attendanceData = await Attendance.updateMany(
      queryParams,
      {
        $set: {
          invoiceStatus: "Generated",
          modified_by: req.user.id,
          modified_on: new Date(),
        },
      },
      { session }
    );

    // console.log(attendanceData);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: "Generated successfully" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error while generating invoice:", err);
    res.status(500).json({
      success: false,
      message: "Failed to generate",
      error: err.message,
    });
  }
};

exports.exportAttendanceToExcel = async (req, res) => {
  try {
    const { searchFields, month, year } = req.query;
    let query = { active: 0 };

    if (searchFields) {
      const fields = JSON.parse(searchFields);
      fields.forEach((field) => {
        if (field.field && field.keyword) {
          query[field.field] = new RegExp(field.keyword, "i");
        }
      });
    }

    if (month) {
      query.month = Number(month);
    }

    if (year) {
      query.year = Number(year);
    }

    const attendanceData = await Attendance.find(query)
      .populate("created_by", "name")
      .populate({
        path: "siteId",
        select: "siteName clientId contactPersonName emailId address contactNo",
      })
      .sort({ year: -1, month: -1, created_on: -1 });

    const headers = [
      "SR NO",
      "CLIENT CODE",
      "EMPLOYEE NAME",
      "EMPLOYEE CODE",
      "SITE NAME",
      "DESIGNATION/RANK",
      "MONTH",
      "YEAR",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "20",
      "21",
      "22",
      "23",
      "24",
      "25",
      "26",
      "27",
      "28",
      "29",
      "30",
      "31",
      "TOTAL N.D.",
      "TOTAL O.T.",
      "TOTAL OFF",
      "HOLIDAY",
      "TOTAL",
      "CREATED BY",
      "CREATED ON",
    ];
    // Dynamically add day headers 1-31
    const mapTempToRow = (e, index) => {
      const row = [];

      // SR NO
      row.push(index + 1);

      // Basic Columns
      row.push(e.clientCode || "");
      row.push(e.employeeName || "");
      row.push(e.employeeCode || "");
      row.push(e.siteId?.siteName || "");
      row.push(e.designation || "");
      row.push(e.month || "");
      row.push(e.year || "");

      // Attendance (1–31)
      for (let day = 1; day <= 31; day++) {
        const val = e.attendance?.get(String(day)) || ""; // get() because it's a Map
        row.push(val);
      }

      row.push(e.totalPresentDays || 0);
      row.push(e.totalOT || 0);
      row.push(e.totalWeekOffs || 0);
      row.push(e.totalHolidays || 0);
      row.push(e.total || 0);

      row.push(e.created_by?.name || "");
      row.push(e.created_on ? formatDateForExcel(e.created_on) : "");

      return row;
    };

    const tempRows = attendanceData.map((temp, index) =>
      mapTempToRow(temp, index)
    );

    const sheetData = [headers, ...tempRows];

    const worksheet = xlsx.utils.aoa_to_sheet(sheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "AttendanceData");

    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `AttendanceData_${randomNumber}.xlsx`;

    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error exporting filtered attendance data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.exportAttendancePrintDownload = async (req, res) => {
  try {
    const { siteId, month, year, attendanceType } = req.query;

    if (!siteId || !month || !year || !attendanceType) {
      return res.status(400).json({
        success: false,
        message: "Missing required query parameters",
      });
    }
    const attendanceData = await Attendance.find({
      siteId,
      month,
      year,
      attendanceType,
    })
      .populate("created_by", "name")
      .populate({
        path: "siteId",
        select: "siteName ",
        populate: {
          path: "clientId",
          select: "companyName",
          populate: {
            path: "billingCompany",
            select:
              "companyName address city regionState pinCode emailId contactNo",
          },
        },
      });

    const headers = [
      "SR NO",
      "CLIENT CODE",
      "EMPLOYEE NAME",
      "EMPLOYEE CODE",
      "SITE NAME",
      "DESIGNATION/RANK",
      "MONTH",
      "YEAR",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "20",
      "21",
      "22",
      "23",
      "24",
      "25",
      "26",
      "27",
      "28",
      "29",
      "30",
      "31",
    ];

    const mapTempToRow = (e, index) => {
      const row = [];

      row.push(index + 1);

      row.push(e.clientCode || "");
      row.push(e.employeeName || "");
      row.push(e.employeeCode || "");
      row.push(e.siteId?.siteName || "");
      row.push(e.designation || "");
      row.push(e.month || "");
      row.push(e.year || "");

      for (let day = 1; day <= 31; day++) {
        const val = e.attendance?.get(String(day)) || ""; // get() because it's a Map
        row.push(val);
      }
      return row;
    };

    const tempRows = attendanceData.map((temp, index) =>
      mapTempToRow(temp, index)
    );

    const sheetData = [headers, ...tempRows];

    const worksheet = xlsx.utils.aoa_to_sheet(sheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `Attendance_${randomNumber}.xlsx`;

    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error exporting filtered attendance data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.exportAttendancePrint = async (req, res) => {
  try {
    const { siteId, month, year, attendanceType } = req.query;

    if (!siteId || !month || !year || !attendanceType) {
      return res.status(400).json({
        success: false,
        message: "Missing required query parameters",
      });
    }
    const printRecords = await Attendance.find({
      siteId,
      month,
      year,
      attendanceType,
    })
      .populate("created_by", "name")
      .populate({
        path: "siteId",
        select: "siteName ",
        populate: {
          path: "clientId",
          select: "companyName",
          populate: {
            path: "billingCompany",
            select: "companyName address city state pinCode emailId contactNo",
          },
        },
      });

    // console.log(printRecords);

    const headers = [
      "SR NO",
      "EMPLOYEE NAME",
      "EMPLOYEE CODE",
      "DESIGNATION/RANK",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "20",
      "21",
      "22",
      "23",
      "24",
      "25",
      "26",
      "27",
      "28",
      "29",
      "30",
      "31",
      "N.D.",
      "O.T.",
      "O.T./HRS",
      "OFF",
      "HOLIDAY",
      "TOTAL",
    ];

    const mapTempToRow = (e, index) => {
      const row = [];
      row.push(index + 1);
      row.push(e.employeeName || "");
      row.push(e.employeeCode || "");
      row.push(e.designation || "");
      for (let day = 1; day <= 31; day++) {
        const val = e.attendance?.get(String(day)) || ""; // get() because it's a Map
        row.push(val);
      }
      row.push(e.totalPresentDays || 0);
      row.push(e.totalOT || 0);
      row.push(e.totalOTHour || 0);
      row.push(e.totalWeekOffs || 0);
      row.push(e.totalHolidays || 0);
      row.push(e.total || 0);
      return row;
    };

    const totalRow = [];

    totalRow.push("");
    totalRow.push("TOTAL");
    totalRow.push("");
    totalRow.push("");

    for (let day = 1; day <= 31; day++) {
      const dayStr = String(day);
      const countForDay = printRecords.reduce((sum, rec) => {
        const v = rec.attendance?.get(dayStr);
        return sum + (v === "P" ? 1 : 0);
      }, 0);
      totalRow.push(countForDay);
    }

    totalRow.push(
      printRecords.reduce((sum, r) => sum + (r.totalPresentDays || 0), 0)
    );
    totalRow.push(printRecords.reduce((sum, r) => sum + (r.totalOT || 0), 0));
    totalRow.push(
      printRecords.reduce((sum, r) => sum + (r.totalOTHour || 0), 0)
    );
    totalRow.push(
      printRecords.reduce((sum, r) => sum + (r.totalWeekOffs || 0), 0)
    );
    totalRow.push(
      printRecords.reduce((sum, r) => sum + (r.totalHolidays || 0), 0)
    );
    totalRow.push(printRecords.reduce((sum, r) => sum + (r.total || 0), 0));

    const tempRows = printRecords.map((temp, index) =>
      mapTempToRow(temp, index)
    );
    // console.log(tempRows);

    const sheetData = [headers, ...tempRows, totalRow];

    const worksheet = xlsx.utils.aoa_to_sheet(sheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "AttendancePrint");

    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `AttendancePrint_${randomNumber}.xlsx`;

    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // console.log(printRecords);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

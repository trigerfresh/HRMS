const EmpWages = require("./EmpWages");
const AtActualCharges = require("./AtActualCharges");

exports.getEmpWagesForOrderInfo = async (siteId, month, year, atType) => {
  return await EmpWages.aggregate([
    {
      $match: {
        siteId,
        attendanceMonth: String(month),
        attendanceYear: String(year),
        attendanceType: atType,
        netDays: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: "$designation",
        rank: { $first: "$designation" },
        total_nos: { $sum: 1 },
        gross: { $first: "$gross" },
        totaldays: { $sum: "$netDays" },
        total: { $sum: "$earnedGross" },
      },
    },
    {
      $project: {
        _id: 1,
        rank: 1,
        total_nos: 1,
        totaldays: 1,
        gross: { $round: ["$gross", 2] },
        total: { $round: ["$total", 2] },
      },
    },
  ]);
};

exports.getEmpWagesForOrderInfoRokada = async (siteId, month, year, atType) => {
  return await EmpWages.aggregate([
    {
      $match: {
        siteId,
        attendanceMonth: String(month),
        attendanceYear: String(year),
        attendanceType: atType,
      },
    },
    {
      $group: {
        _id: null,
        total_nos: { $sum: "$totalNos" },
        total: { $sum: { $subtract: ["$earnedGross", "$earnedOtWages"] } },
        billing_type: { $first: "$billingType" },
      },
    },
  ]);
};

exports.getEmpWagesPF = async (siteId, month, year, atType) => {
  return await EmpWages.aggregate([
    {
      $match: {
        siteId,
        attendanceMonth: String(month),
        attendanceYear: String(year),
        attendanceType: atType,
        netDays: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        total_nos: { $sum: 1 },
        total: { $sum: "$empPf" },
      },
    },
  ]);
};

exports.getEmpWagesPT = async (siteId, month, year, atType) => {
  return await EmpWages.aggregate([
    {
      $match: {
        siteId,
        attendanceMonth: String(month),
        attendanceYear: String(year),
        attendanceType: atType,
        netDays: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        total_nos: {
          $sum: {
            $cond: [{ $gt: ["$deductPt", 0] }, 1, 0],
          },
        },
        total: { $sum: "$deductPt" },
      },
    },
  ]);
};

exports.getEmpWagesOT = async (siteId, month, year, atType) => {
  return await EmpWages.aggregate([
    {
      $match: {
        siteId,
        attendanceMonth: String(month),
        attendanceYear: String(year),
        attendanceType: atType,
        netDays: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$earnedOtWages" },
        total_nos: { $sum: "$otDays" },
        ot_rate: { $first: "$otRate" },
      },
    },
  ]);
};

exports.getEmpWagesESIC = async (siteId, month, year, atType) => {
  return await EmpWages.aggregate([
    {
      $match: {
        siteId,
        attendanceMonth: String(month),
        attendanceYear: String(year),
        attendanceType: atType,
        netDays: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        total_nos: { $sum: 1 },
        total: { $sum: "$empEsic" },
      },
    },
  ]);
};

exports.getEmpWagesBonus = async (siteId, month, year, atType) => {
  return await EmpWages.aggregate([
    {
      $match: {
        siteId,
        attendanceMonth: String(month),
        attendanceYear: String(year),
        attendanceType: atType,
        netDays: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        total_nos: { $sum: 1 },
        total: { $sum: "$bonus" },
      },
    },
  ]);
};

exports.getEmpWagesServiceCharges = async (siteId, month, year, atType) => {
  return await EmpWages.aggregate([
    {
      $match: {
        siteId,
        attendanceMonth: String(month),
        attendanceYear: String(year),
        attendanceType: atType,
        netDays: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        total_nos: { $sum: 1 },
        total: { $sum: "$empServiceCharges" },
      },
    },
  ]);
};

exports.getATActualChargesBySite = async (siteId, month, year, atType) => {
  return await AtActualCharges.find({
    siteId,
    attendanceMonth: String(month),
    attendanceYear: String(year),
    attendanceType: atType,
  }).lean();
};

exports.getEmpWagesForBillingWithoutRank = async (
  siteId,
  month,
  year,
  atType
) => {
  return await EmpWages.aggregate([
    {
      $match: {
        siteId,
        attendanceMonth: String(month),
        attendanceYear: String(year),
        attendanceType: atType,
        netDays: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        totaldays: { $sum: "$netDays" },
        total: { $sum: "$empCtc" },
      },
    },
  ]);
};

const Attendance = require("../models/Attendance");
const Bill = require("../models/Bill");
const Client = require("../models/Client");
const Orders = require("../models/Orders");
const PaymentHistory = require("../models/PaymentHistory");
const mongoose = require("mongoose");
const SiteDetail = require("../models/SiteDetail");

const safeNumber = (v) =>
  v === undefined || v === null || v === "" ? 0 : Number(v);

const roundValue = (value, decimalPoint) => {
  const v = Number(value || 0);
  if (!isFinite(v)) return 0;
  return Number(v.toFixed(decimalPoint));
};

const normalizeDate = (dateString) => {
  if (!dateString) return null;
  const onlyDate = dateString.split("T")[0];
  const [y, m, d] = onlyDate.split("-");
  return new Date(Date.UTC(y, m - 1, d));
};

exports.billsList = async (req, res) => {
  try {
    const { searchFields, month, year } = req.query;

    let billMatch = { active: 0 };
    let clientMatch = {};
    let siteMatch = {};

    //   SAFE SEARCHFIELD PARSING
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
        if (item.field === "salesPersonName") {
          siteMatch["site.salesPersonName"] = new RegExp(item.keyword, "i");
        } else if (item.field === "clientCode") {
          siteMatch["site.clientCode"] = new RegExp(item.keyword, "i");
        } else if (item.field === "siteName") {
          siteMatch["site.siteName"] = new RegExp(item.keyword, "i");
        } else if (item.field === "siteContactPerson") {
          siteMatch["site.contactPersonName"] = new RegExp(item.keyword, "i");
        }

        //   CLIENT FILTERS
        else if (item.field === "clientEmailId") {
          clientMatch["client.emailId"] = new RegExp(item.keyword, "i");
        } else if (item.field === "clientName") {
          clientMatch["client.companyName"] = new RegExp(item.keyword, "i");
        }

        //   BILL FILTERS
        else {
          billMatch[item.field] = new RegExp(item.keyword, "i");
        }
      });
    }

    //   MONTH & YEAR FILTERS
    if (month) billMatch.invoiceMonth = Number(month);
    if (year) billMatch.invoiceYear = Number(year);

    // console.log("BILL MATCH =>", billMatch);
    // console.log("CLIENT MATCH =>", clientMatch);
    // console.log("SITE MATCH =>", siteMatch);

    const bills = await Bill.aggregate([
      { $match: billMatch },

      //   USER LOOKUP
      {
        $lookup: {
          from: "users",
          localField: "created_by",
          foreignField: "_id",
          as: "created_by",
        },
      },
      { $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } },

      //   CLIENT LOOKUP
      {
        $lookup: {
          from: "clients",
          localField: "clientId",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },

      //   CLIENT FILTER
      ...(Object.keys(clientMatch).length ? [{ $match: clientMatch }] : []),

      //   SITE LOOKUP
      {
        $lookup: {
          from: "sitedetails",
          localField: "siteId",
          foreignField: "_id",
          as: "site",
        },
      },
      { $unwind: { path: "$site", preserveNullAndEmptyArrays: true } },

      //   SALES PERSON / CLIENT CODE FILTER
      ...(Object.keys(siteMatch).length ? [{ $match: siteMatch }] : []),

      //   SORT
      {
        $sort: {
          invoiceYear: -1,
          invoiceMonth: -1,
          created_on: -1,
        },
      },
    ]);

    //   PAYMENTS
    const payments = await PaymentHistory.aggregate([
      { $match: { active: 0 } },
      {
        $group: {
          _id: "$billNo",
          paidAmount: { $sum: "$paidAmount" },
        },
      },
    ]);

    const paidMap = {};
    payments.forEach((p) => {
      paidMap[p._id?.toString()] = p.paidAmount;
    });

    const decimalPoint = bills.site?.roundOffAmount ? 0 : 2;

    const formattedBills = bills.map((bill) => {
      const paidAmount = roundValue(
        paidMap[bill._id.toString()] || 0,
        decimalPoint
      );
      const pendingAmount = roundValue(
        (bill.finalAmount || 0) - paidAmount,
        decimalPoint
      );

      return {
        _id: bill._id,
        invoiceNo: bill.invoiceNo,
        invoiceDate: bill.invoiceDate,
        invoiceMonth: bill.invoiceMonth,
        invoiceYear: bill.invoiceYear,
        invoiceFrom: bill.invoiceFrom,
        invoiceTo: bill.invoiceTo,
        totalCostWithoutGST: bill.totalCostWithoutGST,

        paidAmount,
        pendingAmount,
        cgstPerc: bill.cgstPerc,
        sgstPerc: bill.sgstPerc,
        igstPerc: bill.igstPerc,
        cgst: bill.cgst,
        sgst: bill.sgst,
        igst: bill.igst,
        finalAmount: bill.finalAmount,
        billingType: bill.billingType,

        //   CLIENT
        clientId: bill.client?._id,
        clientName: bill.client?.companyName || "",
        clientEmailId: bill.client?.emailId || "",
        clientContactNo: bill.client?.contactNo || "",

        //   SITE
        siteId: bill.site?._id,
        siteName: bill.site?.siteName || "",
        clientCode: bill.site?.clientCode || "",
        salesPersonName: bill.site?.salesPersonName || "",

        created_by: bill.created_by.name || "",
        created_on: bill.created_on,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedBills.length,
      data: formattedBills,
    });
  } catch (err) {
    console.error("BILLS CONTROLLER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching bills",
    });
  }
};

exports.billByInvNo = async (req, res) => {
  try {
    // console.log(req.query);
    const billInvNo = req.query.billInvNo;

    const bills = await Bill.find({ invoiceNo: billInvNo })
      .populate({
        path: "siteId",
        select: "siteName ",
        populate: {
          path: "clientId",
          select: "companyName",
          populate: {
            path: "billingCompany",
            select: "companyName regionState stateCode gstNo panNo ",
          },
        },
      })
      .populate("created_by", "name")
      .sort({ invoiceYear: -1, invoiceMonth: -1, created_on: -1 });

    // console.log(bills);
    return res.status(200).json({
      success: true,
      bills,
    });
  } catch (err) {
    console.error("Error fetching bills:", err);
    res.status(500).json({ success: false, message: "Error fetching bills" });
  }
};

exports.invoiceDataByInvNo = async (req, res) => {
  try {
    // console.log(req.query, req.body);
    const billInvNo = req.query.invoiceNo;

    const bills = await Bill.find({ invoiceNo: billInvNo })
      .populate({
        path: "siteId",
        select: "siteName ",
      })
      .populate({
        path: "clientId",
        select:
          "companyName address contactPersonName sacCode gstNo billingCompany",
        populate: [
          {
            path: "billingCompany",
            select:
              "companyName address city state pinCode emailId contactNo gstNo",
          },
          {
            path: "companyBankName",
            select: "bankName accountNo branchCity ifsc",
          },
        ],
      })
      .populate("created_by", "name")
      .sort({ invoiceYear: -1, invoiceMonth: -1, created_on: -1 });

    const orders = await Orders.find({ invoiceNo: billInvNo, active: 0 }).sort({
      costPerHead: -1,
    });

    // console.log(bills);
    return res.status(200).json({
      success: true,
      bills,
      orders,
    });
  } catch (err) {
    console.error("Error fetching invoice:", err);
    res.status(500).json({ success: false, message: "Error fetching invoice" });
  }
};

exports.receivePayment = async (req, res) => {
  try {
    const {
      billId,
      paidAmount,
      paymentDate,
      transactionType,
      transactionID,
      bankName,
      tds,
    } = req.body;

    if (!billId)
      return res.status(400).json({ message: "Bill ID is required" });

    const bill = await Bill.findById(billId);
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    let payDate = normalizeDate(paymentDate);
    // Save history entry
    const history = new PaymentHistory({
      billNo: billId,
      paidAmount,
      paymentDate: payDate,
      transactionType,
      transactionID,
      tds,
      bankName,
      created_by: req.user?.id,
    });

    await history.save();

    // console.log(history);

    return res.status(200).json({
      success: true,
      message: "Payment saved",
    });
  } catch (err) {
    console.error("Error receiving payment:", err);
    res
      .status(500)
      .json({ success: false, message: "Error receiving payment" });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const { billId } = req.params;

    const history = await PaymentHistory.find({
      billNo: billId,
      active: 0,
    }).sort({ paymentDate: -1 });

    // console.log(history);
    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching payment history",
    });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const { billData, invoiceForm } = req.body;

    const invoiceDate = normalizeDate(invoiceForm.invoiceDate);
    const invoiceFrom = normalizeDate(invoiceForm.invoiceFrom);
    const invoiceTo = normalizeDate(invoiceForm.invoiceTo);
    const billInvoiceNo = billData.invoiceNo;
    // console.log(
    //   billId,
    //   invoiceForm.invoiceNo,
    //   invoiceDate,
    //   invoiceFrom,
    //   invoiceTo
    // );
    const invoiceNoExist = await Bill.findOne({
      $and: [
        { invoiceNo: invoiceForm.invoiceNo.trim() }, // new invoice no
        { invoiceNo: { $ne: billInvoiceNo } }, // exclude old invoice no
      ],
    });

    if (invoiceNoExist) {
      return res.status(400).json({ message: "Invoice No already exists" });
    }
    await Bill.updateOne(
      { invoiceNo: billInvoiceNo },
      {
        invoiceNo: invoiceForm.invoiceNo.trim(),
        invoiceDate,
        invoiceFrom,
        invoiceTo,
        modified_on: new Date(),
        modified_by: req.user?.id,
      }
    );

    await Orders.updateMany(
      { invoiceNo: billInvoiceNo },
      {
        invoiceNo: invoiceForm.invoiceNo.trim(),
        invoiceDate,
        invoiceFrom,
        invoiceTo,
        modified_on: new Date(),
        modified_by: req.user?.id,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Invoice updated",
    });
  } catch (err) {
    console.error("Error updating invoice:", err);
    res.status(500).json({ success: false, message: "Error updating invoice" });
  }
};

exports.saveNewBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      clientId,
      siteId,
      invoiceDate,
      invoiceMonth,
      invoiceYear,
      totalAmt,
      orders,
    } = req.body;

    // console.log(req.body);
    const clientData = await Client.findById({ _id: clientId })
      .populate({
        path: "billingCompany",
        select: "invoicePrefix",
      })
      .session(session);
    if (!clientData) {
      throw new Error("Client not found ");
    }
    const clientDetails = clientData;
    // console.log(clientDetails);

    const siteData = await SiteDetail.findById({ _id: siteId }).session(
      session
    );
    if (!siteData) {
      throw new Error("Site not found ");
    }
    const siteDetails = siteData;
    // console.log(siteDetails);

    let invoiceFrom = new Date(Date.UTC(invoiceYear, invoiceMonth - 1, 1));
    let invoiceTo = new Date(Date.UTC(invoiceYear, invoiceMonth, 0));

    const currentYear = new Date().getFullYear();
    const nextYearShort = String(currentYear + 1).slice(-2);
    let billData = await Bill.findOne({}, { autoNo: 1 })
      .sort({ created_on: -1 })
      .session(session);

    const invoicePrefix = clientDetails?.invoicePrefix;
    let invoiceNo = req.body.invoiceNo.trim(),
      lastInvoice = billData.autoNo;
    if (!invoiceNo) {
      if (billData) {
        // console.log(billData.autoNo);
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
    }

    const cgst = safeNumber(siteDetails.cgst || 0);
    const sgst = safeNumber(siteDetails.sgst || 0);
    const igst = safeNumber(siteDetails.igst || 0);
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let finalAmount = totalAmt;
    const decimalPoint = siteDetails.roundOffAmount ? 0 : 2;
    // console.log(cgst, sgst, igst, decimalPoint);

    if (cgst > 0 && sgst > 0) {
      cgstAmount = roundValue((totalAmt * (cgst || 0)) / 100, decimalPoint);
      sgstAmount = roundValue((totalAmt * (sgst || 0)) / 100, decimalPoint);
      finalAmount = roundValue(
        totalAmt + cgstAmount + sgstAmount,
        decimalPoint
      );
    } else {
      igstAmount = roundValue((totalAmt * (igst || 0)) / 100, decimalPoint);
      finalAmount = roundValue(totalAmt + igstAmount, decimalPoint);
    }

    const invoiceNoExist = await Bill.findOne({ invoiceNo });
    if (invoiceNoExist) {
      return res.status(400).json({ message: "Invoice No already exists" });
    }

    const bill = {
      clientId,
      siteId,
      invoiceNo,
      invoiceDate,
      invoiceMonth,
      invoiceYear,
      invoiceFrom,
      invoiceTo,
      autoNo: lastInvoice,
      totalCostWithoutGST: totalAmt,
      cgstPerc: cgst,
      cgst: cgstAmount,
      sgstPerc: sgst,
      sgst: sgstAmount,
      igstPerc: igst,
      igst: igstAmount,
      finalAmount,
      billingType: "Customize",
      created_by: req.user.id,
    };

    const ordersToInsert = [];

    for (const row of orders) {
      // console.log(row, "oi");
      const order = {
        clientId,
        siteId,
        type: row.type,
        invoiceNo,
        invoiceDate,
        invoiceMonth,
        invoiceYear,
        invoiceFrom,
        invoiceTo,
        autoNo: lastInvoice,
        totalNos: row.totalNos,
        costPerHead: row.costPerHead,
        total: row.total,
        sacCode: row.sacCode || clientDetails?.sacCode || "",
        created_by: req.user.id,
      };

      ordersToInsert.push(order);
    }

    const billDoc = new Bill(bill);
    // console.log(billDoc);
    await billDoc.save({ session });

    if (ordersToInsert.length > 0) {
      // console.log(ordersToInsert);
      await Orders.insertMany(ordersToInsert, { session });
    }

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      success: true,
      message: "Bill created successfully!",
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.log(e);
    res.status(500).json({ message: "Error creating Bill", error: e.message });
  }
};

exports.saveNewTranspBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      clientId,
      siteId,
      invoiceDate,
      invoiceMonth,
      invoiceYear,
      totalAmt,
      orders,
    } = req.body;

    // console.log(req.body);
    const clientData = await Client.findById({ _id: clientId }).populate({
      path: "billingCompany",
      select: "",
    });
    if (!clientData) {
      throw new Error("Client not found ");
    }
    const clientDetails = clientData;

    const siteData = await SiteDetail.findById({ _id: siteId }).session(
      session
    );
    if (!siteData) {
      throw new Error("Site not found ");
    }
    const siteDetails = siteData;
    // console.log(siteDetails);

    const year = Number(invoiceYear);
    const month = Number(invoiceMonth);

    const invoiceFrom = new Date(Date.UTC(year, month - 1, 1));

    const invoiceTo = new Date(Date.UTC(year, month, 0));

    const currentYear = new Date().getFullYear();
    const nextYearShort = String(currentYear + 1).slice(-2);
    let billData = await Bill.findOne({}, { autoNo: 1 })
      .sort({ created_on: -1 })
      .session(session);

    const invoicePrefix = clientDetails?.billingCompany?.invoicePrefix;
    let invoiceNo = req.body.invoiceNo.trim(),
      lastInvoice = billData.autoNo;
    if (!invoiceNo) {
      if (billData) {
        // console.log(billData.autoNo);
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
    }

    const cgst = safeNumber(siteDetails.cgst || 0);
    const sgst = safeNumber(siteDetails.sgst || 0);
    const igst = safeNumber(siteDetails.igst || 0);
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let finalAmount = totalAmt;
    const decimalPoint = siteDetails.roundOffAmount ? 0 : 2;
    // console.log(cgst, sgst, igst, decimalPoint);

    if (cgst > 0 && sgst > 0) {
      cgstAmount = roundValue((totalAmt * (cgst || 0)) / 100, decimalPoint);
      sgstAmount = roundValue((totalAmt * (sgst || 0)) / 100, decimalPoint);
      finalAmount = roundValue(
        totalAmt + cgstAmount + sgstAmount,
        decimalPoint
      );
    } else {
      igstAmount = roundValue((totalAmt * (igst || 0)) / 100, decimalPoint);
      finalAmount = roundValue(totalAmt + igstAmount, decimalPoint);
    }

    const invoiceNoExist = await Bill.findOne({ invoiceNo });
    if (invoiceNoExist) {
      return res.status(400).json({ message: "Invoice No already exists" });
    }

    const bill = {
      clientId,
      siteId,
      invoiceNo,
      invoiceDate,
      invoiceMonth,
      invoiceYear,
      invoiceFrom,
      invoiceTo,
      autoNo: lastInvoice,
      totalCostWithoutGST: totalAmt,
      cgstPerc: cgst,
      cgst: cgstAmount,
      sgstPerc: sgst,
      sgst: sgstAmount,
      igstPerc: igst,
      igst: igstAmount,
      finalAmount,
      billingType: "Transporter",
      created_by: req.user.id,
    };

    const ordersToInsert = [];

    for (const row of orders) {
      const order = {
        clientId,
        siteId,
        tbDate: row.tbDate,
        invoiceNo,
        invoiceDate,
        invoiceMonth,
        invoiceYear,
        invoiceFrom,
        invoiceTo,
        autoNo: lastInvoice,
        tbFrom: row.tbFrom,
        tbTo: row.tbTo,
        lrNo: row.lrNo,
        tbVehicleNo: row.tbVehicleNo,
        tbWeight: row.tbWeight,
        tbInvoiceNo: row.tbInvoiceNo || "",
        total: row.total,
        sacCode: row.sacCode || "",
        created_by: req.user.id,
      };

      ordersToInsert.push(order);
    }

    const billDoc = new Bill(bill);
    // console.log(billDoc);
    await billDoc.save({ session });

    if (ordersToInsert.length > 0) {
      // console.log(ordersToInsert);
      await Orders.insertMany(ordersToInsert, { session });
    }

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      success: true,
      message: "Bill created successfully!",
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.log(e);
    res.status(500).json({ message: "Error creating Bill", error: e.message });
  }
};

exports.updateNewBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      billInv,
      clientId,
      siteId,
      invoiceDate,
      invoiceMonth,
      invoiceYear,
      invoiceNo,
      totalAmt,
      orders,
    } = req.body;

    const invoiceNoExist = await Bill.findOne({
      $and: [
        { invoiceNo: invoiceNo }, // new invoice no
        { invoiceNo: { $ne: billInv } }, // exclude old invoice no
      ],
    });

    if (invoiceNoExist) {
      return res.status(400).json({ message: "Invoice No already exists" });
    }

    let invoiceFrom = new Date(Date.UTC(invoiceYear, invoiceMonth - 1, 1));
    let invoiceTo = new Date(Date.UTC(invoiceYear, invoiceMonth, 0));

    const bill = await Bill.findOne({ invoiceNo: billInv }).session(session);
    // console.log(bill.totalCostWithoutGST);
    if (!bill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    const siteData = await SiteDetail.findById({ _id: siteId }).session(
      session
    );
    if (!siteData) {
      throw new Error("Site not found ");
    }
    const siteDetails = siteData;
    // console.log(siteDetails);

    const cgst = safeNumber(siteDetails.cgst || 0);
    const sgst = safeNumber(siteDetails.sgst || 0);
    const igst = safeNumber(siteDetails.igst || 0);
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let finalAmount = totalAmt;
    const decimalPoint = siteDetails.roundOffAmount ? 0 : 2;
    // console.log(cgst, sgst, igst, decimalPoint);

    if (cgst > 0 && sgst > 0) {
      cgstAmount = roundValue((totalAmt * (cgst || 0)) / 100, decimalPoint);
      sgstAmount = roundValue((totalAmt * (sgst || 0)) / 100, decimalPoint);
      finalAmount = roundValue(
        totalAmt + cgstAmount + sgstAmount,
        decimalPoint
      );
    } else {
      igstAmount = roundValue((totalAmt * (igst || 0)) / 100, decimalPoint);
      finalAmount = roundValue(totalAmt + igstAmount, decimalPoint);
    }

    bill.clientId = clientId || bill.clientId;
    bill.siteId = siteId || bill.siteId;
    bill.invoiceDate = invoiceDate || bill.invoiceDate;
    bill.invoiceMonth = invoiceMonth || bill.invoiceMonth;
    bill.invoiceYear = invoiceYear || bill.invoiceYear;
    bill.invoiceFrom = invoiceFrom || bill.invoiceFrom;
    bill.invoiceTo = invoiceTo || bill.invoiceTo;
    bill.invoiceNo = invoiceNo.trim() || bill.invoiceNo;
    bill.totalCostWithoutGST = totalAmt;
    bill.cgstPerc = cgst;
    bill.cgst = cgstAmount;
    bill.sgstPerc = sgst;
    bill.sgst = sgstAmount;
    bill.igstPerc = igst;
    bill.igst = igstAmount;
    bill.finalAmount = finalAmount;
    bill.modified_on = new Date();
    bill.modified_by = req.user?.id;
    // console.log(bill);
    // Save bill
    await bill.save({ session });

    if (Array.isArray(orders)) {
      const existingOrder = await Orders.find({ invoiceNo: billInv }).session(
        session
      );

      const existingOrderIds = existingOrder.map((o) => o._id.toString());
      const incomingIds = orders
        .filter((o) => o._id)
        .map((o) => o._id.toString());

      const bulkOps = [];

      for (const o of orders) {
        if (o._id && existingOrderIds.includes(o._id)) {
          bulkOps.push({
            updateOne: {
              filter: { _id: o._id },
              update: {
                $set: {
                  clientId,
                  siteId,
                  invoiceNo: invoiceNo.trim(),
                  invoiceDate,
                  invoiceMonth,
                  invoiceYear,
                  invoiceFrom,
                  invoiceTo,
                  autoNo: bill.autoNo,
                  type: o.type || "",
                  sacCode: o.sacCode || "",
                  totalNos: o.totalNos || 0,
                  costPerHead: o.costPerHead || 0,
                  total: o.total || 0,
                  modified_by: req.user.id,
                  modified_on: new Date(),
                },
              },
            },
          });
        } else {
          bulkOps.push({
            insertOne: {
              document: {
                clientId,
                siteId,
                invoiceNo: invoiceNo.trim(),
                invoiceDate,
                invoiceMonth,
                invoiceYear,
                invoiceFrom,
                invoiceTo,
                autoNo: bill.autoNo,
                type: o.type || "",
                sacCode: o.sacCode || "",
                totalNos: o.totalNos || 0,
                costPerHead: o.costPerHead || 0,
                total: o.total || 0,
                created_by: req.user.id,
                active: 0,
              },
            },
          });
        }
      }

      const ordersToDelete = existingOrderIds.filter(
        (id) => !incomingIds.includes(id)
      );

      if (ordersToDelete.length > 0) {
        bulkOps.push({
          updateMany: {
            filter: {
              _id: { $in: ordersToDelete },
            },
            update: {
              $set: {
                active: 1,
                disabled_by: req.user.id,
                disabled_on: new Date(),
              },
            },
          },
        });
      }

      // console.log(JSON.stringify(bulkOps, null, 2));
      if (bulkOps.length) await Orders.bulkWrite(bulkOps, { session });
    }

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      success: true,
      message: "Bill updated successfully!",
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.log(e);
    res.status(500).json({ message: "Error updating Bill", error: e.message });
  }
};

exports.updateTranspNewBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      billInv,
      clientId,
      siteId,
      invoiceDate,
      invoiceMonth,
      invoiceYear,
      invoiceNo,
      totalAmt,
      orders,
    } = req.body;

    // console.log(req.body);

    const invoiceNoExist = await Bill.findOne({
      $and: [
        { invoiceNo: invoiceNo }, // new invoice no
        { invoiceNo: { $ne: billInv } }, // exclude old invoice no
      ],
    });

    if (invoiceNoExist) {
      return res.status(400).json({ message: "Invoice No already exists" });
    }

    let invoiceFrom = new Date(Date.UTC(invoiceYear, invoiceMonth - 1, 1));
    let invoiceTo = new Date(Date.UTC(invoiceYear, invoiceMonth, 0));

    // console.log(orders);
    const bill = await Bill.findOne({ invoiceNo: billInv }).session(session);
    if (!bill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    const siteData = await SiteDetail.findById({ _id: siteId }).session(
      session
    );
    if (!siteData) {
      throw new Error("Site not found ");
    }
    const siteDetails = siteData;
    // console.log(siteDetails);

    const cgst = safeNumber(siteDetails.cgst || 0);
    const sgst = safeNumber(siteDetails.sgst || 0);
    const igst = safeNumber(siteDetails.igst || 0);
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let finalAmount = totalAmt;
    const decimalPoint = siteDetails.roundOffAmount ? 0 : 2;
    // console.log(cgst, sgst, igst, decimalPoint);

    if (cgst > 0 && sgst > 0) {
      cgstAmount = roundValue((totalAmt * (cgst || 0)) / 100, decimalPoint);
      sgstAmount = roundValue((totalAmt * (sgst || 0)) / 100, decimalPoint);
      finalAmount = roundValue(
        totalAmt + cgstAmount + sgstAmount,
        decimalPoint
      );
    } else {
      igstAmount = roundValue((totalAmt * (igst || 0)) / 100, decimalPoint);
      finalAmount = roundValue(totalAmt + igstAmount, decimalPoint);
    }

    bill.clientId = clientId || bill.clientId;
    bill.siteId = siteId || bill.siteId;
    bill.invoiceDate = invoiceDate || bill.invoiceDate;
    bill.invoiceMonth = invoiceMonth || bill.invoiceMonth;
    bill.invoiceYear = invoiceYear || bill.invoiceYear;
    bill.invoiceFrom = invoiceFrom || bill.invoiceFrom;
    bill.invoiceTo = invoiceTo || bill.invoiceTo;
    bill.invoiceNo = invoiceNo.trim() || bill.invoiceNo;
    bill.totalCostWithoutGST = totalAmt;
    bill.cgstPerc = cgst;
    bill.cgst = cgstAmount;
    bill.sgstPerc = sgst;
    bill.sgst = sgstAmount;
    bill.igstPerc = igst;
    bill.igst = igstAmount;
    bill.finalAmount = finalAmount;
    bill.modified_on = new Date();
    bill.modified_by = req.user?.id;
    // console.log(bill);
    // Save bill
    await bill.save({ session });

    if (Array.isArray(orders)) {
      const existingOrder = await Orders.find({ invoiceNo: billInv }).session(
        session
      );

      const existingOrderIds = existingOrder.map((o) => o._id.toString());
      const incomingIds = orders
        .filter((o) => o._id)
        .map((o) => o._id.toString());

      const bulkOps = [];

      for (const o of orders) {
        if (o._id && existingOrderIds.includes(o._id)) {
          bulkOps.push({
            updateOne: {
              filter: { _id: o._id },
              update: {
                $set: {
                  clientId,
                  siteId,
                  invoiceNo: invoiceNo.trim(),
                  invoiceDate,
                  invoiceMonth,
                  invoiceYear,
                  invoiceFrom,
                  invoiceTo,
                  autoNo: bill.autoNo,
                  tbDate: o.tbDate || "",
                  sacCode: o.sacCode || "",
                  tbFrom: o.tbFrom,
                  tbTo: o.tbTo,
                  lrNo: o.lrNo,
                  tbVehicleNo: o.tbVehicleNo,
                  tbWeight: o.tbWeight,
                  tbInvoiceNo: o.tbInvoiceNo,
                  total: o.total || 0,
                  modified_by: req.user.id,
                  modified_on: new Date(),
                },
              },
            },
          });
        } else {
          bulkOps.push({
            insertOne: {
              document: {
                clientId,
                siteId,
                invoiceNo: invoiceNo.trim(),
                invoiceDate,
                invoiceMonth,
                invoiceYear,
                invoiceFrom,
                invoiceTo,
                autoNo: bill.autoNo,
                tbDate: o.tbDate || "",
                sacCode: o.sacCode || "",
                tbFrom: o.tbFrom,
                tbTo: o.tbTo,
                lrNo: o.lrNo,
                tbVehicleNo: o.tbVehicleNo,
                tbWeight: o.tbWeight,
                tbInvoiceNo: o.tbInvoiceNo,
                total: o.total || 0,
                created_by: req.user.id,
                active: 0,
              },
            },
          });
        }
      }

      const ordersToDelete = existingOrderIds.filter(
        (id) => !incomingIds.includes(id)
      );

      if (ordersToDelete.length > 0) {
        bulkOps.push({
          updateMany: {
            filter: {
              _id: { $in: ordersToDelete },
            },
            update: {
              $set: {
                active: 1,
                disabled_by: req.user.id,
                disabled_on: new Date(),
              },
            },
          },
        });
      }

      // console.log(JSON.stringify(bulkOps, null, 2));
      if (bulkOps.length) await Orders.bulkWrite(bulkOps, { session });
    }

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      success: true,
      message: "Bill updated successfully!",
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.log(e);
    res.status(500).json({ message: "Error updating Bill", error: e.message });
  }
};

exports.deletePaymentHist = async (req, res) => {
  try {
    // console.log(req.user);
    const updatedPayHist = await PaymentHistory.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          active: 1,
          disabled_on: new Date(),
          disabled_by: req.user?.id,
        },
      },
      { new: true }
    );

    if (!updatedPayHist) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.status(200).json({
      message: "Receipt deleted successfully",
    });
  } catch (error) {
    console.error("DEACTIVATE PAYMENT FAILED:", error);
    res.status(500).json({
      message: "Deleting payment failed!",
      error: error.message,
    });
  }
};

exports.deleteBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // console.log(req.body);
    const query = {
      siteId: req.body.siteId,
      month: req.body.invoiceMonth,
      year: req.body.invoiceYear,
    };
    const updatedBill = await Bill.findByIdAndUpdate(
      req.body._id,
      {
        $set: {
          active: 1,
          disabled_on: new Date(),
          disabled_by: req.user?.id,
        },
      },
      { new: true, session }
    );

    if (!updatedBill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const attendanceData = await Attendance.updateMany(query, {
      $set: {
        invoiceStatus: "Pending",
        modified_by: req.user.id,
        modified_on: new Date(),
      },
    }).session(session);

    // console.log(query, attendanceData);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Bill deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("DEACTIVATE PAYMENT FAILED:", error);
    res.status(500).json({
      message: "Deleting payment failed!",
      error: error.message,
    });
  }
};

const mongoose = require("mongoose");
const xlsx = require("xlsx");
const PurchaseBills = require("../models/PurchaseBills");
const PurchaseBillsProduct = require("../models/PurchaseBillsProduct");
const PurchaseBillPaymentHistory = require("../models/PurchaseBillPaymentHistory");

const to2 = (val) => Number((Number(val) || 0).toFixed(2));

exports.getPurchaseBillInvoiceNo = async (req, res) => {
  try {
    const purchaseBillData = await PurchaseBills.findOne(
      {},
      { autoNo: 1 },
    ).sort({
      created_on: -1,
    });
    let invoiceNo, lastInvoice;
    // console.log(purchaseBillData);

    if (purchaseBillData) {
      lastInvoice = purchaseBillData.autoNo + 1;
      invoiceNo = lastInvoice;
    } else {
      const lastCount = await PurchaseBills.countDocuments();
      lastInvoice = lastCount + 1;
      invoiceNo = lastInvoice;
    }
    // console.log(invoiceNo);
    return res.json({
      success: true,
      invoiceNo,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching invoice no", error: error.message });
  }
};

exports.getPurchaseBills = async (req, res) => {
  try {
    const { searchFields, fromDate, toDate } = req.query;

    let query = { active: 0 };

    if (searchFields) {
      const fields = JSON.parse(searchFields);
      fields.forEach((field) => {
        if (field.field && field.keyword) {
          query[field.field] = new RegExp(field.keyword, "i");
        }
      });
    }

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // include the entire end day

      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        query.created_on = { $gte: from, $lte: to };
      }
    }

    const bills = await PurchaseBills.find(query)
      // .populate("fromId")
      .populate("created_by", "name")
      .sort({ created_on: -1 });

    const billAndProducts = await Promise.all(
      bills.map(async (bill) => {
        const productDetails = await PurchaseBillsProduct.find({
          purchaseBillId: bill._id,
          active: 0,
        });
        return { ...bill.toObject(), productDetails };
      }),
    );

    // console.log(billProducts, "ASa");
    res.status(200).json(billAndProducts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching purchase bills", error: error.message });
  }
};

exports.getPurchaseBillById = async (req, res) => {
  try {
    // console.log(req.params, "get123");
    const { billId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return res.status(400).json({ message: "Invalid Bill ID" });
    }

    const bills = await PurchaseBills.find({
      _id: billId,
      active: 0,
    })
      .populate(
        "fromId",
        "companyName emailId address regionState stateCode contactNo gstNo",
      )
      .populate("toId")
      .populate("created_by", "name")
      .sort({ created_on: -1 });

    const productDetails = await PurchaseBillsProduct.find({
      purchaseBillId: billId,
      active: 0,
    });

    // console.log(billProducts, "ASa");
    res.status(200).json({
      success: true,
      bills,
      productDetails,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching purchase bills", error: error.message });
  }
};

exports.createPurchaseBill = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const userId = req.user.id;
    const { formData, productDetails } = req.body;
    if (!formData || !productDetails?.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload",
      });
    }
    // console.log(formData, productDetails);

    let grossAmount = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalGST = 0;

    // ✅ CREATE PURCHASE BILL FIRST (without totals)
    const purchaseBill = await PurchaseBills.create(
      [
        {
          ...formData,
          created_by: userId,
        },
      ],
      { session },
    );

    const purchaseBillId = purchaseBill[0]._id;

    // ✅ PROCESS PRODUCTS
    const productDocs = [];

    for (let p of productDetails) {
      const discountAmt = (p.amount * p.discount) / 100;
      // console.log("disAmt", discountAmt);
      const discountedAmt = p.amount - discountAmt;
      // console.log("discountedAmt", discountedAmt);
      let cgstAmt = 0;
      let sgstAmt = 0;
      let igstAmt = 0;

      if (Number(p.IGST) > 0) {
        igstAmt = (discountedAmt * Number(p.IGST) || 0) / 100;
      } else {
        cgstAmt = (discountedAmt * Number(p.CGST || 0)) / 100;
        sgstAmt = (discountedAmt * Number(p.SGST || 0)) / 100;
      }

      cgstAmt = to2(cgstAmt);
      sgstAmt = to2(sgstAmt);
      igstAmt = to2(igstAmt);
      grossAmount += p.amount;
      totalDiscount += discountAmt;
      totalTaxable += discountedAmt;
      totalGST += cgstAmt + sgstAmt + igstAmt;

      productDocs.push({
        purchaseBillId,
        productName: p.productName,
        hsn: p.hsn,
        quantity: p.quantity,
        rate: p.rate,
        amount: p.amount,
        discount: p.discount,
        discountAmt,
        discountedAmt,
        CGST: p.CGST,
        SGST: p.SGST,
        IGST: p.IGST,
        cgstAmt,
        sgstAmt,
        igstAmt,
        created_by: userId,
      });
    }

    // console.log(productDocs);
    // ✅ SAVE PRODUCTS
    await PurchaseBillsProduct.insertMany(productDocs, { session });

    // console.log(totalTaxable, totalGST);
    let finalAmount = totalTaxable + totalGST;

    let freightCharges = formData.freightPercentage
      ? (finalAmount * Number(formData.freightPercentage || 0)) / 100
      : Number(formData.freightCharges) || 0;
    let handlingCharges = formData.handlingPercentage
      ? (finalAmount * Number(formData.handlingPercentage || 0)) / 100
      : Number(formData.handlingCharges) || 0;
    let packingCharges = formData.packingPercentage
      ? (finalAmount * Number(formData.packingPercentage || 0)) / 100
      : Number(formData.packingCharges) || 0;
    // ✅ convert to 2 decimal NUMBER for saving
    freightCharges = to2(freightCharges);
    handlingCharges = to2(handlingCharges);
    packingCharges = to2(packingCharges);

    let extraCharges = freightCharges + handlingCharges + packingCharges;
    console.log(extraCharges, finalAmount);
    finalAmount += extraCharges;
    // ✅ ROUND OFF
    const roundedTotal = Math.round(finalAmount);
    const roundOff = to2(Math.abs(roundedTotal - finalAmount));

    // ✅ UPDATE MASTER TOTALS
    await PurchaseBills.findByIdAndUpdate(
      purchaseBillId,
      {
        freightChargAmt: freightCharges,
        handlingChargAmt: handlingCharges,
        packingChargAmt: packingCharges,
        grossAmount,
        discountAmount: totalDiscount,
        discountedAmount: totalTaxable,
        totalGSTAmount: totalGST,
        totalPayableAmount: roundedTotal,
        roundOff,
      },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Purchase bill created successfully",
      data: purchaseBillId,
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating purchase bill: ", e);
    return res
      .status(500)
      .json({ succes: false, message: "Server error", error: e.message });
  }
};

exports.updatePurchaseBill = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const userId = req.user.id;
    const id = req.params.id;
    const { formData, productDetails } = req.body;

    if (!formData || !productDetails?.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload",
      });
    }
    // console.log(formData, productDetails);

    const invoiceNoExist = await PurchaseBills.findOne({
      invoiceNo: formData.invoiceNo,
      _id: { $ne: id },
    });
    if (invoiceNoExist) {
      return res
        .status(400)
        .json({ success: false, message: "Invoice No already exists" });
    }

    // ✅ CREATE PURCHASE BILL FIRST (without totals)
    const purchaseBill = await PurchaseBills.findByIdAndUpdate(
      id,
      {
        ...formData,
        modified_by: userId,
        modified_on: new Date(),
      },
      { new: true, session },
    );

    const purchaseBillId = purchaseBill._id;

    // ✅ DELETE OLD PRODUCTS
    await PurchaseBillsProduct.deleteMany(
      { purchaseBillId: purchaseBillId },
      { session },
    );

    let grossAmount = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalGST = 0;

    // ✅ PROCESS PRODUCTS
    const productDocs = [];

    for (let p of productDetails) {
      const discountAmt = (p.amount * p.discount) / 100;
      // console.log("disAmt", discountAmt);
      const discountedAmt = p.amount - discountAmt;
      // console.log("discountedAmt", discountedAmt);

      let cgstAmt = 0;
      let sgstAmt = 0;
      let igstAmt = 0;

      if (Number(p.IGST) > 0) {
        igstAmt = (discountedAmt * Number(p.IGST || 0)) / 100;
      } else {
        cgstAmt = (discountedAmt * Number(p.CGST || 0)) / 100;
        sgstAmt = (discountedAmt * Number(p.SGST || 0)) / 100;
      }

      cgstAmt = to2(cgstAmt);
      sgstAmt = to2(sgstAmt);
      igstAmt = to2(igstAmt);
      grossAmount += p.amount;
      totalDiscount += discountAmt;
      totalTaxable += discountedAmt;
      totalGST += cgstAmt + sgstAmt + igstAmt;

      productDocs.push({
        purchaseBillId: purchaseBillId,
        productName: p.productName,
        hsn: p.hsn,
        quantity: p.quantity,
        rate: p.rate,
        amount: p.amount,
        discount: p.discount,
        discountAmt,
        discountedAmt,
        CGST: p.CGST,
        SGST: p.SGST,
        IGST: p.IGST,
        cgstAmt,
        sgstAmt,
        igstAmt,
        created_by: userId,
      });
    }

    // console.log(productDocs);
    // ✅ SAVE PRODUCTS
    await PurchaseBillsProduct.insertMany(productDocs, { session });

    // console.log( totalTaxable, totalGST);
    let finalAmount = totalTaxable + totalGST;

    let freightCharges = formData.freightPercentage
      ? (finalAmount * Number(formData.freightPercentage || 0)) / 100
      : Number(formData.freightCharges) || 0;
    let handlingCharges = formData.handlingPercentage
      ? (finalAmount * Number(formData.handlingPercentage || 0)) / 100
      : Number(formData.handlingCharges) || 0;
    let packingCharges = formData.packingPercentage
      ? (finalAmount * Number(formData.packingPercentage || 0)) / 100
      : Number(formData.packingCharges) || 0;
    // ✅ convert to 2 decimal NUMBER for saving
    freightCharges = to2(freightCharges);
    handlingCharges = to2(handlingCharges);
    packingCharges = to2(packingCharges);

    let extraCharges = freightCharges + handlingCharges + packingCharges;
    // console.log(extraCharges, finalAmount);
    finalAmount += extraCharges;
    // ✅ ROUND OFF
    const roundedTotal = Math.round(finalAmount);
    const roundOff = to2(Math.abs(roundedTotal - finalAmount));

    // ✅ UPDATE MASTER TOTALS
    await PurchaseBills.findByIdAndUpdate(
      purchaseBillId,
      {
        freightChargAmt: freightCharges,
        handlingChargAmt: handlingCharges,
        packingChargAmt: packingCharges,
        grossAmount,
        discountAmount: totalDiscount,
        discountedAmount: totalTaxable,
        totalGSTAmount: totalGST,
        totalPayableAmount: roundedTotal,
        roundOff,
      },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Purchase bill updated successfully",
      data: purchaseBillId,
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating purchase bill: ", e);
    return res
      .status(500)
      .json({ succes: false, message: "Server error", error: e.message });
  }
};

exports.payAmt = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      billId,
      paidAmount,
      paidDate,
      transactionType,
      transactionID,
      bankName,
    } = req.body;

    if (!billId)
      return res.status(400).json({ message: "Bill ID is required" });

    const bill = await PurchaseBills.findById(billId).session(session);
    if (!bill)
      return res.status(404).json({ message: "Purchase Bill not found" });

    // Save history entry
    const history = new PurchaseBillPaymentHistory({
      billNo: billId,
      paidAmount,
      paidDate,
      transactionType,
      transactionID,
      bankName,
      created_by: req.user?.id,
    });

    await history.save({ session });

    // console.log(history);

    const recAmt = Number(bill.paidAmt || 0) + paidAmount;

    // console.log(recAmt);
    const purchaseBill = await PurchaseBills.findByIdAndUpdate(
      billId,
      {
        paidAmt: recAmt,
        modified_by: req.user?.id,
        modified_on: new Date(),
      },
      { new: true, session },
    );

    // console.log(purchaseBill);
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Purchase Bill Payment saved",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error paying payment:", err);
    res.status(500).json({ success: false, message: "Error paying payment" });
  }
};

exports.deletePurchaseBill = async (req, res) => {
  try {
    const updatedPurchaseBill = await PurchaseBills.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          active: 1,
          disabled_on: new Date(),
          disabled_by: req.user.id,
        },
      },
      { new: true },
    );

    if (!updatedPurchaseBill) {
      return res.status(404).json({ message: "Purchase bill not found" });
    }

    res.status(200).json({
      message: "Purchase Bill removed successfully",
      bill: updatedPurchaseBill,
    });
  } catch (error) {
    console.error("REMOVE PURCHASE BILL FAILED:", error);
    res.status(500).json({
      message: "Removing purchase bill failed!",
      error: error.message,
    });
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
  // If it's a string, return as-is
  return String(val);
}

exports.exportPurchaseBillsToExcel = async (req, res) => {
  try {
    const { searchFields, fromDate, toDate } = req.query;

    let query = { active: 0 };

    if (searchFields) {
      const fields = JSON.parse(searchFields);
      fields.forEach((field) => {
        if (field.field && field.keyword) {
          query[field.field] = new RegExp(field.keyword, "i");
        }
      });
    }

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      query.created_on = { $gte: from, $lte: to };
    }

    const bills = await PurchaseBills.find(query)
      .populate("created_by", "name")
      .sort({ created_on: -1 });

    // DEFINE HEADERS
    const headers = [
      "Bill No",
      "Company Name",
      "Bill Date",
      "Bill Amount(Rs.)",
      "Paid Amount(Rs.)",
      "GST(Rs.)",
      "Balance Amount(Rs.)",
      "Created On",
    ];

    // PREPARE ROWS
    const excelRows = bills.map((b) => [
      b.invoiceNo || "",
      b.fromName || "",
      b.invoiceDate ? formatDateForExcel(b.invoiceDate) : "",
      b.totalPayableAmount || 0,
      b.paidAmt || 0,
      b.totalGSTAmount || 0,
      (b.totalPayableAmount || 0) - b.paidAmt || 0,
      b.created_on ? formatDateForExcel(b.created_on) : "",
    ]);

    // Final sheet data (headers + rows)
    const finalSheetData = [headers, ...excelRows];

    // CREATE WORKBOOK
    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Purchase Bills");

    // Random 10-digit number
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `PurchaseBills_${randomNumber}.xlsx`;

    // Write to buffer
    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.send(excelBuffer);
  } catch (error) {
    console.error("DOWNLOAD PURCHASE BILLS EXCEL ERROR:", error);
    res.status(500).json({ message: "Failed to download Excel" });
  }
};

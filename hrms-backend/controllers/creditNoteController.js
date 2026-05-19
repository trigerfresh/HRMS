const mongoose = require("mongoose");
const xlsx = require("xlsx");
const CreditNote = require("../models/CreditNote");
const CreditNoteProduct = require("../models/CreditNoteProduct");

const to2 = (val) => Number((Number(val) || 0).toFixed(2));

exports.getCreditNoteInvoiceNo = async (req, res) => {
  try {
    const creditNoteData = await CreditNote.findOne({}, { autoNo: 1 }).sort({
      created_on: -1,
    });
    let invoiceNo, lastInvoice;
    // console.log(creditNoteData);

    if (creditNoteData) {
      lastInvoice = creditNoteData.autoNo + 1;
      invoiceNo = lastInvoice;
    } else {
      const lastCount = await CreditNote.countDocuments();
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

exports.getCreditNote = async (req, res) => {
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

    const notes = await CreditNote.find(query)
      // .populate("fromId")
      .populate("created_by", "name")
      .sort({ created_on: -1 });

    const noteAndProducts = await Promise.all(
      notes.map(async (note) => {
        const productDetails = await CreditNoteProduct.find({
          creditNoteId: note._id,
          active: 0,
        });
        return { ...note.toObject(), productDetails };
      }),
    );

    // console.log(noteAndProducts, "ASa");
    res.status(200).json(noteAndProducts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching credit note", error: error.message });
  }
};

exports.getCreditNoteById = async (req, res) => {
  try {
    // console.log(req.params, "get123");
    const { noteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: "Invalid Note ID" });
    }

    const notes = await CreditNote.findOne({
      _id: noteId,
      active: 0,
    })
      // .populate(
      //   "fromId",
      //   "companyName emailId address regionState stateCode contactNo gstNo",
      // )
      .populate({
        path: "fromId",
        select:
          "companyName emailId address regionState stateCode contactNo gstNo",
        populate: {
          path: "bankDetails",
          select: "bankName accountNo ifsc branchCity",
        },
      })
      .populate("toId")
      .populate("created_by", "name")
      .sort({ created_on: -1 });

    const productDetails = await CreditNoteProduct.find({
      creditNoteId: noteId,
      active: 0,
    });

    // console.log(productDetails, "ASa");
    res.status(200).json({
      success: true,
      notes: notes,
      productDetails,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching credit note", error: error.message });
  }
};

exports.createCreditNote = async (req, res) => {
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

    // ✅ CREATE CREDIT NOTE FIRST (without totals)
    const creditNote = await CreditNote.create(
      [
        {
          ...formData,
          created_by: userId,
        },
      ],
      { session },
    );

    const creditNoteId = creditNote[0]._id;

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

      const totalTaxableAmt = discountedAmt;
      const totalGSTAmt = cgstAmt + sgstAmt + igstAmt;
      const totalAmt = totalTaxableAmt + totalGSTAmt;

      grossAmount += p.amount;
      totalDiscount += discountAmt;
      totalTaxable += discountedAmt;
      totalGST += cgstAmt + sgstAmt + igstAmt;

      productDocs.push({
        creditNoteId,
        description: p.description,
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
        totalAmt,
        created_by: userId,
      });
    }

    // console.log(productDocs);
    // ✅ SAVE PRODUCTS
    await CreditNoteProduct.insertMany(productDocs, { session });

    // ✅ CASH DISCOUNT
    const cashDiscount = Number(formData.cashDiscount) || 0;

    // console.log(cashDiscount, totalTaxable, totalGST);
    let finalAmount = totalTaxable + totalGST - cashDiscount;

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
    await CreditNote.findByIdAndUpdate(
      creditNoteId,
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
      message: "Credit note created successfully",
      data: creditNoteId,
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating credit note: ", e);
    return res
      .status(500)
      .json({ succes: false, message: "Server error", error: e.message });
  }
};

exports.updateCreditNote = async (req, res) => {
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

    const invoiceNoExist = await CreditNote.findOne({
      invoiceNo: formData.invoiceNo,
      _id: { $ne: id },
    });
    if (invoiceNoExist) {
      return res
        .status(400)
        .json({ success: false, message: "Invoice No already exists" });
    }

    // ✅ CREATE CREDIT NOTE FIRST (without totals)
    const creditNote = await CreditNote.findByIdAndUpdate(
      id,
      {
        ...formData,
        modified_by: userId,
        modified_on: new Date(),
      },
      { new: true, session },
    );

    const creditNoteId = creditNote._id;

    // ✅ DELETE OLD PRODUCTS
    await CreditNoteProduct.deleteMany({ creditNoteId }, { session });

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

      const totalTaxableAmt = discountedAmt;
      const totalGSTAmt = cgstAmt + sgstAmt + igstAmt;
      const totalAmt = totalTaxableAmt + totalGSTAmt;

      grossAmount += p.amount;
      totalDiscount += discountAmt;
      totalTaxable += discountedAmt;
      totalGST += cgstAmt + sgstAmt + igstAmt;

      // console.log(
      //   "discountedAmt",
      // grossAmount,
      // totalTaxable,
      // totalDiscount,
      // totalGST,
      //   totalAmt,
      // );
      productDocs.push({
        creditNoteId,
        description: p.description,
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
        totalAmt,
        created_by: userId,
      });
    }

    // console.log(productDocs);
    // ✅ SAVE PRODUCTS
    await CreditNoteProduct.insertMany(productDocs, { session });

    // ✅ CASH DISCOUNT
    const cashDiscount = Number(formData.cashDiscount) || 0;

    // console.log(cashDiscount, totalTaxable, totalGST);
    let finalAmount = totalTaxable + totalGST - cashDiscount;

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
    await CreditNote.findByIdAndUpdate(
      creditNoteId,
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
      message: "Credit note updated successfully",
      data: creditNoteId,
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating credit note: ", e);
    return res
      .status(500)
      .json({ succes: false, message: "Server error", error: e.message });
  }
};

exports.deleteCreditNote = async (req, res) => {
  try {
    const updatedCreditNote = await CreditNote.findByIdAndUpdate(
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

    if (!updatedCreditNote) {
      return res.status(404).json({ message: "Credit note not found" });
    }

    res.status(200).json({
      message: "Credit note removed successfully",
      note: updatedCreditNote,
    });
  } catch (error) {
    console.error("REMOVE CREDIT NOTE FAILED:", error);
    res.status(500).json({
      message: "Removing credit note failed!",
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

exports.exportCreditNoteToExcel = async (req, res) => {
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

    const notes = await CreditNote.find(query)
      .populate("created_by", "name")
      .sort({ created_on: -1 });

    // DEFINE HEADERS
    const headers = [
      "Invoice No",
      "Company Name",
      "Bill Date",
      "Bill Amount(Rs.)",
      "GST(Rs.)",
      "Created On",
    ];

    // PREPARE ROWS
    const excelRows = notes.map((b) => [
      b.invoiceNo || "",
      b.toName || "",
      b.invoiceDate ? formatDateForExcel(b.invoiceDate) : "",
      b.totalPayableAmount || 0,
      b.totalGSTAmount || 0,
      b.created_on ? formatDateForExcel(b.created_on) : "",
    ]);

    // Final sheet data (headers + rows)
    const finalSheetData = [headers, ...excelRows];

    // CREATE WORKBOOK
    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Credit Note");

    // Random 10-digit number
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `CreditNote_${randomNumber}.xlsx`;

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
    console.error("DOWNLOAD CREDIT NOTE EXCEL ERROR:", error);
    res.status(500).json({ message: "Failed to download Excel" });
  }
};

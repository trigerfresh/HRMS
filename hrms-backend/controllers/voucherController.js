const Voucher = require("../models/Voucher");
const mongoose = require("mongoose");
const excelJS = require("exceljs");

exports.listVouchers = async (req, res) => {
  try {
    const status = req.query.status || "approved";
    const vouchers = await Voucher.find({ status })
      .populate("client", "name")
      .populate("site", "siteName")
      .populate("employee", "employeeName")
      .sort({ createdAt: -1 });
    res.json(vouchers); // <----- ALWAYS an array
  } catch (error) {
    res.status(500).json([]); // <----- ALWAYS return an array, even on error
  }
};

exports.createVoucher = async (req, res) => {
  try {
    const data = req.body;
    if (!data.voucherNo || !data.paymentDate || !data.client || !data.site) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    data.createdBy = req.user ? req.user.id : "system";
    const voucher = new Voucher(data);
    await voucher.save();
    res.status(201).json({ message: "Voucher created successfully", voucher });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create voucher", error: error.message });
  }
};

exports.updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!voucher) return res.status(404).json({ message: "Voucher not found" });
    res.json({ message: "Voucher updated", voucher });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update voucher", error: error.message });
  }
};

exports.deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) return res.status(404).json({ message: "Voucher not found" });
    res.json({ message: "Voucher deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete voucher", error: error.message });
  }
};

exports.updateVoucherStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "pending", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const voucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!voucher) return res.status(404).json({ message: "Voucher not found" });
    res.json({ message: `Voucher ${status}`, voucher });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update status", error: error.message });
  }
};
exports.bulkUploadVouchers = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const workbook = new excelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet =
      workbook.getWorksheet("VoucherTemplate") || workbook.worksheets[0];
    const vouchers = [];
    worksheet.eachRow((row, idx) => {
      if (idx === 1) return; // skip header
      const rowData = row.values;
      vouchers.push({
        voucherNo: String(rowData[1] || ""),
        paymentDate: rowData[2],
        client: rowData[3] ? mongoose.Types.ObjectId(rowData[3]) : undefined,
        site: rowData[4] ? mongoose.Types.ObjectId(rowData[4]) : undefined,
        employee: rowData[5] ? mongoose.Types.ObjectId(rowData[5]) : undefined,
        gang: rowData[6],
        type: rowData[7],
        mode: rowData[8],
        particulars: [{ name: rowData[9], amount: rowData[10] }],
        totalPaid: rowData[11],
        company: rowData[12],
        bank: rowData[13],
        status: "pending",
      });
    });
    await Voucher.insertMany(vouchers);
    res.json({ message: `${vouchers.length} vouchers uploaded successfully` });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

exports.downloadTemplate = async (_, res) => {
  try {
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("VoucherTemplate");
    worksheet.columns = [
      { header: "VoucherNo", key: "voucherNo", width: 15 },
      { header: "PaymentDate (YYYY-MM-DD)", key: "paymentDate", width: 18 },
      { header: "ClientID", key: "client", width: 20 },
      { header: "SiteID", key: "site", width: 20 },
      { header: "EmployeeID", key: "employee", width: 20 },
      { header: "Gang", key: "gang", width: 15 },
      { header: "Type", key: "type", width: 15 },
      { header: "Mode", key: "mode", width: 15 },
      { header: "Particular1", key: "particular1", width: 25 },
      { header: "Amount1", key: "amount1", width: 15 },
      { header: "TotalPaid", key: "totalPaid", width: 15 },
      { header: "Company", key: "company", width: 20 },
      { header: "Bank", key: "bank", width: 20 },
    ];
    worksheet.addRow({
      voucherNo: "V001",
      paymentDate: "2025-09-11",
      client: "<clientObjectId>",
      site: "<siteObjectId>",
      employee: "<employeeObjectId>",
      gang: "Gang A",
      type: "p.f.",
      mode: "Cash",
      particular1: "PF Payment",
      amount1: 3000,
      totalPaid: 3000,
      company: "XYZ Pvt Ltd",
      bank: "ICICI",
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="voucher_template.xlsx"'
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).send("Failed to generate template");
  }
};

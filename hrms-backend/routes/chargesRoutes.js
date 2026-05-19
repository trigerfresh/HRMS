// routes/charges.js
const express = require("express");
const router = express.Router();
const Charge = require("../models/Charge");
const authMiddleware = require("../middleware/authMiddleware");
const xlsx = require("xlsx");

// Get all charges with optional search and date filter
// Get all charges with optional search and date filter
router.get("/", authMiddleware, async (req, res) => {
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

    const charges = await Charge.find(query)
      .sort({ created_on: -1 })
      .populate("created_by", "name");

    // 👉 Simple mode (for dropdowns)
    if (req.query.simple === "true") {
      return res.json(
        charges.map((c) => ({
          id: c._id,
          name: c.chargesType, // 👈 "name" म्हणून chargesType परत कर
        }))
      );
    }

    // Full response
    res.json({ data: charges, success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// Create a new charge
router.post("/", authMiddleware, async (req, res) => {
  try {
    // console.log(req.body, req.user);
    const newCharge = { ...req.body };

    newCharge.created_by = req.user.id;
    const charge = new Charge(newCharge);
    console.log(charge);
    await charge.save();
    res.status(201).json({
      data: charge,
      success: true,
      message: "Charge created successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
});

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

router.get("/export", authMiddleware, async (req, res) => {
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

    const charges = await Charge.find(query)
      .sort({ created_on: -1 })
      .populate("created_by", "name");

    // DEFINE HEADERS
    const headers = ["Charges Type", "Label To Display", "Created On"];

    // PREPARE ROWS
    const excelRows = charges.map((c) => [
      c.chargesType || "",
      c.labelToDisplay || "",
      c.created_on ? formatDateForExcel(c.created_on) : "",
    ]);

    // Final sheet data (headers + rows)
    const finalSheetData = [headers, ...excelRows];

    // CREATE WORKBOOK
    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "ChargesType");

    // Random 10-digit number
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `ChargesType_${randomNumber}.xlsx`;

    // Write to buffer
    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(excelBuffer);
  } catch (error) {
    console.error("DOWNLOAD CHARGES TYPE EXCEL ERROR:", error);
    res.status(500).json({ message: "Failed to download Excel" });
  }
});

// Update a charge
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    console.log(req.body);
    const charge = await Charge.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...req.body,
          modified_on: new Date(),
          modified_by: req.user.id,
        },
      },
      { new: true }
    );

    if (!charge) {
      return res
        .status(404)
        .json({ message: "Charge not found", success: false });
    }

    res.json({
      data: charge,
      success: true,
      message: "Charge updated successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
});

// Delete a charge
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const charge = await Charge.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          active: 1,
          disabled_on: new Date(),
          disabled_by: req.user.id,
        },
      },
      { new: true }
    );

    if (!charge) {
      return res
        .status(404)
        .json({ message: "Charge not found", success: false });
    }

    res.json({ message: "Charge deleted successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

module.exports = router;

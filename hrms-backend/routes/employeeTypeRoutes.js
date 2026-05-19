const xlsx = require("xlsx");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const EmployeeType = require("../models/EmployeeType");
const authMiddleware = require("../middleware/authMiddleware"); // Your JWT auth middleware

// GET all with user populate
router.get("/", authMiddleware, async (req, res) => {
  try {
    // console.log(req.user, "employee");
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

    const all = await EmployeeType.find(query)
      .sort({ created_on: -1 })
      .populate("created_by", "name");
    // console.log(all);
    res.json(all);
  } catch (err) {
    res.status(500).json({ message: "Failed to get employee types" });
  }
});

// POST new employee-type with auth
router.post("/", authMiddleware, async (req, res) => {
  try {
    // console.log(req.user, req.body);
    const newEmployeeType = { ...req.body };
    newEmployeeType.created_by = req.user.id;
    // const createdBy = req.user?.id;
    // if (!createdBy || !mongoose.Types.ObjectId.isValid(createdBy)) {
    //   return res.status(400).json({ message: "Invalid or missing user ID" });
    // }
    const name = newEmployeeType.name;
    const exist = await EmployeeType.findOne({ name });
    if (exist)
      return res.status(400).json({ message: "Employee type already exists" });

    const empType = new EmployeeType(newEmployeeType);
    await empType.save();

    // console.log(empType);
    // await empType.populate("createdBy", "name role");
    res.status(201).json(empType);
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ message: "Server error creating employee type" });
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

    const empType = await EmployeeType.find(query)
      .sort({ created_on: -1 })
      .populate("created_by", "name");

    // DEFINE HEADERS
    const headers = ["Employee Type", "Created On"];

    // PREPARE ROWS
    const excelRows = empType.map((e) => [
      e.name || "",
      e.created_on ? formatDateForExcel(e.created_on) : "",
    ]);

    // Final sheet data (headers + rows)
    const finalSheetData = [headers, ...excelRows];

    // CREATE WORKBOOK
    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "EmployeeTypes");

    // Random 10-digit number
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `EmployeeTypes_${randomNumber}.xlsx`;

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
    console.error("DOWNLOAD USERS EXCEL ERROR:", error);
    res.status(500).json({ message: "Failed to download Excel" });
  }
});

// PUT update employee-type name
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updateData = { ...req.body };
    const username = req.user.id;

    const name = updateData.name;
    const exist = await EmployeeType.findOne({
      name,
      _id: { $ne: req.params.id }, // exclude this ID
    });
    if (exist) {
      return res.status(400).json({ message: "Employee type already exists" });
    }

    const updated = await EmployeeType.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...updateData,
          modified_on: new Date(),
          modified_by: username,
        },
      },
      { new: true }
    );
    // ).populate("createdBy", "name role");

    if (!updated) {
      return res.status(404).json({ message: "Employee Type not found" });
    }

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Failed to update employee type" });
  }
});

// DELETE employee-type
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // await EmployeeType.findByIdAndDelete(req.params.id);
    // res.json({ message: "Deleted" });
    const empType = await EmployeeType.findByIdAndUpdate(
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

    if (!empType) {
      return res.status(404).json({ message: "Employee Type not found" });
    }

    res.status(200).json({
      message: "Employee Type deactivated successfully",
    });
  } catch {
    res.status(500).json({ message: "Failed to delete employee type" });
  }
});

module.exports = router;

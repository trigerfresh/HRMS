const xlsx = require("xlsx");
const express = require("express");
const router = express.Router();
const EquipmentType = require("../models/EquipmentType");
const authMiddleware = require("../middleware/authMiddleware"); // Your JWT auth middleware

// GET all with user populate
router.get("/", authMiddleware, async (req, res) => {
  try {
    // console.log(req.user);
    const { searchFields, fromDate, toDate } = req.query;
    let query = { active: 0 };

    if (searchFields) {
      const fields = JSON.parse(searchFields);

      fields.forEach((field) => {
        if (
          field.field &&
          field.keyword !== undefined &&
          field.keyword !== null
        ) {
          const value = String(field.keyword).trim();

          if (field.field === "rate") {
            // ✅ PARTIAL MATCH ON NUMBER USING STRING CONVERSION
            query.$expr = {
              $regexMatch: {
                input: { $toString: `$${field.field}` },
                regex: value,
                options: "i",
              },
            };
          } else {
            query[field.field] = { $regex: value, $options: "i" };
          }
        }
      });
    }

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        query.created_on = { $gte: from, $lte: to };
      }
    }

    // console.log(query);
    const all = await EquipmentType.find(query)
      .sort({ created_on: -1 })
      .populate("created_by", "name");
    res.json(all);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch Equipment Types." });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    // console.log(req.user, req.body);
    const newEquipmentType = { ...req.body };
    newEquipmentType.created_by = req.user.id;
    const equipmenttype = newEquipmentType.equipmentType;
    const exist = await EquipmentType.findOne({ equipmenttype });
    if (exist)
      return res
        .status(400)
        .json({ message: "Equipment Type already exists." });

    const equipmentType = new EquipmentType(newEquipmentType);
    await equipmentType.save();

    res.status(201).json(equipmentType);
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ message: "Server error creating equipment type" });
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

    const equipmentType = await EquipmentType.find(query)
      .sort({ created_on: -1 })
      .populate("created_by", "name");

    // DEFINE HEADERS
    const headers = ["Equipment Type", "Rate", "Created On"];

    // PREPARE ROWS
    const excelRows = equipmentType.map((e) => [
      e.equipmentType || "",
      e.rate || "",
      e.created_on ? formatDateForExcel(e.created_on) : "",
    ]);

    // Final sheet data (headers + rows)
    const finalSheetData = [headers, ...excelRows];

    // CREATE WORKBOOK
    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "EquipmentTypes");

    // Random 10-digit number
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `EquipmentTypes_${randomNumber}.xlsx`;

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

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updateData = { ...req.body };
    const username = req.user.id;
    // console.log(updateData);

    const equipmentType = updateData.equipmentType;
    const exist = await EquipmentType.findOne({
      equipmentType,
      _id: { $ne: req.params.id },
    });
    if (exist) {
      return res
        .status(400)
        .json({ message: "Equipment Type already exists." });
    }

    const updated = await EquipmentType.findByIdAndUpdate(
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
      return res.status(404).json({ message: "Equipment Type not found" });
    }

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Failed to update equipment type." });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // await EquipmentType.findByIdAndDelete(req.params.id);
    // res.json({ message: "Deleted" });
    const equipmentType = await EquipmentType.findByIdAndUpdate(
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

    if (!equipmentType) {
      return res.status(404).json({ message: "Equipment Type not found" });
    }

    res.status(200).json({
      message: "Equipment Type deactivated successfully",
    });
  } catch {
    res.status(500).json({ message: "Failed to delete Equipment Type" });
  }
});

module.exports = router;

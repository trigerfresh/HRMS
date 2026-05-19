const xlsx = require("xlsx");
const express = require("express");
const router = express.Router();
const Gang = require("../models/Gang");
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

          if (field.field === "contactNo") {
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
    const all = await Gang.find(query)
      .sort({ created_on: -1 })
      .populate("created_by", "name");
    res.json(all);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch Gangs." });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    // console.log(req.user, req.body);
    const newGang = { ...req.body };
    newGang.created_by = req.user.id;
    const name = newGang.name;
    const exist = await Gang.findOne({ name });
    if (exist)
      return res.status(400).json({ message: "Gang name already exists." });

    const gang = new Gang(newGang);
    await gang.save();

    res.status(201).json(gang);
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ message: "Server error creating gang" });
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

    const gang = await Gang.find(query)
      .sort({ created_on: -1 })
      .populate("created_by", "name");

    // DEFINE HEADERS
    const headers = ["Gang Name", "Contact No", "Created On"];

    // PREPARE ROWS
    const excelRows = gang.map((e) => [
      e.name || "",
      e.contactNo || "",
      e.created_on ? formatDateForExcel(e.created_on) : "",
    ]);

    // Final sheet data (headers + rows)
    const finalSheetData = [headers, ...excelRows];

    // CREATE WORKBOOK
    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Gangs");

    // Random 10-digit number
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `Gangs_${randomNumber}.xlsx`;

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

    const name = updateData.name;
    const exist = await Gang.findOne({
      name,
      _id: { $ne: req.params.id },
    });
    if (exist) {
      return res.status(400).json({ message: "Gang name already exists." });
    }

    const updated = await Gang.findByIdAndUpdate(
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
      return res.status(404).json({ message: "Gang not found" });
    }

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Failed to update gang" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // await Gang.findByIdAndDelete(req.params.id);
    // res.json({ message: "Deleted" });
    const gang = await Gang.findByIdAndUpdate(
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

    if (!gang) {
      return res.status(404).json({ message: "Gang not found" });
    }

    res.status(200).json({
      message: "Gang deactivated successfully",
    });
  } catch {
    res.status(500).json({ message: "Failed to delete gang" });
  }
});

module.exports = router;

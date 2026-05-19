const xlsx = require("xlsx");
const Holiday = require("../models/Holiday");

// Create new
exports.createHoliday = async (req, res) => {
  try {
    // console.log(req.body, req.files, req.user);
    // Multer/file upload logic: get images if any
    const holidaysData = JSON.parse(req.body.holidaysData || "[]");
    // Map and attach image filenames if uploaded
    holidaysData.forEach((h, i) => {
      if (req.files && req.files[`holiday_image_${i}`]) {
        h.image = req.files[`holiday_image_${i}`][0].filename;
      }
    });
    const holiday = new Holiday({
      state: req.body.state,
      rank: req.body.rank,
      holidays: holidaysData,
      created_by: req.user.id,
    });
    await holiday.save();
    return res.status(201).json(holiday);
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Failed to create holiday", error: err.message });
  }
};

// List all / filtered
exports.getHolidays = async (req, res) => {
  // Optional: handle search params (state, rank, date...)
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

    const holidays = await Holiday.find(query)
      .sort({ created_on: -1 })
      .populate("created_by", "name");
    return res.json(holidays);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch holidays", error: err.message });
  }
};

// Update
exports.updateHoliday = async (req, res) => {
  try {
    const holidaysData = JSON.parse(req.body.holidaysData || "[]");
    const existing = await Holiday.findById(req.params.id);
    if (!existing)
      return res.status(404).json({ message: "Holiday not found" });

    const existingMap = {};
    existing.holidays.forEach((h) => (existingMap[h._id?.toString()] = h));

    const merged = holidaysData.map((h, i) => {
      const updated = { ...h };

      if (h._id && existingMap[h._id]) {
        const old = existingMap[h._id];
        updated.image =
          req.files && req.files[`holiday_image_${i}`]
            ? req.files[`holiday_image_${i}`][0].filename
            : old.image;
      } else {
        updated.image =
          req.files && req.files[`holiday_image_${i}`]
            ? req.files[`holiday_image_${i}`][0].filename
            : null;
      }
      return updated;
    });

    existing.state = req.body.state;
    existing.rank = req.body.rank;
    existing.holidays = merged;
    (existing.modified_by = req.user.id), (existing.modified_on = new Date());
    await existing.save();

    res.json(existing);
  } catch (err) {
    console.error("Error updating holiday:", err);
    res
      .status(400)
      .json({ message: "Failed to update holiday", error: err.message });
  }
};

// Delete
exports.deleteHoliday = async (req, res) => {
  try {
    await Holiday.findByIdAndUpdate(req.params.id, {
      $set: {
        active: 1,
        disabled_on: new Date(),
        disabled_by: req.user.id,
      },
    });
    res.json({ message: "Holiday deactivated successfully" });
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Failed to deactivate holiday", error: err.message });
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

exports.exportHolidaysToExcel = async (req, res) => {
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

    const holidays = await Holiday.find(query)
      .sort({ created_on: -1 })
      .populate("created_by", "name");

    // DEFINE HEADERS
    const headers = [
      "State",
      "Rank",
      "Holiday Name",
      "Holiday Date",
      "Created On",
    ];

    // PREPARE ROWS
    let excelRows = [];
    holidays.forEach((h) => {
      if (h.holidays && h.holidays.length > 0) {
        h.holidays.forEach((day) => {
          excelRows.push([
            h.state || "",
            h.rank || "",
            day.name || "",
            day.date ? formatDateForExcel(day.date) : "",
            h.created_on ? formatDateForExcel(h.created_on) : "",
          ]);
        });
      }
    });
    // Final sheet data (headers + rows)
    const finalSheetData = [headers, ...excelRows];

    // CREATE WORKBOOK
    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Holidays");

    // Random 10-digit number
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `Holidays_${randomNumber}.xlsx`;

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
    console.error("DOWNLOAD HOLIDAYS EXCEL ERROR:", error);
    res.status(500).json({ message: "Failed to download Excel" });
  }
};

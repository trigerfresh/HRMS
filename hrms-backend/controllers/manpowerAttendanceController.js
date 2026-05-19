const xlsx = require('xlsx');
const ManpowerAttendance = require('../models/ManpowerAttendance');

// Download template with dummy data
exports.downloadTemplate = (req, res) => {
  const wb = xlsx.utils.book_new();
  const ws_data = [
    [
      "SR NO", "CLIENT CODE", "NAME", "DAY", "MONTH", "YEAR", "SHIFT",
      "IN TIME", "OUT TIME", "COUNT", "RATE", "SUPERVISIOR", "GANG NAME", "OT HOURS", "OT RATE"
    ],
   
  ];
  const ws = xlsx.utils.aoa_to_sheet(ws_data);
  xlsx.utils.book_append_sheet(wb, ws, "ManpowerAttendance");
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=ManpowerAttendanceTemplate.xlsx');
  res.send(buffer);
};

// Upload
exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const records = xlsx.utils.sheet_to_json(worksheet);

    if (!req.user?.id) 
      return res.status(401).json({ error: "Authentication required" });

    let created = 0;

    for (const record of records) {
      try {
        await ManpowerAttendance.create({
          clientCode: Number(record["CLIENT CODE"]),
          name: record["NAME"],
          day: Number(record["DAY"]),
          month: String(record["MONTH"]),
          year: Number(record["YEAR"]),
          shift: record["SHIFT"],
          inTime: record["IN TIME"],
          outTime: record["OUT TIME"],
          count: Number(record["COUNT"]),
          rate: Number(record["RATE"]),
          supervisior: record["SUPERVISIOR"],
          gangName: record["GANG NAME"],
          otHours: Number(record["OT HOURS"]),
          otRate: Number(record["OT RATE"]),
          createdBy: req.user.id
        });
        created++;
      } catch (error) {
        console.error("Error saving row:", error.message);
      }
    }

    res.status(201).json({ success: true, message: `${created} records uploaded.` });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ error: error.message });
  }
};




// List all
exports.list = async (req, res) => {
  try {
    const records = await ManpowerAttendance.find().sort({createdAt: -1});
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Verify
exports.verify = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded." });
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const records = xlsx.utils.sheet_to_json(worksheet);
    let issues = [];
    for (const record of records) {
      if (!record["CLIENT CODE"] || !record.NAME || !record.DAY || !record.MONTH || !record.YEAR)
        issues.push({row: record, error: "Missing required fields."});
    }
    res.json({ success: true, hasErrors: issues.length > 0, issues });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.bulkUploadAttendance = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const attendanceRecords = xlsx.utils.sheet_to_json(worksheet);
    console.log('Parsed records:', attendanceRecords);

    let uploadedCount = 0;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    for (const record of attendanceRecords) {
      try {
        const dailyAttendance = new Map();
        for (let i = 1; i <= 31; i++) {
          const dayKey = String(i);
          if (record[dayKey] !== undefined && record[dayKey] !== null) {
            dailyAttendance.set(dayKey, String(record[dayKey]));
          }
        }

        const newAttendance = new Attendance({
          clientCode: record['CLIENT CODE'],
          clientName: record['CLIENT NAME'] || 'Unknown',
          employeeName: record['EMPLOYEE NAME'],
          employeeCode: Number(record['EMPLOYEE CODE']),
          siteName: record['SITE NAME'],
          rank: record['RANK'],
          month: String(record['MONTH']),
          year: Number(record['YEAR']),
          attendance: dailyAttendance,
          attendanceType: req.body.attendanceType || 'Both',
          createdBy: userId
        });

        newAttendance.calculateTotals();
        await newAttendance.save();
        uploadedCount++;
      } catch (err) {
        console.error('Error saving row:', err.message);
      }
    }

    res.status(201).json({ success: true, message: `Uploaded ${uploadedCount} records successfully.` });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};


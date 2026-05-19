const express = require("express");
const router = express.Router();
const holidayController = require("../controllers/holidayController");
const authMiddleware = require("../middleware/authMiddleware");

// Multer upload setup
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/holidays/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Upload field mapping (handle multiple file fields with different names)
const uploadFields = [];
for (let i = 0; i < 20; i++) {
  uploadFields.push({ name: `holiday_image_${i}`, maxCount: 1 });
}

// Create new
router.post(
  "/",
  authMiddleware,
  upload.fields(uploadFields),
  holidayController.createHoliday
);

// List all
router.get("/", holidayController.getHolidays);
router.get("/export", holidayController.exportHolidaysToExcel);

// Update
router.put(
  "/:id",
  authMiddleware,
  upload.fields(uploadFields),
  holidayController.updateHoliday
);

// Delete
router.delete("/:id", authMiddleware, holidayController.deleteHoliday);

module.exports = router;

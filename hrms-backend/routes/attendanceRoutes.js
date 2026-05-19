const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Public - No Auth Required

// Protected - Auth Required
router.get(
  "/download-template",
  authMiddleware,
  attendanceController.downloadAttendanceTemplate
); // Anyone can download template
router.post(
  "/upload",
  authMiddleware,
  upload.single("attendanceFile"),
  attendanceController.bulkUploadAttendance
);
router.post(
  "/verify",
  authMiddleware,
  attendanceController.verifyAttendanceUpload
);
router.get(
  "/uploaderrortemplate/download",
  authMiddleware,
  attendanceController.downloadUploadErrorTemplate
);
router.get(
  "/export",
  authMiddleware,
  attendanceController.exportAttendanceToExcel
);
router.get(
  "/exportPrintData",
  authMiddleware,
  attendanceController.exportAttendancePrint
);
router.get(
  "/exportPrintDownload",
  authMiddleware,
  attendanceController.exportAttendancePrintDownload
);
router.get("/printData", authMiddleware, attendanceController.getPrintData);

router.get("/", authMiddleware, attendanceController.getAllAttendance);
router.get("/emp-wages", authMiddleware, attendanceController.getEmpWages);
// router.delete("/:id", authMiddleware, attendanceController.deleteAttendance);
router.post(
  "/bulk-delete",
  authMiddleware,
  attendanceController.deleteAttendance
);
router.post(
  "/approve-invoice",
  authMiddleware,
  attendanceController.generateInvoice
);
router.post(
  "/generate-invoice",
  authMiddleware,
  attendanceController.saveBillsAndOrders
);

module.exports = router;

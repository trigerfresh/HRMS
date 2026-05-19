const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const manpowerAttendanceController = require('../controllers/manpowerAttendanceController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/download-template', manpowerAttendanceController.downloadTemplate);
router.post('/upload', authMiddleware, upload.single('attendanceFile'), manpowerAttendanceController.upload);
router.post('/verify', authMiddleware, upload.single('attendanceFile'), manpowerAttendanceController.verify);
router.get('/', authMiddleware, manpowerAttendanceController.list);

module.exports = router;

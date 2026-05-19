const express = require('express');
const router = express.Router();

const multer = require('multer');
const { storage } = require('../middleware/storageConfig');
const upload = multer({ storage }); // create multer upload instance with storage

const wagesController = require('../controllers/wagesController');

router.post('/upload', upload.single('excelFile'), wagesController.uploadSheet);
router.get('/', wagesController.listSheets);
router.get('/download/:id', wagesController.downloadSheet);
router.delete('/:id', wagesController.deleteSheet);
router.put('/approve/:id', wagesController.approveSheet);

module.exports = router;

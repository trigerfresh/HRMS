const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');

router.get('/employee', salaryController.listByEmployee);
router.get('/site', salaryController.listBySite);

module.exports = router;

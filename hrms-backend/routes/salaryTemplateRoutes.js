// routes/salaryTemplateRoutes.js
const express = require('express');
const router = express.Router();
const salaryTemplateController = require('../controllers/salaryTemplateController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// CRUD endpoints
router.post('/', salaryTemplateController.createTemplate);
router.get('/', salaryTemplateController.getTemplates);
router.get('/:id', salaryTemplateController.getTemplate);
router.put('/:id', salaryTemplateController.updateTemplate);
router.delete('/:id', salaryTemplateController.deleteTemplate);
router.get('/export', salaryTemplateController.exportTemplates);

module.exports = router;
// routes/companyRoutes.js
const express = require('express')
const router = express.Router()
const companyController = require('../controllers/companyController')
const authMiddleware = require('../middleware/authMiddleware')
const multer = require('multer')

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  },
})
const upload = multer({ storage: storage })

// Public route: get all companies
router.get('/', companyController.getCompanies)

// Protected routes: create, update, delete, export
router.post(
  '/',
  authMiddleware,
  upload.single('logo'),
  companyController.createCompany,
)

router.put(
  '/:id/bank-details',
  authMiddleware,
  companyController.addBankDetails,
)

router.put(
  '/:id',
  authMiddleware,
  upload.single('logo'),
  companyController.updateCompany,
)

router.delete('/:id', authMiddleware, companyController.deleteCompany)

router.get('/export', authMiddleware, companyController.exportCompaniesToExcel)

module.exports = router

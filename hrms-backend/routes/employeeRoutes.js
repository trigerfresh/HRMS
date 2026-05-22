const express = require('express')
const router = express.Router()
const employeeController = require('../controllers/employeeController')
const authMiddleware = require('../middleware/authMiddleware')
const multer = require('multer')
const { poolPromise, sql } = require('../config/db')

// Multer disk storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/employee/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
})
const upload = multer({ storage })

// Multer memory storage for Excel (no saving to disk)
const memoryUpload = multer({ storage: multer.memoryStorage() })

// Upload field mapping for employee
const uploadFields = [
  { name: 'bankDetails.cancelledChequeFile', maxCount: 1 },
  { name: 'educationalDocuments[file]', maxCount: 10 },
]

// Apply authentication middleware to all routes
router.use(authMiddleware)

// Get next employee code
router.get('/next-code', employeeController.getNextEmployeeCode)

// Download Excels

router.get('/export', employeeController.exportEmployeesToExcel)

router.get(
  '/uploadtemplate/download',
  employeeController.downloadEmployeeUploadTemplate,
)
router.get(
  '/uploaderrortemplate/download',
  employeeController.downloadEmployeeUploadErrorTemplate,
)
router.get(
  '/updatetemplate/download',
  employeeController.downloadUpdateTemplate,
)
router.get(
  '/updateerrortemplate/download',
  employeeController.downloadEmployeeUpdateErrorTemplate,
)

// Get all employees
router.get('/', employeeController.getAllEmployees)

// Get single employee by ID
router.get('/:id', employeeController.getEmployeeById)

// Create new employee with file uploads
router.post('/', upload.any(), employeeController.createEmployee)

// Update employee by ID with file uploads
router.put('/:id', upload.any(), employeeController.updateEmployee)

// Delete employee
router.delete('/:id', employeeController.deleteEmployee)

// Update employee status
router.put('/:id/status', employeeController.updateEmployeeStatus)

// Update employee salary
router.put('/:id/salary', employeeController.updateEmployeeSalary)

// Bulk operations (Excel uploads)
router.post(
  '/bulk-upload',
  memoryUpload.single('file'),
  employeeController.bulkUploadEmployees,
)

router.post(
  '/bulk-update',
  memoryUpload.single('file'),
  employeeController.bulkUpdateEmployees,
)

router.post('/verify-bulk-upload', employeeController.verifyBulkUpload)
router.post('/verify-bulk-update', employeeController.verifyBulkUpdate)

module.exports = router

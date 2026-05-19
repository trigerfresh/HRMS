// hrms-backend/routes/branchRoutes.js (Full Updated Code)
const express = require('express')
const router = express.Router()
const branchController = require('../controllers/branchController')
const authMiddleware = require('../middleware/authMiddleware')

// Full CRUD, Search, and Export routes
router.get('/', branchController.getBranches)

router.post('/', authMiddleware, branchController.createBranch)
router.put('/:id', authMiddleware, branchController.updateBranch)
router.delete('/:id', authMiddleware, branchController.deleteBranch)
// router.get('/export', authMiddleware, branchController.exportBranchesToExcel)
router.get('/by-company/:companyId', branchController.getBranchesByCompany)

module.exports = router

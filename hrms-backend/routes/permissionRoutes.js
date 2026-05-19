const express = require('express')
const router = express.Router()
const permissionController = require('../controllers/permissionController')
const authMiddleware = require('../middleware/authMiddleware')

// This route MUST be BEFORE the '/:roleId' route to avoid conflicts
router.get('/mymenu', authMiddleware, permissionController.getMyMenu)

router.get('/roles', authMiddleware, permissionController.getAllRoles)
router.get('/modules', authMiddleware, permissionController.getAllModules)
router.get(
  '/:roleId',
  authMiddleware,
  permissionController.getPermissionsForRole,
)
router.post('/', authMiddleware, permissionController.savePermissionsForRole)

module.exports = router

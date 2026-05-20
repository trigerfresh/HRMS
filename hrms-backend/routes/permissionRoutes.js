const express = require('express')
const router = express.Router()

const permissionController = require('../controllers/permissionController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/mymenu', authMiddleware, permissionController.getMyMenu)

router.get('/roles', authMiddleware, permissionController.getAllRoles)

router.get('/modules', authMiddleware, permissionController.getAllModules)

router.get('/:role', authMiddleware, permissionController.getPermissionsForRole)

router.post('/', authMiddleware, permissionController.savePermissionsForRole)

module.exports = router

const express = require('express')
const router = express.Router()

const holidayController = require('../controllers/holidayController')
const authMiddleware = require('../middleware/authMiddleware')

const multer = require('multer')

/* =====================================================
   MULTER CONFIG
===================================================== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/holidays/')
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
  },
})

const upload = multer({ storage })

/* =====================================================
   MULTIPLE IMAGE FIELDS
===================================================== */

const uploadFields = []

for (let i = 0; i < 20; i++) {
  uploadFields.push({
    name: `holiday_image_${i}`,
    maxCount: 1,
  })
}

/* =====================================================
   CREATE HOLIDAY
   POST /api/holidays
===================================================== */

router.post(
  '/',
  authMiddleware,
  upload.fields(uploadFields),
  holidayController.createHoliday,
)

/* =====================================================
   GET HOLIDAYS
   GET /api/holidays
===================================================== */

router.get('/', authMiddleware, holidayController.getHolidays)

/* =====================================================
   EXPORT EXCEL
   GET /api/holidays/export
===================================================== */

router.get('/export', authMiddleware, holidayController.exportHolidaysToExcel)

/* =====================================================
   UPDATE HOLIDAY
   PUT /api/holidays/:id
===================================================== */

router.put(
  '/:id',
  authMiddleware,
  upload.fields(uploadFields),
  holidayController.updateHoliday,
)

/* =====================================================
   DELETE HOLIDAY
   DELETE /api/holidays/:id
===================================================== */

router.delete('/:id', authMiddleware, holidayController.deleteHoliday)

module.exports = router

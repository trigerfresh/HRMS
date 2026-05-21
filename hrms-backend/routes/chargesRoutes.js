// routes/charges.js

const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const xlsx = require('xlsx')

const { poolPromise, sql } = require('../config/db')

// ==========================
// GET ALL CHARGES
// ==========================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    const { searchFields, fromDate, toDate } = req.query

    let whereClause = `WHERE active = '0'`

    // Search Filters
    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((field) => {
        if (field.field && field.keyword) {
          if (field.field === 'charges_master') {
            whereClause += ` AND charges_master LIKE '%${field.keyword}%'`
          }

          if (field.field === 'label_display') {
            whereClause += ` AND label_display LIKE '%${field.keyword}%'`
          }
        }
      })
    }

    // Date Filter
    if (fromDate && toDate) {
      whereClause += `
        AND CAST(created_on AS DATE)
        BETWEEN '${fromDate}' AND '${toDate}'
      `
    }

    const result = await pool.request().query(`
      SELECT *
      FROM charges_master
      ${whereClause}
      ORDER BY id DESC
    `)

    const charges = result.recordset

    // SIMPLE MODE
    if (req.query.simple === 'true') {
      return res.json(
        charges.map((c) => ({
          id: c.id,
          name: c.charges_master,
        })),
      )
    }

    return res.json({
      data: charges,
      success: true,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      message: error.message,
      success: false,
    })
  }
})

// ==========================
// CREATE CHARGE
// ==========================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    await pool
      .request()
      .input(
        'charges_master',
        sql.VarChar(sql.MAX),
        req.body.charges_master || '',
      )
      .input(
        'label_display',
        sql.VarChar(sql.MAX),
        req.body.label_display || '',
      )
      .input('created_by', sql.VarChar(20), String(req.user.id || ''))
      .input('branch_id', sql.VarChar(20), req.body.branch_id || '')
      .input('company_id', sql.VarChar(20), req.body.company_id || '').query(`
        INSERT INTO charges_master
        (
          charges_master,
          label_display,
          active,
          created_by,
          created_on,
          branch_id,
          company_id
        )
        VALUES
        (
          @charges_master,
          @label_display,
          '0',
          @created_by,
          CONVERT(VARCHAR(10), GETDATE(), 103),
          @branch_id,
          @company_id
        )
      `)

    return res.status(201).json({
      success: true,
      message: 'Charge created successfully',
    })
  } catch (error) {
    console.error(error)

    return res.status(400).json({
      message: error.message,
      success: false,
    })
  }
})

// ==========================
// EXPORT EXCEL
// ==========================
function formatDateForExcel(val) {
  if (!val && val !== 0) return ''

  const d = new Date(val)

  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()

    return `${dd}-${mm}-${yyyy}`
  }

  return String(val)
}

router.get('/export', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    const { searchFields, fromDate, toDate } = req.query

    let whereClause = `WHERE active = '0'`

    // Search
    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((field) => {
        if (field.field && field.keyword) {
          if (field.field === 'charges_master') {
            whereClause += ` AND charges_master LIKE '%${field.keyword}%'`
          }

          if (field.field === 'label_display') {
            whereClause += ` AND label_display LIKE '%${field.keyword}%'`
          }
        }
      })
    }

    // Date
    if (fromDate && toDate) {
      whereClause += `
        AND CAST(created_on AS DATE)
        BETWEEN '${fromDate}' AND '${toDate}'
      `
    }

    const result = await pool.request().query(`
      SELECT *
      FROM charges
      ${whereClause}
      ORDER BY id DESC
    `)

    const charges = result.recordset

    // HEADERS
    const headers = ['Charges Master', 'Label Display', 'Created On']

    // ROWS
    const excelRows = charges.map((c) => [
      c.charges_master || '',
      c.label_display || '',
      c.created_on ? formatDateForExcel(c.created_on) : '',
    ])

    const finalSheetData = [headers, ...excelRows]

    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData)

    const workbook = xlsx.utils.book_new()

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Charges')

    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

    const fileName = `Charges_${randomNumber}.xlsx`

    const excelBuffer = xlsx.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    res.send(excelBuffer)
  } catch (error) {
    console.error('DOWNLOAD CHARGES EXCEL ERROR:', error)

    return res.status(500).json({
      message: 'Failed to download Excel',
    })
  }
})

// ==========================
// UPDATE CHARGE
// ==========================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input(
        'charges_master',
        sql.VarChar(sql.MAX),
        req.body.charges_master || '',
      )
      .input(
        'label_display',
        sql.VarChar(sql.MAX),
        req.body.label_display || '',
      )
      .input('modified_by', sql.VarChar(20), String(req.user.id || '')).query(`
        UPDATE charges_master
        SET
          charges_master = @charges_master,
          label_display = @label_display,
          modified_by = @modified_by,
          modified_on = CONVERT(VARCHAR(10), GETDATE(), 103)
        WHERE id = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        message: 'Charge not found',
        success: false,
      })
    }

    return res.json({
      success: true,
      message: 'Charge updated successfully',
    })
  } catch (error) {
    console.error(error)

    return res.status(400).json({
      message: error.message,
      success: false,
    })
  }
})

// ==========================
// DELETE CHARGE
// ==========================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('disabled_by', sql.VarChar(20), String(req.user.id || '')).query(`
        UPDATE charges_master
        SET
          active = '1',
          disabled_by = @disabled_by,
          disabled_on = GETDATE()
        WHERE id = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        message: 'Charge not found',
        success: false,
      })
    }

    return res.json({
      message: 'Charge deleted successfully',
      success: true,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      message: error.message,
      success: false,
    })
  }
})

module.exports = router

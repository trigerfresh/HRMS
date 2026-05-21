const express = require('express')
const router = express.Router()
const xlsx = require('xlsx')
const authMiddleware = require('../middleware/authMiddleware')
const { poolPromise, sql } = require('../config/db')

// ======================
// GET ALL WORK ORDER TYPES
// ======================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise
    const { searchFields, fromDate, toDate, simple } = req.query

    let query = `
      SELECT *
      FROM work_order_type
      WHERE active = '0'
    `

    // Search Filters
    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((field) => {
        if (field.field && field.keyword) {
          query += `
            AND ${field.field}
            LIKE '%${field.keyword}%'
          `
        }
      })
    }

    // Date Filter
    if (fromDate && toDate) {
      query += `
        AND TRY_CONVERT(date, created_on, 103)
        BETWEEN '${fromDate}' AND '${toDate}'
      `
    }

    query += ` ORDER BY id DESC`

    const result = await pool.request().query(query)

    // Dropdown mode
    if (simple === 'true') {
      return res.json(
        result.recordset.map((item) => ({
          id: item.id,
          name: item.work_order_type,
        })),
      )
    }

    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: 'Failed to fetch work order types.',
    })
  }
})

// ======================
// CREATE
// ======================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise
    const { work_order_type } = req.body

    // Check duplicate
    const exist = await pool
      .request()
      .input('work_order_type', sql.VarChar(sql.MAX), work_order_type).query(`
        SELECT id
        FROM work_order_type
        WHERE work_order_type = @work_order_type
        AND active = '0'
      `)

    if (exist.recordset.length > 0) {
      return res.status(400).json({
        message: 'Work Order type already exists.',
      })
    }

    // Insert
    await pool
      .request()
      .input('work_order_type', sql.VarChar(sql.MAX), work_order_type || '')
      .input('created_by', sql.VarChar(sql.MAX), String(req.user.id || ''))
      .query(`
        INSERT INTO work_order_type
        (
          work_order_type,
          created_on,
          created_by,
          active
        )
        VALUES
        (
          @work_order_type,
          CONVERT(VARCHAR(10), GETDATE(), 103),
          @created_by,
          '0'
        )
      `)

    res.status(201).json({
      success: true,
      message: 'Work Order Type created successfully',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Server error creating work order type.',
    })
  }
})

// ======================
// EXPORT EXCEL
// ======================
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise
    const { searchFields, fromDate, toDate } = req.query

    let query = `
      SELECT *
      FROM work_order_type
      WHERE active = '0'
    `

    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((field) => {
        if (field.field && field.keyword) {
          query += `
            AND ${field.field}
            LIKE '%${field.keyword}%'
          `
        }
      })
    }

    if (fromDate && toDate) {
      query += `
        AND TRY_CONVERT(date, created_on, 103)
        BETWEEN '${fromDate}' AND '${toDate}'
      `
    }

    query += ` ORDER BY id DESC`

    const result = await pool.request().query(query)

    const headers = ['Work Order Type', 'Created On']

    const excelRows = result.recordset.map((e) => [
      e.work_order_type || '',
      e.created_on || '',
    ])

    const finalSheetData = [headers, ...excelRows]

    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData)

    const workbook = xlsx.utils.book_new()

    xlsx.utils.book_append_sheet(workbook, worksheet, 'WorkOrderTypes')

    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

    const fileName = `WorkOrderTypes_${randomNumber}.xlsx`

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
    console.error(error)
    res.status(500).json({
      message: 'Failed to download Excel',
    })
  }
})

// ======================
// UPDATE
// ======================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise
    const { id } = req.params
    const { work_order_type } = req.body

    // Duplicate check
    const exist = await pool
      .request()
      .input('work_order_type', sql.VarChar(sql.MAX), work_order_type)
      .input('id', sql.Int, id).query(`
        SELECT id
        FROM work_order_type
        WHERE work_order_type = @work_order_type
        AND id != @id
        AND active = '0'
      `)

    if (exist.recordset.length > 0) {
      return res.status(400).json({
        message: 'Work Order type already exists.',
      })
    }

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('work_order_type', sql.VarChar(sql.MAX), work_order_type)
      .input('modified_by', sql.VarChar(sql.MAX), String(req.user.id || ''))
      .query(`
        UPDATE work_order_type
        SET
          work_order_type = @work_order_type,
          modified_by = @modified_by,
          modified_on = CONVERT(VARCHAR(10), GETDATE(), 103)
        WHERE id = @id
      `)

    res.json({
      success: true,
      message: 'Updated successfully',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Failed to update work order type.',
    })
  }
})

// ======================
// DELETE (SOFT DELETE)
// ======================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('disabled_by', sql.VarChar(sql.MAX), String(req.user.id || ''))
      .query(`
        UPDATE work_order_type
        SET
          active = '1',
          disabled_by = @disabled_by,
          disabled_on = CONVERT(VARCHAR(10), GETDATE(), 103)
        WHERE id = @id
      `)

    res.status(200).json({
      message: 'Work Order Type deactivated successfully',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Failed to delete work order type',
    })
  }
})

module.exports = router

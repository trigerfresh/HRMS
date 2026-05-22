const xlsx = require('xlsx')
const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const { poolPromise, sql } = require('../config/db')

// ======================
// GET ALL GANGS
// ======================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise
    const { searchFields, fromDate, toDate } = req.query

    let query = `
      SELECT *
      FROM gang_master
      WHERE active = '0'
    `

    // SEARCH FILTER
    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((field) => {
        if (
          field.field &&
          field.keyword !== undefined &&
          field.keyword !== null
        ) {
          query += `
            AND ${field.field}
            LIKE '%${field.keyword}%'
          `
        }
      })
    }

    // DATE FILTER
    if (fromDate && toDate) {
      query += `
        AND TRY_CONVERT(date, created_on, 103)
        BETWEEN '${fromDate}' AND '${toDate}'
      `
    }

    query += ` ORDER BY id DESC`

    const result = await pool.request().query(query)

    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: 'Failed to fetch gangs.',
    })
  }
})

// ======================
// CREATE GANG
// ======================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    const { gang_master, contact_no, branch_id, company_id } = req.body

    // DUPLICATE CHECK
    const exist = await pool
      .request()
      .input('gang_master', sql.VarChar(sql.MAX), gang_master).query(`
        SELECT id
        FROM gang_master
        WHERE gang_master = @gang_master
        AND active = '0'
      `)

    if (exist.recordset.length > 0) {
      return res.status(400).json({
        message: 'Gang name already exists.',
      })
    }

    // INSERT
    await pool
      .request()
      .input('gang_master', sql.VarChar(sql.MAX), gang_master || '')
      .input('contact_no', sql.VarChar(sql.MAX), contact_no || '')
      .input('branch_id', sql.VarChar(20), branch_id || '')
      .input('company_id', sql.VarChar(20), company_id || '')
      .input('created_by', sql.VarChar(20), String(req.user.id || '')).query(`
        INSERT INTO gang_master
        (
          gang_master,
          contact_no,
          active,
          created_by,
          created_on,
          branch_id,
          company_id
        )
        VALUES
        (
          @gang_master,
          @contact_no,
          '0',
          @created_by,
          CONVERT(VARCHAR(10), GETDATE(), 103),
          @branch_id,
          @company_id
        )
      `)

    res.status(201).json({
      success: true,
      message: 'Gang created successfully',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Server error creating gang',
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
      FROM gang_master
      WHERE active = '0'
    `

    // SEARCH
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

    // DATE FILTER
    if (fromDate && toDate) {
      query += `
        AND TRY_CONVERT(date, created_on, 103)
        BETWEEN '${fromDate}' AND '${toDate}'
      `
    }

    query += ` ORDER BY id DESC`

    const result = await pool.request().query(query)

    // EXCEL HEADERS
    const headers = ['Gang Name', 'Contact No', 'Created On']

    // ROWS
    const excelRows = result.recordset.map((e) => [
      e.gang_master || '',
      e.contact_no || '',
      e.created_on || '',
    ])

    const finalSheetData = [headers, ...excelRows]

    // WORKBOOK
    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData)

    const workbook = xlsx.utils.book_new()

    xlsx.utils.book_append_sheet(workbook, worksheet, 'GangMaster')

    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

    const fileName = `GangMaster_${randomNumber}.xlsx`

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
// UPDATE GANG
// ======================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    const { id } = req.params

    const { gang_master, contact_no, branch_id, company_id } = req.body

    // DUPLICATE CHECK
    const exist = await pool
      .request()
      .input('gang_master', sql.VarChar(sql.MAX), gang_master)
      .input('id', sql.Int, id).query(`
        SELECT id
        FROM gang_master
        WHERE gang_master = @gang_master
        AND id != @id
        AND active = '0'
      `)

    if (exist.recordset.length > 0) {
      return res.status(400).json({
        message: 'Gang name already exists.',
      })
    }

    // UPDATE
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('gang_master', sql.VarChar(sql.MAX), gang_master || '')
      .input('contact_no', sql.VarChar(sql.MAX), contact_no || '')
      .input('branch_id', sql.VarChar(20), branch_id || '')
      .input('company_id', sql.VarChar(20), company_id || '')
      .input('modified_by', sql.VarChar(20), String(req.user.id || '')).query(`
        UPDATE gang_master
        SET
          gang_master = @gang_master,
          contact_no = @contact_no,
          branch_id = @branch_id,
          company_id = @company_id,
          modified_by = @modified_by,
          modified_on = CONVERT(VARCHAR(10), GETDATE(), 103)
        WHERE id = @id
      `)

    res.json({
      success: true,
      message: 'Gang updated successfully',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Failed to update gang',
    })
  }
})

// ======================
// DELETE GANG
// ======================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('disabled_by', sql.VarChar(20), String(req.user.id || '')).query(`
        UPDATE gang_master
        SET
          active = '1',
          disabled_by = @disabled_by,
          disabled_on = CONVERT(VARCHAR(10), GETDATE(), 103)
        WHERE id = @id
      `)

    res.status(200).json({
      message: 'Gang deactivated successfully',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Failed to delete gang',
    })
  }
})

module.exports = router

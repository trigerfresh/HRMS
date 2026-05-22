const express = require('express')
const router = express.Router()
const xlsx = require('xlsx')

const authMiddleware = require('../middleware/authMiddleware')
const { poolPromise, sql } = require('../config/db')

// ======================
// GET ALL EQUIPMENT TYPES
// ======================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    const { searchFields, fromDate, toDate, simple } = req.query

    let query = `
      SELECT *
      FROM equipment_master
      WHERE active = '0'
    `

    // SEARCH FILTERS
    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((field) => {
        if (
          field.field &&
          field.keyword !== undefined &&
          field.keyword !== null
        ) {
          const value = String(field.keyword).trim()

          // RATE SEARCH
          if (field.field === 'rate') {
            query += `
              AND rate LIKE '%${value}%'
            `
          } else {
            query += `
              AND ${field.field} LIKE '%${value}%'
            `
          }
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

    // SIMPLE DROPDOWN
    if (simple === 'true') {
      return res.json(
        result.recordset.map((item) => ({
          id: item.id,
          name: item.equipment_master,
        })),
      )
    }

    res.json(result.recordset)
  } catch (err) {
    console.error(err)

    res.status(500).json({
      message: 'Failed to fetch Equipment Types.',
    })
  }
})

// ======================
// CREATE
// ======================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    const { equipment_master, rate, branch_id, company_id } = req.body

    // DUPLICATE CHECK
    const exist = await pool
      .request()
      .input('equipment_master', sql.VarChar(sql.MAX), equipment_master).query(`
        SELECT id
        FROM equipment_master
        WHERE equipment_master = @equipment_master
        AND active = '0'
      `)

    if (exist.recordset.length > 0) {
      return res.status(400).json({
        message: 'Equipment Type already exists.',
      })
    }

    // INSERT
    await pool
      .request()
      .input('equipment_master', sql.VarChar(sql.MAX), equipment_master || '')
      .input('rate', sql.VarChar(sql.MAX), rate || '')
      .input('created_by', sql.VarChar(20), String(req.user.id || ''))
      .input('branch_id', sql.VarChar(20), branch_id || '')
      .input('company_id', sql.VarChar(20), company_id || '').query(`
        INSERT INTO equipment_master
        (
          equipment_master,
          rate,
          active,
          created_by,
          created_on,
          branch_id,
          company_id
        )
        VALUES
        (
          @equipment_master,
          @rate,
          '0',
          @created_by,
          CONVERT(VARCHAR(10), GETDATE(), 103),
          @branch_id,
          @company_id
        )
      `)

    res.status(201).json({
      success: true,
      message: 'Equipment Type created successfully',
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'Server error creating equipment type',
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
      FROM equipment_master
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

    // HEADERS
    const headers = ['Equipment Type', 'Rate', 'Created On']

    // ROWS
    const excelRows = result.recordset.map((e) => [
      e.equipment_master || '',
      e.rate || '',
      e.created_on || '',
    ])

    const finalSheetData = [headers, ...excelRows]

    // CREATE EXCEL
    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData)

    const workbook = xlsx.utils.book_new()

    xlsx.utils.book_append_sheet(workbook, worksheet, 'EquipmentTypes')

    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

    const fileName = `EquipmentTypes_${randomNumber}.xlsx`

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

    const { equipment_master, rate, branch_id, company_id } = req.body

    // DUPLICATE CHECK
    const exist = await pool
      .request()
      .input('equipment_master', sql.VarChar(sql.MAX), equipment_master)
      .input('id', sql.Int, id).query(`
        SELECT id
        FROM equipment_master
        WHERE equipment_master = @equipment_master
        AND id != @id
        AND active = '0'
      `)

    if (exist.recordset.length > 0) {
      return res.status(400).json({
        message: 'Equipment Type already exists.',
      })
    }

    // UPDATE
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('equipment_master', sql.VarChar(sql.MAX), equipment_master)
      .input('rate', sql.VarChar(sql.MAX), rate || '')
      .input('branch_id', sql.VarChar(20), branch_id || '')
      .input('company_id', sql.VarChar(20), company_id || '')
      .input('modified_by', sql.VarChar(20), String(req.user.id || '')).query(`
        UPDATE equipment_master
        SET
          equipment_master = @equipment_master,
          rate = @rate,
          branch_id = @branch_id,
          company_id = @company_id,
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
      message: 'Failed to update equipment type.',
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
      .input('disabled_by', sql.VarChar(20), String(req.user.id || '')).query(`
        UPDATE equipment_master
        SET
          active = '1',
          disabled_by = @disabled_by,
          disabled_on = CONVERT(VARCHAR(10), GETDATE(), 103)
        WHERE id = @id
      `)

    res.status(200).json({
      message: 'Equipment Type deactivated successfully',
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'Failed to delete Equipment Type',
    })
  }
})

module.exports = router

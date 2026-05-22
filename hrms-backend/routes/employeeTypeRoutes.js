const express = require('express')
const router = express.Router()
const xlsx = require('xlsx')

const { poolPromise, sql } = require('../config/db')
const authMiddleware = require('../middleware/authMiddleware')

function formatDateForExcel(val) {
  if (!val) return ''

  const d = new Date(val)

  if (isNaN(d.getTime())) return ''

  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()

  return `${dd}-${mm}-${yyyy}`
}

//
// GET ALL
//
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    let query = `
      SELECT *
      FROM emp_type
      WHERE active = '0'
    `

    const request = pool.request()

    const { searchFields, fromDate, toDate } = req.query

    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((field, index) => {
        if (field.field && field.keyword) {
          query += ` AND ${field.field} LIKE @keyword${index}`

          request.input(`keyword${index}`, sql.VarChar, `%${field.keyword}%`)
        }
      })
    }

    if (fromDate && toDate) {
      query += `
        AND CAST(created_on AS DATE)
        BETWEEN @fromDate AND @toDate
      `

      request.input('fromDate', sql.Date, fromDate)
      request.input('toDate', sql.Date, toDate)
    }

    query += ` ORDER BY id DESC`

    const result = await request.query(query)

    res.json(result.recordset)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Failed to get employee types',
    })
  }
})

//
// CREATE
//
router.post('/', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    const { emp_type, branch_id, company_id } = req.body

    //
    // CHECK EXISTING
    //
    const existCheck = await pool
      .request()
      .input('emp_type', sql.VarChar, emp_type).query(`
        SELECT id
        FROM emp_type
        WHERE emp_type = @emp_type
        AND active = '0'
      `)

    if (existCheck.recordset.length > 0) {
      return res.status(400).json({
        message: 'Employee type already exists',
      })
    }

    //
    // INSERT
    //
    await pool
      .request()
      .input('emp_type', sql.VarChar, emp_type)
      .input('active', sql.VarChar, '0')
      .input('created_by', sql.VarChar, String(req.user.id))
      .input('created_on', sql.VarChar, new Date().toISOString())
      .input('branch_id', sql.VarChar, branch_id || '')
      .input('company_id', sql.VarChar, company_id || '').query(`
        INSERT INTO emp_type (
          emp_type,
          active,
          created_by,
          created_on,
          branch_id,
          company_id
        )
        VALUES (
          @emp_type,
          @active,
          @created_by,
          @created_on,
          @branch_id,
          @company_id
        )
      `)

    res.status(201).json({
      message: 'Employee type created successfully',
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'Server error creating employee type',
    })
  }
})

//
// EXPORT EXCEL
//
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    let query = `
      SELECT *
      FROM emp_type
      WHERE active = '0'
    `

    const request = pool.request()

    const { searchFields, fromDate, toDate } = req.query

    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((field, index) => {
        if (field.field && field.keyword) {
          query += ` AND ${field.field} LIKE @keyword${index}`

          request.input(`keyword${index}`, sql.VarChar, `%${field.keyword}%`)
        }
      })
    }

    if (fromDate && toDate) {
      query += `
        AND CAST(created_on AS DATE)
        BETWEEN @fromDate AND @toDate
      `

      request.input('fromDate', sql.Date, fromDate)
      request.input('toDate', sql.Date, toDate)
    }

    query += ` ORDER BY id DESC`

    const result = await request.query(query)

    const rows = result.recordset

    const headers = ['Employee Type', 'Created On']

    const excelRows = rows.map((e) => [
      e.emp_type || '',
      formatDateForExcel(e.created_on),
    ])

    const finalSheetData = [headers, ...excelRows]

    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData)

    const workbook = xlsx.utils.book_new()

    xlsx.utils.book_append_sheet(workbook, worksheet, 'EmployeeTypes')

    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

    const fileName = `EmployeeTypes_${randomNumber}.xlsx`

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

//
// UPDATE
//
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    const { emp_type } = req.body

    //
    // CHECK DUPLICATE
    //
    const existCheck = await pool
      .request()
      .input('emp_type', sql.VarChar, emp_type)
      .input('id', sql.Int, req.params.id).query(`
        SELECT id
        FROM emp_type
        WHERE emp_type = @emp_type
        AND id != @id
        AND active = '0'
      `)

    if (existCheck.recordset.length > 0) {
      return res.status(400).json({
        message: 'Employee type already exists',
      })
    }

    //
    // UPDATE
    //
    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('emp_type', sql.VarChar, emp_type)
      .input('modified_by', sql.VarChar, String(req.user.id))
      .input('modified_on', sql.VarChar, new Date().toISOString()).query(`
        UPDATE emp_type
        SET
          emp_type = @emp_type,
          modified_by = @modified_by,
          modified_on = @modified_on
        WHERE id = @id
      `)

    res.json({
      message: 'Employee type updated successfully',
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'Failed to update employee type',
    })
  }
})

//
// DELETE (SOFT DELETE)
//
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('disabled_by', sql.VarChar, String(req.user.id))
      .input('disabled_on', sql.VarChar, new Date().toISOString()).query(`
        UPDATE emp_type
        SET
          active = '1',
          disabled_by = @disabled_by,
          disabled_on = @disabled_on
        WHERE id = @id
      `)

    res.json({
      message: 'Employee Type deleted successfully',
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'Failed to delete employee type',
    })
  }
})

module.exports = router

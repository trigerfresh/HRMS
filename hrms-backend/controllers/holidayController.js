const xlsx = require('xlsx')
const sql = require('mssql')
const { poolPromise } = require('../config/db')

/* =========================================================
   CREATE HOLIDAY
========================================================= */
exports.createHoliday = async (req, res) => {
  try {
    const pool = await poolPromise

    console.log('REQ.USER =', req.user)

    const holidaysData = JSON.parse(req.body.holidaysData || '[]')

    // upload images
    holidaysData.forEach((h, i) => {
      if (req.files && req.files[`holiday_image_${i}`]) {
        h.image = req.files[`holiday_image_${i}`][0].filename
      }
    })

    // safe created_by
    const createdBy = String(req.user?.id || req.user?.user_id || '')

    // insert into holidays table
    const holidayResult = await pool
      .request()
      .input('state', sql.VarChar(sql.MAX), req.body.state || '')
      .input('rank', sql.VarChar(sql.MAX), req.body.rank || '')
      .input('created_by', sql.VarChar(20), createdBy)
      .input('company_id', sql.VarChar(sql.MAX), req.body.company_id || '')
      .input('branch_id', sql.VarChar(sql.MAX), req.body.branch_id || '')
      .query(`
        INSERT INTO holidays
        (
          state,
          rank,
          active,
          created_by,
          created_on,
          company_id,
          branch_id
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @state,
          @rank,
          '0',
          @created_by,
          GETDATE(),
          @company_id,
          @branch_id
        )
      `)

    const holidayId = holidayResult.recordset[0].id

    // insert details
    for (const holiday of holidaysData) {
      await pool
        .request()
        .input('holiday_id', sql.VarChar(20), String(holidayId))
        .input('holiday_name', sql.VarChar(sql.MAX), holiday.name || '')
        .input('holiday_date', sql.VarChar(sql.MAX), holiday.date || '')
        .input('image', sql.VarChar(sql.MAX), holiday.image || '').query(`
          INSERT INTO holiday_detail
          (
            holiday_id,
            holiday_name,
            holiday_date,
            image,
            active
          )
          VALUES
          (
            @holiday_id,
            @holiday_name,
            @holiday_date,
            @image,
            '0'
          )
        `)
    }

    return res.status(201).json({
      message: 'Holiday created successfully',
      holiday_id: holidayId,
    })
  } catch (err) {
    console.error(err)

    return res.status(400).json({
      message: 'Failed to create holiday',
      error: err.message,
    })
  }
}
/* =========================================================
   GET HOLIDAYS
========================================================= */
exports.getHolidays = async (req, res) => {
  try {
    const pool = await poolPromise

    const { fromDate, toDate } = req.query

    let query = `
      SELECT
        h.id,
        h.state,
        h.rank,
        h.created_by,
        h.created_on,

        hd.id AS detail_id,
        hd.holiday_name,
        hd.holiday_date,
        hd.image

      FROM holidays h
      LEFT JOIN holiday_detail hd
        ON h.id = hd.holiday_id

      WHERE h.active = '0'
      AND ISNULL(hd.active,'0') = '0'
    `

    // date filter
    if (fromDate && toDate) {
      query += `
        AND CAST(h.created_on AS DATE)
        BETWEEN '${fromDate}' AND '${toDate}'
      `
    }

    query += ` ORDER BY h.created_on DESC`

    const result = await pool.request().query(query)

    // group data
    const grouped = {}

    result.recordset.forEach((row) => {
      if (!grouped[row.id]) {
        grouped[row.id] = {
          id: row.id,
          state: row.state,
          rank: row.rank,
          created_by: row.created_by,
          created_on: row.created_on,
          holidays: [],
        }
      }

      if (row.detail_id) {
        grouped[row.id].holidays.push({
          id: row.detail_id,
          name: row.holiday_name,
          date: row.holiday_date,
          image: row.image,
        })
      }
    })

    return res.json(Object.values(grouped))
  } catch (err) {
    console.error(err)

    return res.status(500).json({
      message: 'Failed to fetch holidays',
      error: err.message,
    })
  }
}

/* =========================================================
   UPDATE HOLIDAY
========================================================= */
exports.updateHoliday = async (req, res) => {
  try {
    const pool = await poolPromise

    console.log('REQ.USER =', req.user)

    const holidaysData = JSON.parse(req.body.holidaysData || '[]')

    // safe modified_by
    const modifiedBy = String(req.user?.id || req.user?.user_id || '')

    // update holidays table
    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('state', sql.VarChar(sql.MAX), req.body.state || '')
      .input('rank', sql.VarChar(sql.MAX), req.body.rank || '')
      .input('modified_by', sql.VarChar(20), modifiedBy).query(`
        UPDATE holidays
        SET
          state = @state,
          rank = @rank,
          modified_by = @modified_by,
          modified_on = GETDATE()
        WHERE id = @id
      `)

    // old details inactive
    await pool
      .request()
      .input('holiday_id', sql.VarChar(20), String(req.params.id)).query(`
        UPDATE holiday_detail
        SET active = '1'
        WHERE holiday_id = @holiday_id
      `)

    // insert new details
    for (let i = 0; i < holidaysData.length; i++) {
      const h = holidaysData[i]

      let image = ''

      if (req.files && req.files[`holiday_image_${i}`]) {
        image = req.files[`holiday_image_${i}`][0].filename
      } else {
        image = h.image || ''
      }

      await pool
        .request()
        .input('holiday_id', sql.VarChar(20), String(req.params.id))
        .input('holiday_name', sql.VarChar(sql.MAX), h.name || '')
        .input('holiday_date', sql.VarChar(sql.MAX), h.date || '')
        .input('image', sql.VarChar(sql.MAX), image).query(`
          INSERT INTO holiday_detail
          (
            holiday_id,
            holiday_name,
            holiday_date,
            image,
            active
          )
          VALUES
          (
            @holiday_id,
            @holiday_name,
            @holiday_date,
            @image,
            '0'
          )
        `)
    }

    return res.json({
      message: 'Holiday updated successfully',
    })
  } catch (err) {
    console.error(err)

    return res.status(400).json({
      message: 'Failed to update holiday',
      error: err.message,
    })
  }
}

/* =========================================================
   DELETE HOLIDAY
========================================================= */
exports.deleteHoliday = async (req, res) => {
  try {
    const pool = await poolPromise

    console.log('REQ.USER =', req.user)

    // safe disabled_by
    const disabledBy = String(req.user?.id || req.user?.user_id || '')

    // holidays inactive
    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('disabled_by', sql.VarChar(20), disabledBy).query(`
        UPDATE holidays
        SET
          active = '1',
          disabled_by = @disabled_by,
          disabled_on = GETDATE()
        WHERE id = @id
      `)

    // holiday_detail inactive
    await pool
      .request()
      .input('holiday_id', sql.VarChar(20), String(req.params.id)).query(`
        UPDATE holiday_detail
        SET active = '1'
        WHERE holiday_id = @holiday_id
      `)

    return res.json({
      message: 'Holiday deleted successfully',
    })
  } catch (err) {
    console.error(err)

    return res.status(400).json({
      message: 'Failed to delete holiday',
      error: err.message,
    })
  }
}

/* =========================================================
   EXPORT EXCEL
========================================================= */

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

exports.exportHolidaysToExcel = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT
        h.state,
        h.rank,
        h.created_on,
        hd.holiday_name,
        hd.holiday_date

      FROM holidays h

      LEFT JOIN holiday_detail hd
        ON h.id = hd.holiday_id

      WHERE h.active = '0'
      AND ISNULL(hd.active,'0') = '0'

      ORDER BY h.created_on DESC
    `)

    const headers = [
      'State',
      'Rank',
      'Holiday Name',
      'Holiday Date',
      'Created On',
    ]

    let excelRows = []

    result.recordset.forEach((row) => {
      excelRows.push([
        row.state || '',
        row.rank || '',
        row.holiday_name || '',
        formatDateForExcel(row.holiday_date),
        formatDateForExcel(row.created_on),
      ])
    })

    const finalSheetData = [headers, ...excelRows]

    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData)

    const workbook = xlsx.utils.book_new()

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Holidays')

    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

    const fileName = `Holidays_${randomNumber}.xlsx`

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
    console.error('DOWNLOAD HOLIDAYS EXCEL ERROR:', error)

    res.status(500).json({
      message: 'Failed to download Excel',
    })
  }
}

// controllers/vendorsController.js

const express = require('express')
const router = express.Router()
const xlsx = require('xlsx')

const authMiddleware = require('../middleware/authMiddleware')
const { poolPromise, sql } = require('../config/db')

// ======================
// CREATE VENDOR
// ======================
exports.createVendor = async (req, res) => {
  try {
    const pool = await poolPromise

    const {
      vendor_name,
      email_id,
      address,
      phone,
      state,
      statecode,
      contactable_person,
      pancard_no,
      registration_no,
      gst_no,
      ac_no,
      bank_name,
      ifsc_code,
      micr_no,
      branch_name,
    } = req.body

    // CHECK DUPLICATE EMAIL
    const emailExist = await pool
      .request()
      .input('email_id', sql.VarChar(sql.MAX), email_id || '').query(`
        SELECT id
        FROM vendors
        WHERE email_id = @email_id
        AND active = '0'
      `)

    if (emailExist.recordset.length > 0) {
      return res.status(400).json({
        message: 'Email ID already exists',
      })
    }

    // INSERT
    await pool
      .request()
      .input('vendor_name', sql.VarChar(sql.MAX), vendor_name || '')
      .input('email_id', sql.VarChar(sql.MAX), email_id || '')
      .input('address', sql.VarChar(sql.MAX), address || '')
      .input('phone', sql.VarChar(sql.MAX), phone || '')
      .input('state', sql.VarChar(sql.MAX), state || '')
      .input('statecode', sql.VarChar(sql.MAX), statecode || '')
      .input(
        'contactable_person',
        sql.VarChar(sql.MAX),
        contactable_person || '',
      )
      .input('pancard_no', sql.VarChar(50), pancard_no || '')
      .input('registration_no', sql.VarChar(20), registration_no || '')
      .input('gst_no', sql.VarChar(20), gst_no || '')
      .input('ac_no', sql.VarChar(17), ac_no || '')
      .input('bank_name', sql.VarChar(100), bank_name || '')
      .input('ifsc_code', sql.VarChar(15), ifsc_code || '')
      .input('micr_no', sql.VarChar(20), micr_no || '')
      .input('branch_name', sql.VarChar(sql.MAX), branch_name || '')
      .input('created_by', sql.Int, req.user.id).query(`
        INSERT INTO vendors
        (
          vendor_name,
          email_id,
          address,
          phone,
          state,
          statecode,
          contactable_person,
          pancard_no,
          registration_no,
          gst_no,
          ac_no,
          bank_name,
          ifsc_code,
          micr_no,
          branch_name,
          active,
          created_on,
          created_by
        )
        VALUES
        (
          @vendor_name,
          @email_id,
          @address,
          @phone,
          @state,
          @statecode,
          @contactable_person,
          @pancard_no,
          @registration_no,
          @gst_no,
          @ac_no,
          @bank_name,
          @ifsc_code,
          @micr_no,
          @branch_name,
          '0',
          GETDATE(),
          @created_by
        )
      `)

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
    })
  } catch (error) {
    console.error('CREATE VENDOR ERROR:', error)

    res.status(500).json({
      message: 'Error creating vendor',
    })
  }
}

// ======================
// GET ALL VENDORS
// ======================
exports.getVendors = async (req, res) => {
  try {
    const pool = await poolPromise

    const { searchFields, fromDate, toDate } = req.query

    let query = `
      SELECT *
      FROM vendors
      WHERE active = '0'
    `

    // SEARCH FILTER
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
        AND CAST(created_on AS DATE)
        BETWEEN '${fromDate}' AND '${toDate}'
      `
    }

    query += ` ORDER BY id DESC`

    const result = await pool.request().query(query)

    res.status(200).json(result.recordset)
  } catch (error) {
    console.error('FETCH VENDORS ERROR:', error)

    res.status(500).json({
      message: 'Error fetching vendors',
    })
  }
}

// ======================
// SEARCH VENDORS
// ======================
exports.searchVendors = async (req, res) => {
  try {
    const pool = await poolPromise

    let { keyword } = req.query

    const result = await pool.request().query(`
      SELECT TOP 10
        vendor_name,
        address,
        gst_no,
        state,
        statecode
      FROM vendors
      WHERE vendor_name LIKE '%${keyword}%'
      AND active = '0'
      ORDER BY id DESC
    `)

    res.json(result.recordset)
  } catch (err) {
    console.error('SEARCH VENDOR ERROR:', err)

    res.status(500).json({
      message: 'Vendor search failed',
    })
  }
}

// ======================
// UPDATE VENDOR
// ======================
exports.updateVendors = async (req, res) => {
  try {
    const pool = await poolPromise

    const { id } = req.params

    const {
      vendor_name,
      email_id,
      address,
      phone,
      state,
      statecode,
      contactable_person,
      pancard_no,
      registration_no,
      gst_no,
      ac_no,
      bank_name,
      ifsc_code,
      micr_no,
      branch_name,
    } = req.body

    // CHECK DUPLICATE EMAIL
    const emailExist = await pool
      .request()
      .input('email_id', sql.VarChar(sql.MAX), email_id || '')
      .input('id', sql.Int, id).query(`
        SELECT id
        FROM vendors
        WHERE email_id = @email_id
        AND id != @id
        AND active = '0'
      `)

    if (emailExist.recordset.length > 0) {
      return res.status(400).json({
        message: 'Email ID already exists',
      })
    }

    // UPDATE
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('vendor_name', sql.VarChar(sql.MAX), vendor_name || '')
      .input('email_id', sql.VarChar(sql.MAX), email_id || '')
      .input('address', sql.VarChar(sql.MAX), address || '')
      .input('phone', sql.VarChar(sql.MAX), phone || '')
      .input('state', sql.VarChar(sql.MAX), state || '')
      .input('statecode', sql.VarChar(sql.MAX), statecode || '')
      .input(
        'contactable_person',
        sql.VarChar(sql.MAX),
        contactable_person || '',
      )
      .input('pancard_no', sql.VarChar(50), pancard_no || '')
      .input('registration_no', sql.VarChar(20), registration_no || '')
      .input('gst_no', sql.VarChar(20), gst_no || '')
      .input('ac_no', sql.VarChar(17), ac_no || '')
      .input('bank_name', sql.VarChar(100), bank_name || '')
      .input('ifsc_code', sql.VarChar(15), ifsc_code || '')
      .input('micr_no', sql.VarChar(20), micr_no || '')
      .input('branch_name', sql.VarChar(sql.MAX), branch_name || '')
      .input('modified_by', sql.Int, req.user.id).query(`
        UPDATE vendors
        SET
          vendor_name = @vendor_name,
          email_id = @email_id,
          address = @address,
          phone = @phone,
          state = @state,
          statecode = @statecode,
          contactable_person = @contactable_person,
          pancard_no = @pancard_no,
          registration_no = @registration_no,
          gst_no = @gst_no,
          ac_no = @ac_no,
          bank_name = @bank_name,
          ifsc_code = @ifsc_code,
          micr_no = @micr_no,
          branch_name = @branch_name,
          modified_on = GETDATE(),
          modified_by = @modified_by
        WHERE id = @id
      `)

    res.status(200).json({
      success: true,
      message: 'Vendor updated successfully',
    })
  } catch (error) {
    console.error('UPDATE VENDOR ERROR:', error)

    res.status(500).json({
      message: 'Error updating vendor',
    })
  }
}

// ======================
// DELETE VENDOR
// ======================
exports.deleteVendors = async (req, res) => {
  try {
    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('disabled_by', sql.Int, req.user.id).query(`
        UPDATE vendors
        SET
          active = '1',
          disabled_on = GETDATE(),
          disabled_by = @disabled_by
        WHERE id = @id
      `)

    res.status(200).json({
      message: 'Vendor deactivated successfully',
    })
  } catch (error) {
    console.error('DELETE VENDOR ERROR:', error)

    res.status(500).json({
      message: 'Error deactivating vendor',
    })
  }
}

// ======================
// EXPORT EXCEL
// ======================
exports.exportVendorsToExcel = async (req, res) => {
  try {
    const pool = await poolPromise

    const { searchFields, fromDate, toDate } = req.query

    let query = `
      SELECT *
      FROM vendors
      WHERE active = '0'
    `

    // SEARCH FILTER
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
        AND CAST(created_on AS DATE)
        BETWEEN '${fromDate}' AND '${toDate}'
      `
    }

    query += ` ORDER BY id DESC`

    const result = await pool.request().query(query)

    // HEADERS
    const headers = [
      'Vendor Name',
      'Email ID',
      'Phone',
      'Address',
      'State',
      'State Code',
      'Contact Person',
      'Pancard No',
      'Registration No',
      'GST No',
      'Account No',
      'Bank Name',
      'IFSC Code',
      'MICR No',
      'Branch Name',
      'Created On',
    ]

    // ROWS
    const excelRows = result.recordset.map((v) => [
      v.vendor_name || '',
      v.email_id || '',
      v.phone || '',
      v.address || '',
      v.state || '',
      v.statecode || '',
      v.contactable_person || '',
      v.pancard_no || '',
      v.registration_no || '',
      v.gst_no || '',
      v.ac_no || '',
      v.bank_name || '',
      v.ifsc_code || '',
      v.micr_no || '',
      v.branch_name || '',
      v.created_on || '',
    ])

    const finalSheetData = [headers, ...excelRows]

    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData)

    const workbook = xlsx.utils.book_new()

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Vendors')

    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

    const fileName = `Vendors_${randomNumber}.xlsx`

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
    console.error('EXPORT EXCEL ERROR:', error)

    res.status(500).json({
      message: 'Failed to download Excel',
    })
  }
}

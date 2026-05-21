// controllers/companyController.js

const { poolPromise, sql } = require('../config/db')

// ---------------- CREATE COMPANY ----------------
async function createCompany(req, res) {
  try {
    const pool = await poolPromise
    const data = req.body

    // Check duplicate company
    const check = await pool
      .request()
      .input('company_name', sql.VarChar, data.company_name).query(`
        SELECT TOP 1 * FROM companies
        WHERE company_name = @company_name
      `)

    if (check.recordset.length > 0) {
      return res.status(400).json({
        message: 'Company already exists',
      })
    }

    // Insert company
    const result = await pool
      .request()
      .input('company_name', sql.VarChar, data.company_name)
      .input('email_id', sql.VarChar, data.email_id)
      .input('address', sql.VarChar, data.address)
      .input('phone', sql.VarChar, data.phone)
      .input('city', sql.VarChar, data.city)
      .input('country', sql.VarChar, data.country)
      .input('pincode', sql.VarChar, data.pincode)
      .input('state', sql.VarChar, data.state)
      .input('statecode', sql.VarChar, data.statecode)
      .input('currency', sql.VarChar, data.currency)
      .input('gst_no', sql.VarChar, data.gst_no)
      .input('website', sql.VarChar, data.website)
      .input('cin_no', sql.VarChar, data.cin_no)
      .input('vat_tin', sql.VarChar, data.vat_tin)
      .input('cst_tin', sql.VarChar, data.cst_tin)
      .input('iec', sql.VarChar, data.iec)
      .input('terms', sql.VarChar, data.terms)
      .input('logo', sql.VarChar, data.logo || null)
      .input('created_by', sql.Int, req.user.id).query(`
        INSERT INTO companies (
          company_name,email_id,address,phone,city,country,pincode,
          state,statecode,currency,gst_no,website,cin_no,vat_tin,
          cst_tin,iec,terms,logo,active,created_on,created_by
        )

        OUTPUT INSERTED.*

        VALUES (
          @company_name,@email_id,@address,@phone,@city,@country,
          @pincode,@state,@statecode,@currency,@gst_no,@website,
          @cin_no,@vat_tin,@cst_tin,@iec,@terms,@logo,
          0,GETDATE(),@created_by
        )
      `)

    res.status(201).json({
      message: 'Company created successfully',
      company: result.recordset[0],
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      message: 'Server error',
    })
  }
}

// ---------------- GET COMPANIES ----------------
async function getCompanies(req, res) {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT *
      FROM companies
      WHERE active = 0
      ORDER BY created_on DESC
    `)

    res.json(result.recordset)
  } catch (err) {
    console.error(err)

    res.status(500).json({
      message: 'Server error',
    })
  }
}

// ---------------- UPDATE COMPANY ----------------
async function updateCompany(req, res) {
  try {
    const pool = await poolPromise

    const id = req.params.id
    const data = req.body

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('company_name', sql.VarChar, data.company_name)
      .input('email_id', sql.VarChar, data.email_id).query(`
        UPDATE companies
        SET
          company_name = @company_name,
          email_id = @email_id,
          modified_on = GETDATE()
        WHERE id = @id
      `)

    res.json({
      message: 'Company updated successfully',
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      message: 'Server error',
    })
  }
}

// ---------------- DELETE COMPANY ----------------
async function deleteCompany(req, res) {
  try {
    const pool = await poolPromise

    const id = req.params.id

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('disabled_by', sql.Int, req.user.id).query(`
        UPDATE companies
        SET
          active = 1,
          disabled_on = GETDATE(),
          disabled_by = @disabled_by
        WHERE id = @id
      `)

    res.json({
      message: 'Company deleted successfully',
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      message: 'Server error',
    })
  }
}

// POST /api/companies/:id/bank-details
async function addBankDetails(req, res) {
  try {
    const pool = await poolPromise

    const companyId = req.params.id

    const {
      bank_name,
      ifsc_code,
      branch_city,
      swift_ac_no,
      ac_no,
      ac_type,
      micr_no,
      branch_name,
    } = req.body

    // Check if company exists
    const companyCheck = await pool
      .request()
      .input('companyId', sql.Int, companyId).query(`
        SELECT *
        FROM companies
        WHERE id = @companyId
      `)

    if (!companyCheck.recordset.length) {
      return res.status(404).json({
        message: 'Company not found',
      })
    }

    // Update bank details
    await pool
      .request()
      .input('companyId', sql.Int, companyId)
      .input('bank_name', sql.VarChar, bank_name)
      .input('ifsc_code', sql.VarChar, ifsc_code)
      .input('branch_city', sql.VarChar, branch_city)
      .input('swift_ac_no', sql.VarChar, swift_ac_no)
      .input('ac_no', sql.VarChar, ac_no)
      .input('ac_type', sql.VarChar, ac_type)
      .input('micr_no', sql.VarChar, micr_no)
      .input('branch_name', sql.VarChar, branch_name)
      .input('modified_by', sql.Int, req.user.id).query(`
        UPDATE companies
        SET
          bank_name = @bank_name,
          ifsc_code = @ifsc_code,
          branch_city = @branch_city,
          swift_ac_no = @swift_ac_no,
          ac_no = @ac_no,
          ac_type = @ac_type,
          micr_no = @micr_no,
          branch_name = @branch_name,
          modified_on = GETDATE(),
          modified_by = @modified_by
        WHERE id = @companyId
      `)

    res.status(200).json({
      message: 'Bank details saved successfully',
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      message: 'Server error',
    })
  }
}

// ---------------- EXPORT COMPANIES ----------------
async function exportCompaniesToExcel(req, res) {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT *
      FROM companies
      WHERE active = 0
      ORDER BY created_on DESC
    `)

    // Placeholder: send JSON; you can implement Excel logic here
    res.json(result.recordset)
  } catch (err) {
    console.error(err)

    res.status(500).json({
      message: 'Server error',
    })
  }
}

module.exports = {
  createCompany,
  getCompanies,
  updateCompany,
  deleteCompany,
  exportCompaniesToExcel,
  addBankDetails,
}

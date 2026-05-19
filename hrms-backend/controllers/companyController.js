// controllers/companyController.js
const { sql } = require('../config/db')

// ---------------- CREATE COMPANY ----------------
async function createCompany(req, res) {
  try {
    const data = req.body

    // Check duplicate company
    const check = await sql.query`
      SELECT TOP 1 * FROM companies 
      WHERE company_name = ${data.company_name}
    `
    if (check.recordset.length > 0) {
      return res.status(400).json({ message: 'Company already exists' })
    }

    // Insert company
    const result = await sql.query`
      INSERT INTO companies (
        company_name,email_id,address,phone,city,country,pincode,state,statecode,
        currency,gst_no,website,cin_no,vat_tin,cst_tin,iec,terms,logo,active,created_on,created_by
      )
      OUTPUT INSERTED.*
      VALUES (
        ${data.company_name},${data.email_id},${data.address},${data.phone},${data.city},${data.country},
        ${data.pincode},${data.state},${data.statecode},${data.currency},${data.gst_no},${data.website},
        ${data.cin_no},${data.vat_tin},${data.cst_tin},${data.iec},${data.terms},${data.logo || null},0,GETDATE(),${req.user.id}
      )
    `

    res.status(201).json({
      message: 'Company created successfully',
      company: result.recordset[0],
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ---------------- GET COMPANIES ----------------
async function getCompanies(req, res) {
  try {
    const result = await sql.query(`
      SELECT * FROM companies
      WHERE active = 0
      ORDER BY created_on DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ---------------- UPDATE COMPANY ----------------
async function updateCompany(req, res) {
  try {
    const id = req.params.id
    const data = req.body

    await sql.query`
      UPDATE companies
      SET company_name=${data.company_name},email_id=${data.email_id},address=${data.address},
          phone=${data.phone},city=${data.city},country=${data.country},pincode=${data.pincode},
          state=${data.state},statecode=${data.statecode},currency=${data.currency},gst_no=${data.gst_no},
          website=${data.website},cin_no=${data.cin_no},vat_tin=${data.vat_tin},cst_tin=${data.cst_tin},
          iec=${data.iec},terms=${data.terms},modified_on=GETDATE(),modified_by=${req.user.id}
      WHERE id=${id}
    `

    res.json({ message: 'Company updated successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ---------------- DELETE (SOFT DELETE) ----------------
async function deleteCompany(req, res) {
  try {
    const id = req.params.id

    await sql.query`
      UPDATE companies
      SET active=1, disabled_on=GETDATE(), disabled_by=${req.user.id}
      WHERE id=${id}
    `

    res.json({ message: 'Company deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ---------------- EXPORT COMPANIES ----------------
async function exportCompaniesToExcel(req, res) {
  try {
    const result = await sql.query(`SELECT * FROM companies WHERE active=0`)
    // Placeholder: send JSON; you can implement Excel logic here
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Export all functions
module.exports = {
  createCompany,
  getCompanies,
  updateCompany,
  deleteCompany,
  exportCompaniesToExcel,
}

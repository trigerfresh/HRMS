const { poolPromise, sql } = require('../config/db')

exports.createBranch = async (req, res) => {
  try {
    const pool = await poolPromise

    const data = req.body

    // Check duplicate email
    if (data.email) {
      const checkEmail = await pool.request().query(`
        SELECT TOP 1 * FROM branch
        WHERE email = '${data.email}' AND active = 0
      `)

      if (checkEmail.recordset.length > 0) {
        return res.status(400).json({
          message: 'Email ID already exists',
        })
      }
    }

    // Insert branch
    const result = await pool.request().query(`
      INSERT INTO branch (
        branch_name, branch_code, company_name, company_id,
        email, address, city, pincode,
        costing_method, def_purchase_ac,
        def_sales_ac, def_branch_recv_ac,
        def_branch_desp_ac, phone,
        active, created_by, created_on
      )
      OUTPUT INSERTED.*
      VALUES (
        '${data.branch_name}',
        '${data.branch_code}',
        '${data.company_name}',
        '${data.company_id}',
        '${data.email}',
        '${data.address}',
        '${data.city}',
        '${data.pincode}',
        '${data.costing_method}',
        '${data.def_purchase_ac}',
        '${data.def_sales_ac}',
        '${data.def_branch_recv_ac}',
        '${data.def_branch_desp_ac}',
        '${data.phone}',
        0,
        '${req.user.id}',
        GETDATE()
      )
    `)

    res.status(201).json({
      message: 'Branch created successfully',
      branch: result.recordset[0],
    })
  } catch (error) {
    console.error('CREATE BRANCH FAILED:', error)

    res.status(500).json({
      message: 'Error creating branch',
      error: error.message,
    })
  }
}

exports.getBranches = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT * FROM branch
      WHERE active = 0
      ORDER BY created_on DESC
    `)

    res.json(result.recordset)
  } catch (error) {
    console.error('GET BRANCHES FAILED:', error)

    res.status(500).json({
      message: 'Error fetching branches',
      error: error.message,
    })
  }
}

exports.updateBranch = async (req, res) => {
  try {
    const pool = await poolPromise

    const id = req.params.id
    const data = req.body

    const result = await pool.request().query(`
      UPDATE branch
      SET
        branch_name='${data.branch_name}',
        branch_code='${data.branch_code}',
        company_name='${data.company_name}',
        company_id='${data.company_id}',
        email='${data.email}',
        address='${data.address}',
        city='${data.city}',
        pincode='${data.pincode}',
        costing_method='${data.costing_method}',
        def_purchase_ac='${data.def_purchase_ac}',
        def_sales_ac='${data.def_sales_ac}',
        def_branch_recv_ac='${data.def_branch_recv_ac}',
        def_branch_desp_ac='${data.def_branch_desp_ac}',
        phone='${data.phone}',
        modified_on=GETDATE(),
        modified_by='${req.user.id}'
      WHERE id='${id}'

      SELECT * FROM branch WHERE id='${id}'
    `)

    res.status(200).json({
      message: 'Branch updated successfully',
      branch: result.recordset[0],
    })
  } catch (error) {
    console.error('UPDATE BRANCH FAILED:', error)

    res.status(500).json({
      message: 'Error updating branch',
      error: error.message,
    })
  }
}

exports.deleteBranch = async (req, res) => {
  try {
    const pool = await poolPromise

    const id = req.params.id

    const result = await pool.request().query(`
      UPDATE branch
      SET
        active = 1,
        disabled_on = GETDATE(),
        disabled_by = '${req.user.id}'
      WHERE id = '${id}'

      SELECT * FROM branch WHERE id='${id}'
    `)

    res.status(200).json({
      message: 'Branch deleted successfully',
      branch: result.recordset[0],
    })
  } catch (error) {
    console.error('DELETE BRANCH FAILED:', error)

    res.status(500).json({
      message: 'Error deleting branch',
      error: error.message,
    })
  }
}

// ---------------- EXPORT BRANCHES TO EXCEL ----------------
exports.exportBranchesToExcel = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT *
      FROM branch
      WHERE active = 0
      ORDER BY created_on DESC
    `)

    const branches = result.recordset

    const headers = [
      'Branch Name',
      'Branch Code',
      'Company Name',
      'Email',
      'Address',
      'City',
      'Pincode',
      'Costing Method',
      'Def. Purchase Account',
      'Def. Sales Account',
      'Def. Branch Recv. Account',
      'Def. Branch Disp. Account',
      'Phone',
      'Created On',
    ]

    const excelRows = branches.map((b) => [
      b.branch_name,
      b.branch_code,
      b.company_name,
      b.email,
      b.address,
      b.city,
      b.pincode,
      b.costing_method,
      b.def_purchase_ac,
      b.def_sales_ac,
      b.def_branch_recv_ac,
      b.def_branch_desp_ac,
      b.phone,
      b.created_on ? new Date(b.created_on).toLocaleDateString() : '',
    ])

    const finalSheetData = [headers, ...excelRows]

    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData)

    const workbook = xlsx.utils.book_new()

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Branches')

    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

    const fileName = `Branches_${randomNumber}.xlsx`

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
    console.error('EXPORT BRANCHES FAILED:', error)

    res.status(500).json({
      message: 'Failed to download Excel',
      error: error.message,
    })
  }
}

// ---------------- GET BRANCHES BY COMPANY ----------------
exports.getBranchesByCompany = async (req, res) => {
  try {
    const pool = await poolPromise

    const companyId = req.params.companyId

    const result = await pool.request().query(`
      SELECT *
      FROM branch
      WHERE company_id='${companyId}'
      AND active = 0
    `)

    res.json(result.recordset)
  } catch (err) {
    console.error(err)

    res.status(500).json({
      message: 'Server Error',
      error: err.message,
    })
  }
}

const sql = require('mssql')
const { poolPromise } = require('../config/db')

// ================= CREATE TEMPLATE =================

exports.createTemplate = async (req, res) => {
  try {
    const pool = await poolPromise

    const {
      template_name,
      rank,
      gross_salary,
      gross_salary_type,
      basic_salary,
      basic_salary_type,
      perday_salary,
      hra,
      deductions,
      earnings,
    } = req.body

    // INSERT TEMPLATE
    const templateResult = await pool
      .request()
      .input('template_name', sql.VarChar, template_name)
      .input('rank', sql.VarChar, rank)
      .input('gross_salary', sql.VarChar, gross_salary)
      .input('gross_salary_type', sql.VarChar, gross_salary_type)
      .input('basic_salary', sql.VarChar, basic_salary)
      .input('basic_salary_type', sql.VarChar, basic_salary_type)
      .input('perday_salary', sql.VarChar, perday_salary)
      .input('hra', sql.VarChar, hra)
      .input('active', sql.VarChar, '0')
      .input('created_by', sql.VarChar, String(req.user.id)).query(`
        INSERT INTO salary_template
        (
          template_name,
          rank,
          gross_salary,
          gross_salary_type,
          basic_salary,
          basic_salary_type,
          perday_salary,
          hra,
          active,
          created_by,
          created_on
        )

        OUTPUT INSERTED.id

        VALUES
        (
          @template_name,
          @rank,
          @gross_salary,
          @gross_salary_type,
          @basic_salary,
          @basic_salary_type,
          @perday_salary,
          @hra,
          @active,
          @created_by,
          GETDATE()
        )
      `)

    const templateId = templateResult.recordset[0].id

    // ================= INSERT DEDUCTIONS =================

    if (deductions && deductions.length > 0) {
      for (const d of deductions) {
        await pool
          .request()
          .input('tmpl_id', sql.VarChar, String(templateId))
          .input('deduction_name', sql.VarChar, d.deduction_name)
          .input('deduction_rate', sql.VarChar, d.deduction_rate)
          .input('deduction_amount', sql.VarChar, d.deduction_amount)
          .input('from_date', sql.VarChar, d.from_date)
          .input('to_date', sql.VarChar, d.to_date)
          .input('dd_calculateon', sql.VarChar, d.dd_calculateon)
          .input('dd_operator', sql.VarChar, d.dd_operator)
          .input('dd_comp_operator', sql.VarChar, d.dd_comp_operator)
          .input('active', sql.VarChar, '0').query(`
            INSERT INTO salary_deduction
            (
              tmpl_id,
              deduction_name,
              deduction_rate,
              deduction_amount,
              from_date,
              to_date,
              dd_calculateon,
              dd_operator,
              dd_comp_operator,
              active
            )

            VALUES
            (
              @tmpl_id,
              @deduction_name,
              @deduction_rate,
              @deduction_amount,
              @from_date,
              @to_date,
              @dd_calculateon,
              @dd_operator,
              @dd_comp_operator,
              @active
            )
          `)
      }
    }

    // ================= INSERT EARNINGS =================

    if (earnings && earnings.length > 0) {
      for (const e of earnings) {
        await pool
          .request()
          .input('tmpl_id', sql.VarChar, String(templateId))
          .input('earning_name', sql.VarChar, e.earning_name)
          .input('earning_rate', sql.VarChar, e.earning_rate)
          .input('earning_amount', sql.VarChar, e.earning_amount)
          .input('ea_from_date', sql.VarChar, e.ea_from_date)
          .input('ea_to_date', sql.VarChar, e.ea_to_date)
          .input('ea_calculateon', sql.VarChar, e.ea_calculateon)
          .input('ea_operator', sql.VarChar, e.ea_operator)
          .input('ea_comp_operator', sql.VarChar, e.ea_comp_operator)
          .input('active', sql.VarChar, '0').query(`
            INSERT INTO salary_earning
            (
              tmpl_id,
              earning_name,
              earning_rate,
              earning_amount,
              ea_from_date,
              ea_to_date,
              ea_calculateon,
              ea_operator,
              ea_comp_operator,
              active
            )

            VALUES
            (
              @tmpl_id,
              @earning_name,
              @earning_rate,
              @earning_amount,
              @ea_from_date,
              @ea_to_date,
              @ea_calculateon,
              @ea_operator,
              @ea_comp_operator,
              @active
            )
          `)
      }
    }

    res.status(201).json({
      success: true,
      message: 'Salary Template Created Successfully',
      templateId,
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      success: false,
      message: 'Create Failed',
      error: error.message,
    })
  }
}

// ================= UPDATE TEMPLATE =================

exports.updateTemplate = async (req, res) => {
  try {
    const pool = await poolPromise

    const templateId = req.params.id

    const {
      template_name,
      rank,
      gross_salary,
      gross_salary_type,
      basic_salary,
      basic_salary_type,
      perday_salary,
      hra,
      deductions,
      earnings,
    } = req.body

    // ================= UPDATE SALARY TEMPLATE =================

    await pool
      .request()
      .input('id', sql.Int, templateId)
      .input('template_name', sql.VarChar, template_name)
      .input('rank', sql.VarChar, rank)
      .input('gross_salary', sql.VarChar, gross_salary)
      .input('gross_salary_type', sql.VarChar, gross_salary_type)
      .input('basic_salary', sql.VarChar, basic_salary)
      .input('basic_salary_type', sql.VarChar, basic_salary_type)
      .input('perday_salary', sql.VarChar, perday_salary)
      .input('hra', sql.VarChar, hra)
      .input('modified_by', sql.VarChar, String(req.user.id)).query(`
        UPDATE salary_template
        SET
          template_name = @template_name,
          rank = @rank,
          gross_salary = @gross_salary,
          gross_salary_type = @gross_salary_type,
          basic_salary = @basic_salary,
          basic_salary_type = @basic_salary_type,
          perday_salary = @perday_salary,
          hra = @hra,
          modified_by = @modified_by,
          modified_on = GETDATE()
        WHERE id = @id
      `)

    // ================= DELETE OLD DEDUCTIONS =================

    await pool.request().input('tmpl_id', sql.VarChar, String(templateId))
      .query(`
        DELETE FROM salary_deduction
        WHERE tmpl_id = @tmpl_id
      `)

    // ================= INSERT NEW DEDUCTIONS =================

    if (deductions && deductions.length > 0) {
      for (const d of deductions) {
        await pool
          .request()
          .input('tmpl_id', sql.VarChar, templateId)
          .input('deduction_name', sql.VarChar, d.deduction_name)
          .input('deduction_rate', sql.VarChar, d.deduction_rate)
          .input('deduction_amount', sql.VarChar, d.deduction_amount)
          .input('from_date', sql.VarChar, d.from_date)
          .input('to_date', sql.VarChar, d.to_date)
          .input('dd_calculateon', sql.VarChar, d.dd_calculateon)
          .input('dd_operator', sql.VarChar, d.dd_operator)
          .input('dd_comp_operator', sql.VarChar, d.dd_comp_operator)
          .input('active', sql.VarChar, '0').query(`
            INSERT INTO salary_deduction
            (
              tmpl_id,
              deduction_name,
              deduction_rate,
              deduction_amount,
              from_date,
              to_date,
              dd_calculateon,
              dd_operator,
              dd_comp_operator,
              active
            )

            VALUES
            (
              @tmpl_id,
              @deduction_name,
              @deduction_rate,
              @deduction_amount,
              @from_date,
              @to_date,
              @dd_calculateon,
              @dd_operator,
              @dd_comp_operator,
              @active
            )
          `)
      }
    }

    // ================= DELETE OLD EARNINGS =================

    await pool.request().input('tmpl_id', sql.VarChar, templateId).query(`
        DELETE FROM salary_earning
        WHERE tmpl_id = @tmpl_id
      `)

    // ================= INSERT NEW EARNINGS =================

    if (earnings && earnings.length > 0) {
      for (const e of earnings) {
        await pool
          .request()
          .input('tmpl_id', sql.VarChar, templateId)
          .input('earning_name', sql.VarChar, e.earning_name)
          .input('earning_rate', sql.VarChar, e.earning_rate)
          .input('earning_amount', sql.VarChar, e.earning_amount)
          .input('ea_from_date', sql.VarChar, e.ea_from_date)
          .input('ea_to_date', sql.VarChar, e.ea_to_date)
          .input('ea_calculateon', sql.VarChar, e.ea_calculateon)
          .input('ea_operator', sql.VarChar, e.ea_operator)
          .input('ea_comp_operator', sql.VarChar, e.ea_comp_operator)
          .input('active', sql.VarChar, '0').query(`
            INSERT INTO salary_earning
            (
              tmpl_id,
              earning_name,
              earning_rate,
              earning_amount,
              ea_from_date,
              ea_to_date,
              ea_calculateon,
              ea_operator,
              ea_comp_operator,
              active
            )

            VALUES
            (
              @tmpl_id,
              @earning_name,
              @earning_rate,
              @earning_amount,
              @ea_from_date,
              @ea_to_date,
              @ea_calculateon,
              @ea_operator,
              @ea_comp_operator,
              @active
            )
          `)
      }
    }

    res.status(200).json({
      success: true,
      message: 'Salary Template Updated Successfully',
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      success: false,
      message: 'Update Failed',
      error: error.message,
    })
  }
}

// ================= DELETE TEMPLATE =================

exports.deleteTemplate = async (req, res) => {
  try {
    const pool = await poolPromise

    const templateId = req.params.id

    // ================= SOFT DELETE TEMPLATE =================

    await pool
      .request()
      .input('id', sql.Int, templateId)
      .input('disabled_by', sql.VarChar, String(req.user.id)).query(`
        UPDATE salary_template
        SET
          active = 1,
          disabled_by = @disabled_by,
          disabled_on = GETDATE()
        WHERE id = @id
      `)

    // ================= SOFT DELETE DEDUCTIONS =================

    await pool.request().input('tmpl_id', sql.VarChar, templateId).query(`
        UPDATE salary_deduction
        SET active = 1
        WHERE tmpl_id = @tmpl_id
      `)

    // ================= SOFT DELETE EARNINGS =================

    await pool.request().input('tmpl_id', sql.VarChar, templateId).query(`
        UPDATE salary_earning
        SET active = 1
        WHERE tmpl_id = @tmpl_id
      `)

    res.status(200).json({
      success: true,
      message: 'Salary Template Deleted Successfully',
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      success: false,
      message: 'Delete Failed',
      error: error.message,
    })
  }
}

// ================= GET ALL SALARY TEMPLATES =================

exports.getTemplates = async (req, res) => {
  try {
    const pool = await poolPromise

    const { searchFields, fromDate, toDate } = req.query

    let query = `
      WHERE st.active = 0
    `

    // ================= SEARCH FILTER =================

    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((field) => {
        if (field.field && field.keyword) {
          query += ` 
            AND ${field.field} LIKE '%${field.keyword}%'
          `
        }
      })
    }

    // ================= DATE FILTER =================

    if (fromDate && toDate) {
      query += `
        AND CAST(st.created_on AS DATE)
        BETWEEN '${fromDate}' AND '${toDate}'
      `
    }

    // ================= GET TEMPLATE =================

    const templateResult = await pool.request().query(`
      SELECT
        st.*
      FROM salary_template st
      ${query}
      ORDER BY st.id DESC
    `)

    const templates = templateResult.recordset

    // ================= GET DEDUCTIONS & EARNINGS =================

    for (const template of templates) {
      // DEDUCTIONS

      const deductionResult = await pool
        .request()
        .input('tmpl_id', sql.VarChar, String(template.id)).query(`
          SELECT
            id,
            tmpl_id,
            deduction_name,
            deduction_rate,
            deduction_amount,
            from_date,
            to_date,
            dd_calculateon,
            dd_operator,
            dd_comp_operator
          FROM salary_deduction
          WHERE tmpl_id = @tmpl_id
          AND active = 0
        `)

      // EARNINGS

      const earningResult = await pool
        .request()
        .input('tmpl_id', sql.VarChar, String(template.id)).query(`
          SELECT
            id,
            tmpl_id,
            earning_name,
            earning_rate,
            earning_amount,
            ea_from_date,
            ea_to_date,
            ea_calculateon,
            ea_operator,
            ea_comp_operator
          FROM salary_earning
          WHERE tmpl_id = @tmpl_id
          AND active = 0
        `)

      template.deductions = deductionResult.recordset
      template.earnings = earningResult.recordset
    }

    res.status(200).json({
      success: true,
      data: templates,
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message,
    })
  }
}

// ================= GET SINGLE TEMPLATE =================

exports.getTemplate = async (req, res) => {
  try {
    const pool = await poolPromise

    const templateId = req.params.id

    // ================= TEMPLATE =================

    const templateResult = await pool.request().input('id', sql.Int, templateId)
      .query(`
        SELECT *
        FROM salary_template
        WHERE id = @id
        AND active = 0
      `)

    if (templateResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      })
    }

    const template = templateResult.recordset[0]

    // ================= DEDUCTIONS =================

    const deductionResult = await pool
      .request()
      .input('tmpl_id', sql.VarChar, templateId).query(`
        SELECT
          id,
          tmpl_id,
          deduction_name,
          deduction_rate,
          deduction_amount,
          from_date,
          to_date,
          dd_calculateon,
          dd_operator,
          dd_comp_operator
        FROM salary_deduction
        WHERE tmpl_id = @tmpl_id
        AND active = 0
      `)

    // ================= EARNINGS =================

    const earningResult = await pool
      .request()
      .input('tmpl_id', sql.VarChar, templateId).query(`
        SELECT
          id,
          tmpl_id,
          earning_name,
          earning_rate,
          earning_amount,
          ea_from_date,
          ea_to_date,
          ea_calculateon,
          ea_operator,
          ea_comp_operator
        FROM salary_earning
        WHERE tmpl_id = @tmpl_id
        AND active = 0
      `)

    template.deductions = deductionResult.recordset
    template.earnings = earningResult.recordset

    res.status(200).json({
      success: true,
      data: template,
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: error.message,
    })
  }
}

exports.exportTemplates = async (req, res) => {
  try {
    const pool = await poolPromise

    const { searchFields, fromDate, toDate } = req.query

    let whereClause = `WHERE st.active = '0'`

    // ================= SEARCH =================

    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((field) => {
        if (field.field && field.keyword) {
          whereClause += `
            AND st.${field.field}
            LIKE '%${field.keyword}%'
          `
        }
      })
    }

    // ================= DATE FILTER =================

    if (fromDate && toDate) {
      whereClause += `
        AND CAST(st.created_on AS DATE)
        BETWEEN '${fromDate}' AND '${toDate}'
      `
    }

    // ================= FETCH DATA =================

    const result = await pool.request().query(`
      SELECT
        st.id,
        st.template_name,
        st.rank,
        st.gross_salary,
        st.gross_salary_type,
        st.basic_salary,
        st.basic_salary_type,
        st.perday_salary,
        st.hra,
        st.created_on,

        STUFF((
          SELECT ', ' + sd.deduction_name
          FROM salary_deduction sd
          WHERE sd.tmpl_id = CAST(st.id AS VARCHAR)
          AND sd.active = '0'
          FOR XML PATH('')
        ), 1, 2, '') AS deductions,

        STUFF((
          SELECT ', ' + se.earning_name
          FROM salary_earning se
          WHERE se.tmpl_id = CAST(st.id AS VARCHAR)
          AND se.active = '0'
          FOR XML PATH('')
        ), 1, 2, '') AS earnings

      FROM salary_template st

      ${whereClause}

      ORDER BY st.id DESC
    `)

    const templates = result.recordset

    // ================= HEADERS =================

    const headers = [
      'Template Name',
      'Rank',
      'Gross Salary',
      'Gross Salary Type',
      'Basic Salary',
      'Basic Salary Type',
      'Per Day Salary',
      'HRA',
      'Deductions',
      'Earnings',
      'Created On',
    ]

    // ================= ROWS =================

    const excelRows = templates.map((t) => [
      t.template_name || '',
      t.rank || '',
      t.gross_salary || '',
      t.gross_salary_type || '',
      t.basic_salary || '',
      t.basic_salary_type || '',
      t.perday_salary || '',
      t.hra || '',
      t.deductions || '',
      t.earnings || '',
      t.created_on ? new Date(t.created_on).toLocaleDateString() : '',
    ])

    const finalData = [headers, ...excelRows]

    // ================= CREATE EXCEL =================

    const worksheet = xlsx.utils.aoa_to_sheet(finalData)

    const workbook = xlsx.utils.book_new()

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Salary Templates')

    // ================= FILE =================

    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

    const fileName = `Salary_Templates_${randomNumber}.xlsx`

    const excelBuffer = xlsx.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    // ================= RESPONSE =================

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    res.send(excelBuffer)
  } catch (error) {
    console.log('EXPORT ERROR:', error)

    res.status(500).json({
      success: false,
      message: 'Export Failed',
      error: error.message,
    })
  }
}

// ================= GET DROPDOWN DATA =================

exports.getGangMasterDropdown = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT
        id,
        gang_master
      FROM gang_master
      WHERE active = 0
      ORDER BY gang_master ASC
    `)

    res.status(200).json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch dropdown',
      error: error.message,
    })
  }
}

exports.getGangDropdown = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT
        id,
        gang_master
      FROM gang_master
      WHERE active = 0
      ORDER BY gang_master
    `)

    res.json(result.recordset)
  } catch (error) {
    res.status(500).json({
      message: error.message,
    })
  }
}

const Employee = require('../models/Employee')
const xlsx = require('xlsx')
const cloudinary = require('../utils/cloudinary') // Assuming you have a Cloudinary setup
const fs = require('fs') // For handling temporary files if not using memoryStorage
const path = require('path')
const TempEmployee = require('../models/TempEmployee')
const SiteDetail = require('../models/SiteDetail')
const mongoose = require('mongoose')
const TempEmployeeUpdate = require('../models/TempEmployeeUpdate')
const { poolPromise, sql } = require('../config/db')

// Helper to format dates (TempEmployee has dates as strings or Date objects)
// Helper to format dates for Excel (works for MSSQL DateTime also)
function formatDateForExcel(val) {
  if (!val && val !== 0) return ''

  const date = new Date(val)

  if (!isNaN(date.getTime())) {
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = date.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  }

  return String(val)
}

// Convert Excel date (DD-MM-YYYY) → JS Date (usable for MSSQL insert/update)
function parseExcelDate(dateStr) {
  if (!dateStr) return null

  const parts = dateStr.split('-')
  if (parts.length !== 3) return null

  const [d, m, y] = parts.map(Number)

  return new Date(y, m - 1, d)
}

// Get next employee code
exports.getNextEmployeeCode = async (req, res) => {
  try {
    const pool = await poolPromise

    // Get last employee code
    const result = await pool.request().query(`
      SELECT MAX(employee_code) AS lastCode
      FROM employee
    `)

    let nextCode = 'E001'

    const lastCode = result.recordset[0].lastCode

    if (lastCode) {
      const numberPart = parseInt(lastCode.replace(/\D/g, '')) || 0
      const nextNumber = numberPart + 1
      nextCode = `E${String(nextNumber).padStart(3, '0')}`
    }

    res.status(200).json({
      success: true,
      nextCode,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// Create new employee - UPDATED to auto-generate employee code
exports.createEmployee = async (req, res) => {
  try {
    const pool = await poolPromise

    // 1. Employee code generate
    const countResult = await pool.request().query(`
      SELECT COUNT(*) AS count FROM employee
    `)

    const employeeCount = countResult.recordset[0].count
    const employeeCode = `E${String(employeeCount + 1).padStart(3, '0')}`

    const d = req.body

    const request = pool.request()

    // =========================
    // ALL EMPLOYEE FIELDS
    // =========================
    request.input('employee_code', sql.NVarChar, employeeCode)
    request.input('initial', sql.NVarChar, d.initial)
    request.input('first_name', sql.NVarChar, d.first_name)
    request.input('middle_name', sql.NVarChar, d.middle_name)
    request.input('last_name', sql.NVarChar, d.last_name)
    request.input('gender', sql.NVarChar, d.gender)
    request.input('dob', sql.Date, d.dob || null)
    request.input('date_of_joining', sql.NVarChar, d.date_of_joining)

    request.input('address', sql.NVarChar, d.address)
    request.input('city', sql.NVarChar, d.city)
    request.input('state', sql.NVarChar, d.state)
    request.input('pincode', sql.NVarChar, d.pincode)
    request.input('country', sql.NVarChar, d.country)

    request.input('phone1', sql.NVarChar, d.phone1)
    request.input('phone2', sql.NVarChar, d.phone2)
    request.input('email_id', sql.NVarChar, d.email_id)

    request.input('contact_person', sql.NVarChar, d.contact_person)
    request.input('contact_mobile', sql.NVarChar, d.contact_mobile)

    request.input('p_address', sql.NVarChar, d.p_address)
    request.input('p_city', sql.NVarChar, d.p_city)
    request.input('p_state', sql.NVarChar, d.p_state)
    request.input('p_pincode', sql.NVarChar, d.p_pincode)
    request.input('p_country', sql.NVarChar, d.p_country)

    request.input('contact_relation', sql.NVarChar, d.contact_relation)
    request.input('contact_email', sql.NVarChar, d.contact_email)

    request.input('marital_status', sql.NVarChar, d.marital_status)
    request.input('mrg_date', sql.NVarChar, d.mrg_date)

    request.input('cast', sql.NVarChar, d.cast)
    request.input('category', sql.NVarChar, d.category)
    request.input('native_place', sql.NVarChar, d.native_place)
    request.input('blood_group', sql.NVarChar, d.blood_group)

    request.input('driving_license', sql.NVarChar, d.driving_license)
    request.input('pancard_no', sql.NVarChar, d.pancard_no)
    request.input('aadhar_no', sql.NVarChar, d.aadhar_no)
    request.input('passport_no', sql.NVarChar, d.passport_no)

    request.input('uan_no', sql.NVarChar, d.uan_no)
    request.input('passport_valid_date', sql.NVarChar, d.passport_valid_date)

    request.input('lang1', sql.NVarChar, d.lang1)
    request.input('lang2', sql.NVarChar, d.lang2)
    request.input('lang3', sql.NVarChar, d.lang3)
    request.input('lang4', sql.NVarChar, d.lang4)
    request.input('lang5', sql.NVarChar, d.lang5)

    request.input('hobby1', sql.NVarChar, d.hobby1)
    request.input('hobby2', sql.NVarChar, d.hobby2)
    request.input('hobby3', sql.NVarChar, d.hobby3)
    request.input('hobby4', sql.NVarChar, d.hobby4)

    request.input('bank_name', sql.NVarChar, d.bank_name)
    request.input('account_no', sql.NVarChar, d.account_no)
    request.input('bank_address', sql.NVarChar, d.bank_address)
    request.input('bank_city', sql.NVarChar, d.bank_city)
    request.input('bank_state', sql.NVarChar, d.bank_state)
    request.input('bank_ifsc', sql.NVarChar, d.bank_ifsc)
    request.input('bank_micr', sql.NVarChar, d.bank_micr)

    request.input('client_id', sql.NVarChar, d.client_id)
    request.input('site_id', sql.NVarChar, d.site_id)

    request.input('rank', sql.NVarChar, d.rank)
    request.input('department', sql.NVarChar, d.department)

    request.input('gross_salary', sql.NVarChar, d.gross_salary)
    request.input('basic_salary', sql.NVarChar, d.basic_salary)

    request.input('pf_no', sql.NVarChar, d.pf_no)
    request.input('esis_no', sql.NVarChar, d.esis_no)

    request.input('father_name', sql.NVarChar, d.father_name)
    request.input('emp_full_name', sql.NVarChar, d.emp_full_name)

    // system fields
    request.input('created_by', sql.NVarChar, String(req.user.id))
    request.input('created_on', sql.DateTime, new Date())
    request.input('active', sql.NVarChar, '0')

    // =========================
    // INSERT QUERY (ALL COLUMNS)
    // =========================
    await request.query(`
      INSERT INTO employee (
        employee_code, initial, first_name, middle_name, last_name,
        gender, dob, date_of_joining,
        address, city, state, pincode, country,
        phone1, phone2, email_id,
        contact_person, contact_mobile,
        p_address, p_city, p_state, p_pincode, p_country,
        contact_relation, contact_email,
        marital_status, mrg_date,
        cast, category, native_place, blood_group,
        driving_license, pancard_no, aadhar_no, passport_no,
        uan_no, passport_valid_date,
        lang1, lang2, lang3, lang4, lang5,
        hobby1, hobby2, hobby3, hobby4,
        bank_name, account_no, bank_address, bank_city, bank_state, bank_ifsc, bank_micr,
        client_id, site_id,
        rank, department,
        gross_salary, basic_salary,
        pf_no, esis_no,
        father_name, emp_full_name,
        created_by, created_on, active
      )
      VALUES (
        @employee_code, @initial, @first_name, @middle_name, @last_name,
        @gender, @dob, @date_of_joining,
        @address, @city, @state, @pincode, @country,
        @phone1, @phone2, @email_id,
        @contact_person, @contact_mobile,
        @p_address, @p_city, @p_state, @p_pincode, @p_country,
        @contact_relation, @contact_email,
        @marital_status, @mrg_date,
        @cast, @category, @native_place, @blood_group,
        @driving_license, @pancard_no, @aadhar_no, @passport_no,
        @uan_no, @passport_valid_date,
        @lang1, @lang2, @lang3, @lang4, @lang5,
        @hobby1, @hobby2, @hobby3, @hobby4,
        @bank_name, @account_no, @bank_address, @bank_city, @bank_state, @bank_ifsc, @bank_micr,
        @client_id, @site_id,
        @rank, @department,
        @gross_salary, @basic_salary,
        @pf_no, @esis_no,
        @father_name, @emp_full_name,
        @created_by, @created_on, @active
      )
    `)

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

//get all employee
exports.getAllEmployees = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT 
        e.*,
        cr.site_name, cd.company_name
      FROM employee e
      LEFT JOIN client_rates cr
        ON e.client_id = cr.client_id
      LEFT JOIN new_client cd
        ON e.client_id = cd.id
      WHERE e.active = 0
      ORDER BY e.created_on DESC
    `)

    res.json({
      success: true,
      count: result.recordset.length,
      data: result.recordset,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// Get single employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().input('id', sql.Int, req.params.id)
      .query(`
        SELECT 
          e.*,
          cr.site_name
        FROM employee e
        LEFT JOIN client_rates cr
          ON e.client_id = cr.client_id
        WHERE e.id = @id
      `)

    if (!result.recordset.length) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      })
    }

    res.json({
      success: true,
      data: result.recordset[0],
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ✅ Update Employee Controller
exports.updateEmployee = async (req, res) => {
  try {
    const pool = await poolPromise
    const d = req.body

    const request = pool.request()

    request.input('id', sql.Int, req.params.id)

    // same inputs as create (reuse pattern)
    Object.keys(d).forEach((key) => {
      request.input(key, sql.NVarChar, d[key])
    })

    request.input('modified_on', sql.DateTime, new Date())
    request.input('modified_by', sql.NVarChar, String(req.user.id))

    await request.query(`
      UPDATE employee SET
        initial=@initial,
        first_name=@first_name,
        middle_name=@middle_name,
        last_name=@last_name,
        gender=@gender,
        dob=@dob,
        date_of_joining=@date_of_joining,
        address=@address,
        city=@city,
        state=@state,
        pincode=@pincode,
        country=@country,
        phone1=@phone1,
        phone2=@phone2,
        email_id=@email_id,
        contact_person=@contact_person,
        contact_mobile=@contact_mobile,
        p_address=@p_address,
        p_city=@p_city,
        p_state=@p_state,
        p_pincode=@p_pincode,
        p_country=@p_country,
        contact_relation=@contact_relation,
        contact_email=@contact_email,
        marital_status=@marital_status,
        mrg_date=@mrg_date,
        cast=@cast,
        category=@category,
        native_place=@native_place,
        blood_group=@blood_group,
        driving_license=@driving_license,
        pancard_no=@pancard_no,
        aadhar_no=@aadhar_no,
        passport_no=@passport_no,
        uan_no=@uan_no,
        lang1=@lang1, lang2=@lang2, lang3=@lang3, lang4=@lang4, lang5=@lang5,
        hobby1=@hobby1, hobby2=@hobby2, hobby3=@hobby3, hobby4=@hobby4,
        bank_name=@bank_name,
        account_no=@account_no,
        bank_ifsc=@bank_ifsc,
        bank_micr=@bank_micr,
        client_id=@client_id,
        site_id=@site_id,
        gross_salary=@gross_salary,
        basic_salary=@basic_salary,
        modified_on=@modified_on,
        modified_by=@modified_by
      WHERE id=@id
    `)

    res.json({ success: true, message: 'Updated successfully' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// Update employee status
exports.updateEmployeeStatus = async (req, res) => {
  try {
    const pool = await poolPromise

    const { status } = req.body

    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('status', sql.NVarChar, status)
      .input('modified_by', sql.NVarChar, String(req.user.id))
      .input('modified_on', sql.DateTime, new Date()).query(`
        UPDATE employee
        SET 
          em_status = @status,
          modified_by = @modified_by,
          modified_on = @modified_on
        WHERE id = @id
      `)

    // check affected rows
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// Update employee salary
exports.updateEmployeeSalary = async (req, res) => {
  try {
    const pool = await poolPromise

    const { monthlySalary } = req.body

    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('monthlySalary', sql.NVarChar, monthlySalary)
      .input('modified_by', sql.NVarChar, String(req.user.id))
      .input('modified_on', sql.DateTime, new Date()).query(`
        UPDATE employee
        SET 
          perday_salary = @monthlySalary,
          modified_by = @modified_by,
          modified_on = @modified_on
        WHERE id = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Salary updated successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// Delete employee by ID
exports.deleteEmployee = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('disabled_by', sql.NVarChar, String(req.user.id))
      .input('disabled_on', sql.DateTime, new Date())
      .input('active', sql.NVarChar, '1') // assuming '1' = disabled
      .query(`
        UPDATE employee
        SET 
          active = @active,
          disabled_by = @disabled_by,
          disabled_on = @disabled_on
        WHERE id = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Employee disabled successfully',
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

exports.exportEmployeesToExcel = async (req, res) => {
  try {
    const pool = await poolPromise
    const { searchFields, fromDate, toDate } = req.query

    let query = `
      SELECT e.*, c.site_name, c.client_code, c.companyName AS client_name
      FROM employee e
      LEFT JOIN client_rates c ON e.client_id = c.client_id
      WHERE e.active = 0
    `

    // Date filter
    if (fromDate && toDate) {
      query += ` AND e.created_on BETWEEN @fromDate AND @toDate`
    }

    // Dynamic search filters
    let inputs = {}
    if (searchFields) {
      const fields = JSON.parse(searchFields)
      fields.forEach((field, idx) => {
        if (field.field && field.keyword) {
          const param = `search${idx}`
          query += ` AND e.[${field.field}] LIKE @${param}`
          inputs[param] = `%${field.keyword}%`
        }
      })
    }

    query += ` ORDER BY e.created_on DESC`

    const request = pool.request()
    if (fromDate && toDate) {
      request.input('fromDate', sql.DateTime, new Date(fromDate))
      request.input('toDate', sql.DateTime, new Date(toDate))
    }

    for (const key in inputs) {
      request.input(key, sql.NVarChar, inputs[key])
    }

    const result = await request.query(query)
    const employees = result.recordset

    // Excel headers
    const headers = [
      'Employee Code',
      'Employee Name',
      'Gender',
      'Date of birth',
      'Date of Joining',
      'Designation',
      'Address',
      'City',
      'State',
      'Pincode',
      'Country',
      'Phone1',
      'Phone2',
      'Email Id',
      'Driving License No',
      'Pancard No',
      'Aadhar No',
      'Passport No',
      'UAN No',
      'ESIS No',
      'Bank Name',
      'Account No',
      'Bank Address',
      'Bank City',
      'Bank State',
      'IFSC Code',
      'MICR',
      'Basic Salary',
      'PF No',
      'Client Name',
      'Client Code',
      'Site Name',
      'Created On',
    ]

    const excelRows = employees.map((e) => [
      e.employee_code || '',
      `${e.first_name || ''} ${e.middle_name || ''} ${e.last_name || ''}`,
      e.gender || '',
      e.dob ? formatDateForExcel(e.dob) : '',
      e.date_of_joining || '',
      e.designation || '',
      e.address || '',
      e.city || '',
      e.state || '',
      e.pincode || '',
      e.country || '',
      e.phone1 || '',
      e.phone2 || '',
      e.email_id || '',
      e.driving_license || '',
      e.pancard_no || '',
      e.aadhar_no || '',
      e.passport_no || '',
      e.uan_no || '',
      e.esis_no || '',
      e.bank_name || '',
      e.account_no || '',
      e.bank_address || '',
      e.bank_city || '',
      e.bank_state || '',
      e.bank_ifsc || '',
      e.bank_micr || '',
      e.basic_salary || '',
      e.pf_no || '',
      e.client_name || '',
      e.client_code || '',
      e.site_name || '',
      e.created_on ? formatDateForExcel(e.created_on) : '',
    ])

    const finalSheetData = [headers, ...excelRows]

    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Employees')

    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)
    const fileName = `Employees_${randomNumber}.xlsx`

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
    console.error('DOWNLOAD EMPLOYEES EXCEL ERROR:', error)
    res.status(500).json({ message: 'Failed to download Excel' })
  }
}

//yaha tak code hai iske baad bulk update hain
// Download bulk upload template
exports.downloadEmployeeUploadTemplate = (req, res) => {
  try {
    const wb = xlsx.utils.book_new()

    // COLUMN HEADERS
    const columnHeaders = [
      // EMPLOYEE DETAIL (19 columns)
      'SR NO',
      'EMPLOYEE CODE',
      'CLIENT CODE',
      'INITIAL',
      'FIRST NAME',
      'MIDDLE NAME',
      'LAST NAME',
      'GENDER',
      'DOB',
      'JOINING DATE',
      'EMAIL ID',
      'SALARY GENERATION FROM DATE',
      'SALARY GENERATION TO DATE',
      'FATHER',
      'DESIGNATION/RANK',
      'DEPARTMENT',
      'REPORTING MANAGER',
      'REPORTING USER',
      'GANG NAME',

      // CONTACT DETAIL (PRESENT ADDRESS) (7 columns)
      'ADDRESS',
      'CITY',
      'STATE',
      'PINCODE',
      'COUNTRY',
      'PHONE1',
      'PHONE2',

      // CONTACT DETAIL (PERMANENT ADDRESS) (7 columns)
      'ADDRESS',
      'CITY',
      'STATE',
      'PINCODE',
      'COUNTRY',
      'PHONE1',
      'PHONE2',

      // EMERGENCY CONTACT DETAILS (4 columns)
      'CONTACT PERSON',
      'MOBILE',
      'RELATION',
      'EMAIL',

      // PERSONAL DETAILS (25 columns)
      'MARITAL STATUS',
      'MARRIAGE DATE',
      'CAST',
      'CATEGORY',
      'NATIVE PLACE',
      'BLOOD GROUP',
      'DRIVING LICENSE NO',
      'PAN CARD NO',
      'AADHAR CARD NO',
      'PASSPORT NO',
      'PASSPORT VALID DATE',
      'P.F NO',
      'ESIS NO',
      'ESIS DATE',
      'UAN NO',
      'UAN DATE',
      'LANGUAGE KNOWN(1)',
      'LANGUAGE KNOWN(2)',
      'LANGUAGE KNOWN(3)',
      'LANGUAGE KNOWN(4)',
      'LANGUAGE KNOWN(5)',
      'HOBBY(1)',
      'HOBBY(2)',
      'HOBBY(3)',
      'HOBBY(4)',

      // EDUCATIONAL DETAILS (5 columns)
      'DOCUMENT TYPE',
      'DOCUMENT NAME',
      'IMAGE',
      'STATUS',
      'REMARK/DESCRIPTION',

      // FAMILY AND NOMINEE DETAILS (13 columns)
      'INITIAL',
      'RELATIVE NAME',
      'GENDER',
      'RELATION',
      'DATE OF BIRTH',
      'AGE',
      'MINOR(UNDER 18)',
      "GUARDIAN NAME (IF MINOR 'YES')",
      'ADDRESS',
      'CONTACT NO',
      'EMAIL ID',
      'SHARE PF %',
      'SHARE ESIC %',

      // PREVIOUS EMPLOYEE DETAILS (19 columns)
      'COMPANY NAME',
      'DESIGNATION',
      'ADDRESS',
      'CITY',
      'STATE',
      'COUNTRY',
      'PINCODE',
      'JOINED DATE',
      'LAST WORKING DATE',
      'ANNUAL CTC RUPEES',
      'MONTHLY CTC',
      'REPORTING TO',
      'REPORTING TO DESIGNATION',
      'EMAIL',
      'CONTACT',
      'GROSS INCOME IN PREV EMPLOYEE',
      'GROSS TDS DEDUCTED',
      'GROSS PT',
      'TOTAL PT DEDUCTED',

      // BANK DETAILS (10 columns)
      'ACCOUNT HOLDER NAME',
      'CARD NO',
      'BANK NAME',
      'BANK ACCOUNT NO',
      'BANK ADDRESS',
      'CITY',
      'STATE',
      'IFSC CODE',
      'MICR CODE',
      'CANCELLED CHEQUE IMAGE',

      // SEPARATION DETAILS (6 columns)
      'SEPARATION TYPE',
      'SEPARATION REASON',
      'DATE OF SEPARATION',
      'NOTICE PERIOD',
      'LAST WORKING DATE',
      'HANDOVER GIVEN TO',
    ]

    // TOP GROUP HEADERS
    const topHeader = []

    // Fill blank cells with "" so length matches
    const pushHeader = (label, count) => {
      topHeader.push(label)
      for (let i = 1; i < count; i++) topHeader.push('')
    }

    pushHeader('EMPLOYEE DETAIL', 19)
    pushHeader('CONTACT DETAIL (PRESENT ADDRESS)', 7)
    pushHeader('CONTACT DETAIL (PERMANENT ADDRESS)', 7)
    pushHeader('EMERGENCY CONTACT DETAILS', 4)
    pushHeader('PERSONAL DETAILS', 25)
    pushHeader('EDUCATIONAL DETAILS', 5)
    pushHeader('FAMILY AND NOMINEE DETAILS', 13)
    pushHeader('PREVIOUS EMPLOYEE DETAILS', 19)
    pushHeader('BANK DETAILS', 10)
    pushHeader('SEPARATION DETAILS', 6)

    //  BUILD SHEET
    const ws_data = [topHeader, columnHeaders]
    const ws = xlsx.utils.aoa_to_sheet(ws_data)

    // MERGE GROUP HEADERS
    let startCol = 0
    const merges = []

    const groupCounts = [19, 7, 7, 4, 25, 5, 13, 19, 10, 6]
    groupCounts.forEach((count) => {
      merges.push({
        s: { r: 0, c: startCol },
        e: { r: 0, c: startCol + count - 1 },
      })
      startCol += count
    })

    ws['!merges'] = merges

    // Set column widths
    ws['!cols'] = columnHeaders.map(() => ({ wch: 25 }))

    xlsx.utils.book_append_sheet(wb, ws, 'EmployeeTemplate')

    // SEND RESPONSE
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=employee_bulk_upload_template.xlsx',
    )
    res.end(buffer)
  } catch (error) {
    console.error('Error generating employee template:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate employee bulk upload template.',
    })
  }
}

exports.downloadEmployeeUploadErrorTemplate = async (req, res) => {
  try {
    // Fetch temp employees that have errors (non-empty error field)
    const failedRows = await TempEmployee.find({})

    if (!failedRows.length) {
      return res
        .status(404)
        .json({ success: false, message: 'No failed rows found.' })
    }

    // COLUMN HEADERS (exactly as your template)
    const columnHeaders = [
      // EMPLOYEE DETAIL (19 columns)
      'SR NO',
      'EMPLOYEE CODE',
      'CLIENT CODE',
      'INITIAL',
      'FIRST NAME',
      'MIDDLE NAME',
      'LAST NAME',
      'GENDER',
      'DOB',
      'JOINING DATE',
      'EMAIL ID',
      'SALARY GENERATION FROM DATE',
      'SALARY GENERATION TO DATE',
      'FATHER',
      'DESIGNATION/RANK',
      'DEPARTMENT',
      'REPORTING MANAGER',
      'REPORTING USER',
      'GANG NAME',

      // CONTACT DETAIL (PRESENT ADDRESS) (7 columns)
      'ADDRESS',
      'CITY',
      'STATE',
      'PINCODE',
      'COUNTRY',
      'PHONE1',
      'PHONE2',

      // CONTACT DETAIL (PERMANENT ADDRESS) (7 columns)
      'ADDRESS',
      'CITY',
      'STATE',
      'PINCODE',
      'COUNTRY',
      'PHONE1',
      'PHONE2',

      // EMERGENCY CONTACT DETAILS (4 columns)
      'CONTACT PERSON',
      'MOBILE',
      'RELATION',
      'EMAIL',

      // PERSONAL DETAILS (25 columns)
      'MARITAL STATUS',
      'MARRIAGE DATE',
      'CAST',
      'CATEGORY',
      'NATIVE PLACE',
      'BLOOD GROUP',
      'DRIVING LICENSE NO',
      'PAN CARD NO',
      'AADHAR CARD NO',
      'PASSPORT NO',
      'PASSPORT VALID DATE',
      'P.F NO',
      'ESIS NO',
      'ESIS DATE',
      'UAN NO',
      'UAN DATE',
      'LANGUAGE KNOWN(1)',
      'LANGUAGE KNOWN(2)',
      'LANGUAGE KNOWN(3)',
      'LANGUAGE KNOWN(4)',
      'LANGUAGE KNOWN(5)',
      'HOBBY(1)',
      'HOBBY(2)',
      'HOBBY(3)',
      'HOBBY(4)',

      // EDUCATIONAL DETAILS (5 columns)
      'DOCUMENT TYPE',
      'DOCUMENT NAME',
      'IMAGE',
      'STATUS',
      'REMARK/DESCRIPTION',

      // FAMILY AND NOMINEE DETAILS (13 columns)
      'INITIAL',
      'RELATIVE NAME',
      'GENDER',
      'RELATION',
      'DATE OF BIRTH',
      'AGE',
      'MINOR(UNDER 18)',
      "GUARDIAN NAME (IF MINOR 'YES')",
      'ADDRESS',
      'CONTACT NO',
      'EMAIL ID',
      'SHARE PF %',
      'SHARE ESIC %',

      // PREVIOUS EMPLOYEE DETAILS (19 columns)
      'COMPANY NAME',
      'DESIGNATION',
      'ADDRESS',
      'CITY',
      'STATE',
      'COUNTRY',
      'PINCODE',
      'JOINED DATE',
      'LAST WORKING DATE',
      'ANNUAL CTC RUPEES',
      'MONTHLY CTC',
      'REPORTING TO',
      'REPORTING TO DESIGNATION',
      'EMAIL',
      'CONTACT',
      'GROSS INCOME IN PREV EMPLOYEE',
      'GROSS TDS DEDUCTED',
      'GROSS PT',
      'TOTAL PT DEDUCTED',

      // BANK DETAILS (10 columns)
      'ACCOUNT HOLDER NAME',
      'CARD NO',
      'BANK NAME',
      'BANK ACCOUNT NO',
      'BANK ADDRESS',
      'CITY',
      'STATE',
      'IFSC CODE',
      'MICR CODE',
      'CANCELLED CHEQUE IMAGE',

      // SEPARATION DETAILS (6 columns)
      'SEPARATION TYPE',
      'SEPARATION REASON',
      'DATE OF SEPARATION',
      'NOTICE PERIOD',
      'LAST WORKING DATE',
      'HANDOVER GIVEN TO',

      // Extra final column for errors
      'ERROR',
    ]

    // TOP GROUP HEADERS (same grouping as template -- we'll append an empty header column for ERROR)
    const topHeader = []

    const pushHeader = (label, count) => {
      topHeader.push(label)
      for (let i = 1; i < count; i++) topHeader.push('')
    }

    pushHeader('EMPLOYEE DETAIL', 19)
    pushHeader('CONTACT DETAIL (PRESENT ADDRESS)', 7)
    pushHeader('CONTACT DETAIL (PERMANENT ADDRESS)', 7)
    pushHeader('EMERGENCY CONTACT DETAILS', 4)
    pushHeader('PERSONAL DETAILS', 25)
    pushHeader('EDUCATIONAL DETAILS', 5)
    pushHeader('FAMILY AND NOMINEE DETAILS', 13)
    pushHeader('PREVIOUS EMPLOYEE DETAILS', 19)
    pushHeader('BANK DETAILS', 10)
    pushHeader('SEPARATION DETAILS', 6)

    // add an extra header cell for ERROR column (spanning 1)
    topHeader.push('ERROR')

    // Build rows: topHeader, columnHeaders, then data rows
    const ws_data = [topHeader, columnHeaders]

    // Helper to safely push values (map order must follow columnHeaders)
    const mapTempToRow = (temp) => {
      const row = []

      // EMPLOYEE DETAIL (19)
      row.push(temp.srNo ?? '')
      row.push(temp.employeeCode ?? '')
      row.push(temp.clientCode ?? '')
      row.push(temp.initial ?? '')
      row.push(temp.firstName ?? '')
      row.push(temp.middleName ?? '')
      row.push(temp.lastName ?? '')
      row.push(temp.gender ?? '')
      row.push(formatDateForExcel(temp.dob))
      row.push(formatDateForExcel(temp.joiningDate))
      row.push(temp.emailId ?? '')
      row.push(formatDateForExcel(temp.salaryGenerationFromDate))
      row.push(formatDateForExcel(temp.salaryGenerationToDate))
      row.push(temp.father ?? '')
      row.push(temp.designation ?? '')
      row.push(temp.department ?? '')
      row.push(temp.reportingManager ?? '')
      row.push(temp.reportingUser ?? '')
      row.push(temp.gangName ?? '')

      // PRESENT ADDRESS (7)
      row.push(temp.presentAddress ?? '')
      row.push(temp.presentCity ?? '')
      row.push(temp.presentState ?? '')
      row.push(temp.presentPincode ?? '')
      row.push(temp.presentCountry ?? '')
      row.push(temp.presentPhone1 ?? '')
      row.push(temp.presentPhone2 ?? '')

      // PERMANENT ADDRESS (7)
      row.push(temp.permanentAddress ?? '')
      row.push(temp.permanentCity ?? '')
      row.push(temp.permanentState ?? '')
      row.push(temp.permanentPincode ?? '')
      row.push(temp.permanentCountry ?? '')
      row.push(temp.permanentPhone1 ?? '')
      row.push(temp.permanentPhone2 ?? '')

      // EMERGENCY CONTACT (4)
      row.push(temp.emergencyContactPerson ?? '')
      row.push(temp.emergencyMobile ?? '')
      row.push(temp.emergencyRelation ?? '')
      row.push(temp.emergencyEmail ?? '')

      // PERSONAL DETAILS (25)
      row.push(temp.maritalStatus ?? '')
      row.push(formatDateForExcel(temp.marriageDate))
      row.push(temp.cast ?? '')
      row.push(temp.category ?? '')
      row.push(temp.nativePlace ?? '')
      row.push(temp.bloodGroup ?? '')
      row.push(temp.drivingLicenseNo ?? '')
      row.push(temp.panCardNo ?? '')
      row.push(temp.aadharCardNo ?? '')
      row.push(temp.passportNo ?? '')
      row.push(formatDateForExcel(temp.passportValidDate))
      row.push(temp.pfNo ?? '')
      row.push(temp.esisNo ?? '')
      row.push(formatDateForExcel(temp.esisDate))
      row.push(temp.uanNo ?? '')
      row.push(formatDateForExcel(temp.uanDate))
      row.push(temp.language1 ?? '')
      row.push(temp.language2 ?? '')
      row.push(temp.language3 ?? '')
      row.push(temp.language4 ?? '')
      row.push(temp.language5 ?? '')
      row.push(temp.hobby1 ?? '')
      row.push(temp.hobby2 ?? '')
      row.push(temp.hobby3 ?? '')
      row.push(temp.hobby4 ?? '')

      // EDUCATIONAL DETAILS (5)
      row.push(temp.educationDocumentType ?? '')
      row.push(temp.educationDocumentName ?? '')
      // if you stored image paths, use that; otherwise empty
      row.push(temp.educationImagePath ?? '')
      row.push(temp.educationStatus ?? '')
      row.push(temp.educationRemark ?? '')

      // FAMILY & NOMINEE (13)
      row.push(temp.familyInitial ?? '')
      row.push(temp.relativeName ?? '')
      row.push(temp.familyGender ?? '')
      row.push(temp.familyRelation ?? '')
      row.push(formatDateForExcel(temp.familyDob))
      row.push(temp.familyAge ?? '')
      row.push(temp.isMinor === true ? 'Yes' : 'No')
      row.push(temp.guardianName ?? '')
      row.push(temp.familyAddress ?? '')
      row.push(temp.familyContactNo ?? '')
      row.push(temp.familyEmailId ?? '')
      row.push(temp.sharePfPercent ?? '')
      row.push(temp.shareEsicPercent ?? '')

      // PREVIOUS EMPLOYEE DETAILS (19)
      row.push(temp.prevCompanyName ?? '')
      row.push(temp.prevDesignation ?? '')
      row.push(temp.prevAddress ?? '')
      row.push(temp.prevCity ?? '')
      row.push(temp.prevState ?? '')
      row.push(temp.prevCountry ?? '')
      row.push(temp.prevPincode ?? '')
      row.push(formatDateForExcel(temp.prevJoinedDate))
      row.push(formatDateForExcel(temp.prevLastWorkingDate))
      row.push(temp.prevAnnualCtcRupees ?? '')
      row.push(temp.prevMonthlyCtc ?? '')
      row.push(temp.prevReportingTo ?? '')
      row.push(temp.prevReportingDesignation ?? '')
      row.push(temp.prevEmail ?? '')
      row.push(temp.prevContact ?? '')
      row.push(temp.prevGrossIncome ?? '')
      row.push(temp.prevGrossTdsDeducted ?? '')
      row.push(temp.prevGrossPT ?? '')
      row.push(temp.prevTotalPtDeducted ?? '')

      // BANK DETAILS (10)
      row.push(temp.accountHolderName ?? '')
      row.push(temp.cardNo ?? '')
      row.push(temp.bankName ?? '')
      row.push(temp.bankAccountNo ?? '')
      row.push(temp.bankAddress ?? '')
      row.push(temp.bankCity ?? '')
      row.push(temp.bankState ?? '')
      row.push(temp.bankIfsc ?? '')
      row.push(temp.bankMicr ?? '')
      row.push(temp.cancelledChequeImage ?? '')

      // SEPARATION DETAILS (6)
      row.push(temp.separationType ?? '')
      row.push(temp.separationReason ?? '')
      row.push(formatDateForExcel(temp.dateOfSeparation))
      row.push(temp.noticePeriod ?? '')
      row.push(formatDateForExcel(temp.lastWorkingDate))
      row.push(temp.handoverGivenTo ?? '')

      // FINAL ERROR COLUMN
      row.push(temp.error ?? '')

      return row
    }

    // push each failed row mapped
    for (const temp of failedRows) {
      ws_data.push(mapTempToRow(temp))
    }

    // build workbook and worksheet
    const wb = xlsx.utils.book_new()
    const ws = xlsx.utils.aoa_to_sheet(ws_data)

    // MERGES for top header groups (same as original)
    const groupCounts = [19, 7, 7, 4, 25, 5, 13, 19, 10, 6]
    const merges = []
    let startCol = 0
    groupCounts.forEach((count) => {
      merges.push({
        s: { r: 0, c: startCol },
        e: { r: 0, c: startCol + count - 1 },
      })
      startCol += count
    })
    // add merge for ERROR column (last column) row 0 col = startCol
    merges.push({
      s: { r: 0, c: startCol },
      e: { r: 0, c: startCol }, // single cell
    })

    ws['!merges'] = merges

    // set column widths (keep moderate width)
    ws['!cols'] = columnHeaders.map(() => ({ wch: 25 }))

    xlsx.utils.book_append_sheet(wb, ws, 'ViewUploadedData')

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="temp_employees_failed_with_errors.xlsx"',
    )

    await TempEmployee.deleteMany({})
    return res.end(buffer)
  } catch (err) {
    console.error('Export failed:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

// Download update template
exports.downloadUpdateTemplate = async (req, res) => {
  try {
    const { searchFields, fromDate, toDate } = req.query

    let query = { active: 0 }

    // APPLY SEARCH FILTERS
    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((field) => {
        if (field.field && field.keyword) {
          query[field.field] = new RegExp(field.keyword, 'i')
        }
      })
    }

    // APPLY DATE FILTERS
    if (fromDate && toDate) {
      const from = new Date(fromDate)
      const to = new Date(toDate)
      to.setHours(23, 59, 59, 999)

      query.created_on = { $gte: from, $lte: to }
    }
    // console.log(req.query);
    // FETCH EMPLOYEES
    const employees = await Employee.find(query)
      .populate('client', 'companyName')
      .populate('location', 'siteName')
      .sort({ created_on: -1 })

    // EXCEL HEADERS
    const headers = [
      'Employee Code',
      'First Name',
      'Middle Name',
      'Last Name',
      'DOB',
      'Gender',
      'DOJ',
      'Designation/Rank',
      'Father Name',
      'Address',
      'City',
      'State',
      'Pincode',
      'Country',
      'Phone1',
      'Email Id',
      'Pancard No',
      'Aadhar No',
      'ESIS No',
      'Date of ESIS',
      'UAN No',
      'Date of UAN',
      'Basic Salary',
      'Account No',
      'IFSC Code',
    ]

    // FORMAT ROWS
    const excelRows = employees.map((e) => [
      e.employeeCode || '',
      e.firstName || '',
      e.middleName || '',
      e.lastName || '',
      e.dateOfBirth ? formatDateForExcel(e.dateOfBirth) : '',
      e.gender || '',
      e.dateOfJoining ? formatDateForExcel(e.dateOfJoining) : '',
      e.designation || '',
      e.father || '',
      e.presentAddress?.address || '',
      e.presentAddress?.city || '',
      e.presentAddress?.state || '',
      e.presentAddress?.pincode || '',
      e.presentAddress?.country || '',
      e.presentAddress?.phone1 || '',
      e.emailId || '',
      e.panCardNo || '',
      e.aadharCardNo || '',
      e.esisNo || '',
      e.esisDate ? formatDateForExcel(e.esisDate) : '',
      e.uanNo || '',
      e.uanDate ? formatDateForExcel(e.uanDate) : '',
      e.basicSalary || '',
      e.bankDetails?.bankAccountNo || '',
      e.bankDetails?.ifscCode || '',
    ])

    const sheetData = [headers, ...excelRows]

    // CREATE EXCEL
    const worksheet = xlsx.utils.aoa_to_sheet(sheetData)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Employee_Specific')

    // 10-digit random number
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)
    const fileName = `Employees_${randomNumber}.xlsx`

    const excelBuffer = xlsx.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    return res.send(excelBuffer)
  } catch (error) {
    console.error('DOWNLOAD EMPLOYEE EXCEL ERROR:', error)
    return res.status(500).json({ message: 'Failed to download Excel' })
  }
}

exports.downloadEmployeeUpdateErrorTemplate = async (req, res) => {
  try {
    const failedRows = await TempEmployeeUpdate.find({})

    if (!failedRows.length) {
      return res
        .status(404)
        .json({ success: false, message: 'No failed rows found.' })
    }

    // console.log(failedRows);
    // EXCEL HEADERS
    const headers = [
      'Employee Code',
      'First Name',
      'Middle Name',
      'Last Name',
      'DOB',
      'Gender',
      'DOJ',
      'Designation/Rank',
      'Father Name',
      'Address',
      'City',
      'State',
      'Pincode',
      'Country',
      'Phone1',
      'Email Id',
      'Pancard No',
      'Aadhar No',
      'ESIS No',
      'Date of ESIS',
      'UAN No',
      'Date of UAN',
      'Basic Salary',
      'Account No',
      'IFSC Code',
      'Error',
    ]

    const mapTempToRow = (e) => {
      const row = []

      ;(row.push(e.employeeCode || ''),
        row.push(e.firstName || ''),
        row.push(e.middleName || ''),
        row.push(e.lastName || ''),
        row.push(e.dateOfBirth ? formatDateForExcel(e.dateOfBirth) : ''),
        row.push(e.gender || ''),
        row.push(e.dateOfJoining ? formatDateForExcel(e.dateOfJoining) : ''),
        row.push(e.designation || ''),
        row.push(e.father || ''),
        row.push(e.presentAddress || ''),
        row.push(e.presentCity || ''),
        row.push(e.presentState || ''),
        row.push(e.presentPincode || ''),
        row.push(e.presentCountry || ''),
        row.push(e.presentPhone1 || ''),
        row.push(e.emailId || ''),
        row.push(e.panCardNo || ''),
        row.push(e.aadharCardNo || ''),
        row.push(e.esisNo || ''),
        row.push(e.esisDate ? formatDateForExcel(e.esisDate) : ''),
        row.push(e.uanNo || ''),
        row.push(e.uanDate ? formatDateForExcel(e.uanDate) : ''),
        row.push(e.basicSalary || ''),
        row.push(e.bankAccountNo || ''),
        row.push(e.bankIfsc || ''),
        row.push(e.error ?? ''))

      return row
    }
    const tempRows = []
    for (const temp of failedRows) {
      tempRows.push(mapTempToRow(temp))
    }

    // console.log(tempRows);

    const sheetData = [headers, ...tempRows]

    // CREATE EXCEL
    const worksheet = xlsx.utils.aoa_to_sheet(sheetData)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'ViewUploadedData')

    // 10-digit random number
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)
    const fileName = `Employees_${randomNumber}.xlsx`

    const excelBuffer = xlsx.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    await TempEmployeeUpdate.deleteMany({})

    return res.send(excelBuffer)
  } catch (error) {
    console.error('DOWNLOAD EMPLOYEE EXCEL ERROR:', error)
    return res.status(500).json({ message: 'Failed to download Excel' })
  }
}

// Bulk upload employees (Excel)
exports.bulkUploadEmployees = async (req, res) => {
  try {
    // console.log(req.file, req.body);
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: 'No file uploaded.' })
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { range: 1 })

    if (jsonData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty or invalid format.',
      })
    }
    // console.log(jsonData);

    const userId = req.user.id
    const employees = []

    for (const row of jsonData) {
      const emp = {
        // EMPLOYEE DETAILS
        srNo: row['SR NO'] || '',
        employeeCode: row['EMPLOYEE CODE'] || '',
        clientCode: row['CLIENT CODE'] || '',
        initial: row['INITIAL'] || '',
        firstName: row['FIRST NAME'] || '',
        middleName: row['MIDDLE NAME'] || '',
        lastName: row['LAST NAME'] || '',
        gender: row['GENDER'] || '',
        dob: row['DOB'] || '',
        joiningDate: row['JOINING DATE'] || '',
        emailId: row['EMAIL ID'] || '',
        salaryGenerationFromDate: row['SALARY GENERATION FROM DATE'] || '',
        salaryGenerationToDate: row['SALARY GENERATION TO DATE'] || '',
        father: row['FATHER'] || '',
        designation: row['DESIGNATION/RANK'] || '',
        department: row['DEPARTMENT'] || '',
        reportingManager: row['REPORTING MANAGER'] || '',
        reportingUser: row['REPORTING USER'] || '',
        gangName: row['GANG NAME'] || '',

        // PRESENT ADDRESS
        presentAddress: row['ADDRESS'] || '',
        presentCity: row['CITY'] || '',
        presentState: row['STATE'] || '',
        presentPincode: row['PINCODE'] || '',
        presentCountry: row['COUNTRY'] || '',
        presentPhone1: row['PHONE1'] || '',
        presentPhone2: row['PHONE2'] || '',

        // PERMANENT ADDRESS
        permanentAddress: row['ADDRESS_1'] || '',
        permanentCity: row['CITY_1'] || '',
        permanentState: row['STATE_1'] || '',
        permanentPincode: row['PINCODE_1'] || '',
        permanentCountry: row['COUNTRY_1'] || '',
        permanentPhone1: row['PHONE1_1'] || '',
        permanentPhone2: row['PHONE2_1'] || '',

        // EMERGENCY CONTACT
        emergencyContactPerson: row['CONTACT PERSON'] || '',
        emergencyMobile: row['MOBILE'] || '',
        emergencyRelation: row['RELATION'] || '',
        emergencyEmail: row['EMAIL'] || '',

        // PERSONAL DETAILS
        maritalStatus: row['MARITAL STATUS'] || '',
        marriageDate: row['MARRIAGE DATE'] || '',
        cast: row['CAST'] || '',
        category: row['CATEGORY'] || '',
        nativePlace: row['NATIVE PLACE'] || '',
        bloodGroup: row['BLOOD GROUP'] || '',
        drivingLicenseNo: row['DRIVING LICENSE NO'],
        panCardNo: row['PAN CARD NO'] || '',
        aadharCardNo: row['AADHAR CARD NO'] || '',
        passportNo: row['PASSPORT NO'] || '',
        passportValidDate: row['PASSPORT VALID DATE'],
        pfNo: row['P.F NO'] || '',
        esisNo: row['ESIS NO'] || '',
        esisDate: row['ESIS DATE'] || '',
        uanNo: row['UAN NO'] || '',
        uanDate: row['UAN DATE'] || '',
        language1: row['LANGUAGE KNOWN(1)'] || '',
        language2: row['LANGUAGE KNOWN(2)'] || '',
        language3: row['LANGUAGE KNOWN(3)'] || '',
        language4: row['LANGUAGE KNOWN(4)'] || '',
        language5: row['LANGUAGE KNOWN(5)'] || '',
        hobby1: row['HOBBY(1)'] || '',
        hobby2: row['HOBBY(2)'] || '',
        hobby3: row['HOBBY(3)'] || '',
        hobby4: row['HOBBY(4)'] || '',

        // EDUCATION
        educationDocumentType: row['DOCUMENT TYPE'] || '',
        educationDocumentName: row['DOCUMENT NAME'] || '',
        educationImagePath: row['IMAGE'] || '',
        educationStatus: row['STATUS'] || '',
        educationRemark: row['REMARK/DESCRIPTION'] || '',

        // FAMILY & NOMINEE
        familyInitial: row['INITIAL_1'] || '',
        relativeName: row['RELATIVE NAME'] || '',
        familyGender: row['GENDER_1'] || '',
        familyRelation: row['RELATION_1'] || '',
        familyDob: row['DATE OF BIRTH'] || '',
        familyAge: row['AGE'] || '',
        isMinor: row['MINOR(UNDER 18)'] || '',
        guardianName: row["GUARDIAN NAME (IF MINOR 'YES')"] || '',
        familyAddress: row['ADDRESS_2'] || '',
        familyContactNo: row['CONTACT NO'] || '',
        familyEmailId: row['EMAIL ID'] || '',
        sharePfPercent: row['SHARE PF %'] || '',
        shareEsicPercent: row['SHARE ESIC %'] || '',

        // PREVIOUS EMPLOYEE DETAILS
        prevCompanyName: row['COMPANY NAME'] || '',
        prevDesignation: row['DESIGNATION'] || '',
        prevAddress: row['ADDRESS_3'] || '',
        prevCity: row['CITY_2'] || '',
        prevState: row['STATE_2'] || '',
        prevCountry: row['COUNTRY_2'] || '',
        prevPincode: row['PINCODE_2'] || '',
        prevJoinedDate: row['JOINED DATE'] || '',
        prevLastWorkingDate: row['LAST WORKING DATE'] || '',
        prevAnnualCtcRupees: row['ANNUAL CTC RUPEES'] || '',
        prevMonthlyCtc: row['MONTHLY CTC'] || '',
        prevReportingTo: row['REPORTING TO'] || '',
        prevReportingDesignation: row['REPORTING TO DESIGNATION'] || '',
        prevEmail: row['EMAIL_1'] || '',
        prevContact: row['CONTACT'] || '',
        prevGrossIncome: row['GROSS INCOME IN PREV EMPLOYEE'] || '',
        prevGrossTdsDeducted: row['GROSS TDS DEDUCTED'] || '',
        prevGrossPT: row['GROSS PT'] || '',
        prevTotalPtDeducted: row['TOTAL PT DEDUCTED'] || '',

        // BANK DETAILS
        accountHolderName: row['ACCOUNT HOLDER NAME'] || '',
        cardNo: row['CARD NO'] || '',
        bankName: row['BANK NAME'] || '',
        bankAccountNo: row['BANK ACCOUNT NO'] || '',
        bankAddress: row['BANK ADDRESS'] || '',
        bankCity: row['CITY_3'] || '',
        bankState: row['STATE_3'] || '',
        bankIfsc: row['IFSC CODE'] || '',
        bankMicr: row['MICR CODE'] || '',
        cancelledChequeImage: row['CANCELLED CHEQUE IMAGE'] || '',

        // SEPARATION DETAILS
        separationType: row['SEPARATION TYPE'] || '',
        separationReason: row['SEPARATION REASON'] || '',
        dateOfSeparation: row['DATE OF SEPARATION'] || '',
        noticePeriod: row['NOTICE PERIOD'] || '',
        lastWorkingDate: row['LAST WORKING DATE_1'] || '',
        handoverGivenTo: row['HANDOVER GIVEN TO'] || '',

        created_by: userId,
      }

      employees.push(emp)
    }

    // console.log(employees);
    // Insert all rows into DB
    await TempEmployee.insertMany(employees)

    res.status(200).json({
      success: true,
      message: 'Employee data uploaded successfully',
      insertedCount: employees.length,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

// Bulk update employees (Excel)
exports.bulkUpdateEmployees = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty or invalid format.',
      })
    }

    // REQUIRED HEADERS
    const headers = [
      'Employee Code',
      'First Name',
      'Middle Name',
      'Last Name',
      'DOB',
      'Gender',
      'DOJ',
      'Designation/Rank',
      'Father Name',
      'Address',
      'City',
      'State',
      'Pincode',
      'Country',
      'Phone1',
      'Email Id',
      'Pancard No',
      'Aadhar No',
      'ESIS No',
      'Date of ESIS',
      'UAN No',
      'Date of UAN',
      'Basic Salary',
      'Account No',
      'IFSC Code',
    ]

    // Validate headers
    const sheetHeaders = Object.keys(rows[0] || {})
    for (let h of headers) {
      if (!sheetHeaders.includes(h)) {
        return res
          .status(400)
          .json({ message: `Missing required header: ${h}` })
      }
    }

    const userId = req.user.id
    const employees = []

    for (let row of rows) {
      // Build update object
      const updateData = {
        employeeCode: row['Employee Code'] || '',
        firstName: row['First Name'] || '',
        middleName: row['Middle Name'] || '',
        lastName: row['Last Name'] || '',
        dateOfBirth: row['DOB'] || '',
        gender: row['Gender'] || '',
        dateOfJoining: row['DOJ'] || '',
        designation: row['Designation/Rank'] || '',
        father: row['Father Name'] || '',
        presentAddress: row['Address'] || '',
        presentCity: row['City'] || '',
        presentState: row['State'] || '',
        presentPincode: row['Pincode'] || '',
        presentCountry: row['Country'] || '',
        presentPhone1: row['Phone1'] || '',
        emailId: row['Email Id'] || '',
        panCardNo: row['Pancard No'] || '',
        aadharCardNo: row['Aadhar No'] || '',
        esisNo: row['ESIS No'] || '',
        esisDate: row['Date of ESIS'] || '',
        uanNo: row['UAN No'] || '',
        uanDate: row['Date of UAN'] || '',
        basicSalary: row['Basic Salary'] || '',
        bankAccountNo: row['Account No'] || '',
        bankIfsc: row['IFSC Code'] || '',
        created_by: userId,
      }

      employees.push(updateData)
    }
    // console.log(employees.length);
    await TempEmployeeUpdate.insertMany(employees)

    return res.status(200).json({
      success: true,
      message: 'Employee data uploaded successfully',
      updatedCount: employees.length,
    })
  } catch (error) {
    console.error('Bulk Update Error:', error)
    return res.status(500).json({ message: 'Bulk update processing failed' })
  }
}

// Verify bulk upload
exports.verifyBulkUpload = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const tempEmployees = await TempEmployee.find({})
    const results = []
    const successEmployees = []

    if (!tempEmployees.length) {
      return res.status(400).json({
        success: false,
        message: 'No Employees found',
      })
    }
    const employeeCount = await Employee.countDocuments()
    let currentEmpNumber = employeeCount

    for (const temp of tempEmployees) {
      let errors = []
      let employeeCode = ''
      // ---------------- VALIDATIONS ----------------
      // console.log(temp.employeeCode);
      currentEmpNumber += 1
      if (!temp.employeeCode) {
        employeeCode = `E${String(currentEmpNumber).padStart(3, '0')}`
      }
      if (!temp.firstName) errors.push('First Name is required')
      if (!temp.lastName) errors.push('Last Name is required')
      if (!temp.emailId) errors.push('Email ID is required')
      if (!temp.designation) errors.push('Designation is required')

      const existingEmployee = await Employee.findOne({
        emailId: temp.emailId,
      })
      if (existingEmployee)
        errors.push(`Am employee with Email ID ${temp.emailId} already exists`)

      let site
      if (temp.clientCode) {
        site = await SiteDetail.findOne({
          clientCode: temp.clientCode,
        })
        // console.log("site", site.clientId, site._id);

        if (!site)
          errors.push(`Site with client code: ${temp.clientCode} is not found.`)
      }

      // Convert error array → string
      const errorString = errors.join(', ')

      // ---------------- SAVE ERRORS INSIDE TempEmployee ----------------
      if (errors.length > 0) {
        await TempEmployee.findByIdAndUpdate(
          temp._id,
          {
            error: errorString,
          },
          { session },
        )

        results.push({
          tempId: temp._id,
          errors: errorString,
        })

        continue
      }

      // console.log(employeeCode, "dfa");
      // ---------------- CREATE EMPLOYEE PAYLOAD ----------------
      const employeeData = {
        employeeCode: temp.employeeCode || employeeCode,
        initial: temp.initial || '',
        firstName: temp.firstName || '',
        middleName: temp.middleName || '',
        lastName: temp.lastName || '',
        gender: temp.gender || '',
        dateOfBirth: temp.dob ? parseExcelDate(temp.dob) : '',
        dateOfJoining: temp.joiningDate ? parseExcelDate(temp.joiningDate) : '',
        emailId: temp.emailId || '',
        salaryGenerationFromDate: temp.salaryGenerationFromDate
          ? parseExcelDate(temp.salaryGenerationFromDate)
          : '',
        salaryGenerationToDate: temp.salaryGenerationToDate
          ? parseExcelDate(temp.salaryGenerationToDate)
          : '',
        father: temp.father || '',
        designation: temp.designation || '',
        department: temp.department || '',
        client: site?.clientId || '',
        location: site?._id || '',
        reportingManager: temp.reportingManager || null,
        reportingUser: temp.reportingUser || null,
        gangName: temp.gangName || '',

        // ---------------- CONTACT DETAILS ----------------
        presentAddress: {
          address: temp.presentAddress || '',
          city: temp.presentCity || '',
          state: temp.presentState || '',
          pincode: temp.presentPincode || '',
          country: temp.presentCountry || '',
          phone1: temp.presentPhone1 || '',
          phone2: temp.presentPhone2 || '',
        },
        permanentAddress: {
          address: temp.permanentAddress || '',
          city: temp.permanentCity || '',
          state: temp.permanentState || '',
          pincode: temp.permanentPincode || '',
          country: temp.permanentCountry || '',
          phone1: temp.permanentPhone1 || '',
          phone2: temp.permanentPhone2 || '',
        },

        // ---------------- EMERGENCY CONTACT ----------------
        emergencyContacts: [
          {
            contactPerson: temp.emergencyContactPerson || '',
            mobile: temp.emergencyMobile || '',
            relation: temp.emergencyRelation || '',
            email: temp.emergencyEmail || '',
          },
        ],

        // ---------------- PERSONAL DETAILS ----------------
        maritalStatus: temp.maritalStatus || '',
        marriageDate: temp.marriageDate
          ? parseExcelDate(temp.marriageDate)
          : '',
        cast: temp.cast || '',
        category: temp.category || '',
        nativePlace: temp.nativePlace || '',
        bloodGroup: temp.bloodGroup || '',
        languageKnown: [
          temp.language1 || '',
          temp.language2 || '',
          temp.language3 || '',
          temp.language4 || '',
          temp.language5 || '',
        ],
        hobbies: [
          temp.hobby1 || '',
          temp.hobby2 || '',
          temp.hobby3 || '',
          temp.hobby4 || '',
        ],
        drivingLicenseNo: temp.drivingLicenseNo || '',
        panCardNo: temp.panCardNo || '',
        aadharCardNo: temp.aadharCardNo || '',
        passportNo: temp.passportNo || '',
        passportValidDate: temp.passportValidDate
          ? parseExcelDate(temp.passportValidDate)
          : '',
        pfNo: temp.pfNo || '',
        esisNo: temp.esisNo || '',
        esisDate: temp.esisDate ? parseExcelDate(temp.esisDate) : '',
        uanNo: temp.uanNo || '',
        uanDate: temp.uanDate ? parseExcelDate(temp.uanDate) : '',

        // ---------------- EDUCATION DOCUMENT ----------------
        educationalDocuments: [
          {
            documentType: temp.educationDocumentType || '',
            imagePath: temp.educationImagePath || '',
            status: temp.educationStatus || '',
            remark: temp.educationRemark || '',
          },
        ],

        // ---------------- FAMILY DETAILS ----------------
        familyNomineeDetails: [
          {
            initial: temp.familyInitial || '',
            relativeName: temp.relativeName || '',
            gender: temp.familyGender || '',
            relation: temp.familyRelation || '',
            dob: temp.familyDob ? parseExcelDate(temp.familyDob) : '',
            age: temp.familyAge || 0,
            isMinor: temp.isMinor.toLowerCase() === 'yes',
            guardianName: temp.guardianName || '',
            address: temp.familyAddress || '',
            contactNo: temp.familyContactNo || '',
            emailId: temp.familyEmailId || '',
            sharePF: temp.sharePfPercent || 0,
            shareESIC: temp.shareEsicPercent || 0,
          },
        ],

        // ---------------- PREVIOUS EMPLOYMENT ----------------
        previousEmployments: [
          {
            companyName: temp.prevCompanyName || '',
            designation: temp.prevDesignation || '',
            address: temp.prevAddress || '',
            city: temp.prevCity || '',
            state: temp.prevState || '',
            country: temp.prevCountry || '',
            pincode: temp.prevPincode || '',
            joinedDate: temp.prevJoinedDate
              ? parseExcelDate(temp.prevJoinedDate)
              : '',
            lastWorkingDate: temp.prevLastWorkingDate
              ? parseExcelDate(temp.prevLastWorkingDate)
              : '',
            annualCTC: temp.prevAnnualCtcRupees || 0,
            monthlyCTC: temp.prevMonthlyCtc || 0,
            reportingTo: temp.prevReportingTo || '',
            reportingToDesignation: temp.prevReportingDesignation || '',
            email: temp.prevEmail || '',
            contact: temp.prevContact || '',
            grossIncomePrevEmpl: temp.prevGrossIncome || 0,
            grossTDSDeducted: temp.prevGrossTdsDeducted || 0,
            grossPT: temp.prevGrossPT || 0,
            totalPTDeducted: temp.prevTotalPtDeducted || 0,
          },
        ],

        // ---------------- BANK DETAILS ----------------
        bankDetails: {
          accountHolderName: temp.accountHolderName || '',
          cardNo: temp.cardNo || '',
          bankName: temp.bankName || '',
          bankAccountNo: temp.bankAccountNo || '',
          bankAddress: temp.bankAddress || '',
          city: temp.bankCity || '',
          state: temp.bankState || '',
          ifscCode: temp.bankIfsc || '',
          micrCode: temp.bankMicr || '',
          cancelledChequeImagePath: temp.cancelledChequeImage || '',
        },
        separationDetails: {
          separationType: temp.separationType || '',
          separationReason: temp.separationReason || '',
          dateOfSeparation: temp.dateOfSeparation
            ? parseExcelDate(temp.dateOfSeparation)
            : '',
          noticePeriodDays: temp.noticePeriod || 0,
          lastWorkingDate: temp.lastWorkingDate
            ? parseExcelDate(temp.lastWorkingDate)
            : '',
          handoverGivenTo: temp.handoverGivenTo || '',
        },

        created_by: temp.created_by,
      }

      // ---------------- SAVE EMPLOYEE ----------------
      const employee = new Employee(employeeData)
      await employee.save({ session })
      successEmployees.push(employee)
      // Remove temp from TempEmployee
      await TempEmployee.findByIdAndDelete(temp._id, { session })
    }

    // console.log(results);
    await session.commitTransaction()
    session.endSession()

    return res.status(200).json({
      success: true,
      message: 'Verification completed! All rows are saved.',
      results: results.length > 0,
      createdCount: successEmployees.length,
    })
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    console.error('Verify Error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
}

// Verify bulk update
exports.verifyBulkUpdate = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const tempEmployees = await TempEmployeeUpdate.find({})
    const results = []
    const updatedEmployees = []

    if (!tempEmployees.length) {
      return res.status(400).json({
        success: false,
        message: 'No Employees found.',
      })
    }

    for (const temp of tempEmployees) {
      let errors = []

      // ---------------- REQUIRED CHECKS ----------------
      if (!temp.employeeCode) errors.push('Employee Code is required')
      if (!temp.firstName) errors.push('First Name is required')
      if (!temp.lastName) errors.push('Last Name is required')
      if (!temp.emailId) errors.push('Email ID is required')
      if (!temp.designation) errors.push('Designation is required')

      // ---------------- EMPLOYEE SHOULD EXIST ----------------
      const employee = await Employee.findOne({
        employeeCode: temp.employeeCode,
      })

      if (!employee) {
        errors.push(`Employee with Code ${temp.employeeCode} not found.`)
      }

      // ---------------- CHECK EMAIL UNIQUE (EXCEPT SELF) ----------------
      if (temp.emailId) {
        const duplicateEmail = await Employee.findOne({
          emailId: temp.emailId,
          _id: { $ne: employee?._id },
        })

        if (duplicateEmail) {
          errors.push(
            `An employee with Email ID ${temp.emailId} already exists`,
          )
        }
      }

      // ---------------- STORE ERRORS & CONTINUE ----------------
      if (errors.length > 0) {
        const errorString = errors.join(', ')

        await TempEmployeeUpdate.findByIdAndUpdate(
          temp._id,
          { error: errorString },
          { session },
        )

        results.push({
          tempId: temp._id,
          errors: errorString,
        })

        continue
      }
      // console.log(temp);
      // ---------------- VALIDATION PASSED → PREP UPDATE DATA ----------------
      const updateData = {
        firstName: temp.firstName || '',
        middleName: temp.middleName || '',
        lastName: temp.lastName || '',
        dateOfBirth: temp.dateOfBirth ? parseExcelDate(temp.dateOfBirth) : '',
        gender: temp.gender || '',
        dateOfJoining: temp.dateOfJoining
          ? parseExcelDate(temp.dateOfJoining)
          : '',
        designation: temp.designation || '',
        emailId: temp.emailId || '',
        father: temp.father || '',

        presentAddress: {
          address: temp.presentAddress || '',
          city: temp.presentCity || '',
          state: temp.presentState || '',
          pincode: temp.presentPincode || '',
          country: temp.presentCountry || '',
          phone1: temp.presentPhone1 || '',
          phone2: employee.presentAddress?.phone2 || '',
        },

        panCardNo: temp.panCardNo || '',
        aadharCardNo: temp.aadharCardNo || '',

        esisNo: temp.esisNo || '',
        esisDate: temp.esisDate ? parseExcelDate(temp.esisDate) : '',

        uanNo: temp.uanNo || '',
        uanDate: temp.uanDate ? parseExcelDate(temp.uanDate) : '',

        bankDetails: {
          accountHolderName: employee.bankDetails?.accountHolderName,
          cardNo: employee.bankDetails?.cardNo,
          bankName: employee.bankDetails?.bankName,
          bankAddress: employee.bankDetails?.bankAddress,
          city: employee.bankDetails?.city,
          state: employee.bankDetails?.state,
          micrCode: employee.bankDetails?.micrCode,
          cancelledChequeImagePath:
            employee.bankDetails?.cancelledChequeImagePath,
          monthlySalary: temp.basicSalary || '',
          bankAccountNo: temp.bankAccountNo || '',
          ifscCode: temp.bankIfsc || '',
        },

        modified_on: new Date(),
        modified_by: req.user.id,
      }

      // ---------------- UPDATE EMPLOYEE ----------------
      // console.log(updateData);
      await Employee.updateOne(
        { employeeCode: temp.employeeCode },
        updateData,
        { session },
      )

      updatedEmployees.push(temp.employeeCode)

      // Delete temp row
      await TempEmployeeUpdate.findByIdAndDelete(temp._id, { session })
    }

    await session.commitTransaction()
    session.endSession()

    return res.status(200).json({
      success: true,
      message: 'Verification completed! All valid rows updated.',
      updatedCount: updatedEmployees.length,
      results: results.length > 0,
    })
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    console.error('Verify Bulk Update Error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
}

// hrms-backend/controllers/userController.js (New File)
const User = require('../models/User')
const Role = require('../models/Role') // We need this to populate roles dropdown
const xlsx = require('xlsx') // <-- ADD THIS LINE FOR EXPORT TO WORK
const { sql } = require('../config/db')
const bcrypt = require('bcryptjs')
//API for getUsers : http://localhost:5000/api/users?searchFields=[{"field":"first_name","keyword":"Saurabh"}]&fromDate=2026-05-01&toDate=2026-05-19
exports.getUsers = async (req, res) => {
  try {
    const { searchFields, fromDate, toDate } = req.query

    // 1. Build WHERE clause
    let whereClauses = ['u.active = 0']

    if (searchFields) {
      const fields = JSON.parse(searchFields)
      fields.forEach((field) => {
        if (field.field && field.keyword) {
          // Using LIKE for search
          whereClauses.push(`u.${field.field} LIKE '%${field.keyword}%'`)
        }
      })
    }

    if (fromDate && toDate) {
      whereClauses.push(
        `u.created_on BETWEEN '${fromDate} 00:00:00' AND '${toDate} 23:59:59'`,
      )
    }

    const whereSQL =
      whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

    // 2. Build the full SQL query string
    const query = `
      SELECT u.*, 
             c.company_name AS company_name_actual,
             b.branch_name AS branch_name_actual
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN branch b ON u.branch_id = b.id
      ${whereSQL}
      ORDER BY u.created_on DESC
    `

    // 3. Execute the query
    const result = await sql.query(query)

    // 4. Return result
    res.status(200).json(result.recordset)
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching users', error: error.message })
  }
}
// 2. Create a New User
exports.createUser = async (req, res) => {
  try {
    const userData = { ...req.body }

    if (req.file) userData.profile_image = req.file.path

    // Check if email exists
    const emailCheck = await sql.query`
      SELECT TOP 1 * FROM users WHERE email = ${userData.email}
    `
    if (emailCheck.recordset.length > 0) {
      return res.status(400).json({ message: 'Email ID already exists' })
    }

    // Hash password
    if (userData.password) {
      const salt = await bcrypt.genSalt(10)
      userData.password = await bcrypt.hash(userData.password, salt)
    }

    // Insert
    const insertQuery = `
      INSERT INTO users 
      (first_name, last_name, fullname, email, password, phone, company_id, branch_id, role, created_by, created_on, active)
      VALUES
      (@first_name, @last_name, @fullname, @email, @password, @phone, @company_id, @branch_id, @role, @created_by, GETDATE(), 0);
      SELECT SCOPE_IDENTITY() AS id;
    `

    const result = await sql.query(`
  INSERT INTO users 
  (
    first_name,
    last_name,
    fullname,
    email,
    password,
    phone,
    company_id,
    branch_id,
    role,
    created_by,
    created_on,
    active
  )
  VALUES
  (
    '${userData.first_name}',
    '${userData.last_name}',
    '${userData.fullname}',
    '${userData.email}',
    '${userData.password}',
    '${userData.phone}',
    '${userData.company_id}',
    '${userData.branch_id}',
    '${userData.role}',
    '${req.user.id}',
    GETDATE(),
    0
  );

  SELECT SCOPE_IDENTITY() AS id;
`)

    const newUserId = result.recordset[0].id

    res
      .status(201)
      .json({ message: 'User created successfully', userId: newUserId })
  } catch (error) {
    console.error('CREATE USER FAILED:', error)
    res
      .status(500)
      .json({ message: 'Error creating user', error: error.message })
  }
}

// 3. Update a User
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id
    const updateData = { ...req.body }

    if (req.file) {
      updateData.profile_image = req.file.path
    }

    // Hash password if exists
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(updateData.password, salt)
    } else {
      delete updateData.password
    }

    // Check duplicate email
    const emailCheck = await sql.query`
      SELECT TOP 1 * FROM users
      WHERE email = ${updateData.email}
      AND id != ${userId}
    `

    if (emailCheck.recordset.length > 0) {
      return res.status(400).json({
        message: 'Email ID already exists',
      })
    }

    // Dynamic update query
    let setQuery = ''

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        setQuery += `${key}='${updateData[key]}',`
      }
    })

    setQuery += `
      modified_on=GETDATE(),
      modified_by='${req.user.id}'
    `

    const updateQuery = `
      UPDATE users
      SET ${setQuery}
      WHERE id='${userId}';

      SELECT * FROM users WHERE id='${userId}';
    `

    const result = await sql.query(updateQuery)

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: result.recordset[0],
    })
  } catch (error) {
    console.error('UPDATE USER FAILED:', error)

    res.status(500).json({
      message: 'Error updating user',
      error: error.message,
    })
  }
}

// ... (other functions like deleteUser, getRoles, etc.)

// 4. Delete a User
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id

    const result = await sql.query`
      UPDATE users
      SET 
        active = 1,
        disabled_on = GETDATE(),
        disabled_by = ${req.user.id}
      WHERE id = ${userId};

      SELECT * FROM users WHERE id = ${userId};
    `

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({
      message: 'User deleted successfully',
      user: result.recordset[0],
    })
  } catch (error) {
    console.error('DELETE USER FAILED:', error)

    res.status(500).json({
      message: 'Error deleting user',
      error: error.message,
    })
  }
}

// Helper function to get all roles for the form dropdown
exports.getRoles = async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT 
        id,
        role_name
      FROM role_master
      WHERE active = 0
      ORDER BY role_name ASC
    `)

    res.status(200).json(result.recordset)
  } catch (error) {
    console.error('GET ROLES FAILED:', error)

    res.status(500).json({
      message: 'Error fetching roles',
      error: error.message,
    })
  }
}

// 5. EXPORT Users to Excel (NEW FUNCTION)

function formatDateForExcel(val) {
  if (!val && val !== 0) return ''
  if (val instanceof Date && !isNaN(val.getTime())) {
    const d = val
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  }
  return String(val)
}

exports.exportUsersToExcel = async (req, res) => {
  try {
    const { searchFields, fromDate, toDate } = req.query

    // Build WHERE clause
    let whereClauses = ['u.active = 0']

    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((field) => {
        if (field.field && field.keyword) {
          whereClauses.push(`u.${field.field} LIKE '%${field.keyword}%'`)
        }
      })
    }

    if (fromDate && toDate) {
      whereClauses.push(
        `u.created_on BETWEEN '${fromDate} 00:00:00' AND '${toDate} 23:59:59'`,
      )
    }

    const whereSQL =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    // Final Query
    const query = `
      SELECT 
        u.id,
        u.first_name + ' ' + u.last_name AS name,
        u.fullname,
        u.email,
        u.phone AS contactNo,
        u.address,
        u.city,
        u.pincode,
        c.company_name AS company_name_actual,
        b.branch_name AS branch_name_actual,
        u.created_on
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN branch b ON u.branch_id = b.id
      ${whereSQL}
      ORDER BY u.created_on DESC
    `

    const result = await sql.query(query)

    const users = result.recordset

    // Headers
    const headers = [
      'Name',
      'Email ID',
      'Contact No',
      'Address',
      'City',
      'Pincode',
      'Role',
      'Company',
      'Branch',
      'Created On',
    ]

    // Rows
    const excelRows = users.map((u) => [
      u.name || u.fullname || '',
      u.email || '',
      u.contactNo || '',
      u.address || '',
      u.city || '',
      u.pincode || '',
      u.role_name || '',
      u.company_name_actual || '',
      u.branch_name_actual || '',
      u.created_on ? formatDateForExcel(new Date(u.created_on)) : '',
    ])

    const finalSheetData = [headers, ...excelRows]

    // Workbook
    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData)
    const workbook = xlsx.utils.book_new()

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Users')

    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

    const fileName = `Users_${randomNumber}.xlsx`

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
    console.error('DOWNLOAD USERS EXCEL ERROR:', error)

    res.status(500).json({
      message: 'Failed to download Excel',
      error: error.message,
    })
  }
}

const { sql } = require('../config/db')
const jwt = require('jsonwebtoken')
const md5 = require('md5')

exports.login = async (req, res) => {
  try {
    const { email, password, company, branch } = req.body

    // 1. GET USER JOINED WITH COMPANY AND BRANCH
    const result = await sql.query`
      SELECT TOP 1 u.*, 
             c.company_name AS company_name_actual, 
             b.branch_name AS branch_name_actual
      FROM users u
      INNER JOIN companies c ON u.company_name = c.id    -- users.company_name stores company id
      INNER JOIN branch b ON u.branch_name = b.id       -- users.branch_name stores branch id
      WHERE u.email = ${email}
    `

    const user = result.recordset[0]

    if (!user) {
      return res.status(401).json({ msg: 'Invalid credentials' })
    }

    // 2. MD5 PASSWORD CHECK
    const hashedPassword = md5(password)
    if (hashedPassword !== user.password) {
      return res.status(401).json({ msg: 'Invalid credentials' })
    }

    // 3. MATCH FRONTEND SELECTED COMPANY AND BRANCH IDs
    // Convert to int just to be safe
    if (
      parseInt(company) !== parseInt(user.company_name) ||
      parseInt(branch) !== parseInt(user.branch_name)
    ) {
      return res
        .status(401)
        .json({ msg: 'Selected company or branch does not match' })
    }

    // 4. CREATE JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        company: user.company_name_actual,
        branch: user.branch_name_actual,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    )

    // 5. RETURN RESPONSE
    res.json({
      token,
      user: {
        id: user.id,
        name: user.fullname || user.first_name,
        email: user.email,
        role: user.role,
        company: user.company_name_actual, // name for frontend display
        branch: user.branch_name_actual, // name for frontend display
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: 'Server error' })
  }
}

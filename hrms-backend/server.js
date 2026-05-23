const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const path = require('path') // ADDED: File paths sobat kam karnyसाठी 'path' module import kara.
dotenv.config()

const { poolPromise } = require('./config/db.js')
const authRoutes = require('./routes/authRoutes')
const companyRoutes = require('./routes/companyRoutes')
const branchRoutes = require('./routes/branchRoutes')
const permissionRoutes = require('./routes/permissionRoutes')
const userRoutes = require('./routes/userRoutes.js')
const clientRoutes = require('./routes/clientRoutes.js')
const holidayRoutes = require('./routes/holidayRoutes.js')
const chargesRoutes = require('./routes/chargesRoutes.js')
const workOrderType = require('./routes/workOrderTypeRoutes.js')
const equipmentRoutes = require('./routes/equipmentTypeRoutes.js')
const gangRoutes = require('./routes/gangMasterRoutes.js')
const vendorRoutes = require('./routes/vendorsMasterRoutes.js')
const salaryTemplateRoutes = require('./routes/salaryTemplateRoutes.js')
const empTypeRoutes = require('./routes/employeeTypeRoutes.js')
const employeeRoutes = require('./routes/employeeRoutes.js')
const workOrderRoutes = require('./routes/woRateChartRoutes.js')
// // Connect DB
// connectDB()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

app.use(
  cors({
    origin: 'http://localhost:5173', // frontend URL
    credentials: true,
  }),
)

app.use('/api/auth', authRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/branches', branchRoutes)
app.use('/api/permissions', permissionRoutes)
app.use('/api/users', userRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/holidays', holidayRoutes)
app.use('/api/charges', chargesRoutes)
app.use('/api/workOrderType', workOrderType)
app.use('/api/equipmentType', equipmentRoutes)
app.use('/api/gangs', gangRoutes)
app.use('/api/vendors-master', vendorRoutes)
app.use('/api/salary-templates', salaryTemplateRoutes)
app.use('/api/employee-types', empTypeRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/work-orders', workOrderRoutes)

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes import
// const companyRoutes = require('./routes/companyRoutes')
// const branchRoutes = require('./routes/branchRoutes')
// const authRoutes = require('./routes/authRoutes')
// const permissionRoutes = require('./routes/permissionRoutes')
// const userRoutes = require('./routes/userRoutes') // <-- 1. IMPORT
// const clientRoutes = require('./routes/clientRoutes')
// const clientWorkOrderRoutes = require('./routes/clientWorkOrderRoutes')
// const employeeTypeRoutes = require('./routes/employeeTypeRoutes')
// const employeeRoutes = require('./routes/employeeRoutes') // <-- Import employee routes
// const equipmentTypeRoutes = require('./routes/equipmentTypeRoutes') // <-- Import employee routes
// const attendanceRoutes = require('./routes/attendanceRoutes') // Attendance routes
// const gangRoutes = require('./routes/gangMasterRoutes')
// const holidayRoutes = require('./routes/holidayRoutes')
// const salaryTemplateRoutes = require('./routes/salaryTemplateRoutes')
// const chargesRoutes = require('./routes/chargesRoutes')
// const manpowerAttendanceRoutes = require('./routes/manpowerAttendanceRoutes')
// const billRoutes = require('./routes/billRoutes')
// const purchaseBillsRoutes = require('./routes/purchaseBillsRoutes')
// const saleBillsRoutes = require('./routes/saleBillsRoutes')
// const creditNoteRoutes = require('./routes/creditNoteRoutes')
// const debitNoteRoutes = require('./routes/debitNoteRoutes')
// const salaryEmpRoutes = require('./routes/salaryRoutes')
// const workOrderTypeRoutes = require('./routes/workOrderTypeRoutes')
// const wagesRoutes = require('./routes/wagesRoutes')
// const vendorsMasterRoutes = require('./routes/vendorsMasterRoutes')
// const voucherRoutes = require('./routes/VoucherRoutes')

// // Load env vars

// dotenv.config()

// // Models import (he ensure kartat ki schema register zale ahet)
// require('./models/Role')
// require('./models/Company')
// require('./models/Branch')
// require('./models/User')

// app.use((req, res, next) => {
//   console.log(`[INCOMING REQUEST] ${req.method} ${req.originalUrl}`)
//   next()
// })

// // --- ADDED CODE START ---
// // Form madhun yeṇārā data (jasa ki file uploads) parse karnyसाठी he middleware mahatvache ahe.
// app.use(express.urlencoded({ extended: true }))

// // 'uploads' folder la publicly accessible banavnyसाठी.
// // Yane browser uploaded images (logos) dakhavu shakel.
// // Example: http://localhost:5000/uploads/image_name.png
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
// // --- ADDED CODE END ---

// // Routes
// app.use('/api/auth', authRoutes)
// app.use('/api/companies', companyRoutes)
// app.use('/api/branches', branchRoutes)
// app.use('/api/permissions', permissionRoutes)
// app.use('/api/users', userRoutes) // <-- 2. USE THE ROUTES
// app.use('/api/clients', clientRoutes)
// app.use('/api/client-work-order', clientWorkOrderRoutes)
// app.use('/api/employee-types', employeeTypeRoutes)
// app.use('/api/employees', employeeRoutes) // <-- Use employee routes
// app.use('/api/attendance', attendanceRoutes) // Attendance routes
// app.use('/api/equipment-type', equipmentTypeRoutes)
// app.use('/api/gangs', gangRoutes)
// app.use('/api/holidays', holidayRoutes) // Holiday routes
// app.use('/api/salary-templates', salaryTemplateRoutes)
// app.use('/api/charges', chargesRoutes)
// app.use('/api/manpower-attendance', manpowerAttendanceRoutes)
// app.use('/api/bills', billRoutes) // Bill routes
// app.use('/api/salary-by-employee', salaryEmpRoutes)
// app.use('/api/b2b/sales-bill', saleBillsRoutes) // Voucher routes
// app.use('/api/b2b/purchase-bill', purchaseBillsRoutes) // Voucher routes
// app.use('/api/b2b/credit-note', creditNoteRoutes) // Voucher routes
// app.use('/api/b2b/debit-note', debitNoteRoutes) // Voucher routes
// app.use('/api/wages', wagesRoutes) // Wages routes
// app.use('/api/work-order-type', workOrderTypeRoutes)
// app.use('/api/vendors-master', vendorsMasterRoutes) // Voucher routes
// app.use('/api/vouchers', voucherRoutes) // Voucher routes

// Server
const PORT = process.env.PORT
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))

const sql = require('mssql')

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT),
  options: {
    trustServerCertificate: true,
    encrypt: false,
  },
}

const connectDB = async () => {
  try {
    await sql.connect(config)
    console.log('✅ MSSQL Connected')
  } catch (err) {
    console.log('DB Connection Error:', err)
  }
}

module.exports = {
  sql,
  connectDB,
}

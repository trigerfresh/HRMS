const { poolPromise, sql } = require('../config/db')
const xlsx = require('xlsx')
const Client = require('../models/Client')
const User = require('../models/User')
const SiteDetail = require('../models/SiteDetail')
const ChargesByRank = require('../models/ChargesByRank')
const OtherCharges = require('../models/OtherCharges')
const mongoose = require('mongoose')
const WORateChart = require('../models/WORateChart')
const Employee = require('../models/Employee')

// @desc    Create a new client
// @route   POST /api/clients

// controllers/clientController.js

// ==========================================
// CREATE CLIENT (MSSQL VERSION)
// ==========================================
exports.createClient = async (req, res) => {
  const pool = await poolPromise
  const transaction = new sql.Transaction(pool)

  try {
    await transaction.begin()

    const createdBy = Number(req.user.id)

    const {
      companyName,
      contactPersonName,
      contactNo,
      emailId,
      address,
      city,
      state,
      pincode,
      gstStateCode,
      gstNo,
      sacCode,
      billingCompany,
      companyBankName,
      otherInfo,
      termsAndConditions,

      bankName,
      accountNo,
      ifscCode,
      micrCode,
      branch,
      bankCity,

      sites = [],
    } = req.body

    // ==========================================
    // CHECK DUPLICATE COMPANY
    // ==========================================
    const duplicateCompany = await transaction
      .request()
      .input('company_name', sql.VarChar, companyName).query(`
        SELECT TOP 1 id
        FROM new_client
        WHERE company_name = @company_name
        AND active = 0
      `)

    if (duplicateCompany.recordset.length > 0) {
      await transaction.rollback()

      return res.status(400).json({
        success: false,
        message: 'Company name already exists',
      })
    }

    // ==========================================
    // CHECK DUPLICATE EMAIL
    // ==========================================
    const duplicateEmail = await transaction
      .request()
      .input('client_email', sql.VarChar, emailId).query(`
        SELECT TOP 1 id
        FROM new_client
        WHERE client_email = @client_email
        AND active = 0
      `)

    if (duplicateEmail.recordset.length > 0) {
      await transaction.rollback()

      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      })
    }

    // ==========================================
    // INSERT CLIENT
    // ==========================================
    const clientResult = await transaction
      .request()
      .input('company_name', sql.VarChar, companyName)
      .input('contact_person', sql.VarChar, contactPersonName)
      .input('contact_no', sql.VarChar, contactNo)
      .input('client_email', sql.VarChar, emailId)
      .input('client_add', sql.VarChar, address)
      .input('client_city', sql.VarChar, city)
      .input('client_state', sql.VarChar, state)
      .input('city_pincode', sql.VarChar, pincode)
      .input('client_gst_state_code', sql.VarChar, gstStateCode)
      .input('client_gst_no', sql.VarChar, gstNo)
      .input('bank_name', sql.VarChar, bankName)
      .input('client_acc_no', sql.VarChar, accountNo)
      .input('ifsc_code', sql.VarChar, ifscCode)
      .input('bank_branch', sql.VarChar, branch)
      .input('bank_city', sql.VarChar, bankCity)
      .input('micr_code', sql.VarChar, micrCode)
      .input('sac_code', sql.VarChar, sacCode)
      .input('other_info', sql.VarChar, otherInfo)
      .input('terms', sql.VarChar, termsAndConditions)
      .input('company_bank_name', sql.VarChar, companyBankName)
      .input('billing_company', sql.VarChar, billingCompany)
      .input('branch_id', sql.VarChar, req.user.branch_id)
      .input('company_id', sql.VarChar, req.user.company_id)
      .input('created_by', sql.Int, createdBy).query(`
        INSERT INTO new_client (
          company_name,
          contact_person,
          contact_no,
          client_email,
          client_add,
          client_city,
          client_state,
          city_pincode,
          client_gst_state_code,
          client_gst_no,
          bank_name,
          client_acc_no,
          ifsc_code,
          bank_branch,
          bank_city,
          micr_code,
          sac_code,
          other_info,
          terms,
          company_bank_name,
          billing_company,
          branch_id,
          company_id,
          created_by,
          created_on,
          active
        )
        VALUES (
          @company_name,
          @contact_person,
          @contact_no,
          @client_email,
          @client_add,
          @client_city,
          @client_state,
          @city_pincode,
          @client_gst_state_code,
          @client_gst_no,
          @bank_name,
          @client_acc_no,
          @ifsc_code,
          @bank_branch,
          @bank_city,
          @micr_code,
          @sac_code,
          @other_info,
          @terms,
          @company_bank_name,
          @billing_company,
          @branch_id,
          @company_id,
          @created_by,
          GETDATE(),
          0
        )

        SELECT SCOPE_IDENTITY() AS id
      `)

    const clientId = clientResult.recordset[0].id

    // ==========================================
    // INSERT SITES
    // ==========================================
    for (const site of sites) {
      // Generate client code
      const codeResult = await transaction.request().query(`
        SELECT COUNT(*) AS total
        FROM client_rates
      `)

      const total = codeResult.recordset[0].total + 1
      const clientCode = `C${String(total).padStart(3, '0')}`

      // ==========================================
      // INSERT SITE
      // ==========================================
      const siteResult = await transaction
        .request()
        .input('client_id', sql.VarChar, String(clientId))
        .input('site_name', sql.VarChar, site.siteName)
        .input('work_order_no', sql.VarChar, site.workOrderNo)
        .input('client_code', sql.VarChar, clientCode)

        .input('cc_contact_person', sql.VarChar, site.contactPersonName)

        .input('cc_address', sql.VarChar, site.address)

        .input('cc_billing_address', sql.VarChar, site.billingAddress)

        .input('cc_contactno', sql.VarChar, site.contactNo)
        .input('cc_emailid', sql.VarChar, site.emailId)
        .input('cc_city', sql.VarChar, site.city)
        .input('cc_state', sql.VarChar, site.state)
        .input('cc_country', sql.VarChar, site.country)

        .input('cc_location_name', sql.VarChar, site.locationName)

        .input('cc_loct_Startdate', sql.VarChar, site.locationStartDate)

        .input('cc_sales_person', sql.VarChar, site.salesPersonName)

        .input('cc_sales_person_email', sql.VarChar, site.salesPersonEmailId)

        .input('cc_sales_person_phone', sql.VarChar, site.salesPersonContactNo)

        .input('cc_bill_cycle_Date', sql.VarChar, site.billCycleDate)

        .input('cc_loct_status', sql.VarChar, site.status || 'Active')

        .input('cc_cgst', sql.VarChar, String(site.cgst) || '0')
        .input('cc_sgst', sql.VarChar, String(site.sgst) || '0')
        .input('cc_igst', sql.VarChar, String(site.igst) || '0')

        .input(
          'cc_est_billing_amount',
          sql.VarChar,
          String(site.expectedBillingAmount) || '0',
        )

        .input('billing_nodays', sql.VarChar, site.daysForBilling || 0)

        .input('display_ot', sql.VarChar, site.viewOTHours ? 1 : 0)

        .input('attach_wages', sql.VarChar, site.attachWagesSHeet ? 1 : 0)

        .input('convert_decimal', sql.VarChar, site.roundOffAmount ? 1 : 0)

        .input('bill_without_rank', sql.VarChar, site.billWithoutRank ? 1 : 0)

        .input('branch_id', sql.VarChar, req.user.branch_id)

        .input('company_id', sql.VarChar, req.user.company_id)

        .input('created_by', sql.VarChar, createdBy).query(`
          INSERT INTO client_rates (
            client_id,
            site_name,
            work_order_no,
            client_code,

            cc_contact_person,
            cc_address,
            cc_billing_address,
            cc_contactno,
            cc_emailid,
            cc_city,
            cc_state,
            cc_country,

            cc_location_name,
            cc_loct_Startdate,

            cc_sales_person,
            cc_sales_person_email,
            cc_sales_person_phone,

            cc_bill_cycle_Date,
            cc_loct_status,

            cc_cgst,
            cc_sgst,
            cc_igst,

            cc_est_billing_amount,

            billing_nodays,

            display_ot,
            attach_wages,
            convert_decimal,
            bill_without_rank,

            branch_id,
            company_id,
            created_by,
            active
          )
          VALUES (
            @client_id,
            @site_name,
            @work_order_no,
            @client_code,

            @cc_contact_person,
            @cc_address,
            @cc_billing_address,
            @cc_contactno,
            @cc_emailid,
            @cc_city,
            @cc_state,
            @cc_country,

            @cc_location_name,
            @cc_loct_Startdate,

            @cc_sales_person,
            @cc_sales_person_email,
            @cc_sales_person_phone,

            @cc_bill_cycle_Date,
            @cc_loct_status,

            @cc_cgst,
            @cc_sgst,
            @cc_igst,

            @cc_est_billing_amount,

            @billing_nodays,

            @display_ot,
            @attach_wages,
            @convert_decimal,
            @bill_without_rank,

            @branch_id,
            @company_id,
            @created_by,
            0
          )
        `)

      // ==========================================
      // HERE INSERT:
      // - Charges By Rank
      // - Other Charges
      // INTO YOUR MSSQL TABLES
      // ==========================================
    }

    await transaction.commit()

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      clientId,
    })
  } catch (error) {
    await transaction.rollback()

    console.error('CREATE CLIENT FAILED:', error)

    res.status(500).json({
      success: false,
      message: 'Error creating client',
      error: error.message,
    })
  }
}

// MSSQL VERSION - addClientSite

exports.addClientSite = async (req, res) => {
  const pool = await poolPromise
  const transaction = new sql.Transaction(pool)

  const safe = (v) => (v === undefined || v === null ? '' : String(v))

  const safeNum = (v) =>
    v === undefined || v === null || v === '' ? '0' : String(v)

  try {
    await transaction.begin()

    const { clientId } = req.params
    const userId = req.user.id
    const siteData = req.body || {}

    // ======================
    // CHECK CLIENT
    // ======================
    const clientCheck = await new sql.Request(transaction).input(
      'clientId',
      sql.VarChar,
      clientId,
    ).query(`
        SELECT TOP 1 id 
        FROM new_client 
        WHERE id = @clientId AND active = '0'
      `)

    if (!clientCheck.recordset.length) {
      await transaction.rollback()
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      })
    }

    // ======================
    // GENERATE CODE
    // ======================
    const countResult = await new sql.Request(transaction).query(`
      SELECT COUNT(*) AS total FROM client_rates
    `)

    const clientCode =
      'C' + String(countResult.recordset[0].total + 1).padStart(3, '0')

    // ======================
    // INSERT SITE
    // ======================
    const result = await new sql.Request(transaction)
      .input('client_id', sql.VarChar, clientId)
      .input('site_name', sql.VarChar, safe(siteData.siteName))
      .input('work_order_no', sql.VarChar, safe(siteData.workOrderNo))
      .input('client_code', sql.VarChar, clientCode)

      .input('cc_contact_person', sql.VarChar, safe(siteData.contactPersonName))
      .input('cc_address', sql.VarChar, safe(siteData.address))
      .input('cc_billing_address', sql.VarChar, safe(siteData.billingAddress))
      .input('cc_contactno', sql.VarChar, safe(siteData.contactNo))
      .input('cc_emailid', sql.VarChar, safe(siteData.emailId))
      .input('cc_city', sql.VarChar, safe(siteData.city))
      .input('cc_state', sql.VarChar, safe(siteData.state))
      .input('cc_country', sql.VarChar, safe(siteData.country))

      .input('cc_location_name', sql.VarChar, safe(siteData.locationName))
      .input('cc_loct_Startdate', sql.VarChar, safe(siteData.startDate))

      .input('cc_sales_person', sql.VarChar, safe(siteData.salesPersonName))
      .input(
        'cc_sales_person_email',
        sql.VarChar,
        safe(siteData.salesPersonEmail),
      )
      .input(
        'cc_sales_person_phone',
        sql.VarChar,
        safe(siteData.salesPersonPhone),
      )

      .input('cc_bill_cycle_Date', sql.VarChar, safe(siteData.billCycleDate))
      .input('cc_loct_status', sql.VarChar, safe(siteData.status || 'Active'))

      // IMPORTANT FIX (NO undefined allowed)
      .input('cc_cgst', sql.VarChar, safeNum(siteData.cgst))
      .input('cc_sgst', sql.VarChar, safeNum(siteData.sgst))
      .input('cc_igst', sql.VarChar, safeNum(siteData.igst))
      .input(
        'cc_est_billing_amount',
        sql.VarChar,
        safeNum(siteData.billingAmount),
      )
      .input('billing_nodays', sql.VarChar, safeNum(siteData.billingDays))

      .input('display_ot', sql.VarChar, siteData.displayOt ? '1' : '0')
      .input('attach_wages', sql.VarChar, siteData.attachWages ? '1' : '0')
      .input(
        'convert_decimal',
        sql.VarChar,
        siteData.convertDecimal ? '1' : '0',
      )
      .input(
        'bill_without_rank',
        sql.VarChar,
        siteData.billWithoutRank ? '1' : '0',
      )

      .input('active', sql.VarChar, '0')
      .input('company_id', sql.VarChar, safe(req.user.company_id))
      .input('branch_id', sql.VarChar, safe(req.user.branch_id))
      .input('modified_by', sql.VarChar, safe(userId)).query(`
        INSERT INTO client_rates (
          client_id,
          site_name,
          work_order_no,
          client_code,
          cc_contact_person,
          cc_address,
          cc_billing_address,
          cc_contactno,
          cc_emailid,
          cc_city,
          cc_state,
          cc_country,
          cc_location_name,
          cc_loct_Startdate,
          cc_sales_person,
          cc_sales_person_email,
          cc_sales_person_phone,
          cc_bill_cycle_Date,
          cc_loct_status,
          cc_cgst,
          cc_sgst,
          cc_igst,
          cc_est_billing_amount,
          billing_nodays,
          display_ot,
          attach_wages,
          convert_decimal,
          bill_without_rank,
          active,
          company_id,
          branch_id,
          modified_by
        )
        VALUES (
          @client_id,
          @site_name,
          @work_order_no,
          @client_code,
          @cc_contact_person,
          @cc_address,
          @cc_billing_address,
          @cc_contactno,
          @cc_emailid,
          @cc_city,
          @cc_state,
          @cc_country,
          @cc_location_name,
          @cc_loct_Startdate,
          @cc_sales_person,
          @cc_sales_person_email,
          @cc_sales_person_phone,
          @cc_bill_cycle_Date,
          @cc_loct_status,
          @cc_cgst,
          @cc_sgst,
          @cc_igst,
          @cc_est_billing_amount,
          @billing_nodays,
          @display_ot,
          @attach_wages,
          @convert_decimal,
          @bill_without_rank,
          @active,
          @company_id,
          @branch_id,
          @modified_by
        )

        SELECT SCOPE_IDENTITY() AS id
      `)

    await transaction.commit()

    return res.status(201).json({
      success: true,
      message: 'Site added successfully',
      siteId: result.recordset[0].id,
      clientCode,
    })
  } catch (error) {
    await transaction.rollback()

    console.error('ADD CLIENT SITE FAILED:', error)

    return res.status(500).json({
      success: false,
      message: 'Server error while adding new site',
      error: error.message,
    })
  }
}

// @desc    Get all clients with search and filter
// @route   GET /api/clients

// ======================================================
// GET ALL CLIENTS - MSSQL VERSION
// ======================================================

exports.getAllClients = async (req, res) => {
  try {
    const { searchFields, fromDate, toDate } = req.query

    const pool = await poolPromise

    let whereClause = ` WHERE c.active = 0 `
    const request = pool.request()

    // =========================================
    // SEARCH FILTERS
    // =========================================
    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((field, index) => {
        if (field.field && field.keyword) {
          const paramName = `search${index}`

          // field.field frontend se aa raha hai
          // validate for security
          const allowedFields = {
            companyName: 'c.company_name',
            contactPersonName: 'c.contact_person',
            contactNo: 'c.contact_no',
            emailId: 'c.client_email',
            city: 'c.client_city',
            state: 'c.client_state',
            gstNo: 'c.client_gst_no',
          }

          if (allowedFields[field.field]) {
            whereClause += ` 
              AND ${allowedFields[field.field]} LIKE @${paramName}
            `

            request.input(paramName, `%${field.keyword}%`)
          }
        }
      })
    }

    // =========================================
    // DATE FILTER
    // =========================================
    if (fromDate && toDate) {
      whereClause += `
        AND CAST(c.created_on AS DATE)
        BETWEEN @fromDate AND @toDate
      `

      request.input('fromDate', fromDate)
      request.input('toDate', toDate)
    }

    // =========================================
    // MAIN QUERY
    // =========================================
    const result = await request.query(`
      SELECT 
        c.id,
        c.company_name,
        c.contact_person,
        c.contact_no,
        c.client_email,
        c.client_city,
        c.client_state,
        c.client_gst_no,
        c.created_on,

        creator.fullname AS created_by_name,

        billing.company_name AS billing_company_name,

        bank.company_name AS company_bank_name,

        ISNULL(siteCounts.totalSites, 0) AS totalSites,

        ISNULL(employeeCounts.totalEmployees, 0) AS totalEmployees

      FROM new_client c

      LEFT JOIN users creator
        ON creator.id = c.created_by

      LEFT JOIN new_client billing
        ON billing.id = c.billing_company_id

      LEFT JOIN new_client bank
        ON bank.id = c.company_bank_name

      LEFT JOIN (
        SELECT 
          client_id,
          COUNT(*) AS totalSites
        FROM client_rates
        WHERE active = 0
        GROUP BY client_id
      ) siteCounts
        ON siteCounts.client_id = c.id

      LEFT JOIN (
  SELECT 
    client_id,
    COUNT(*) AS totalEmployees
  FROM employee
  WHERE active = 0
  GROUP BY client_id
) employeeCounts
  ON employeeCounts.client_id = c.id

      ${whereClause}

      ORDER BY c.id DESC
    `)

    const formatted = result.recordset.map((client) => ({
      _id: client.id,
      companyName: client.company_name,
      contactPersonName: client.contact_person,
      contactNo: client.contact_no,
      emailId: client.client_email,

      billingCompany: client.billing_company_name || '',

      companyBankName: client.company_bank_name || '',

      city: client.client_city,
      state: client.client_state,

      gstNo: client.client_gst_no || '—',

      totalSites: client.totalSites || 0,

      totalEmployees: client.totalEmployees || 0,

      created_by: client.created_by_name || '',

      created_on: client.created_on,
    }))

    return res.status(200).json({
      success: true,
      data: formatted,
    })
  } catch (error) {
    console.error('GET CLIENTS FAILED:', error)

    return res.status(500).json({
      success: false,
      message: 'Server error fetching clients',
      error: error.message,
    })
  }
}

// ======================================================
// GET CLIENT BY ID - MSSQL VERSION
// ======================================================

exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    // =========================================
    // GET CLIENT
    // =========================================
    const clientResult = await pool.request().input('id', sql.VarChar, id)
      .query(`
        SELECT 
          c.*,

          creator.fullname AS created_by_name,

          billing.company_name AS billing_company_name,

          bank.company_name AS bank_company_name,
          bank.bank_name AS bank_name,
          bank.ifsc_code AS bank_ifsc

        FROM new_client c

        LEFT JOIN users creator
          ON creator.id = c.created_by

        LEFT JOIN new_client billing
          ON billing.id = c.billing_company_id

        LEFT JOIN new_client bank
          ON bank.id = c.company_bank_name

        WHERE c.id = @id
        AND c.active = 0
      `)

    if (clientResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      })
    }

    const client = clientResult.recordset[0]

    // =========================================
    // GET SITES
    // =========================================
    const sitesResult = await pool.request().input('clientId', sql.VarChar, id)
      .query(`
        SELECT *
        FROM client_rates
        WHERE client_id = @clientId
        AND active = 0
        ORDER BY id DESC
      `)

    const sites = sitesResult.recordset

    // =========================================
    // GET RATES + OTHER DETAILS
    // =========================================
    for (const site of sites) {
      // -------------------------
      // RATES
      // -------------------------
      const ratesResult = await pool
        .request()
        .input('siteId', sql.VarChar, site.id).query(`
          SELECT *
          FROM charges_by_rank
          WHERE site_id = @siteId
          AND active = 0
        `)

      // -------------------------
      // OTHER DETAILS
      // -------------------------
      const otherDetailsResult = await pool
        .request()
        .input('siteId', sql.VarChar, site.id).query(`
          SELECT *
          FROM other_charges
          WHERE site_id = @siteId
          AND active = 0
        `)

      site.rates = ratesResult.recordset
      site.otherDetails = otherDetailsResult.recordset
    }

    // =========================================
    // FINAL RESPONSE
    // =========================================
    return res.status(200).json({
      success: true,

      data: {
        _id: client.id,

        companyName: client.company_name,
        contactPersonName: client.contact_person,
        contactNo: client.contact_no,
        emailId: client.client_email,

        address: client.client_add,
        city: client.client_city,
        state: client.client_state,
        pincode: client.city_pincode,

        gstStateCode: client.client_gst_state_code,
        gstNo: client.client_gst_no,

        sacCode: client.sac_code,

        otherInfo: client.other_info,

        termsAndConditions: client.terms,

        bankDetails: {
          bankName: client.bank_name,
          accountNo: client.client_acc_no,
          ifscCode: client.ifsc_code,
          branch: client.bank_branch,
          city: client.bank_city,
          micrCode: client.micr_code,
        },

        billingCompany: {
          companyName: client.billing_company_name || '',
        },

        companyBankName: {
          companyName: client.bank_company_name || '',
          bankName: client.bank_name || '',
          ifsc: client.bank_ifsc || '',
        },

        created_by: client.created_by_name || '',

        created_on: client.created_on,

        sites,
      },
    })
  } catch (error) {
    console.error('GET CLIENT BY ID FAILED:', error)

    return res.status(500).json({
      success: false,
      message: 'Server error fetching client details',
      error: error.message,
    })
  }
}

// @desc    Get Sites By Client ID
// @route   GET /api/clients/sites/:clientId
exports.getSitesByClientId = async (req, res) => {
  try {
    const { clientId } = req.params

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'clientId is required',
      })
    }

    const pool = await poolPromise

    const result = await pool.request().input('clientId', sql.Int, clientId)
      .query(`
        SELECT *
        FROM client_rates
        WHERE client_id = @clientId
        AND active = 0
        ORDER BY id DESC
      `)

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active sites found for this client',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Sites fetched successfully',
      data: result.recordset,
    })
  } catch (error) {
    console.error('FETCH SITES BY CLIENT ID FAILED:', error)

    res.status(500).json({
      success: false,
      message: 'Error fetching sites for client',
      error: error.message,
    })
  }
}

// @desc    Get Sites By Multiple Client IDs
// @route   POST /api/clients/sites-by-ids
exports.getSitesByClientIds = async (req, res) => {
  try {
    const { clientIds } = req.body

    if (!clientIds || !Array.isArray(clientIds)) {
      return res.status(400).json({
        success: false,
        message: 'clientIds must be an array',
      })
    }

    const pool = await poolPromise

    // Convert array into comma separated values
    const ids = clientIds
      .map((idObj) => parseInt(idObj.$oid || idObj))
      .filter((id) => !isNaN(id))

    if (ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client IDs',
      })
    }

    const query = `
      SELECT *
      FROM client_rates
      WHERE client_id IN (${ids.join(',')})
      AND active = 0
      ORDER BY id DESC
    `

    const result = await pool.request().query(query)

    res.status(200).json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    console.error('FETCH SITES BY CLIENT IDS FAILED:', error)

    res.status(500).json({
      success: false,
      message: 'Error fetching sites by client IDs',
      error: error.message,
    })
  }
}

// @desc    Update an existing client by its ID
// @route   PUT /api/clients/:id

exports.updateClientDetails = async (req, res) => {
  const pool = await poolPromise
  const transaction = new sql.Transaction(pool)

  try {
    const { id } = req.params
    const userId = req.user.id

    const {
      companyName,
      contactPersonName,
      contactNo,
      emailId,
      address,
      city,
      state,
      pincode,
      gstStateCode,
      gstNo,
      sacCode,
      billingCompany,
      companyBankName,
      otherInfo,
      termsAndConditions,
    } = req.body

    await transaction.begin()

    // =========================
    // 1. DUPLICATE CHECK (NEW REQUEST)
    // =========================
    const dupRequest = new sql.Request(transaction)

    const dup = await dupRequest
      .input('id', sql.Int, id)
      .input('companyName', sql.VarChar, companyName)
      .input('emailId', sql.VarChar, emailId).query(`
        SELECT id FROM new_client
        WHERE (company_name = @companyName OR client_email = @emailId)
        AND id <> @id
      `)

    if (dup.recordset.length > 0) {
      await transaction.rollback()
      return res.status(400).json({
        message: 'Company name or Email already exists',
      })
    }

    // =========================
    // 2. UPDATE QUERY (NEW REQUEST)
    // =========================
    const updateRequest = new sql.Request(transaction)

    await updateRequest
      .input('companyName', sql.VarChar, companyName)
      .input('contactPersonName', sql.VarChar, contactPersonName)
      .input('contactNo', sql.VarChar, contactNo)
      .input('emailId', sql.VarChar, emailId)
      .input('address', sql.VarChar, address)
      .input('city', sql.VarChar, city)
      .input('state', sql.VarChar, state)
      .input('pincode', sql.VarChar, pincode)
      .input('gstStateCode', sql.VarChar, gstStateCode)
      .input('gstNo', sql.VarChar, gstNo)
      .input('sacCode', sql.VarChar, sacCode)
      .input('billingCompany', sql.VarChar, billingCompany)
      .input('companyBankName', sql.VarChar, companyBankName)
      .input('otherInfo', sql.VarChar, otherInfo)
      .input('termsAndConditions', sql.VarChar, termsAndConditions)
      .input('userId', sql.Int, userId)
      .input('id', sql.Int, id).query(`
        UPDATE new_client
        SET
          company_name = @companyName,
          contact_person = @contactPersonName,
          contact_no = @contactNo,
          client_email = @emailId,
          client_add = @address,
          client_city = @city,
          client_state = @state,
          city_pincode = @pincode,
          client_gst_state_code = @gstStateCode,
          client_gst_no = @gstNo,
          sac_code = @sacCode,
          billing_company = @billingCompany,
          company_bank_name = @companyBankName,
          other_info = @otherInfo,
          terms = @termsAndConditions,
          modified_by = @userId,
          modified_on = GETDATE()
        WHERE id = @id
      `)

    await transaction.commit()

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
    })
  } catch (error) {
    console.error('UPDATE CLIENT FAILED:', error)
    await transaction.rollback()

    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

exports.updateClientBankDetails = async (req, res) => {
  const pool = await poolPromise

  try {
    const { id } = req.params
    const userId = req.user.id
    const bank = req.body

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('bankName', sql.VarChar, bank.bankName || '')
      .input('accountNo', sql.VarChar, bank.accountNo || '')
      .input('ifscCode', sql.VarChar, bank.ifscCode || '')
      .input('branch', sql.VarChar, bank.branch || '')
      .input('city', sql.VarChar, bank.bankCity || bank.city || '')
      .input('micrCode', sql.VarChar, bank.micrCode || '')
      .input('userId', sql.Int, userId).query(`
        UPDATE new_client
        SET
          bank_name = @bankName,
          client_acc_no = @accountNo,
          ifsc_code = @ifscCode,
          bank_branch = @branch,
          bank_city = @city,
          micr_code = @micrCode,
          modified_by = @userId,
          modified_on = GETDATE()
        WHERE id = @id
      `)

    res.status(200).json({
      success: true,
      message: 'Bank details updated successfully',
    })
  } catch (error) {
    console.error('BANK UPDATE FAILED:', error)
    res.status(500).json({ success: false, error: error.message })
  }
}

exports.updateClientSiteDetails = async (req, res) => {
  const pool = await poolPromise
  const transaction = new sql.Transaction(pool)

  try {
    const { clientId, siteId } = req.params
    const userId = req.user.id
    const siteData = req.body

    await transaction.begin()
    const request = new sql.Request(transaction)

    // =========================
    // UPDATE SITE
    // =========================
    await request
      .input('siteId', sql.Int, siteId)
      .input('clientId', sql.Int, clientId)
      .input('userId', sql.Int, userId)
      .input('siteName', sql.VarChar, siteData.siteName)
      .input('workOrderNo', sql.VarChar, siteData.workOrderNo)
      .input('contactPersonName', sql.VarChar, siteData.contactPersonName)
      .input('address', sql.VarChar, siteData.address)
      .input('billingAddress', sql.VarChar, siteData.billingAddress)
      .input('contactNo', sql.VarChar, siteData.contactNo)
      .input('emailId', sql.VarChar, siteData.emailId)
      .input('city', sql.VarChar, siteData.city)
      .input('state', sql.VarChar, siteData.state)
      .input('country', sql.VarChar, siteData.country)
      .input('locationName', sql.VarChar, siteData.locationName)
      .input('cgst', sql.Float, parseFloat(siteData.cgst) || 0)
      .input('sgst', sql.Float, parseFloat(siteData.sgst) || 0)
      .input('igst', sql.Float, parseFloat(siteData.igst) || 0)
      .input(
        'expectedBillingAmount',
        sql.Float,
        parseFloat(siteData.expectedBillingAmount) || 0,
      )
      .input('daysForBilling', sql.Int, parseInt(siteData.daysForBilling) || 0)
      .query(`
        UPDATE client_rates
        SET
          site_name = @siteName,
          work_order_no = @workOrderNo,
          cc_contact_person = @contactPersonName,
          cc_address = @address,
          cc_contactno = @contactNo,
          cc_emailid = @emailId,
          cc_city = @city,
          cc_state = @state,
          cc_country = @country,
          cc_location_name = @locationName,
          cc_cgst = @cgst,
          cc_sgst = @sgst,
          cc_igst = @igst,
          cc_est_billing_amount = @expectedBillingAmount,
          billing_nodays = @daysForBilling,
          modified_by = @userId,
          modified_on = GETDATE()
        WHERE id = @siteId
      `)

    // =========================
    // RATES UPDATE (SIMPLE VERSION)
    // =========================
    if (Array.isArray(siteData.rates)) {
      for (const r of siteData.rates) {
        if (r.id) {
          await request.input('rateId', sql.Int, r.id).query(`
              UPDATE charges_by_rank
              SET
                hours = ${Number(r.hours) || 0},
                nos = ${Number(r.nos) || 0},
                basic = ${Number(r.basic) || 0},
                hra = ${Number(r.hra) || 0},
                da = ${Number(r.da) || 0},
                modified_by = ${userId},
                modified_on = GETDATE()
              WHERE id = @rateId
            `)
        }
      }
    }

    // =========================
    // OTHER CHARGES
    // =========================
    if (Array.isArray(siteData.otherDetails)) {
      for (const d of siteData.otherDetails) {
        if (d.id) {
          await request.query(`
            UPDATE other_charges
            SET
              charges = ${Number(d.charges) || 0},
              modified_by = ${userId},
              modified_on = GETDATE()
            WHERE id = ${d.id}
          `)
        }
      }
    }

    await transaction.commit()

    res.status(200).json({
      success: true,
      message: 'Site updated successfully',
    })
  } catch (error) {
    console.error('SITE UPDATE FAILED:', error)
    await transaction.rollback()

    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// @desc    Delete a client by its ID
// @route   DELETE /api/clients/:id
exports.deleteClient = async (req, res) => {
  try {
    const clientId = req.params.id
    const userId = req.user.id

    const pool = await poolPromise

    const result = await pool
      .request()
      .input('id', sql.Int, clientId)
      .input('disabled_by', sql.VarChar, String(userId))
      .input('disabled_on', sql.DateTime, new Date()).query(`
        UPDATE new_client
        SET 
          active = '1',
          disabled_by = @disabled_by,
          disabled_on = @disabled_on
        WHERE id = @id AND active = '0'
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Client deleted successfully',
    })
  } catch (error) {
    console.error('DELETE CLIENT FAILED:', error)

    return res.status(500).json({
      success: false,
      message: 'Server error while deleting client',
      error: error.message,
    })
  }
}

exports.deleteClientSite = async (req, res) => {
  try {
    const pool = await poolPromise

    const siteId = req.params.siteId
    const userId = req.user.id

    const result = await pool
      .request()
      .input('siteId', siteId)
      .input('disabled_by', userId)
      .input('disabled_on', new Date()).query(`
        UPDATE client_rates
        SET 
          active = '1',
          disabled_by = @disabled_by,
          disabled_on = @disabled_on
        WHERE id = @siteId AND active = '0'
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Site deleted successfully',
    })
  } catch (error) {
    console.error('DELETE SITE FAILED:', error)

    return res.status(500).json({
      success: false,
      message: 'Server error while deleting site',
      error: error.message,
    })
  }
}

function formatDateForExcel(val) {
  if (!val && val !== 0) return ''
  const d = new Date(val)

  if (d instanceof Date && !isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  }

  return String(val)
}

exports.exportClientsToExcel = async (req, res) => {
  try {
    const { searchFields, fromDate, toDate } = req.query

    let whereClause = `WHERE c.active = '0'`

    // 🔍 Search filters
    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((f) => {
        if (f.field && f.keyword) {
          whereClause += ` AND c.${f.field} LIKE '%${f.keyword}%'`
        }
      })
    }

    // 📅 Date filter
    if (fromDate && toDate) {
      whereClause += `
        AND c.created_on BETWEEN '${fromDate}' AND '${toDate} 23:59:59'
      `
    }

    // 1️⃣ GET CLIENTS
    const clientsResult = await req.db.request().query(`
      SELECT 
        c.id,
        c.company_name,
        c.contact_person,
        c.contact_no,
        c.client_email,
        c.client_gst_no,
        c.created_on
      FROM new_client c
      ${whereClause}
      ORDER BY c.created_on DESC
    `)

    const clients = clientsResult.recordset

    // 2️⃣ GET SITES
    const sitesResult = await req.db.request().query(`
      SELECT 
        s.client_id,
        s.site_name,
        s.client_code,
        s.cc_contact_person,
        s.cc_address,
        s.cc_contactno,
        s.cc_emailid
      FROM client_rates s
      WHERE s.active = '0'
    `)

    const sites = sitesResult.recordset

    // 📦 Map sites by client_id
    const siteMap = {}
    sites.forEach((s) => {
      if (!siteMap[s.client_id]) siteMap[s.client_id] = []
      siteMap[s.client_id].push(s)
    })

    // 3️⃣ HEADERS
    const headers = [
      'Client Name',
      'Client Code',
      'Client Contact Person',
      'Client Contact No',
      'Client GST No',
      'Site Name',
      'Site Contact Person',
      'Site Address',
      'Site Contact No',
      'Site Email ID',
      'Created On',
    ]

    // 4️⃣ ROWS
    const excelRows = []

    clients.forEach((client) => {
      const clientSites = siteMap[client.id] || []

      clientSites.forEach((site) => {
        excelRows.push([
          client.company_name || '',
          site.client_code || '',
          client.contact_person || '',
          client.contact_no || '',
          client.client_gst_no || '',
          site.site_name || '',
          site.cc_contact_person || '',
          site.cc_address || '',
          site.cc_contactno || '',
          site.cc_emailid || '',
          formatDateForExcel(client.created_on),
        ])
      })
    })

    // 5️⃣ CREATE EXCEL
    const sheetData = [headers, ...excelRows]

    const worksheet = xlsx.utils.aoa_to_sheet(sheetData)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Client Sites')

    const fileName = `ClientSites_${Date.now()}.xlsx`

    const buffer = xlsx.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    // 6️⃣ RESPONSE
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    return res.send(buffer)
  } catch (error) {
    console.error('EXPORT CLIENT ERROR:', error)
    return res.status(500).json({
      message: 'Failed to generate report',
      error: error.message,
    })
  }
}

//Not check in postman
exports.getWORates = async (req, res) => {
  try {
    const siteId = req.params.siteId

    const result = await req.db.request().input('siteId', siteId).query(`
        SELECT *
        FROM wo_rate_chart
        WHERE site_id = @siteId
          AND active = '0'
        ORDER BY created_on ASC
      `)

    return res.status(200).json(result.recordset)
  } catch (e) {
    console.error('GET WO RATES FAILED:', e)
    return res.status(500).json({
      success: false,
      message: 'Server error fetching WO Rates',
      error: e.message,
    })
  }
}

//Not check in postman
exports.addWORates = async (req, res) => {
  const transaction = new req.db.Transaction()

  try {
    const clientId = req.params.clientId
    const siteId = req.params.siteId
    const woRates = req.body

    await transaction.begin()

    const request = transaction.request()

    // 1️⃣ Get existing records
    const existing = await request
      .input('clientId', clientId)
      .input('siteId', siteId).query(`
        SELECT id
        FROM wo_rate_chart
        WHERE client_id = @clientId
          AND site_id = @siteId
          AND active = '0'
      `)

    const existingIds = existing.recordset.map((r) => r.id)

    const incomingIds = woRates.filter((o) => o.id).map((o) => o.id)

    // 2️⃣ UPDATE + INSERT
    for (const o of woRates) {
      if (o.id && existingIds.includes(o.id)) {
        // UPDATE
        await transaction
          .request()
          .input('id', o.id)
          .input('woType', o.woType || '')
          .input('size', o.size || '')
          .input('fromWt', o.fromWt || '')
          .input('toWt', o.toWt || '')
          .input('type', o.type || '')
          .input('equipmentType', o.equipmentType || '')
          .input('examPer', o.examPer || '')
          .input('rate', o.rate || 0)
          .input('modified_by', req.user.id)
          .input('modified_on', new Date()).query(`
            UPDATE wo_rate_chart
            SET 
              wo_type = @woType,
              size = @size,
              from_wt = @fromWt,
              to_wt = @toWt,
              type = @type,
              equipment_type = @equipmentType,
              exam_per = @examPer,
              rate = @rate,
              modified_by = @modified_by,
              modified_on = @modified_on
            WHERE id = @id
          `)
      } else {
        // INSERT
        await transaction
          .request()
          .input('clientId', clientId)
          .input('siteId', siteId)
          .input('woType', o.woType || '')
          .input('size', o.size || '')
          .input('fromWt', o.fromWt || '')
          .input('toWt', o.toWt || '')
          .input('type', o.type || '')
          .input('equipmentType', o.equipmentType || '')
          .input('examPer', o.examPer || '')
          .input('rate', o.rate || 0)
          .input('created_by', req.user.id).query(`
            INSERT INTO wo_rate_chart (
              client_id,
              site_id,
              wo_type,
              size,
              from_wt,
              to_wt,
              type,
              equipment_type,
              exam_per,
              rate,
              created_by,
              active,
              created_on
            )
            VALUES (
              @clientId,
              @siteId,
              @woType,
              @size,
              @fromWt,
              @toWt,
              @type,
              @equipmentType,
              @examPer,
              @rate,
              @created_by,
              '0',
              GETDATE()
            )
          `)
      }
    }

    // 3️⃣ SOFT DELETE (removed records)
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id))

    if (toDelete.length > 0) {
      await transaction
        .request()
        .input('ids', toDelete.join(','))
        .input('disabled_by', req.user.id).query(`
          UPDATE wo_rate_chart
          SET 
            active = '1',
            disabled_by = @disabled_by,
            disabled_on = GETDATE()
          WHERE id IN (SELECT value FROM STRING_SPLIT(@ids, ','))
        `)
    }

    await transaction.commit()

    return res.status(200).json({
      success: true,
      message: 'Work order rates saved successfully!',
    })
  } catch (e) {
    await transaction.rollback()

    console.error('WO RATE ERROR:', e)
    return res.status(500).json({
      success: false,
      message: 'Error adding WO Rates',
      error: e.message,
    })
  }
}

exports.getSiteBySiteId = async (req, res) => {
  try {
    const { id } = req.params

    const result = await req.db.request().input('id', id).query(`
        SELECT TOP 1 *
        FROM client_rates
        WHERE id = @id
      `)

    if (!result.recordset.length) {
      return res.status(404).json({
        success: false,
        message: 'Site not found',
      })
    }

    const site = result.recordset[0]

    return res.status(200).json({ data: site })
  } catch (e) {
    console.error('GET SITE BY ID FAILED:', e)
    res.status(500).json({
      success: false,
      message: 'Server error fetching site details',
      error: e.message,
    })
  }
}

//Not check in postman
exports.updateWagesSettings = async (req, res) => {
  try {
    const { clientId, siteId } = req.params

    const {
      multiplyOTHours,
      calculateUniformDays,
      calculateEarnedGrossWithoutOT,
      pfWagesCalculatedOn,
      ESICWagesCalculatedOn,
      CTCCalculate,
      wagesSettings,
    } = req.body

    if (!clientId || !siteId) {
      return res.status(400).json({
        message: 'Client ID and Site ID are required',
      })
    }

    const request = req.db.request()

    // 1️⃣ CHECK SITE EXISTS
    const siteCheck = await request
      .input('clientId', clientId)
      .input('siteId', siteId).query(`
        SELECT TOP 1 *
        FROM client_rates
        WHERE id = @siteId AND client_id = @clientId
      `)

    if (!siteCheck.recordset.length) {
      return res.status(404).json({
        message: 'Site not found',
      })
    }

    const site = siteCheck.recordset[0]

    // 2️⃣ UPDATE QUERY
    await req.db
      .request()
      .input('clientId', clientId)
      .input('siteId', siteId)
      .input('multiplyOTHours', multiplyOTHours ?? site.multiply_ot_hours)
      .input(
        'calculateUniformDays',
        calculateUniformDays ?? site.calculate_uniform_days,
      )
      .input(
        'calculateEarnedGrossWithoutOT',
        calculateEarnedGrossWithoutOT ?? site.calculate_earnedgross_withoutot,
      )
      .input(
        'pfWagesCalculatedOn',
        pfWagesCalculatedOn ?? site.pf_wages_calculated_on,
      )
      .input(
        'ESICWagesCalculatedOn',
        ESICWagesCalculatedOn ?? site.ESIC_wages_calculated_on,
      )
      .input('CTCCalculate', CTCCalculate ?? site.CTC_calculate)
      .input(
        'wagesSettings',
        wagesSettings ? JSON.stringify(wagesSettings) : site.wages_header,
      )
      .input('modified_by', req.user.id)
      .input('modified_on', new Date()).query(`
        UPDATE client_rates
        SET
          multiply_ot_hours = @multiplyOTHours,
          calculate_uniform_days = @calculateUniformDays,
          calculate_earnedgross_withoutot = @calculateEarnedGrossWithoutOT,
          pf_wages_calculated_on = @pfWagesCalculatedOn,
          ESIC_wages_calculated_on = @ESICWagesCalculatedOn,
          CTC_calculate = @CTCCalculate,
          wages_header = @wagesSettings,
          modified_by = @modified_by,
          modified_on = @modified_on
        WHERE id = @siteId AND client_id = @clientId
      `)

    // 3️⃣ RETURN UPDATED DATA
    const updated = await req.db.request().input('siteId', siteId).query(`
        SELECT TOP 1 *
        FROM client_rates
        WHERE id = @siteId
      `)

    return res.status(200).json({
      message: 'Wages settings updated successfully',
      site: updated.recordset[0],
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Server error',
      error: error.message,
    })
  }
}

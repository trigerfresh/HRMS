const express = require('express')
const router = express.Router()
const xlsx = require('xlsx')
const authMiddleware = require('../middleware/authMiddleware')
const { poolPromise, sql } = require('../config/db')

// =====================================================
// GET ALL WORK ORDERS WITH DETAILS
// =====================================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    const request = pool.request()
    request.timeout = 60000

    const query = `
      SELECT TOP 10
        wo.id AS work_order_id,
        wo.client_name,
        wo.client_id,
        wo.work_order_no,
        wo.work_order_date,
        wo.work_order_type,
        wo.igm_no,
        wo.vendor,
        wo.cha_name,
        wo.importer_name,
        wo.status,

        wod.id AS detail_id,
        wod.parent_id,
        wod.item_no,
        wod.container_no,
        wod.vehicle_no,
        wod.cargo_name,
        wod.invoice_number,
        wod.destuff_pkgs,
        wod.destuff_weight,
        wod.total_cargo_pkgs,
        wod.total_cargo_weight

      FROM work_order wo

      LEFT JOIN work_order_detail wod
        ON wo.id = wod.parent_id
        AND wod.active = '0'

      WHERE wo.active = '0'

      ORDER BY wo.id DESC
    `

    const result = await request.query(query)

    return res.json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      message: 'Failed to fetch work orders',
    })
  }
})

// =====================================================
// CREATE WORK ORDER + DETAILS
// =====================================================
router.post('/', authMiddleware, async (req, res) => {
  const transaction = new sql.Transaction(await poolPromise)

  try {
    await transaction.begin()

    const {
      client_name,
      client_id,
      work_order_no,
      work_order_date,
      work_order_type,
      status,
      details,
      cha_name,
      igm_no,
      importer_name,
      vendor,
    } = req.body

    // =============================
    // CHECK DUPLICATE
    // =============================
    const duplicateCheck = await transaction
      .request()
      .input('work_order_no', sql.VarChar(sql.MAX), work_order_no).query(`
        SELECT id
        FROM work_order
        WHERE work_order_no = @work_order_no
        AND active = '0'
      `)

    if (duplicateCheck.recordset.length > 0) {
      await transaction.rollback()
      return res.status(400).json({ message: 'Work Order already exists' })
    }

    // =============================
    // INSERT WORK ORDER
    // =============================
    const insertWO = await transaction
      .request()
      .input('client_name', sql.VarChar(sql.MAX), client_name || '')
      .input('client_id', sql.VarChar(sql.MAX), client_id || '')
      .input('work_order_no', sql.VarChar(sql.MAX), work_order_no || '')
      .input('work_order_date', sql.VarChar(sql.MAX), work_order_date || '')
      .input('work_order_type', sql.VarChar(sql.MAX), work_order_type || '')
      .input('status', sql.VarChar(sql.MAX), status || '')
      .input('cha_name', sql.VarChar(sql.MAX), cha_name || '')
      .input('importer_name', sql.VarChar(sql.MAX), importer_name || '')
      .input('vendor', sql.VarChar(sql.MAX), vendor || '')
      .input('igm_no', sql.VarChar(sql.MAX), igm_no || '')
      .input('created_by', sql.VarChar(sql.MAX), String(req.user.id || ''))
      .query(`
        INSERT INTO work_order (
          client_name,
          client_id,
          work_order_no,
          work_order_date,
          work_order_type,
          status,
          active,
          igm_no,
          cha_name,
          importer_name,
          vendor,
          created_on,
          created_by
        )
        OUTPUT INSERTED.id
        VALUES (
          @client_name,
          @client_id,
          @work_order_no,
          @work_order_date,
          @work_order_type,
          @status,
          '0',
          @igm_no,
          @cha_name,
          @importer_name,
          @vendor,
          CONVERT(VARCHAR(10), GETDATE(), 103),
          @created_by
        )
      `)

    const workOrderId = insertWO.recordset[0].id

    // =============================
    // INSERT DETAILS
    // =============================
    if (Array.isArray(details) && details.length > 0) {
      for (const item of details) {
        await transaction
          .request()
          .input('parent_id', sql.Int, workOrderId)
          .input('item_no', sql.VarChar(sql.MAX), item.item_no || '')
          .input('container_no', sql.VarChar(sql.MAX), item.container_no || '')
          .input('vehicle_no', sql.VarChar(sql.MAX), item.vehicle_no || '')
          .input('cargo_name', sql.VarChar(sql.MAX), item.cargo_name || '')
          .input(
            'invoice_number',
            sql.VarChar(sql.MAX),
            item.invoice_number || '',
          )
          .input('destuff_pkgs', sql.VarChar(sql.MAX), item.destuff_pkgs || '')
          .input(
            'destuff_weight',
            sql.VarChar(sql.MAX),
            item.destuff_weight || '',
          )

          .input('size', sql.VarChar(sql.MAX), item.size || '')
          .input(
            'percentage_exam',
            sql.VarChar(sql.MAX),
            item.percentage_exam || '',
          )
          .input('remarks', sql.VarChar(sql.MAX), item.remarks || '')
          .input('hours', sql.VarChar(sql.MAX), item.hours || '')
          .input('cbm', sql.VarChar(sql.MAX), item.cbm || '')
          .input('seal_no', sql.VarChar(sql.MAX), item.seal_no || '')
          .input('arrival_date', sql.VarChar(sql.MAX), item.arrival_date || '')
          .input('allow_pkg', sql.VarChar(sql.MAX), item.allow_pkg || '')
          .input('allow_weight', sql.VarChar(sql.MAX), item.allow_weight || '')
          .input(
            'total_cargo_pkgs',
            sql.VarChar(sql.MAX),
            item.total_cargo_pkgs || '',
          )
          .input(
            'total_cargo_weight',
            sql.VarChar(sql.MAX),
            item.total_cargo_weight || '',
          )
          .input('status', sql.VarChar(sql.MAX), item.status || '')
          .input('export_party', sql.VarChar(sql.MAX), item.export_party || '')
          .input('gang_name', sql.VarChar(sql.MAX), item.gang_name || '')

          .input('created_by', sql.VarChar(sql.MAX), String(req.user.id || ''))
          .query(`
            INSERT INTO work_order_detail (
              parent_id,
              item_no,
              container_no,
              vehicle_no,
              cargo_name,
              invoice_number,
              destuff_pkgs,
              destuff_weight,
              size,
              percentage_exam,
              remarks,
              hours,
              cbm,
              seal_no,
              arrival_date,
              allow_pkg,
              allow_weight,
              total_cargo_pkgs,
              total_cargo_weight,
              status,
              export_party,
              gang_name,
              active,
              created_on,
              created_by
            )
            VALUES (
              @parent_id,
              @item_no,
              @container_no,
              @vehicle_no,
              @cargo_name,
              @invoice_number,
              @destuff_pkgs,
              @destuff_weight,
              @size,
              @percentage_exam,
              @remarks,
              @hours,
              @cbm,
              @seal_no,
              @arrival_date,
              @allow_pkg,
              @allow_weight,
              @total_cargo_pkgs,
              @total_cargo_weight,
              @status,
              @export_party,
              @gang_name,
              '0',
              CONVERT(VARCHAR(10), GETDATE(), 103),
              @created_by
            )
          `)
      }
    }

    await transaction.commit()

    res.status(201).json({
      success: true,
      message: 'Work Order created successfully',
      id: workOrderId,
    })
  } catch (error) {
    await transaction.rollback()
    console.error(error)

    res.status(500).json({
      message: 'Failed to create work order',
    })
  }
})

// =====================================================
// GET WORK ORDER BY ID
// =====================================================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise
    const { id } = req.params

    const query = `
      SELECT
        wo.id AS work_order_id,
        wo.client_name,
        wo.client_id,
        wo.work_order_no,
        wo.work_order_date,
        wo.work_order_type,
        wo.igm_no,
        wo.vendor,
        wo.cha_name,
        wo.importer_name,
        wo.status,

        wod.id AS detail_id,
        wod.parent_id,
        wod.item_no,
        wod.container_no,
        wod.vehicle_no,
        wod.cargo_name,
        wod.invoice_number,
        wod.destuff_pkgs,
        wod.destuff_weight,
        wod.size,
        wod.percentage_exam,
        wod.remarks,
        wod.hours,
        wod.cbm,
        wod.seal_no,
        wod.arrival_date,
        wod.allow_pkg,
        wod.allow_weight,
        wod.total_cargo_pkgs,
        wod.total_cargo_weight,
        wod.export_party,
        wod.gang_name

      FROM work_order wo

      LEFT JOIN work_order_detail wod
        ON wo.id = wod.parent_id
        AND wod.active = '0'

      WHERE wo.id = @id
      AND wo.active = '0'
    `

    const result = await pool.request().input('id', sql.Int, id).query(query)

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found',
      })
    }

    const firstRow = result.recordset[0]

    const data = {
      work_order_id: firstRow.work_order_id,
      client_name: firstRow.client_name || '',
      client_id: firstRow.client_id || '',
      work_order_no: firstRow.work_order_no || '',
      work_order_date: firstRow.work_order_date || '',
      work_order_type: firstRow.work_order_type || '',
      igm_no: firstRow.igm_no || '',
      vendor: firstRow.vendor || '',
      cha_name: firstRow.cha_name || '',
      importer_name: firstRow.importer_name || '',
      status: firstRow.status || '',
      details: result.recordset
        .filter((x) => x.detail_id !== null)
        .map((row) => ({
          detail_id: row.detail_id,
          parent_id: row.parent_id,
          item_no: row.item_no || '',
          container_no: row.container_no || '',
          vehicle_no: row.vehicle_no || '',
          cargo_name: row.cargo_name || '',
          invoice_number: row.invoice_number || '',
          destuff_pkgs: row.destuff_pkgs || '',
          destuff_weight: row.destuff_weight || '',
          size: row.size || '',
          percentage_exam: row.percentage_exam || '',
          remarks: row.remarks || '',
          hours: row.hours || '',
          cbm: row.cbm || '',
          seal_no: row.seal_no || '',
          arrival_date: row.arrival_date || '',
          allow_pkg: row.allow_pkg || '',
          allow_weight: row.allow_weight || '',
          total_cargo_pkgs: row.total_cargo_pkgs || '',
          total_cargo_weight: row.total_cargo_weight || '',
          export_party: row.export_party || '',
          gang_name: row.gang_name || '',
        })),
    }

    res.json({
      success: true,
      data,
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch work order details',
    })
  }
})

// =====================================================
// UPDATE WORK ORDER + DETAILS
// =====================================================
router.put('/:id', authMiddleware, async (req, res) => {
  const transaction = new sql.Transaction(await poolPromise)

  try {
    await transaction.begin()

    const { id } = req.params

    const {
      client_name,
      client_id,
      work_order_no,
      work_order_date,
      work_order_type,
      status,
      cha_name,
      igm_no,
      importer_name,
      vendor,
      details,
    } = req.body

    // =============================
    // UPDATE MASTER
    // =============================
    await transaction
      .request()
      .input('id', sql.Int, id)
      .input('client_name', sql.VarChar(sql.MAX), client_name || '')
      .input('client_id', sql.VarChar(sql.MAX), client_id || '')
      .input('work_order_no', sql.VarChar(sql.MAX), work_order_no || '')
      .input('work_order_date', sql.VarChar(sql.MAX), work_order_date || '')
      .input('work_order_type', sql.VarChar(sql.MAX), work_order_type || '')
      .input('status', sql.VarChar(sql.MAX), status || '')
      .input('cha_name', sql.VarChar(sql.MAX), cha_name || '')
      .input('igm_no', sql.VarChar(sql.MAX), igm_no || '')
      .input('importer_name', sql.VarChar(sql.MAX), importer_name || '')
      .input('vendor', sql.VarChar(sql.MAX), vendor || '')
      .input('modified_by', sql.VarChar(sql.MAX), String(req.user.id || ''))
      .query(`
        UPDATE work_order
        SET
          client_name = @client_name,
          client_id = @client_id,
          work_order_no = @work_order_no,
          work_order_date = @work_order_date,
          work_order_type = @work_order_type,
          status = @status,
          cha_name = @cha_name,
          igm_no = @igm_no,
          importer_name = @importer_name,
          vendor = @vendor,
          modified_by = @modified_by,
          modified_on = CONVERT(VARCHAR(10), GETDATE(), 103)
        WHERE id = @id
      `)

    // =============================
    // DELETE OLD DETAILS
    // =============================
    await transaction.request().input('id', sql.Int, id).query(`
        DELETE FROM work_order_detail
        WHERE parent_id = @id
      `)

    // =============================
    // INSERT NEW DETAILS
    // =============================
    if (Array.isArray(details) && details.length > 0) {
      for (const item of details) {
        await transaction
          .request()
          .input('parent_id', sql.Int, id)
          .input('item_no', sql.VarChar(sql.MAX), item.item_no || '')
          .input('container_no', sql.VarChar(sql.MAX), item.container_no || '')
          .input('vehicle_no', sql.VarChar(sql.MAX), item.vehicle_no || '')
          .input('cargo_name', sql.VarChar(sql.MAX), item.cargo_name || '')
          .input(
            'invoice_number',
            sql.VarChar(sql.MAX),
            item.invoice_number || '',
          )
          .input('destuff_pkgs', sql.VarChar(sql.MAX), item.destuff_pkgs || '')
          .input(
            'destuff_weight',
            sql.VarChar(sql.MAX),
            item.destuff_weight || '',
          )

          .input('size', sql.VarChar(sql.MAX), item.size || '')
          .input(
            'percentage_exam',
            sql.VarChar(sql.MAX),
            item.percentage_exam || '',
          )
          .input('remarks', sql.VarChar(sql.MAX), item.remarks || '')
          .input('hours', sql.VarChar(sql.MAX), item.hours || '')
          .input('cbm', sql.VarChar(sql.MAX), item.cbm || '')
          .input('seal_no', sql.VarChar(sql.MAX), item.seal_no || '')
          .input('arrival_date', sql.VarChar(sql.MAX), item.arrival_date || '')
          .input('allow_pkg', sql.VarChar(sql.MAX), item.allow_pkg || '')
          .input('allow_weight', sql.VarChar(sql.MAX), item.allow_weight || '')
          .input(
            'total_cargo_pkgs',
            sql.VarChar(sql.MAX),
            item.total_cargo_pkgs || '',
          )
          .input(
            'total_cargo_weight',
            sql.VarChar(sql.MAX),
            item.total_cargo_weight || '',
          )
          .input('status', sql.VarChar(sql.MAX), item.status || '')
          .input('export_party', sql.VarChar(sql.MAX), item.export_party || '')
          .input('gang_name', sql.VarChar(sql.MAX), item.gang_name || '')
          .input('modified_by', sql.VarChar(sql.MAX), String(req.user.id || ''))
          .query(`
            INSERT INTO work_order_detail (
              parent_id,
              item_no,
              container_no,
              vehicle_no,
              cargo_name,
              invoice_number,
              destuff_pkgs,
              destuff_weight,
              size,
              percentage_exam,
              remarks,
              hours,
              cbm,
              seal_no,
              arrival_date,
              allow_pkg,
              allow_weight,
              total_cargo_pkgs,
              total_cargo_weight,
              status,
              export_party,
              gang_name,
              active,
              created_on,
              created_by
            )
            VALUES (
              @parent_id,
              @item_no,
              @container_no,
              @vehicle_no,
              @cargo_name,
              @invoice_number,
              @destuff_pkgs,
              @destuff_weight,
              @size,
              @percentage_exam,
              @remarks,
              @hours,
              @cbm,
              @seal_no,
              @arrival_date,
              @allow_pkg,
              @allow_weight,
              @total_cargo_pkgs,
              @total_cargo_weight,
              @status,
              @export_party,
              @gang_name,
              '0',
              CONVERT(VARCHAR(10), GETDATE(), 103),
              @modified_by
            )
          `)
      }
    }

    await transaction.commit()

    res.json({
      success: true,
      message: 'Work Order updated successfully',
    })
  } catch (error) {
    await transaction.rollback()
    console.error(error)

    res.status(500).json({
      message: 'Failed to update work order',
    })
  }
})

// =====================================================
// DELETE (SOFT DELETE)
// =====================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  const transaction = new sql.Transaction(await poolPromise)

  try {
    await transaction.begin()

    const { id } = req.params

    // =============================
    // SOFT DELETE MASTER
    // =============================
    await transaction
      .request()
      .input('id', sql.Int, id)
      .input('disabled_by', sql.VarChar(sql.MAX), String(req.user.id || ''))
      .query(`
        UPDATE work_order

        SET
          active = '1',
          disabled_by = @disabled_by,
          disabled_on = CONVERT(VARCHAR(10), GETDATE(), 103)

        WHERE id = @id
      `)

    // =============================
    // SOFT DELETE DETAILS
    // =============================
    await transaction
      .request()
      .input('id', sql.Int, id)
      .input('disabled_by', sql.VarChar(sql.MAX), String(req.user.id || ''))
      .query(`
        UPDATE work_order_detail

        SET
          active = '1',
          disabled_by = @disabled_by,
          disabled_on = CONVERT(VARCHAR(10), GETDATE(), 103)

        WHERE parent_id = @id
      `)

    await transaction.commit()

    res.json({
      success: true,
      message: 'Deleted successfully',
    })
  } catch (error) {
    await transaction.rollback()

    console.error(error)

    res.status(500).json({
      message: 'Failed to delete work order',
    })
  }
})

// =====================================================
// EXPORT EXCEL
// =====================================================
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    const query = `
      SELECT
        wo.work_order_no,
        wo.client_name,
        wo.work_order_date,
        wo.work_order_type,

        wod.item_no,
        wod.container_no,
        wod.vehicle_no,
        wod.cargo_name,
        wod.invoice_number,
        wod.destuff_pkgs,
        wod.destuff_weight

      FROM work_order wo

      LEFT JOIN work_order_detail wod
        ON wo.id = wod.parent_id

      WHERE wo.active = '0'
      AND wod.active = '0'

      ORDER BY wo.id DESC
    `

    const result = await pool.request().query(query)

    const headers = [
      'Work Order No',
      'Client Name',
      'Work Order Date',
      'Work Order Type',
      'Item No',
      'Container No',
      'Vehicle No',
      'Cargo Name',
      'Invoice Number',
      'Destuff Packages',
      'Destuff Weight',
    ]

    const rows = result.recordset.map((e) => [
      e.work_order_no || '',
      e.client_name || '',
      e.work_order_date || '',
      e.work_order_type || '',
      e.item_no || '',
      e.container_no || '',
      e.vehicle_no || '',
      e.cargo_name || '',
      e.invoice_number || '',
      e.destuff_pkgs || '',
      e.destuff_weight || '',
    ])

    const worksheet = xlsx.utils.aoa_to_sheet([headers, ...rows])

    const workbook = xlsx.utils.book_new()

    xlsx.utils.book_append_sheet(workbook, worksheet, 'WorkOrders')

    const buffer = xlsx.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    res.setHeader('Content-Disposition', `attachment; filename=WorkOrders.xlsx`)

    res.send(buffer)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'Failed to export excel',
    })
  }
})

// =====================================================
// UPDATE STATUS ONLY
// =====================================================
router.put('/status/:id', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise

    const { id } = req.params
    const { status } = req.body

    // =============================
    // VALIDATION
    // =============================
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      })
    }

    // =============================
    // CHECK RECORD EXISTS
    // =============================
    const check = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT id
        FROM work_order
        WHERE id = @id
        AND active = '0'
      `)

    if (check.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work Order not found',
      })
    }

    // =============================
    // UPDATE STATUS
    // =============================
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('status', sql.VarChar(sql.MAX), status)
      .input('modified_by', sql.VarChar(sql.MAX), String(req.user.id || ''))
      .query(`
        UPDATE work_order
        SET
          status = @status,
          modified_by = @modified_by,
          modified_on = CONVERT(VARCHAR(10), GETDATE(), 103)
        WHERE id = @id
      `)

    return res.json({
      success: true,
      message: `Work Order ${status} successfully`,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      success: false,
      message: 'Failed to update work order status',
    })
  }
})


module.exports = router

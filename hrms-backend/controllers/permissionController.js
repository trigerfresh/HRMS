const { poolPromise } = require('../config/db')

// ================= GET ALL ROLES =================
exports.getAllRoles = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT DISTINCT role_name
      FROM role_master
      WHERE active = 0
      ORDER BY role_name
    `)

    res.json(result.recordset)
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: 'Error fetching roles',
    })
  }
}

// ================= GET ALL MODULES =================
exports.getAllModules = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT *
      FROM modules
      WHERE active = 0
      ORDER BY sort_order ASC
    `)

    res.json(result.recordset)
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: 'Error fetching modules',
    })
  }
}

// ================= GET PERMISSIONS FOR ROLE =================
exports.getPermissionsForRole = async (req, res) => {
  try {
    const pool = await poolPromise
    const role = req.params.role

    const result = await pool.request().input('role', role).query(`
      SELECT
        ra.*,
        m.module_name,
        m.module_url,
        m.main_module,
        m.segment
      FROM role_access ra
      LEFT JOIN modules m
        ON ra.module_id = m.module_id
      WHERE ra.role = @role
        AND ra.active = 0
      ORDER BY m.sort_order ASC
    `)

    const assignedModules = [
      ...new Set(result.recordset.map((r) => r.module_id)),
    ]

    res.json({
      assignedModules,
      detailedPermissions: result.recordset,
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: 'Error fetching permissions',
    })
  }
}

// ================= SAVE PERMISSIONS =================
// ================= SAVE PERMISSIONS =================
exports.savePermissionsForRole = async (req, res) => {
  try {
    const pool = await poolPromise

    const { role, permissions } = req.body

    if (!role) {
      return res.status(400).json({
        message: 'Role is required',
      })
    }

    // DELETE OLD
    await pool.request().input('role', role).query(`
      DELETE FROM role_access
      WHERE role = @role
    `)

    // INSERT NEW
    for (const item of permissions) {
      await pool
        .request()
        .input('role', role)

        // NULL SAFE
        .input('segment', item.segment || '')
        .input('main_module', item.main_module || '')

        .input('submodule_id', item.submodule_id || 0)

        .input('module_id', item.module_id || 0)

        .input('add_access', item.add_access || 0)

        .input('edit_access', item.edit_access || 0)

        .input('delete_access', item.delete_access || 0)

        .input('export_access', item.export_access || 0)

        .input('print_access', item.print_access || 0).query(`
          INSERT INTO role_access (
            role,
            segment,
            main_module,
            submodule_id,
            module_id,
            add_access,
            edit_access,
            delete_access,
            export_access,
            print_access,
            active
          )
          VALUES (
            @role,
            @segment,
            @main_module,
            @submodule_id,
            @module_id,
            @add_access,
            @edit_access,
            @delete_access,
            @export_access,
            @print_access,
            0
          )
        `)
    }

    res.status(200).json({
      message: 'Permissions saved successfully!',
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: 'Error saving permissions',
      error: error.message,
    })
  }
}
// ================= GET MY MENU =================
exports.getMyMenu = async (req, res) => {
  try {
    const pool = await poolPromise

    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'User role not found' })
    }

    const role = req.user.role

    // STEP 1
    const roleModuleResult = await pool.request().input('role', role).query(`
        SELECT modules, submodules
        FROM role_module
        WHERE role = @role
      `)

    if (!roleModuleResult.recordset.length) {
      return res.json([])
    }

    const { modules: modulesCsv, submodules: submodulesCsv } =
      roleModuleResult.recordset[0]

    if (!modulesCsv || !submodulesCsv) {
      return res.json([])
    }

    const allowedSubmodules = submodulesCsv
      .split(',')
      .map((s) => `'${s.trim()}'`)

    const modulesQuery = `
      SELECT module_id, module_name, main_module
      FROM modules
      WHERE module_id IN (${allowedSubmodules.join(',')})
        AND active = 0
      ORDER BY sort_order ASC
    `

    const modulesResult = await pool.request().query(modulesQuery)

    const moduleRows = modulesResult.recordset

    if (!moduleRows.length) {
      return res.json([])
    }

    // STEP 2 GROUPING
    const menu = []
    const moduleMap = {}

    moduleRows.forEach((row) => {
      const mainModule = row.main_module

      if (!moduleMap[mainModule]) {
        moduleMap[mainModule] = {
          moduleName: mainModule,
          submodules: [],
        }

        menu.push(moduleMap[mainModule])
      }

      moduleMap[mainModule].submodules.push({
        moduleId: row.module_id,
        moduleName: row.module_name,
      })
    })

    res.json(menu)
  } catch (error) {
    console.error('GET MENU ERROR:', error)

    res.status(500).json({
      message: 'Error fetching menu',
    })
  }
}
// exports.getMyMenu = async (req, res) => {
//   try {
//     if (!req.user || !req.user.role) {
//       return res.status(401).json({ message: 'User role not found' })
//     }

//     const role = req.user.role

//     // Step 1: Check if role exists in role_access
//     const roleAccessResult = await sql.query`
//       SELECT TOP 1 1
//       FROM role_access
//       WHERE role = ${role}
//         AND active = '0'
//     `

//     if (!roleAccessResult.recordset.length) {
//       // No permissions found for this role
//       return res.json([])
//     }

//     // Step 2: Fetch modules/submodules from role_module for this role
//     const roleModuleResult = await sql.query`
//       SELECT modules, submodules
//       FROM role_module
//       WHERE role = ${role}
//     `

//     if (!roleModuleResult.recordset.length) {
//       return res.json([]) // role_module not defined for this role
//     }

//     res.json(roleModuleResult.recordset)
//   } catch (error) {
//     console.error('GET MENU ERROR:', error)
//     res.status(500).json({ message: 'Error fetching menu' })
//   }
// }

// exports.getMyMenu = async (req, res) => {
//   try {
//     if (!req.user || !req.user.role) {
//       return res.status(401).json({
//         message: 'Authentication error: User role not found.',
//       })
//     }

//     const role = req.user.role

//     const result = await sql.query`
//       SELECT
//         ra.role,
//         ra.module_id,
//         ra.submodule_id,
//         ra.add_access,
//         ra.edit_access,
//         ra.delete_access,
//         ra.export_access,
//         ra.print_access,
//         m.segment,
//         m.main_module,
//         m.module_name,
//         m.module_url,
//         m.module_icon,
//         m.sort_order
//       FROM role_access ra
//       LEFT JOIN modules m
//         ON ra.module_id = m.module_id
//       WHERE ra.role = ${role}
//         AND ra.active = 0
//         AND m.active = 0
//       ORDER BY m.sort_order ASC
//     `

//     const rows = result.recordset

//     // Group by module_name
//     const menu = []
//     const moduleMap = {}

//     rows.forEach((row) => {
//       if (!moduleMap[row.module_name]) {
//         moduleMap[row.module_name] = {
//           moduleId: row.module_id,
//           moduleName: row.module_name,
//           moduleUrl: row.module_url,
//           moduleIcon: row.module_icon,
//           submodules: [],
//         }
//         menu.push(moduleMap[row.module_name])
//       }

//       // Add submodule
//       moduleMap[row.module_name].submodules.push({
//         submoduleId: row.submodule_id,
//         submoduleName: row.module_name, // or use another column for display
//         path: row.module_url,
//         addAccess: row.add_access,
//         editAccess: row.edit_access,
//         deleteAccess: row.delete_access,
//         exportAccess: row.export_access,
//         printAccess: row.print_access,
//       })
//     })

//     res.json(menu)
//   } catch (error) {
//     console.log('GET MENU ERROR:', error)
//     res.status(500).json({
//       message: 'Server crashed while building user menu',
//     })
//   }
// }

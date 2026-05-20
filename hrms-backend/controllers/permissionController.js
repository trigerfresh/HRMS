const { sql } = require('../config/db')

// ================= GET ALL ROLES =================
exports.getAllRoles = async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT DISTINCT role
      FROM role_access
      WHERE active = 0
      ORDER BY role
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
    const result = await sql.query(`
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
    const role = req.params.role

    const result = await sql.query`
      SELECT
        ra.*,
        m.module_name,
        m.module_url,
        m.main_module,
        m.segment
      FROM role_access ra

      LEFT JOIN modules m
        ON ra.module_id = m.module_id

      WHERE ra.role = ${role}
        AND ra.active = 0

      ORDER BY m.sort_order ASC
    `

    res.json(result.recordset)
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: 'Error fetching permissions',
    })
  }
}

// ================= SAVE PERMISSIONS =================
exports.savePermissionsForRole = async (req, res) => {
  try {
    const { role, permissions } = req.body

    // DELETE OLD PERMISSIONS
    await sql.query`
      DELETE FROM role_access
      WHERE role = ${role}
    `

    // INSERT NEW
    for (const item of permissions) {
      await sql.query`
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

          ${role},
          ${item.segment},
          ${item.main_module},
          ${item.submodule_id},
          ${item.module_id},

          ${item.add_access || 0},
          ${item.edit_access || 0},
          ${item.delete_access || 0},
          ${item.export_access || 0},
          ${item.print_access || 0},

          0
        )
      `
    }

    res.status(200).json({
      message: 'Permissions saved successfully!',
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: 'Error saving permissions',
    })
  }
}

// ================= GET MY MENU =================
exports.getMyMenu = async (req, res) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'User role not found' })
    }

    const role = req.user.role

    // Step 1: Fetch role_module for this role
    const roleModuleResult = await sql.query`
      SELECT modules, submodules
      FROM role_module
      WHERE role = ${role}
    `

    if (!roleModuleResult.recordset.length) return res.json([])

    const { modules: modulesCsv, submodules: submodulesCsv } =
      roleModuleResult.recordset[0]

    if (!modulesCsv || !submodulesCsv) return res.json([])

    const allowedModules = modulesCsv.split(',').map((m) => m.trim())
    const allowedSubmodules = submodulesCsv.split(',').map((s) => s.trim())

    if (!allowedModules.length || !allowedSubmodules.length) return res.json([])

    // Step 2: Fetch module details from module table where module_id in submodules
    const submodulesList = allowedSubmodules.map((s) => `'${s}'`).join(',')

    const modulesQuery = `
      SELECT module_id, module_name, main_module
      FROM modules
      WHERE module_id IN (${submodulesList})
        AND active = '0'  -- match your DB active value
      ORDER BY sort_order ASC
    `

    const modulesResult = await sql.query(modulesQuery)
    const moduleRows = modulesResult.recordset

    if (!moduleRows.length) return res.json([])

    // Step 3: Group submodules under their main_module for dropdown
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
    res.status(500).json({ message: 'Error fetching menu' })
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

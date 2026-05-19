const Permission = require('../models/Permission')
const Module = require('../models/Module')
const Role = require('../models/Role')

// Get all roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({})
    res.json(roles)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching roles' })
  }
}

// Get all modules
exports.getAllModules = async (req, res) => {
  try {
    const modules = await Module.find({}).sort({ srno: 1 })
    res.json(modules)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching modules' })
  }
}

// Get permissions for a role
exports.getPermissionsForRole = async (req, res) => {
  try {
    const { roleId } = req.params
    const permissions = await Permission.findOne({ roleId })
    if (!permissions) {
      return res.json({ assignedModules: [], detailedPermissions: [] })
    }
    res.json(permissions)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching permissions' })
  }
}

// Save permissions for a role
exports.savePermissionsForRole = async (req, res) => {
  try {
    const { roleId, assignedModules, detailedPermissions } = req.body
    // console.log(roleId, assignedModules, detailedPermissions);
    await Permission.findOneAndUpdate(
      { roleId },
      { assignedModules, detailedPermissions },
      { new: true, upsert: true, runValidators: true },
    )
    res.status(200).json({ message: 'Permissions saved successfully!' })
  } catch (error) {
    res.status(500).json({ message: 'Error saving permissions' })
  }
}
// exports.savePermissionsForRole = async (req, res) => {
//   try {
//     const { roleId, assignedModules, detailedPermissions } = req.body;

//     // Ensure detailedPermissions only contains submodules that are actually assigned
//     const filteredPermissions = detailedPermissions.filter((perm) =>
//       assignedModules.includes(perm.parentModuleId || perm.submoduleId)
//     );

//     // Save using upsert
//     const updated = await Permission.findOneAndUpdate(
//       { roleId },
//       { assignedModules, detailedPermissions: filteredPermissions },
//       { new: true, upsert: true, runValidators: true }
//     );

//     res
//       .status(200)
//       .json({ message: "Permissions saved successfully!", data: updated });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Error saving permissions", error: error.message });
//   }
// };

exports.getMyMenu = async (req, res) => {
  try {
    if (!req.user || !req.user.roleId) {
      return res
        .status(401)
        .json({ message: 'Authentication error: User role not found.' })
    }
    const roleId = req.user.roleId

    // const permissionDoc = await Permission.findOne({ roleId }).populate(
    //   "assignedModules"
    // );
    const permissionDoc = await Permission.findOne({ roleId }).populate({
      path: 'assignedModules',
      options: { sort: { srno: 1 } }, // ascending order (use -1 for descending)
    })

    if (
      !permissionDoc ||
      !permissionDoc.assignedModules ||
      permissionDoc.assignedModules.length === 0
    ) {
      return res.json([])
    }

    const allowedSubmoduleIds = new Set(
      (permissionDoc.detailedPermissions || [])
        .filter((p) => p && p.submoduleId)
        .map((p) => p.submoduleId.toString()),
    )

    const userMenu = permissionDoc.assignedModules
      .map((module) => {
        if (!module) return null

        let accessibleSubmodules = [] // जर detailedPermissions रिकामं असेल किंवा permissions दिल्या नसतील, सर्व submodules मिळवा
        if (
          !permissionDoc.detailedPermissions ||
          permissionDoc.detailedPermissions.length === 0
        ) {
          accessibleSubmodules = module.submodules || []
        } else {
          const allowedSubmoduleIds = new Set(
            (permissionDoc.detailedPermissions || [])
              .filter((p) => p && p.submoduleId)
              .map((p) => p.submoduleId.toString()),
          )
          accessibleSubmodules = (module.submodules || []).filter((submodule) =>
            allowedSubmoduleIds.has(submodule._id.toString()),
          )
        }

        if (accessibleSubmodules.length > 0) {
          return {
            moduleId: module._id,
            moduleName: module.name,
            submodules: accessibleSubmodules.map((sm) => ({
              submoduleId: sm._id,
              submoduleName: sm.name,
              path: sm.path,
            })),
          }
        } // direct link module (no submodules)

        if (
          (!module.submodules || module.submodules.length === 0) &&
          module.path
        ) {
          return {
            moduleId: module._id,
            moduleName: module.name,
            modulePath: module.path,
            submodules: [],
          }
        }
        return null
      })
      .filter(Boolean)

    // console.log(userMenu);
    res.json(userMenu)
  } catch (error) {
    console.error('!!! CRITICAL ERROR in getMyMenu !!!:', error)
    res.status(500).json({ message: 'Server crashed while building user menu' })
  }
}

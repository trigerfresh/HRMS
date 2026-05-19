const mongoose = require('mongoose')

// This schema defines the detailed permissions for ONE submodule
const SubmodulePermissionSchema = new mongoose.Schema(
  {
    submoduleId: {
      type: mongoose.Schema.Types.ObjectId, // The _id of the submodule from the Module model
      required: true,
    },
    // We store name and path here for convenience, to avoid extra lookups
    submoduleName: { type: String, required: true },
    path: { type: String, required: true },

    // The actual permissions
    canAdd: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    canPrint: { type: Boolean, default: false },
    canExport: { type: Boolean, default: false },
  },
  { _id: false },
) // Using { _id: false } is good practice for subdocuments that don't need their own ID.

const PermissionSchema = new mongoose.Schema({
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
    unique: true, // Each role has only one permission document
  },

  // Stores the list of assigned main modules (from the middle section of your UI)
  // This is a simple array of ObjectIDs referencing the Module model.
  assignedModules: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
    },
  ],

  // Stores the detailed permissions for all submodules (from the bottom table of your UI)
  detailedPermissions: [SubmodulePermissionSchema],
})

module.exports = mongoose.model('Permission', PermissionSchema)

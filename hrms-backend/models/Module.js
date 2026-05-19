const mongoose = require('mongoose')

// This schema defines a single submodule
const SubmoduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
    unique: true,
    sparse: true, // <-- THIS IS THE FIX. It allows modules with no submodules.
  },
})

// This schema defines a main module, which contains a list of submodules
const ModuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Each module name (like "MASTER") must be unique
  },
  srno: {
    type: Number,
  },
  submodules: [SubmoduleSchema], // An array of the submodules defined above
})

module.exports = mongoose.model('Module', ModuleSchema)

const mongoose = require('mongoose');
const WagesSheetSchema = new mongoose.Schema({
  tableName: String,
  client: String,
  siteName: String,
  clientCode: String,
  monthYear: String,
  uploadedAt: String, // store date/time as string for easier UI display
  filePath: String,   // saved file path/name for download
  status: { type: String, default: "pending" }
});
module.exports = mongoose.model('WagesSheet', WagesSheetSchema);

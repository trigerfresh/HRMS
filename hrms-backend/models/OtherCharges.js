const mongoose = require("mongoose");

const OtherChargesSchema = new mongoose.Schema({
  // Define this for clarity
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SiteDetail",
  },
  typeOfServ: String,
  chargesType: String,
  charges: { type: Number, default: 0 },
  calcOn: String,
  calcOperation: String,
  amountToCompare: String,
  active: { type: Number, default: 0 },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  created_on: { type: Date, default: Date.now },
  modified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  modified_on: { type: Date },
  disabled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  disabled_on: { type: Date },
});

module.exports = mongoose.model("OtherCharges", OtherChargesSchema);

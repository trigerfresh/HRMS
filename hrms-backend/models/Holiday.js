const mongoose = require("mongoose");

const HolidaySchema = new mongoose.Schema({
  state: { type: String, required: true },
  rank: { type: String, default: "All" },
  holidays: [
    {
      name: { type: String, required: true },
      date: { type: Date, required: true },
      image: { type: String }, // Store image filename/path if needed
    },
  ],
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

module.exports = mongoose.model("Holiday", HolidaySchema);

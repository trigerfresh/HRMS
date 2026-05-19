const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware"); // Surakshe sathi middleware import kara
const { addWORates } = require("../controllers/woRateChartController");

// router.get("/", authMiddleware);
// router.post("/", authMiddleware, addWORates);

module.exports = router;

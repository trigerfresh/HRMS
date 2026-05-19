// hrms-backend/routes/branchRoutes.js (Full Updated Code)
const express = require("express");
const router = express.Router();
const vendorsMasterController = require("../controllers/vendorsMasterController");
const authMiddleware = require("../middleware/authMiddleware");

// Full CRUD, Search, and Export routes
router.get("/", vendorsMasterController.getVendors);
router.get("/searchVendors", vendorsMasterController.searchVendors);
router.get(
  "/export",
  authMiddleware,
  vendorsMasterController.exportVendorsToExcel
);

router.post("/", authMiddleware, vendorsMasterController.createVendor);
router.put("/:id", authMiddleware, vendorsMasterController.updateVendors);
router.delete("/:id", authMiddleware, vendorsMasterController.deleteVendors);

module.exports = router;

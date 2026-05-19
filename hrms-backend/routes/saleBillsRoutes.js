const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const saleBillsController = require("../controllers/saleBillsController");

router.get(
  "/fetchInvoiceNo",
  authMiddleware,
  saleBillsController.getSaleBillInvoiceNo,
);
router.get("/", authMiddleware, saleBillsController.getSaleBills);
router.get(
  "/export",
  authMiddleware,
  saleBillsController.exportSaleBillsToExcel,
);
router.post("/", authMiddleware, saleBillsController.createSaleBill);
router.post("/receiveAmt", authMiddleware, saleBillsController.receiveAmt);
router.get("/:billId", authMiddleware, saleBillsController.getSaleBillById);
router.put("/:id", authMiddleware, saleBillsController.updateSaleBill);
router.delete("/:id", authMiddleware, saleBillsController.deleteSaleBill);

module.exports = router;

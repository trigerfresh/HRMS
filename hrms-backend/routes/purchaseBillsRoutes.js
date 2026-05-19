const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const purchaseBillsController = require("../controllers/purchaseBillsController");

router.get(
  "/fetchInvoiceNo",
  authMiddleware,
  purchaseBillsController.getPurchaseBillInvoiceNo,
);
router.get("/", authMiddleware, purchaseBillsController.getPurchaseBills);
router.post("/", authMiddleware, purchaseBillsController.createPurchaseBill);
router.get(
  "/export",
  authMiddleware,
  purchaseBillsController.exportPurchaseBillsToExcel,
);
router.post("/payAmt", authMiddleware, purchaseBillsController.payAmt);
router.get(
  "/:billId",
  authMiddleware,
  purchaseBillsController.getPurchaseBillById,
);
router.put("/:id", authMiddleware, purchaseBillsController.updatePurchaseBill);
router.delete(
  "/:id",
  authMiddleware,
  purchaseBillsController.deletePurchaseBill,
);

module.exports = router;

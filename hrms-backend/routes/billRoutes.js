const express = require("express");
const router = express.Router();
const billController = require("../controllers/billController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, billController.billsList);
router.get("/getDataByInvNo", authMiddleware, billController.billByInvNo);
// router.get("/export", authMiddleware, billController.billByInvNo);
router.get(
  "/getInvoiceData",
  authMiddleware,
  billController.invoiceDataByInvNo
);
router.post("/receive-payment", authMiddleware, billController.receivePayment);
router.get(
  "/payment-history/:billId",
  authMiddleware,
  billController.getPaymentHistory
);
router.delete(
  "/del-payment-history/:id",
  authMiddleware,
  billController.deletePaymentHist
);
router.delete("/del-bill", authMiddleware, billController.deleteBill);
router.post("/invoice-change", authMiddleware, billController.updateInvoice);
router.post("/save-new-bill", authMiddleware, billController.saveNewBill);
router.post(
  "/save-new-transp-bill",
  authMiddleware,
  billController.saveNewTranspBill
);
router.put("/update-bill", authMiddleware, billController.updateNewBill);
router.put(
  "/update-transp-bill",
  authMiddleware,
  billController.updateTranspNewBill
);

module.exports = router;

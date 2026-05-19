const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const debitNoteController = require("../controllers/debitNoteController");

router.get(
  "/fetchInvoiceNo",
  authMiddleware,
  debitNoteController.getDebitNoteInvoiceNo,
);
router.get("/", authMiddleware, debitNoteController.getDebitNote);
router.get(
  "/export",
  authMiddleware,
  debitNoteController.exportDebitNoteToExcel,
);
router.post("/", authMiddleware, debitNoteController.createDebitNote);
router.get("/:noteId", authMiddleware, debitNoteController.getDebitNoteById);
router.put("/:id", authMiddleware, debitNoteController.updateDebitNote);
router.delete("/:id", authMiddleware, debitNoteController.deleteDebitNote);

module.exports = router;

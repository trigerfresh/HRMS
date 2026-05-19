const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const creditNoteController = require("../controllers/creditNoteController");

router.get(
  "/fetchInvoiceNo",
  authMiddleware,
  creditNoteController.getCreditNoteInvoiceNo,
);
router.get("/", authMiddleware, creditNoteController.getCreditNote);
router.get(
  "/export",
  authMiddleware,
  creditNoteController.exportCreditNoteToExcel,
);
router.post("/", authMiddleware, creditNoteController.createCreditNote);
router.get("/:noteId", authMiddleware, creditNoteController.getCreditNoteById);
router.put("/:id", authMiddleware, creditNoteController.updateCreditNote);
router.delete("/:id", authMiddleware, creditNoteController.deleteCreditNote);

module.exports = router;

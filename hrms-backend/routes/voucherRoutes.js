const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucherController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", voucherController.listVouchers); // ?status=approved|pending|cancelled
router.post("/", voucherController.createVoucher);
router.put("/:id", voucherController.updateVoucher);
router.delete("/:id", voucherController.deleteVoucher);
router.put("/:id/status", voucherController.updateVoucherStatus);
router.post("/bulk-upload", upload.single('file'), voucherController.bulkUploadVouchers);
router.get("/template/download", voucherController.downloadTemplate);

module.exports = router;

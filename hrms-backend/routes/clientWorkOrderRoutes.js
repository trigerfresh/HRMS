const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware"); // Your JWT auth middleware
const clientWorkOrderController = require("../controllers/clientWorkOrderController");

router.get(
  "/",
  authMiddleware,
  clientWorkOrderController.getAllClientWorkOrders,
);
router.get(
  "/:id",
  authMiddleware,
  clientWorkOrderController.getSingleClientWorkOrder,
);
// router.get(
//   "/:clientId",
//   authMiddleware,
//   clientWorkOrderController.getAllWorkOrdersByClientId,
// );
router.post(
  "/",
  authMiddleware,
  clientWorkOrderController.createClientWorkOrder,
);
router.put(
  "/single/",
  authMiddleware,
  clientWorkOrderController.updateSingleClientWorkOrder,
);
router.put(
  "/status/:id",
  authMiddleware,
  clientWorkOrderController.updateClientWorkOrderStatus,
);
router.put(
  "/:id",
  authMiddleware,
  clientWorkOrderController.updateClientWorkOrder,
);
router.delete(
  "/:id",
  authMiddleware,
  clientWorkOrderController.deleteWorkOrderItem,
);

module.exports = router;

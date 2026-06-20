const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");

router.get("/admin/orders", adminController.getOrders);
router.get("/admin/orders/history", adminController.getHistory);
router.get("/admin/tables/open", adminController.getOpenTables);

router.patch("/admin/orders/:id/status", adminController.updateOrderStatus);
router.patch("/admin/orders/:id/cancel", adminController.cancelOrder);

router.patch("/admin/tables/:tableNumber/close", adminController.closeTable);
router.patch("/admin/tables/:tableNumber/pay", adminController.payTable);

module.exports = router;
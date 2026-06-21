const express = require("express");
const router = express.Router();
const dangerController = require("../controllers/danger.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post(
  "/admin/danger/reset-orders",
  authMiddleware,
  dangerController.resetOrders
);

router.post(
  "/admin/danger/reset-all",
  authMiddleware,
  dangerController.resetAll
);

module.exports = router;
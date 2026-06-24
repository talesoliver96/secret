const express = require("express");
const router = express.Router();

const ordersController = require("../controllers/orders.controller");

router.post("/orders", ordersController.createOrder);
router.get("/public/my-orders", ordersController.getCustomerOrdersByPhone);

module.exports = router;
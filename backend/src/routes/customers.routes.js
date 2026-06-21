const express = require("express");
const router = express.Router();

const customersController = require("../controllers/customers.controller");

router.get("/admin/customers", customersController.getCustomers);
router.patch("/admin/customers/:id", customersController.updateCustomer);
router.delete("/admin/customers/:id", customersController.deleteCustomer);
router.get("/admin/customers/:id/orders", customersController.getCustomerOrders);

module.exports = router;
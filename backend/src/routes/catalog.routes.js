const express = require("express");
const router = express.Router();

const catalogController = require("../controllers/catalog.controller");

router.get("/admin/categories", catalogController.getCategories);
router.post("/admin/categories", catalogController.createCategory);
router.patch("/admin/categories/:id", catalogController.updateCategory);
router.delete("/admin/categories/:id", catalogController.deleteCategory);

router.get("/admin/products", catalogController.getProducts);
router.post("/admin/products", catalogController.createProduct);
router.patch("/admin/products/:id", catalogController.updateProduct);
router.delete("/admin/products/:id", catalogController.deleteProduct);

module.exports = router;
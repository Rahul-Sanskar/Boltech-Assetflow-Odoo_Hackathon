const express = require("express");
const { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } = require("../controllers/category.controller");
const router = express.Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.post("/", createCategory);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;

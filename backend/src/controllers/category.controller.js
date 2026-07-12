const prisma = require("../config/db");

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { assets: true } } }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: Number(req.params.id) },
      include: { assets: true }
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, customFields } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const category = await prisma.category.create({
      data: { name, customFields }
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, customFields } = req.body;
    const data = {};

    if (name) data.name = name;
    if (customFields !== undefined) data.customFields = customFields;

    const category = await prisma.category.update({
      where: { id: Number(req.params.id) },
      data
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await prisma.category.delete({
      where: { id: Number(req.params.id) }
    });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { assets: true } } }
  });

  return sendSuccess(res, { message: "Categories retrieved", data: categories });
});

exports.getCategoryById = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: Number(req.params.id) },
    include: { assets: true }
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return sendSuccess(res, { message: "Category retrieved", data: category });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, customFields } = req.body;

  const category = await prisma.category.create({
    data: { name, customFields }
  });

  return sendSuccess(res, { statusCode: 201, message: "Category created", data: category });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const { name, customFields } = req.body;
  const data = {};

  if (name) data.name = name;
  if (customFields !== undefined) data.customFields = customFields;

  const category = await prisma.category.update({
    where: { id: Number(req.params.id) },
    data
  });

  return sendSuccess(res, { message: "Category updated", data: category });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  await prisma.category.delete({
    where: { id: Number(req.params.id) }
  });

  return sendSuccess(res, { message: "Category deleted successfully", data: null });
});

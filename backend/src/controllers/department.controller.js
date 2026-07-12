const prisma = require("../config/db");

exports.getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        head: true,
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        _count: { select: { employees: true, assets: true } }
      }
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        head: true,
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        employees: true,
        assets: true
      }
    });

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.json(department);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, parentId, headId } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const department = await prisma.department.create({
      data: {
        name,
        parentId: parentId ? Number(parentId) : null,
        headId: headId ? Number(headId) : null
      }
    });

    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { name, status, parentId, headId } = req.body;
    const data = {};

    if (name) data.name = name;
    if (status) data.status = status;
    if (parentId !== undefined) data.parentId = parentId ? Number(parentId) : null;
    if (headId !== undefined) data.headId = headId ? Number(headId) : null;

    const department = await prisma.department.update({
      where: { id: Number(req.params.id) },
      data
    });

    res.json(department);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    await prisma.department.delete({
      where: { id: Number(req.params.id) }
    });
    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

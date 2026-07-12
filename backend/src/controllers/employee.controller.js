const prisma = require("../config/db");

exports.getEmployees = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        department: { select: { id: true, name: true } },
        user: { select: { id: true, role: true, status: true } },
        _count: { select: { allocations: true, bookings: true } }
      }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        department: true,
        user: { select: { id: true, role: true, status: true } },
        allocations: { include: { asset: true } },
        bookings: { include: { asset: true } }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { name, email, departmentId, userId } = req.body;

    if (!name || !email || !departmentId) {
      return res.status(400).json({ error: "Name, email and departmentId are required" });
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        departmentId: Number(departmentId),
        userId: userId ? Number(userId) : null
      }
    });

    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { name, email, status, departmentId } = req.body;
    const data = {};

    if (name) data.name = name;
    if (email) data.email = email;
    if (status) data.status = status;
    if (departmentId) data.departmentId = Number(departmentId);

    const employee = await prisma.employee.update({
      where: { id: Number(req.params.id) },
      data
    });

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    await prisma.employee.delete({
      where: { id: Number(req.params.id) }
    });
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

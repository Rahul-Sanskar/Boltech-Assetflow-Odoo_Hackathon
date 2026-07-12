const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

exports.signup = async (req, res) => {
  try {
    const { name, email, password, departmentId } = req.body;

    if (!name || !email || !password || !departmentId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    const dept = await prisma.department.findUnique({
      where: { id: Number(departmentId) }
    });

    if (!dept) {
      return res.status(404).json({ error: "Department not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "EMPLOYEE"
        }
      });

      const employee = await tx.employee.create({
        data: {
          name,
          email,
          departmentId: Number(departmentId),
          userId: user.id
        }
      });

      return { user, employee };
    });

    const token = jwt.sign({ id: result.user.id, role: result.user.role }, JWT_SECRET, {
      expiresIn: "24h"
    });

    const { password: _, ...userWithoutPassword } = result.user;

    res.status(201).json({
      user: userWithoutPassword,
      employee: result.employee,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "24h"
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const prisma = require("../config/db");

exports.getAuditCycles = async (req, res) => {
  try {
    const cycles = await prisma.auditCycle.findMany({
      include: {
        department: { select: { id: true, name: true } },
        assignments: { include: { auditor: { select: { id: true, name: true } } } },
        _count: { select: { items: true } }
      },
      orderBy: { startDate: "desc" }
    });
    res.json(cycles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAuditCycleById = async (req, res) => {
  try {
    const cycle = await prisma.auditCycle.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        department: true,
        assignments: { include: { auditor: { select: { id: true, name: true } } } },
        items: { include: { asset: true } }
      }
    });

    if (!cycle) {
      return res.status(404).json({ error: "Audit cycle not found" });
    }

    res.json(cycle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createAuditCycle = async (req, res) => {
  try {
    const { name, scope, departmentId, location, startDate, endDate } = req.body;

    if (!name || !scope || !startDate || !endDate) {
      return res.status(400).json({ error: "name, scope, startDate and endDate are required" });
    }

    const cycle = await prisma.auditCycle.create({
      data: {
        name,
        scope,
        departmentId: departmentId ? Number(departmentId) : null,
        location: location || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    });

    res.status(201).json(cycle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.assignAuditor = async (req, res) => {
  try {
    const { auditorId } = req.body;
    const auditCycleId = Number(req.params.id);

    if (!auditorId) {
      return res.status(400).json({ error: "auditorId is required" });
    }

    const assignment = await prisma.auditAssignment.create({
      data: {
        auditCycleId,
        auditorId: Number(auditorId)
      }
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addAuditItem = async (req, res) => {
  try {
    const { assetId, result, notes } = req.body;
    const auditCycleId = Number(req.params.id);

    if (!assetId) {
      return res.status(400).json({ error: "assetId is required" });
    }

    const item = await prisma.auditItem.create({
      data: {
        auditCycleId,
        assetId: Number(assetId),
        result: result || null,
        notes: notes || null
      }
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAuditItem = async (req, res) => {
  try {
    const { result, notes } = req.body;

    const item = await prisma.auditItem.update({
      where: { id: Number(req.params.itemId) },
      data: {
        result: result || undefined,
        notes: notes !== undefined ? notes : undefined
      }
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAuditCycle = async (req, res) => {
  try {
    const { status } = req.body;

    const cycle = await prisma.auditCycle.update({
      where: { id: Number(req.params.id) },
      data: { status }
    });

    res.json(cycle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

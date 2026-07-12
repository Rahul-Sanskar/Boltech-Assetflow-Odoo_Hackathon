const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { transferListScope, isManager } = require("../utils/scope");

exports.getTransfers = asyncHandler(async (req, res) => {
  const transfers = await prisma.transferRequest.findMany({
    where: transferListScope(req.user),
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      requestedBy: { select: { id: true, name: true } }
    }
  });

  return sendSuccess(res, { message: "Transfers retrieved", data: transfers });
});

exports.getTransferById = asyncHandler(async (req, res) => {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: Number(req.params.id) },
    include: { asset: true, requestedBy: true }
  });

  if (!transfer) {
    throw new AppError("Transfer request not found", 404);
  }

  return sendSuccess(res, { message: "Transfer retrieved", data: transfer });
});

exports.createTransfer = asyncHandler(async (req, res) => {
  const { assetId, requestedById } = req.body;

  const transfer = await prisma.transferRequest.create({
    data: {
      assetId: Number(assetId),
      requestedById: Number(requestedById)
    }
  });

  return sendSuccess(res, { statusCode: 201, message: "Transfer request created", data: transfer });
});

exports.approveTransfer = asyncHandler(async (req, res) => {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: Number(req.params.id) },
    include: { asset: true, requestedBy: true }
  });

  if (!transfer || transfer.status !== "Requested") {
    throw new AppError("Transfer not found or already processed", 400);
  }

  if (isManager(req.user)) {
    const inScope =
      transfer.asset.departmentId === req.user.departmentId ||
      transfer.requestedBy.departmentId === req.user.departmentId;
    if (!inScope) {
      throw new AppError("Transfer is outside your department scope", 403);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.transferRequest.update({
      where: { id: transfer.id },
      data: { status: "Approved", approvedDate: new Date() }
    });

    await tx.asset.update({
      where: { id: transfer.assetId },
      data: { employeeId: transfer.requestedById, status: "Allocated" }
    });

    return updated;
  });

  return sendSuccess(res, { message: "Transfer approved", data: result });
});

exports.rejectTransfer = asyncHandler(async (req, res) => {
  const { rejectedReason } = req.body;

  const transfer = await prisma.transferRequest.findUnique({
    where: { id: Number(req.params.id) },
    include: { asset: true, requestedBy: true }
  });

  if (!transfer) {
    throw new AppError("Transfer request not found", 404);
  }

  if (isManager(req.user)) {
    const inScope =
      transfer.asset.departmentId === req.user.departmentId ||
      transfer.requestedBy.departmentId === req.user.departmentId;
    if (!inScope) {
      throw new AppError("Transfer is outside your department scope", 403);
    }
  }

  const updated = await prisma.transferRequest.update({
    where: { id: transfer.id },
    data: {
      status: "Rejected",
      rejectedReason: rejectedReason || null
    }
  });

  return sendSuccess(res, { message: "Transfer rejected", data: updated });
});

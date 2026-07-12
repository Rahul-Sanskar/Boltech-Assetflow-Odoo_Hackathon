const prisma = require("../config/db");
const AppError = require("../utils/AppError");
const { isAdmin, isManager, isEmployee } = require("../utils/scope");

/**
 * Force employees to act as themselves on create payloads.
 * Managers/Admins may supply another employee id (further validated by scope).
 */
const enforceSelfAsOwner = (field) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  if (isEmployee(req.user)) {
    if (!req.user.employeeId) {
      return next(new AppError("No employee profile linked to this user", 403));
    }
    req.body[field] = req.user.employeeId;
  }

  next();
};

/**
 * Ensure a body employee reference is within the caller's allowed scope.
 */
const assertBodyEmployeeInScope = (field) => async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (isAdmin(req.user)) return next();

    const employeeId = Number(req.body[field]);
    if (!employeeId) {
      return next(new AppError(`${field} is required`, 400));
    }

    if (isEmployee(req.user)) {
      if (employeeId !== req.user.employeeId) {
        return next(new AppError("You can only act on your own employee profile", 403));
      }
      return next();
    }

    if (isManager(req.user)) {
      if (!req.user.departmentId) {
        return next(new AppError("No department assigned to this manager", 403));
      }
      const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
      if (!employee) {
        return next(new AppError("Employee not found", 404));
      }
      if (employee.departmentId !== req.user.departmentId) {
        return next(new AppError("Employee is outside your department scope", 403));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Ensure an asset (from body.assetId or loaded resource) is in manager department.
 */
const assertBodyAssetInScope = (field = "assetId") => async (req, res, next) => {
  try {
    if (!req.user || isAdmin(req.user)) return next();

    const assetId = Number(req.body[field]);
    if (!assetId) {
      return next(new AppError(`${field} is required`, 400));
    }

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return next(new AppError("Asset not found", 404));
    }

    if (isManager(req.user)) {
      if (!req.user.departmentId || asset.departmentId !== req.user.departmentId) {
        return next(new AppError("Asset is outside your department scope", 403));
      }
    }

    if (isEmployee(req.user)) {
      const sameDept = asset.departmentId === req.user.departmentId;
      const isHolder = asset.employeeId === req.user.employeeId;
      if (!sameDept && !isHolder && !asset.isBookable) {
        return next(new AppError("You do not have access to this asset", 403));
      }
    }

    req.scopedAsset = asset;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Generic resource access check by id param.
 * options:
 *  - model: prisma model key
 *  - param: route param name (default "id")
 *  - include: prisma include
 *  - getOwnerEmployeeId(record)
 *  - getDepartmentId(record)
 *  - getOwnerUserId(record) — for notifications
 *  - allowAssignedAuditor — for audit item updates
 */
const requireResourceAccess = (options) => async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (isAdmin(req.user)) {
      return next();
    }

    const {
      model,
      param = "id",
      include,
      getOwnerEmployeeId,
      getDepartmentId,
      getOwnerUserId
    } = options;

    const id = Number(req.params[param]);
    if (!id) {
      return next(new AppError("Invalid resource id", 400));
    }

    const record = await prisma[model].findUnique({
      where: { id },
      include
    });

    if (!record) {
      return next(new AppError("Resource not found", 404));
    }

    if (isEmployee(req.user)) {
      if (getOwnerUserId) {
        if (getOwnerUserId(record) !== req.user.id) {
          return next(new AppError("You do not have access to this resource", 403));
        }
      } else if (getOwnerEmployeeId) {
        if (getOwnerEmployeeId(record) !== req.user.employeeId) {
          return next(new AppError("You do not have access to this resource", 403));
        }
      } else {
        return next(new AppError("You do not have access to this resource", 403));
      }
    }

    if (isManager(req.user)) {
      if (!req.user.departmentId) {
        return next(new AppError("No department assigned to this manager", 403));
      }

      let allowed = false;

      if (getDepartmentId) {
        const deptId = getDepartmentId(record);
        if (deptId === req.user.departmentId) allowed = true;
      }

      if (!allowed && getOwnerEmployeeId) {
        const ownerEmpId = getOwnerEmployeeId(record);
        if (ownerEmpId) {
          const owner = await prisma.employee.findUnique({ where: { id: ownerEmpId } });
          if (owner && owner.departmentId === req.user.departmentId) allowed = true;
        }
      }

      if (!allowed && getOwnerUserId && getOwnerUserId(record) === req.user.id) {
        allowed = true;
      }

      if (!allowed) {
        return next(new AppError("Resource is outside your department scope", 403));
      }
    }

    req.resource = record;
    next();
  } catch (error) {
    next(error);
  }
};

/** Ensure manager cannot write assets outside their department (by :id) */
const requireAssetDepartmentAccess = async (req, res, next) => {
  try {
    if (!req.user || isAdmin(req.user)) return next();

    const id = Number(req.params.id);
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return next(new AppError("Asset not found", 404));
    }

    if (isManager(req.user)) {
      if (asset.departmentId !== req.user.departmentId) {
        return next(new AppError("Asset is outside your department scope", 403));
      }
    }

    if (isEmployee(req.user)) {
      return next(new AppError("You do not have permission to modify assets", 403));
    }

    req.resource = asset;
    next();
  } catch (error) {
    next(error);
  }
};

/** On create/update asset, managers may only target their department */
const enforceManagerDepartmentOnBody = (field = "departmentId") => (req, res, next) => {
  if (!req.user || isAdmin(req.user)) return next();

  if (isManager(req.user)) {
    if (!req.user.departmentId) {
      return next(new AppError("No department assigned to this manager", 403));
    }
    if (req.body[field] !== undefined && Number(req.body[field]) !== req.user.departmentId) {
      return next(new AppError("You can only manage resources in your department", 403));
    }
    if (req.body[field] === undefined && req.method === "POST") {
      req.body[field] = req.user.departmentId;
    }
  }

  next();
};

/** Self-or-admin for user profile reads */
const requireSelfOrElevated = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (isAdmin(req.user) || isManager(req.user)) {
      if (isManager(req.user)) {
        const target = await prisma.user.findUnique({
          where: { id: Number(req.params.id) },
          include: { employee: true }
        });
        if (!target) {
          return next(new AppError("User not found", 404));
        }
        if (target.employee && target.employee.departmentId !== req.user.departmentId && target.id !== req.user.id) {
          return next(new AppError("User is outside your department scope", 403));
        }
      }
      return next();
    }

    if (Number(req.params.id) !== req.user.id) {
      return next(new AppError("You can only access your own profile", 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

const requireSelfEmployeeOrElevated = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (isAdmin(req.user)) return next();

    const employee = await prisma.employee.findUnique({
      where: { id: Number(req.params.id) }
    });
    if (!employee) {
      return next(new AppError("Employee not found", 404));
    }

    if (isManager(req.user)) {
      if (employee.departmentId !== req.user.departmentId) {
        return next(new AppError("Employee is outside your department scope", 403));
      }
      return next();
    }

    if (employee.id !== req.user.employeeId) {
      return next(new AppError("You can only access your own employee profile", 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enforceSelfAsOwner,
  assertBodyEmployeeInScope,
  assertBodyAssetInScope,
  requireResourceAccess,
  requireAssetDepartmentAccess,
  enforceManagerDepartmentOnBody,
  requireSelfOrElevated,
  requireSelfEmployeeOrElevated
};

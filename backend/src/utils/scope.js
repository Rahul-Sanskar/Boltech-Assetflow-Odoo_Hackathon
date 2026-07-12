/**
 * Build Prisma where clauses based on authenticated user role.
 * ADMIN → unrestricted
 * MANAGER → department-scoped
 * EMPLOYEE → own records only
 */

const isAdmin = (user) => user?.role === "ADMIN";
const isManager = (user) => user?.role === "MANAGER";
const isEmployee = (user) => user?.role === "EMPLOYEE";

const mergeWhere = (base = {}, extra = {}) => {
  const baseKeys = Object.keys(base);
  const extraKeys = Object.keys(extra);
  if (baseKeys.length === 0) return extra;
  if (extraKeys.length === 0) return base;
  return { AND: [base, extra] };
};

/** Assets: manager → own dept; employee → own dept (read) or held by self */
const assetListScope = (user) => {
  if (isAdmin(user)) return {};
  if (isManager(user)) return { departmentId: user.departmentId };
  return {
    OR: [
      { departmentId: user.departmentId },
      { employeeId: user.employeeId }
    ]
  };
};

const assetDepartmentScope = (user) => {
  if (isAdmin(user)) return {};
  return { departmentId: user.departmentId };
};

/** Allocations */
const allocationListScope = (user) => {
  if (isAdmin(user)) return {};
  if (isManager(user)) {
    return {
      OR: [
        { employee: { departmentId: user.departmentId } },
        { asset: { departmentId: user.departmentId } }
      ]
    };
  }
  return { employeeId: user.employeeId };
};

/** Bookings */
const bookingListScope = (user) => {
  if (isAdmin(user)) return {};
  if (isManager(user)) {
    return {
      OR: [
        { employee: { departmentId: user.departmentId } },
        { asset: { departmentId: user.departmentId } }
      ]
    };
  }
  return { employeeId: user.employeeId };
};

/** Transfers */
const transferListScope = (user) => {
  if (isAdmin(user)) return {};
  if (isManager(user)) {
    return {
      OR: [
        { requestedBy: { departmentId: user.departmentId } },
        { asset: { departmentId: user.departmentId } }
      ]
    };
  }
  return { requestedById: user.employeeId };
};

/** Maintenance */
const maintenanceListScope = (user) => {
  if (isAdmin(user)) return {};
  if (isManager(user)) {
    return {
      OR: [
        { requestedBy: { departmentId: user.departmentId } },
        { asset: { departmentId: user.departmentId } }
      ]
    };
  }
  return { requestedById: user.employeeId };
};

/** Employees */
const employeeListScope = (user) => {
  if (isAdmin(user)) return {};
  if (isManager(user)) return { departmentId: user.departmentId };
  return { id: user.employeeId };
};

/** Users */
const userListScope = (user) => {
  if (isAdmin(user)) return {};
  if (isManager(user)) return { employee: { departmentId: user.departmentId } };
  return { id: user.id };
};

/** Departments */
const departmentListScope = (user) => {
  if (isAdmin(user)) return {};
  if (isManager(user) || isEmployee(user)) return { id: user.departmentId };
  return { id: -1 };
};

/** Audits */
const auditListScope = (user) => {
  if (isAdmin(user)) return {};
  if (isManager(user)) {
    return {
      OR: [
        { departmentId: user.departmentId },
        { departmentId: null },
        { assignments: { some: { auditorId: user.id } } }
      ]
    };
  }
  return { assignments: { some: { auditorId: user.id } } };
};

module.exports = {
  isAdmin,
  isManager,
  isEmployee,
  mergeWhere,
  assetListScope,
  assetDepartmentScope,
  allocationListScope,
  bookingListScope,
  transferListScope,
  maintenanceListScope,
  employeeListScope,
  userListScope,
  departmentListScope,
  auditListScope
};

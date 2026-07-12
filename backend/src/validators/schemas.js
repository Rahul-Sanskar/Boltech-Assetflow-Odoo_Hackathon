const { z } = require("zod");

const idParam = z.object({
  id: z.coerce.number().int().positive()
});

const itemIdParam = z.object({
  id: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive()
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required")
});

const signupBody = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  departmentId: z.coerce.number().int().positive()
});

const updateUserBody = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
  status: z.string().min(1).optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

const createEmployeeBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  departmentId: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive().optional().nullable()
});

const updateEmployeeBody = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  status: z.string().min(1).optional(),
  departmentId: z.coerce.number().int().positive().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

const createDepartmentBody = z.object({
  name: z.string().min(1),
  parentId: z.coerce.number().int().positive().optional().nullable(),
  headId: z.coerce.number().int().positive().optional().nullable()
});

const updateDepartmentBody = z.object({
  name: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  parentId: z.coerce.number().int().positive().optional().nullable(),
  headId: z.coerce.number().int().positive().optional().nullable()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

const createCategoryBody = z.object({
  name: z.string().min(1),
  customFields: z.string().optional().nullable()
});

const updateCategoryBody = z.object({
  name: z.string().min(1).optional(),
  customFields: z.string().optional().nullable()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

const createAssetBody = z.object({
  name: z.string().min(1),
  assetTag: z.string().min(1),
  serialNumber: z.string().optional().nullable(),
  condition: z.string().optional(),
  location: z.string().optional().nullable(),
  acquisitionDate: z.string().datetime().or(z.string().min(1)).optional().nullable(),
  acquisitionCost: z.coerce.number().optional().nullable(),
  photo: z.string().optional().nullable(),
  isBookable: z.boolean().optional(),
  departmentId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive()
});

const updateAssetBody = z.object({
  name: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  condition: z.string().optional(),
  location: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  isBookable: z.boolean().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

const assetQuery = z.object({
  status: z.string().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional()
});

const allocateBody = z.object({
  assetId: z.coerce.number().int().positive(),
  employeeId: z.coerce.number().int().positive(),
  expectedReturn: z.string().datetime().or(z.string().min(1)).optional().nullable()
});

const returnBody = z.object({
  returnNotes: z.string().optional().nullable()
});

const createBookingBody = z.object({
  assetId: z.coerce.number().int().positive(),
  employeeId: z.coerce.number().int().positive(),
  startTime: z.string().min(1),
  endTime: z.string().min(1)
}).refine((data) => new Date(data.startTime) < new Date(data.endTime), {
  message: "startTime must be before endTime",
  path: ["endTime"]
});

const bookingQuery = z.object({
  status: z.string().optional(),
  assetId: z.coerce.number().int().positive().optional()
});

const createTransferBody = z.object({
  assetId: z.coerce.number().int().positive(),
  requestedById: z.coerce.number().int().positive()
});

const rejectTransferBody = z.object({
  rejectedReason: z.string().optional().nullable()
});

const createMaintenanceBody = z.object({
  assetId: z.coerce.number().int().positive(),
  requestedById: z.coerce.number().int().positive(),
  description: z.string().min(1),
  priority: z.string().optional(),
  photo: z.string().optional().nullable()
});

const updateMaintenanceBody = z.object({
  status: z.string().min(1).optional(),
  technicianId: z.coerce.number().int().positive().optional().nullable(),
  resolvedDate: z.string().optional().nullable()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

const maintenanceQuery = z.object({
  status: z.string().optional(),
  priority: z.string().optional()
});

const createAuditBody = z.object({
  name: z.string().min(1),
  scope: z.string().min(1),
  departmentId: z.coerce.number().int().positive().optional().nullable(),
  location: z.string().optional().nullable(),
  startDate: z.string().min(1),
  endDate: z.string().min(1)
});

const updateAuditBody = z.object({
  status: z.string().min(1)
});

const assignAuditorBody = z.object({
  auditorId: z.coerce.number().int().positive()
});

const addAuditItemBody = z.object({
  assetId: z.coerce.number().int().positive(),
  result: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

const updateAuditItemBody = z.object({
  result: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

const createNotificationBody = z.object({
  userId: z.coerce.number().int().positive(),
  type: z.string().min(1),
  message: z.string().min(1)
});

const activityLogQuery = z.object({
  entity: z.string().optional(),
  userId: z.coerce.number().int().positive().optional()
});

module.exports = {
  idParam,
  itemIdParam,
  loginBody,
  signupBody,
  updateUserBody,
  createEmployeeBody,
  updateEmployeeBody,
  createDepartmentBody,
  updateDepartmentBody,
  createCategoryBody,
  updateCategoryBody,
  createAssetBody,
  updateAssetBody,
  assetQuery,
  allocateBody,
  returnBody,
  createBookingBody,
  bookingQuery,
  createTransferBody,
  rejectTransferBody,
  createMaintenanceBody,
  updateMaintenanceBody,
  maintenanceQuery,
  createAuditBody,
  updateAuditBody,
  assignAuditorBody,
  addAuditItemBody,
  updateAuditItemBody,
  createNotificationBody,
  activityLogQuery
};

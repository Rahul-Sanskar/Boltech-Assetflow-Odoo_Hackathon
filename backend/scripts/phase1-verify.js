/**
 * Phase 1 verification suite — run with: node scripts/phase1-verify.js
 * Temporary verification harness (not a product feature).
 */
require("dotenv").config();
const http = require("http");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const prisma = require("../src/config/db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const results = [];
const logCapture = [];
const originalLog = console.log;

function pass(section, name, detail = "") {
  results.push({ section, name, ok: true, detail });
  originalLog(`  ✅ ${name}${detail ? " — " + detail : ""}`);
}

function fail(section, name, detail = "") {
  results.push({ section, name, ok: false, detail });
  originalLog(`  ❌ ${name}${detail ? " — " + detail : ""}`);
}

function assert(section, name, condition, detail = "") {
  if (condition) pass(section, name, detail);
  else fail(section, name, detail);
}

async function req(base, method, path, { body, token, headers = {} } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json, text };
}

function isSuccessShape(json) {
  return (
    json &&
    json.success === true &&
    typeof json.message === "string" &&
    Object.prototype.hasOwnProperty.call(json, "data")
  );
}

function isErrorShape(json) {
  return (
    json &&
    json.success === false &&
    typeof json.message === "string" &&
    Array.isArray(json.errors) &&
    !("stack" in json) &&
    !String(json.message).includes("at ") &&
    !textHasStack(json)
  );
}

function textHasStack(json) {
  const s = JSON.stringify(json);
  return s.includes("\\n    at ") || s.includes("Error:\n");
}

async function login(base, email, password) {
  const res = await req(base, "POST", "/api/auth/login", { body: { email, password } });
  return res;
}

async function main() {
  console.log = (...args) => {
    const line = args.map(String).join(" ");
    logCapture.push(line);
    originalLog(...args);
  };

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  originalLog(`\n=== Phase 1 Verification @ ${base} ===\n`);

  try {
    // Ensure seed-like baseline exists
    let adminLogin = await login(base, "admin@example.com", "adminpassword");
    if (adminLogin.status !== 200) {
      originalLog("Seeded admin missing — running prisma seed via require...");
      // fallback: create minimal if needed
      throw new Error("Seeded users not found. Run: npm run seed");
    }

    const adminToken = adminLogin.json.data.token;
    const managerLogin = await login(base, "manager@example.com", "managerpassword");
    const employeeLogin = await login(base, "employee@example.com", "employeepassword");
    const managerToken = managerLogin.json.data.token;
    const employeeToken = employeeLogin.json.data.token;
    const adminUser = adminLogin.json.data.user;
    const managerUser = managerLogin.json.data.user;
    const employeeUser = employeeLogin.json.data.user;

    // Resolve employee profiles & depts/assets from DB
    const adminEmp = await prisma.employee.findUnique({ where: { userId: adminUser.id } });
    const managerEmp = await prisma.employee.findUnique({ where: { userId: managerUser.id } });
    const employeeEmp = await prisma.employee.findUnique({ where: { userId: employeeUser.id } });
    const itDept = await prisma.department.findUnique({ where: { name: "IT" } });
    const hrDept = await prisma.department.findUnique({ where: { name: "HR" } });
    const itAsset = await prisma.asset.findFirst({ where: { departmentId: itDept.id } });
    const hrAsset = await prisma.asset.findFirst({ where: { departmentId: hrDept.id } });
    const categories = await prisma.category.findMany();

    // Prepare ownership fixtures (clean previous test fixtures)
    await prisma.notification.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.transferRequest.deleteMany({});
    await prisma.maintenanceRequest.deleteMany({});
    await prisma.allocation.deleteMany({});
    await prisma.asset.updateMany({ data: { status: "Available", employeeId: null } });

    // Make HR asset bookable for booking tests
    await prisma.asset.update({ where: { id: hrAsset.id }, data: { isBookable: true } });
    await prisma.asset.update({ where: { id: itAsset.id }, data: { isBookable: true } });

    const empBooking = await prisma.booking.create({
      data: {
        assetId: itAsset.id,
        employeeId: employeeEmp.id,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        status: "Upcoming"
      }
    });
    const mgrBooking = await prisma.booking.create({
      data: {
        assetId: hrAsset.id,
        employeeId: managerEmp.id,
        startTime: new Date(Date.now() + 10800000),
        endTime: new Date(Date.now() + 14400000),
        status: "Upcoming"
      }
    });

    const empAlloc = await prisma.allocation.create({
      data: { assetId: itAsset.id, employeeId: employeeEmp.id, status: "Allocated" }
    });
    await prisma.asset.update({
      where: { id: itAsset.id },
      data: { status: "Allocated", employeeId: employeeEmp.id }
    });

    // Use a second IT asset if available for manager alloc, else create temp HR allocation on hr asset
    const empMaint = await prisma.maintenanceRequest.create({
      data: {
        assetId: itAsset.id,
        requestedById: employeeEmp.id,
        description: "Employee maintenance",
        status: "Pending"
      }
    });
    const mgrMaint = await prisma.maintenanceRequest.create({
      data: {
        assetId: hrAsset.id,
        requestedById: managerEmp.id,
        description: "Manager maintenance",
        status: "Pending"
      }
    });

    const empTransfer = await prisma.transferRequest.create({
      data: { assetId: itAsset.id, requestedById: employeeEmp.id, status: "Requested" }
    });
    const mgrTransfer = await prisma.transferRequest.create({
      data: { assetId: hrAsset.id, requestedById: managerEmp.id, status: "Requested" }
    });

    const empNotif = await prisma.notification.create({
      data: { userId: employeeUser.id, type: "INFO", message: "Employee note" }
    });
    const mgrNotif = await prisma.notification.create({
      data: { userId: managerUser.id, type: "INFO", message: "Manager note" }
    });

    // ---------- STEP 2 JWT ----------
    originalLog("\n[JWT]");
    let r = await req(base, "GET", "/api/dashboard");
    assert("JWT", "No Authorization header → 401", r.status === 401 && isErrorShape(r.json), `status=${r.status}`);

    r = await req(base, "GET", "/api/dashboard", { token: "not-a-jwt" });
    assert("JWT", "Invalid JWT → 401", r.status === 401 && isErrorShape(r.json), `status=${r.status}`);

    const expired = jwt.sign({ id: adminUser.id, role: "ADMIN" }, JWT_SECRET, { expiresIn: -10 });
    r = await req(base, "GET", "/api/dashboard", { token: expired });
    assert("JWT", "Expired JWT → 401", r.status === 401 && isErrorShape(r.json), `status=${r.status} msg=${r.json.message}`);

    r = await fetch(base + "/api/dashboard", {
      headers: { Authorization: "Token abc" }
    }).then(async (res) => ({ status: res.status, json: await res.json() }));
    assert("JWT", "Malformed Bearer → 401", r.status === 401 && isErrorShape(r.json), `status=${r.status}`);

    r = await req(base, "GET", "/api/dashboard", { token: adminToken });
    assert("JWT", "Valid JWT → access granted", r.status === 200 && isSuccessShape(r.json), `status=${r.status}`);

    // Public vs protected sample
    r = await req(base, "POST", "/api/auth/login", { body: { email: "admin@example.com", password: "adminpassword" } });
    assert("JWT", "POST /auth/login public", r.status === 200);

    r = await req(base, "GET", "/api/assets");
    assert("JWT", "GET /assets requires auth", r.status === 401);

    // ---------- STEP 3 ROLE MATRIX ----------
    originalLog("\n[Authorization]");
    // ADMIN full access samples
    r = await req(base, "GET", "/api/departments", { token: adminToken });
    assert("Authorization", "ADMIN can list departments", r.status === 200 && isSuccessShape(r.json));
    r = await req(base, "GET", "/api/categories", { token: adminToken });
    assert("Authorization", "ADMIN can list categories", r.status === 200);
    r = await req(base, "GET", "/api/users", { token: adminToken });
    assert("Authorization", "ADMIN can list users", r.status === 200);
    r = await req(base, "POST", "/api/assets", {
      token: adminToken,
      body: {
        name: "Verify Asset",
        assetTag: `VF-${Date.now()}`,
        departmentId: itDept.id,
        categoryId: categories[0].id
      }
    });
    assert("Authorization", "ADMIN asset create", r.status === 201, `status=${r.status}`);
    const createdAssetId = r.json.data?.id;

    // MANAGER allowed
    r = await req(base, "GET", "/api/dashboard", { token: managerToken });
    assert("Authorization", "MANAGER dashboard", r.status === 200);
    r = await req(base, "POST", "/api/assets", {
      token: managerToken,
      body: {
        name: "HR Verify Asset",
        assetTag: `HR-${Date.now()}`,
        departmentId: hrDept.id,
        categoryId: categories[0].id
      }
    });
    assert("Authorization", "MANAGER asset create (own dept)", r.status === 201, `status=${r.status} ${r.json.message}`);
    const mgrCreatedAssetId = r.json.data?.id;

    r = await req(base, "POST", "/api/allocations", {
      token: managerToken,
      body: { assetId: mgrCreatedAssetId, employeeId: managerEmp.id }
    });
    assert("Authorization", "MANAGER allocation", r.status === 201 || r.status === 400, `status=${r.status} ${r.json.message}`);
    // if 400 because somehow unavailable, still role allowed (not 403)
    assert("Authorization", "MANAGER allocation not forbidden", r.status !== 403, `status=${r.status}`);

    r = await req(base, "PATCH", `/api/maintenance/${mgrMaint.id}`, {
      token: managerToken,
      body: { status: "In Progress" }
    });
    assert("Authorization", "MANAGER maintenance approval/update", r.status === 200, `status=${r.status}`);

    // MANAGER denied
    r = await req(base, "POST", "/api/departments", { token: managerToken, body: { name: `X-${Date.now()}` } });
    assert("Authorization", "MANAGER cannot create department", r.status === 403);
    r = await req(base, "POST", "/api/categories", { token: managerToken, body: { name: `C-${Date.now()}` } });
    assert("Authorization", "MANAGER cannot create category", r.status === 403);
    r = await req(base, "PATCH", `/api/users/${employeeUser.id}`, {
      token: managerToken,
      body: { role: "ADMIN" }
    });
    assert("Authorization", "MANAGER cannot promote users", r.status === 403);

    // EMPLOYEE allowed
    r = await req(base, "GET", "/api/dashboard", { token: employeeToken });
    assert("Authorization", "EMPLOYEE own dashboard", r.status === 200 && r.json.message.toLowerCase().includes("personal"));
    r = await req(base, "GET", `/api/bookings/${empBooking.id}`, { token: employeeToken });
    assert("Authorization", "EMPLOYEE own booking", r.status === 200);
    r = await req(base, "GET", `/api/maintenance/${empMaint.id}`, { token: employeeToken });
    assert("Authorization", "EMPLOYEE own maintenance", r.status === 200);
    r = await req(base, "GET", `/api/transfers/${empTransfer.id}`, { token: employeeToken });
    assert("Authorization", "EMPLOYEE own transfer", r.status === 200);

    // EMPLOYEE denied
    r = await req(base, "POST", "/api/assets", {
      token: employeeToken,
      body: { name: "Nope", assetTag: `N-${Date.now()}`, departmentId: itDept.id, categoryId: categories[0].id }
    });
    assert("Authorization", "EMPLOYEE cannot create asset", r.status === 403);
    r = await req(base, "POST", "/api/departments", { token: employeeToken, body: { name: `E-${Date.now()}` } });
    assert("Authorization", "EMPLOYEE cannot create department", r.status === 403);
    r = await req(base, "POST", "/api/categories", { token: employeeToken, body: { name: `EC-${Date.now()}` } });
    assert("Authorization", "EMPLOYEE cannot create category", r.status === 403);
    r = await req(base, "GET", "/api/users", { token: employeeToken });
    assert("Authorization", "EMPLOYEE cannot list users", r.status === 403);
    r = await req(base, "PATCH", `/api/maintenance/${empMaint.id}`, {
      token: employeeToken,
      body: { status: "Resolved" }
    });
    assert("Authorization", "EMPLOYEE cannot approve maintenance", r.status === 403);
    r = await req(base, "PATCH", `/api/transfers/${empTransfer.id}/approve`, { token: employeeToken });
    assert("Authorization", "EMPLOYEE cannot approve transfer", r.status === 403);

    // ---------- STEP 4 OWNERSHIP ----------
    originalLog("\n[Ownership]");
    r = await req(base, "GET", `/api/bookings/${mgrBooking.id}`, { token: employeeToken });
    assert("Ownership", "Employee cannot read other booking", r.status === 403, `status=${r.status}`);
    r = await req(base, "GET", `/api/maintenance/${mgrMaint.id}`, { token: employeeToken });
    assert("Ownership", "Employee cannot read other maintenance", r.status === 403, `status=${r.status}`);
    r = await req(base, "PATCH", `/api/notifications/${mgrNotif.id}/read`, { token: employeeToken });
    assert("Ownership", "Employee cannot read/mark other notification", r.status === 403, `status=${r.status}`);
    // Create allocation for manager on HR asset (return IT first if needed - separate alloc)
    const mgrAlloc = await prisma.allocation.create({
      data: { assetId: hrAsset.id, employeeId: managerEmp.id, status: "Allocated" }
    });
    r = await req(base, "GET", `/api/allocations/${mgrAlloc.id}`, { token: employeeToken });
    assert("Ownership", "Employee cannot read other allocation", r.status === 403, `status=${r.status}`);
    r = await req(base, "GET", `/api/transfers/${mgrTransfer.id}`, { token: employeeToken });
    assert("Ownership", "Employee cannot read other transfer", r.status === 403, `status=${r.status}`);

    // Employee can mark own notification
    r = await req(base, "PATCH", `/api/notifications/${empNotif.id}/read`, { token: employeeToken });
    assert("Ownership", "Employee can mark own notification", r.status === 200);

    // ---------- STEP 5 DEPARTMENT SCOPE ----------
    originalLog("\n[Department Scope]");
    r = await req(base, "GET", `/api/assets/${itAsset.id}`, { token: managerToken });
    assert("DepartmentScope", "Manager cannot get other-dept asset", r.status === 403, `status=${r.status}`);
    r = await req(base, "GET", `/api/assets/${hrAsset.id}`, { token: managerToken });
    assert("DepartmentScope", "Manager can get own-dept asset", r.status === 200);

    r = await req(base, "GET", `/api/employees/${employeeEmp.id}`, { token: managerToken });
    assert("DepartmentScope", "Manager cannot get other-dept employee", r.status === 403, `status=${r.status}`);
    r = await req(base, "GET", `/api/employees/${managerEmp.id}`, { token: managerToken });
    assert("DepartmentScope", "Manager can get own-dept employee", r.status === 200);

    r = await req(base, "GET", `/api/allocations/${empAlloc.id}`, { token: managerToken });
    assert("DepartmentScope", "Manager cannot get other-dept allocation", r.status === 403, `status=${r.status}`);

    r = await req(base, "GET", `/api/maintenance/${empMaint.id}`, { token: managerToken });
    assert("DepartmentScope", "Manager cannot get other-dept maintenance", r.status === 403, `status=${r.status}`);

    r = await req(base, "GET", `/api/transfers/${empTransfer.id}`, { token: managerToken });
    assert("DepartmentScope", "Manager cannot get other-dept transfer", r.status === 403, `status=${r.status}`);

    r = await req(base, "GET", "/api/dashboard", { token: managerToken });
    assert(
      "DepartmentScope",
      "Manager dashboard scoped",
      r.status === 200 && r.json.message.toLowerCase().includes("department"),
      r.json.message
    );

    r = await req(base, "GET", `/api/assets?departmentId=${itDept.id}`, { token: managerToken });
    assert("DepartmentScope", "Manager cannot query other dept assets", r.status === 403, `status=${r.status}`);

    r = await req(base, "GET", "/api/reports/assets-by-department", { token: managerToken });
    assert(
      "DepartmentScope",
      "Manager reports only own dept",
      r.status === 200 && Array.isArray(r.json.data) && r.json.data.every((d) => d.id === hrDept.id),
      JSON.stringify(r.json.data?.map((d) => d.id))
    );

    // Admin passes
    r = await req(base, "GET", `/api/assets/${itAsset.id}`, { token: adminToken });
    assert("DepartmentScope", "Admin can access any asset", r.status === 200);
    r = await req(base, "GET", `/api/employees/${managerEmp.id}`, { token: adminToken });
    assert("DepartmentScope", "Admin can access any employee", r.status === 200);

    // ---------- STEP 6 VALIDATION ----------
    originalLog("\n[Validation]");
    const invalidCases = [
      ["POST", "/api/auth/login", null, {}],
      ["POST", "/api/auth/signup", null, { email: "bad" }],
      ["POST", "/api/departments", adminToken, {}],
      ["POST", "/api/categories", adminToken, {}],
      ["POST", "/api/employees", adminToken, { name: "x" }],
      ["POST", "/api/assets", adminToken, { name: "x" }],
      ["POST", "/api/allocations", adminToken, {}],
      ["POST", "/api/bookings", adminToken, { assetId: 1 }],
      ["POST", "/api/transfers", adminToken, {}],
      ["POST", "/api/maintenance", adminToken, {}],
      ["POST", "/api/audits", adminToken, {}],
      ["PATCH", `/api/users/${employeeUser.id}`, adminToken, { role: "SUPERUSER" }],
      ["POST", "/api/notifications", adminToken, {}],
      ["PATCH", `/api/assets/${hrAsset.id}`, adminToken, {}]
    ];

    for (const [method, path, token, body] of invalidCases) {
      r = await req(base, method, path, { token, body });
      assert(
        "Validation",
        `${method} ${path} invalid → 400`,
        r.status === 400 && isErrorShape(r.json) && r.json.message === "Validation Failed",
        `status=${r.status} msg=${r.json.message}`
      );
    }

    // ---------- STEP 7 ERROR HANDLER ----------
    originalLog("\n[ErrorHandler]");
    r = await req(base, "GET", "/api/assets/999999", { token: adminToken });
    assert("ErrorHandler", "Not found uses error shape, no stack", r.status === 404 && isErrorShape(r.json) && !textHasStack(r.json));

    r = await req(base, "GET", "/api/no-such-route", { token: adminToken });
    assert("ErrorHandler", "Unknown route 404 standardized", r.status === 404 && isErrorShape(r.json));

    // Prisma unique conflict
    r = await req(base, "POST", "/api/categories", { token: adminToken, body: { name: "Laptops" } });
    assert(
      "ErrorHandler",
      "Prisma P2002 → 409 standardized",
      r.status === 409 && isErrorShape(r.json) && !textHasStack(r.json),
      `status=${r.status}`
    );

    r = await req(base, "GET", "/api/dashboard", { token: "garbage.token.value" });
    assert("ErrorHandler", "JWT error standardized 401", r.status === 401 && isErrorShape(r.json));

    // ---------- STEP 8 RESPONSE FORMAT ----------
    originalLog("\n[ResponseFormat]");
    r = await req(base, "GET", "/api/categories", { token: adminToken });
    assert("ResponseFormat", "Success shape categories", isSuccessShape(r.json));
    r = await req(base, "GET", "/api/assets", { token: adminToken });
    assert("ResponseFormat", "Success shape assets", isSuccessShape(r.json));
    r = await req(base, "POST", "/api/auth/login", { body: { email: "x", password: "y" } });
    assert("ResponseFormat", "Error shape validation", isErrorShape(r.json));

    // ---------- STEP 9 LOGGING ----------
    originalLog("\n[Logging]");
    const sampleLogs = logCapture.filter((l) => l.includes("] GET ") || l.includes("] POST "));
    assert("Logging", "Logs include method+endpoint+status+time", sampleLogs.some((l) => /\[.*\] (GET|POST|PATCH|DELETE) .+ user=.+ status=\d+ \d+ms/.test(l)), sampleLogs.slice(-1)[0] || "none");
    assert("Logging", "Logs include authenticated user id", sampleLogs.some((l) => /user=\d+/.test(l)));
    assert(
      "Logging",
      "Logs do not contain passwords",
      !logCapture.some((l) => /adminpassword|managerpassword|employeepassword/.test(l))
    );
    assert(
      "Logging",
      "Logs do not contain JWT tokens",
      !logCapture.some((l) => /Bearer eyJ|user=eyJ/.test(l)) && !sampleLogs.some((l) => l.includes(adminToken))
    );

    // ---------- STEP 10 REGRESSION ----------
    originalLog("\n[Regression]");
    r = await req(base, "POST", "/api/auth/login", {
      body: { email: "admin@example.com", password: "adminpassword" }
    });
    assert("Regression", "Login works", r.status === 200 && r.json.data?.token);

    // Signup with unique email
    const signupEmail = `verify_${Date.now()}@example.com`;
    r = await req(base, "POST", "/api/auth/signup", {
      body: {
        name: "Verify User",
        email: signupEmail,
        password: "password123",
        departmentId: itDept.id
      }
    });
    assert("Regression", "Signup works", r.status === 201 && r.json.data?.token, `status=${r.status} ${r.json.message}`);

    const endpoints = [
      ["GET", "/api/departments"],
      ["GET", "/api/categories"],
      ["GET", "/api/employees"],
      ["GET", "/api/assets"],
      ["GET", "/api/allocations"],
      ["GET", "/api/transfers"],
      ["GET", "/api/bookings"],
      ["GET", "/api/maintenance"],
      ["GET", "/api/dashboard"],
      ["GET", "/api/notifications"],
      ["GET", "/api/reports/assets-by-status"]
    ];
    for (const [method, path] of endpoints) {
      r = await req(base, method, path, { token: adminToken });
      assert("Regression", `${method} ${path}`, r.status === 200 && isSuccessShape(r.json), `status=${r.status}`);
    }

    // Cleanup created verify assets if present
    if (createdAssetId) {
      try {
        await prisma.asset.delete({ where: { id: createdAssetId } });
      } catch (_) {}
    }
  } catch (err) {
    originalLog("FATAL:", err);
    fail("Suite", "Fatal error", err.message);
  } finally {
    console.log = originalLog;
    await prisma.$disconnect();
    await new Promise((resolve) => server.close(resolve));
  }

  // Summary
  const sections = [
    "JWT",
    "Authorization",
    "Ownership",
    "DepartmentScope",
    "Validation",
    "ErrorHandler",
    "ResponseFormat",
    "Logging",
    "Regression"
  ];

  originalLog("\n\n## Phase 1 Verification Report\n");
  const sectionPass = {};
  for (const s of sections) {
    const items = results.filter((x) => x.section === s);
    sectionPass[s] = items.length > 0 && items.every((x) => x.ok);
  }

  const map = {
    JWT: "Authentication",
    Authorization: "Authorization",
    Ownership: "Ownership Checks",
    DepartmentScope: "Department Scope",
    Validation: "Validation",
    ErrorHandler: "Global Error Handling",
    ResponseFormat: "Response Format",
    Logging: "Logging",
    Regression: "Regression Testing"
  };

  for (const [key, label] of Object.entries(map)) {
    originalLog(`${label}\n${sectionPass[key] ? "✅ PASS" : "❌ FAIL"}\n`);
  }

  const overall = Object.values(sectionPass).every(Boolean);
  originalLog(`Overall Status\n${overall ? "PASS" : "FAIL"}\n`);

  const failures = results.filter((x) => !x.ok);
  if (failures.length) {
    originalLog("\n### Failures");
    for (const f of failures) {
      originalLog(`- [${f.section}] ${f.name}: ${f.detail}`);
    }
  }

  originalLog(`\nTotal: ${results.filter((x) => x.ok).length}/${results.length} checks passed`);
  process.exit(overall ? 0 : 1);
}

main();

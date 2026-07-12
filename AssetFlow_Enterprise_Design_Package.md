# ASSETFLOW

## Enterprise Asset & Resource Management System

### Complete Enterprise Design Package — Odoo Community Implementation

**Prepared for:** Odoo Hackathon Judging Panel **Prepared by:** AssetFlow Solution Architecture Team **Target Platform:** Odoo 17 Community Edition | PostgreSQL 15 **Document Classification:** Enterprise Architecture & Design Specification

---

**Design Philosophy Note (read first):** This package intentionally avoids microservices, Kafka, Kubernetes, Redis, GraphQL, and event-driven architecture. AssetFlow is designed as a **monolithic, modular Odoo application** — a set of custom Odoo addons (modules) that map directly onto Odoo's native ORM, views, security, and workflow engine. Every architectural decision below is justified against this constraint.

---

# PART 1 — PROJECT OVERVIEW

## 1\. Executive Summary

AssetFlow is a modular Enterprise Resource Planning (ERP) application, built as a set of native Odoo Community addons, that digitizes the full lifecycle of physical assets and shared resources for any organization — offices, schools, hospitals, factories, or agencies. It replaces spreadsheets and paper logs with structured master data (departments, categories, employees), a governed asset lifecycle, conflict-free allocation and booking engines, an approval-driven maintenance workflow, and a cyclical audit process — all surfaced through a real-time KPI dashboard and a unified notification/activity-log layer.

AssetFlow deliberately excludes purchasing, invoicing, and accounting. It is a **tracking and workflow system**, not a financial system, though it retains acquisition cost as a read-only reporting field for future integration with Odoo's native `account` and `purchase` apps.

## 2\. Vision

To become the default lightweight, organization-agnostic system of record for "who holds what, where it is, and what condition it's in" — deployable inside any Odoo instance in under a day, with zero bespoke infrastructure.

## 3\. Mission

Deliver a user-centric, responsive Odoo application that gives every role — Admin, Manager, Employee — the tools to register, allocate, book, maintain, and audit physical assets, with hard guarantees against double-allocation and double-booking.

## 4\. Problem Statement

Organizations track physical assets and shared resources (rooms, vehicles, equipment) using disconnected spreadsheets and paper logs. This causes:

- No single source of truth for asset location, custody, or condition.  
- Silent double-allocation of assets and double-booking of shared resources.  
- Maintenance work starting without approval, or being forgotten entirely.  
- No structured, periodic verification of physical inventory (audits done ad hoc, if at all).  
- No proactive visibility into overdue returns, bookings, or maintenance — issues surface only when someone complains.

AssetFlow solves this with structured lifecycles, conflict validation at the database and business-logic layer, mandatory approval gates, and a scheduled audit engine.

## 5\. Business Objectives

| \# | Objective | Success Metric |
| :---- | :---- | :---- |
| 1 | Eliminate double-allocation of assets | 0% conflict incidents post-launch |
| 2 | Eliminate overlapping resource bookings | 0% overlap incidents post-launch |
| 3 | Reduce maintenance turnaround time | Approval-to-resolution cycle time tracked & reduced |
| 4 | Increase audit compliance | 100% of scheduled audit cycles closed with discrepancy reports |
| 5 | Improve visibility | 100% of overdue items surfaced on Dashboard within 24 hours |
| 6 | Realistic security | 0 instances of self-elevated admin/manager roles |

## 6\. Target Users

Any organization (industry-agnostic) with physical assets or shared resources: corporate offices, schools/universities, hospitals/clinics, manufacturing plants, government agencies, co-working spaces. Primary personas: IT/Admin staff, Facility/Asset Managers, Department Managers, general Employees.

## 7\. Scope

**In Scope:**

- Department, asset category, and employee directory master data  
- Asset registration and full lifecycle tracking  
- Asset allocation, transfer, and return workflows with conflict prevention  
- Shared resource booking with overlap validation  
- Maintenance request → approval → resolution workflow  
- Scheduled audit cycles with discrepancy reporting  
- Notifications and full activity logging  
- KPI dashboard and operational reports  
- Role-based access control (Admin, Manager, Employee) with realistic account provisioning

## 8\. Out of Scope

- Purchasing / procurement (PO creation, vendor management)  
- Invoicing, billing, or accounting entries  
- Payroll or HR management beyond the employee directory  
- Asset depreciation / financial valuation logic  
- Multi-currency, multi-company consolidation (noted as Future Enhancement)  
- Native mobile apps (responsive web only for hackathon scope)  
- IoT/RFID hardware integration (Future Enhancement)

## 9\. Functional Requirements

| ID | Requirement |
| :---- | :---- |
| FR-01 | Users can sign up and are created as Employee only; no self-role-selection |
| FR-02 | Admin can promote Employees to Manager or Asset Manager\* from the Employee Directory only |
| FR-03 | System maintains Departments (with optional parent hierarchy) and Asset Categories |
| FR-04 | System registers Assets with auto-generated Asset Tag, category, serial number, cost, condition, location |
| FR-05 | Assets move through a defined lifecycle state machine with validated transitions |
| FR-06 | System blocks allocation of an already-allocated asset and offers a Transfer Request instead |
| FR-07 | System validates resource bookings for time-slot overlap before confirming |
| FR-08 | Maintenance requests require Asset Manager approval before status flips to Under Maintenance |
| FR-09 | Audit cycles support multiple auditors, per-asset verification, and auto-generated discrepancy reports |
| FR-10 | System auto-flags overdue allocations, bookings, and maintenance activities |
| FR-11 | System raises notifications for all major state transitions |
| FR-12 | System logs all create/update/approve/reject actions with actor and timestamp |
| FR-13 | Dashboard presents live KPI cards per role |
| FR-14 | Reports module exports utilization, maintenance frequency, and booking heatmap data |

*\*Assumption:* "Asset Manager" and "Department Head" from the SRS are merged into the single **Manager** role per hackathon role constraints (see Section 11 — Assumptions).

## 10\. Non-Functional Requirements

| Category | Requirement |
| :---- | :---- |
| Performance | List/search views must return results in \<2s for up to 50,000 asset records (standard Odoo ORM \+ PostgreSQL indexing) |
| Scalability | Modular addon design allows horizontal feature growth without re-architecture |
| Security | Odoo native `ir.rule` record rules \+ `res.groups` for role isolation; no client-side-only checks |
| Usability | Native Odoo UX patterns (list/kanban/form/calendar views) for zero learning curve |
| Availability | Single-node deployment acceptable for hackathon; production notes included for HA |
| Auditability | Every state-changing action logged via `mail.thread` / custom activity log model |
| Maintainability | Each module independently installable/upgradable; no cross-module hard dependencies beyond `base` |
| Data Integrity | Overlap/conflict validation enforced in Python `@api.constrains`, not just UI |

## 11\. Assumptions

All assumptions below are explicitly labeled as **\[ASSUMPTION\]** because the SRS did not specify them or because the hackathon constraints required a deviation.

- **\[ASSUMPTION\]** "Department Head" is merged into **Manager**. A Manager can be scoped to one or more Departments via a `department_ids` field, replicating Department Head's departmental scope while also carrying Asset Manager's cross-department approval powers where the SRS assigned them to "Asset Manager."  
- **\[ASSUMPTION\]** Because Manager now covers both former "Asset Manager" and "Department Head" duties, approval steps that the SRS split between the two (e.g., transfer approval by "Asset Manager/Department Head") are consolidated to: **any Manager scoped to the relevant department, or an Admin.**  
- **\[ASSUMPTION\]** "Forgot password" uses Odoo's native `auth_signup` reset-password flow; no custom OTP/SMS layer for hackathon scope.  
- **\[ASSUMPTION\]** QR code search (Screen 4\) uses Odoo's built-in `barcode` field type on `asset.asset`, scannable via any standard barcode/QR scanner app or the Odoo Barcode app.  
- **\[ASSUMPTION\]** Photo/document attachments use Odoo's native `ir.attachment` model — no separate document management system.  
- **\[ASSUMPTION\]** Acquisition Cost is stored as a `Monetary`/`Float` field for **reporting/ranking only**; it is explicitly NOT linked to `account.move` or any accounting model.  
- **\[ASSUMPTION\]** "Reports & Analytics" is delivered via Odoo's native pivot/graph views \+ QWeb PDF export, not a separate BI tool.  
- **\[ASSUMPTION\]** Notifications use Odoo's native `mail.activity` / `bus.bus` (in-app real-time bus) — no external push/SMS/email gateway required for hackathon scope (email is a Future Enhancement via `mail` templates).

## 12\. Constraints

- Must be buildable entirely on **Odoo Community Edition** (no Enterprise-only widgets/modules).  
- Must use **PostgreSQL** (Odoo's mandatory native database).  
- Development team has **zero prior Odoo experience** — architecture must be learnable by any Python developer within the hackathon timeframe.  
- Only **three roles** permitted: Admin, Manager, Employee.  
- No external infrastructure dependencies (no Kafka/Redis/Kubernetes/GraphQL).  
- Hackathon timeframe — architecture must be buildable incrementally, module by module.

## 13\. Business Rules

| ID | Rule |
| :---- | :---- |
| BR-01 | Signup always creates an Employee-role user; roles are elevated only via Organization Setup → Employee Directory by an Admin |
| BR-02 | An asset can have at most one **active** allocation at any time |
| BR-03 | Allocating an already-allocated asset is blocked; the system must offer "Transfer Request" instead |
| BR-04 | A resource booking is rejected if its time range overlaps any existing Upcoming/Ongoing booking for the same resource (touching boundaries, e.g. 9:00–10:00 then 10:00–11:00, are allowed) |
| BR-05 | Maintenance work cannot begin (asset cannot enter Under Maintenance) until the request is Approved |
| BR-06 | Asset status auto-reverts to Available when maintenance is Resolved or an allocation is Returned |
| BR-07 | An Audit Cycle can only be Closed after every in-scope asset has been marked Verified/Missing/Damaged by an assigned auditor |
| BR-08 | Closing an Audit Cycle with Missing items auto-transitions those assets to `Lost` |
| BR-09 | Overdue detection (allocations, bookings, maintenance) runs against `Expected Return Date` / booking end / SLA date and is recomputed at least daily |
| BR-10 | Every approval-gated transition (transfer, maintenance, audit closure) must record actor \+ timestamp in the Activity Log |

---

# PART 2 — SYSTEM ARCHITECTURE

## 2.1 Overall System Architecture

AssetFlow is a **single Odoo Community instance** composed of independently-installable custom addons sitting on top of Odoo's standard three-tier engine (ORM → Business Logic → Views). There is no separate backend service, no separate API gateway, and no separate frontend SPA — Odoo's built-in web client (owl.js) renders XML-defined views directly against the ORM.

                         ┌───────────────────────────────────────────┐

                         │              BROWSER (Odoo Web Client)      │

                         │   Owl.js Views: List / Form / Kanban /      │

                         │   Calendar / Pivot / Graph / Dashboard      │

                         └───────────────────┬─────────────────────────┘

                                              │ JSON-RPC / HTTP

                         ┌───────────────────▼─────────────────────────┐

                         │            ODOO APPLICATION SERVER           │

                         │  ┌─────────────────────────────────────────┐ │

                         │  │  Custom Addons (AssetFlow Modules)      │ │

                         │  │  \- assetflow\_base                       │ │

                         │  │  \- assetflow\_org                        │ │

                         │  │  \- assetflow\_asset                      │ │

                         │  │  \- assetflow\_allocation                 │ │

                         │  │  \- assetflow\_booking                    │ │

                         │  │  \- assetflow\_maintenance                │ │

                         │  │  \- assetflow\_audit                      │ │

                         │  │  \- assetflow\_notification                │ │

                         │  │  \- assetflow\_reports                    │ │

                         │  └─────────────────────────────────────────┘ │

                         │  Odoo Core: ORM | Security (ir.rule/groups) │

                         │  Workflow (mail.activity) | Scheduler (cron)│

                         └───────────────────┬─────────────────────────┘

                                              │ psycopg2

                         ┌───────────────────▼─────────────────────────┐

                         │              PostgreSQL 15 Database          │

                         └───────────────────────────────────────────────┘

## 2.2 High Level Architecture

Three logical tiers, all inside one Odoo process:

1. **Presentation Layer** — Odoo XML views (list, form, kanban, calendar, pivot, graph) \+ QWeb templates for the dashboard and PDF reports.  
2. **Application/Domain Layer** — Python models (`models.Model`) encapsulating entities and business rules via `@api.constrains`, `@api.onchange`, and workflow methods (`action_approve`, `action_close`, etc.).  
3. **Data Layer** — PostgreSQL, accessed exclusively through the Odoo ORM (no raw SQL except for reporting-optimized read views where justified).

## 2.3 Low Level Architecture

Each module follows the same internal shape:

module/

 ├── models/        (business entities \+ logic)

 ├── views/          (XML: list/form/kanban/calendar/search)

 ├── security/       (ir.model.access.csv \+ record rules)

 ├── data/           (sequences, cron jobs, default categories)

 ├── wizards/        (transient models for multi-step actions, e.g. Transfer Request)

 └── report/         (QWeb PDF templates)

## 2.4 Logical Architecture (Module Dependency Graph)

                         assetflow\_base

                               │

                     ┌─────────┼─────────┐

                     ▼                   ▼

              assetflow\_org      assetflow\_notification

                     │                   ▲

                     ▼                   │

             assetflow\_asset ────────────┤

                     │                   │

        ┌────────────┼───────────┬───────┤

        ▼            ▼           ▼       │

 assetflow\_       assetflow\_  assetflow\_ │

 allocation       booking     maintenance│

        │            │           │       │

        └────────────┴─────┬─────┘       │

                            ▼             │

                    assetflow\_audit ──────┘

                            │

                            ▼

                    assetflow\_reports

Every domain module depends on `assetflow_notification` (write-only, to raise events) and never depends on `assetflow_reports` (read-only, one-directional).

## 2.5 Physical Architecture

Single VM/container running:

- Odoo application server (multi-worker, gevent for longpolling/notifications)  
- PostgreSQL server (can be co-located for hackathon, separate node for production)  
- Nginx reverse proxy (SSL termination, static file caching) — **\[ASSUMPTION\]** for production hardening, not required for hackathon demo

## 2.6 Deployment Architecture

        ┌────────────┐      ┌──────────────────┐      ┌───────────────┐

        │   Nginx    │ ───► │  Odoo (gunicorn/  │ ───► │  PostgreSQL   │

        │  (SSL, LB) │      │  gevent workers)  │      │   (single DB) │

        └────────────┘      └──────────────────┘      └───────────────┘

              ▲                      │

              │              Filestore (local disk /

         Browser Clients     mounted volume) for

                              ir.attachment binaries

No containers-of-containers, no orchestration layer required — a single Docker Compose (odoo \+ postgres) is sufficient for hackathon deployment and demo.

## 2.7 Module Architecture

See the module catalogue in Section 2.11 of this part for the authoritative Core/Supporting/Future classification.

## 2.8 Component Architecture

| Component | Odoo Mechanism |
| :---- | :---- |
| Master Data Management | Standard CRUD models (Department, Category) |
| Employee Directory | Custom model `assetflow.employee`, linked 1:1 to `res.users` (kept independent of the `hr` app for zero-dependency hackathon scope) |
| Lifecycle Engine | `selection` field \+ `@api.constrains` guarded `write()` overrides on `assetflow.asset` |
| Conflict Engine | SQL constraints (`_sql_constraints`) \+ Python `@api.constrains` on Allocation and Booking models |
| Approval Workflow | State machine (`selection` field) \+ button-triggered `action_*` methods restricted by `res.groups` |
| Audit Engine | Parent (`assetflow.audit.cycle`) / child (`assetflow.audit.line`) pattern with a `cron` for scheduling |
| Notifications | `mail.activity` for task-style alerts \+ `bus.bus` for real-time toasts |
| Dashboard | Owl.js client action reading aggregated `read_group` queries |
| Reporting | `pivot`/`graph` views \+ QWeb PDF `report.report_qweb` |

## 2.9 Layered Architecture

┌───────────────────────────────────────────────┐

│  Presentation:  XML Views / QWeb / Owl widgets │

├───────────────────────────────────────────────┤

│  Controller:    Odoo HTTP/JSON-RPC controllers  │  (dashboard AJAX \+ barcode scan endpoint only)

├───────────────────────────────────────────────┤

│  Domain/Business Logic: Python Models           │

├───────────────────────────────────────────────┤

│  ORM:           Odoo ORM (active record pattern)│

├───────────────────────────────────────────────┤

│  Data:          PostgreSQL                       │

└───────────────────────────────────────────────┘

## 2.10 Odoo Mapping Architecture

| SRS Concept | Odoo Artifact |
| :---- | :---- |
| Screen | `ir.actions.act_window` \+ `ir.ui.view` (form/list/kanban) |
| Entity/Table | `models.Model` (`_name = 'assetflow.xxx'`) |
| Role | `res.groups` (`group_admin`, `group_manager`, `group_employee`) |
| Permission | `ir.model.access.csv` (CRUD per group) \+ `ir.rule` (row-level) |
| Workflow state | `selection` field `state` \+ `statusbar` widget |
| Approval button | `<button type="object" name="action_approve">` guarded by `groups="assetflow.group_manager"` |
| Notification | `mail.activity.type` \+ `bus.bus` message |
| Audit trail | `mail.thread` mixin (chatter) on every transactional model |
| Scheduled job | `ir.cron` |
| Dashboard | Custom Owl.js client action (`ir.actions.client`) |
| Reports | `ir.actions.report` (QWeb PDF) \+ native pivot/graph views |
| Sequence (AF-0001) | `ir.sequence` |
| Barcode/QR | Native `barcode` widget on a `Char` field |

## 2.11 Module Catalogue — Core / Supporting / Future

| Classification | Modules |
| :---- | :---- |
| **Core Modules** | `assetflow_base`, `assetflow_org`, `assetflow_asset`, `assetflow_allocation`, `assetflow_booking`, `assetflow_maintenance`, `assetflow_audit` |
| **Supporting Modules** | `assetflow_notification`, `assetflow_reports`, `assetflow_activity_log` (folded into base via `mail.thread`, listed separately for traceability) |
| **Future Enhancement Modules** | `assetflow_iot` (RFID/IoT tag sync), `assetflow_mobile` (native mobile scanning app), `assetflow_multicompany`, `assetflow_purchase_bridge` (optional link to Odoo `purchase`/`account`), `assetflow_bi` (advanced analytics/Odoo Enterprise Spreadsheet integration) |

## 2.12 Database / Backend / Frontend / Security / Notification / Reporting Layers — Summary

| Layer | Technology |
| :---- | :---- |
| Database Layer | PostgreSQL 15, accessed exclusively via Odoo ORM |
| Backend Layer | Python 3.10+, Odoo 17 framework; business rules in model methods and `@api.constrains` |
| Frontend Layer | Odoo native XML views \+ one custom Owl.js dashboard component (no external SPA framework) |
| Security Layer | `res.groups` \+ `ir.model.access.csv` \+ `ir.rule` (row-level) \+ field-level `groups` attributes |
| Notification Layer | `mail.activity` (persistent/actionable) \+ `bus.bus` (real-time toast), unified behind one internal `notify()` service |
| Reporting Layer | Native pivot/graph views bound to PostgreSQL views for heavy aggregation \+ QWeb PDF export |

---

# PART 3 — USER ROLES

**\[ASSUMPTION\]** Per hackathon constraint, only **Admin, Manager, Employee** exist. "Department Head" and "Asset Manager" from the SRS are both merged into **Manager**. A Manager record carries a `department_ids` many2many (their scope) and an `is_asset_manager` boolean-equivalent is unnecessary — every Manager has full Manager powers within their scoped departments, and Admin can additionally scope a Manager as "Global" (all departments) to replicate a cross-department Asset Manager.

## 3.1 Admin

**Responsibilities**

- Owns Organization Setup: Departments, Asset Categories, Employee Directory  
- Promotes Employees to Manager (the only place role elevation happens)  
- Creates/schedules Audit Cycles and assigns auditors  
- Views organization-wide analytics and all reports  
- Full override authority on any workflow (can approve any transfer/maintenance/audit if needed)

**Permissions:** Full CRUD on all AssetFlow models; only role that can write to `res.groups` membership.

**Accessible Modules:** All (Org Setup, Asset Directory, Allocation, Booking, Maintenance, Audit, Reports, Notifications, Settings).

**Restrictions:** None functionally, but every promotion/demotion action is logged (cannot silently self-elevate — Admin role itself is seeded at installation, not self-assignable via signup).

**User Journey:** Login → Dashboard (org-wide KPIs) → Organization Setup (create departments/categories, promote employees) → monitor all modules → Reports for strategic review.

## 3.2 Manager

**Responsibilities**

- Registers and allocates assets within their scoped department(s)  
- Approves transfer requests, maintenance requests, and audit discrepancy resolutions for their scope (or org-wide if scoped as Global)  
- Approves asset returns and condition check-in notes  
- Books shared resources on behalf of their department  
- Views assets allocated to their department(s)

**Permissions:** CRUD on Assets/Allocations/Bookings/Maintenance within scoped departments (enforced via `ir.rule`); read-only on Org Setup master data (cannot create departments/categories or promote users).

**Accessible Modules:** Dashboard, Asset Directory, Allocation & Transfer, Resource Booking, Maintenance, Audit (as assigned auditor), Reports (scoped).

**Restrictions:** Cannot promote/demote users; cannot create/edit Departments or Categories; cannot see other departments' data unless scoped as Global by Admin.

**User Journey:** Login → Dashboard (department KPIs) → Register/Allocate assets → Approve pending transfer/maintenance requests → Conduct assigned audits → Review department reports.

## 3.3 Employee

**Responsibilities**

- Views assets allocated to them  
- Books shared resources  
- Raises maintenance requests  
- Initiates return/transfer requests

**Permissions:** Read own allocations; Create on Booking and Maintenance Request (own); Create on Transfer Request (own, requires Manager approval); no access to Org Setup, no visibility into other employees' allocations.

**Accessible Modules:** Dashboard (personal KPIs), My Assets (read-only), Resource Booking, Maintenance (raise only), Notifications.

**Restrictions:** Cannot approve anything; cannot register or reassign assets; cannot see Acquisition Cost field (hidden via field-level `groups`); cannot see other departments' bookings beyond availability calendar.

**User Journey:** Login → Dashboard (my assets, upcoming returns) → Book a resource / Raise a maintenance request → Track request status via Notifications.

## 3.4 Role Permission Matrix

| Capability | Admin | Manager | Employee |
| :---- | :---: | :---: | :---: |
| Create Department / Category | ✅ | ❌ | ❌ |
| Promote User Role | ✅ | ❌ | ❌ |
| Register Asset | ✅ | ✅ | ❌ |
| Allocate Asset | ✅ | ✅ | ❌ |
| Approve Transfer | ✅ | ✅ (own scope) | ❌ |
| Initiate Transfer/Return Request | ✅ | ✅ | ✅ |
| Book Resource | ✅ | ✅ | ✅ |
| Raise Maintenance Request | ✅ | ✅ | ✅ |
| Approve Maintenance | ✅ | ✅ (own scope) | ❌ |
| Create/Assign Audit Cycle | ✅ | ❌ | ❌ |
| Perform Audit Verification | ✅ | ✅ (if assigned) | ❌ |
| Close Audit Cycle | ✅ | ❌ | ❌ |
| View Org-wide Reports | ✅ | ❌ (scoped only) | ❌ |
| View Acquisition Cost | ✅ | ✅ | ❌ |

---

# PART 4 — DATABASE DESIGN

All tables are Odoo models (`_name`), physically materialized as PostgreSQL tables with the same name (dots become underscores, e.g. `assetflow.asset` → `assetflow_asset`). Every table implicitly has `id, create_date, create_uid, write_date, write_uid` from Odoo's ORM (omitted below for brevity) plus `active` (Boolean, default True) for soft-delete.

## 4.1 assetflow\_department

| Column | Type | Key/Constraint | Notes |
| :---- | :---- | :---- | :---- |
| id | Integer | PK |  |
| name | Char(120) | NOT NULL, Unique |  |
| parent\_id | Many2one → assetflow\_department | FK, nullable | self-referential hierarchy |
| head\_manager\_id | Many2one → assetflow\_employee | FK, nullable | replaces "Department Head" concept |
| status | Selection(active, inactive) | NOT NULL, default active |  |
| **Indexes** | idx on `parent_id`, idx on `status` |  |  |
| **Validation** | No department may be its own ancestor (recursive `@api.constrains`) |  |  |

## 4.2 assetflow\_category

| Column | Type | Key/Constraint | Notes |
| :---- | :---- | :---- | :---- |
| id | Integer | PK |  |
| name | Char(100) | NOT NULL, Unique | e.g. Electronics, Furniture, Vehicles |
| description | Text | nullable |  |
| has\_warranty\_field | Boolean | default False | drives optional field display |
| **Indexes** | unique idx on `name` |  |  |

## 4.3 assetflow\_employee

| Column | Type | Key/Constraint | Notes |
| :---- | :---- | :---- | :---- |
| id | Integer | PK |  |
| user\_id | Many2one → res.users | FK, Unique, NOT NULL | links to Odoo login |
| name | Char(150) | NOT NULL |  |
| email | Char(150) | NOT NULL, Unique |  |
| department\_id | Many2one → assetflow\_department | FK, NOT NULL |  |
| role | Selection(employee, manager, admin) | NOT NULL, default employee | mirrors `res.groups` membership |
| status | Selection(active, inactive) | NOT NULL, default active |  |
| **Indexes** | idx on `department_id`, idx on `role` |  |  |
| **Validation** | `role` field is write-protected — only writable by Admin group (`ir.rule` \+ `groups` attr) |  |  |

## 4.4 assetflow\_asset

| Column | Type | Key/Constraint | Notes |
| :---- | :---- | :---- | :---- |
| id | Integer | PK |  |
| asset\_tag | Char(20) | NOT NULL, Unique | auto via `ir.sequence`, e.g. AF-0001 |
| name | Char(150) | NOT NULL |  |
| category\_id | Many2one → assetflow\_category | FK, NOT NULL |  |
| serial\_number | Char(100) | Unique, nullable |  |
| barcode | Char(64) | Unique, nullable | QR/barcode value |
| acquisition\_date | Date | NOT NULL |  |
| acquisition\_cost | Monetary | nullable | reporting only, field-level `groups` hides from Employee |
| condition | Selection(new, good, fair, poor, damaged) | NOT NULL, default new |  |
| location | Char(150) | NOT NULL |  |
| department\_id | Many2one → assetflow\_department | FK, nullable | current owning department |
| is\_bookable | Boolean | default False | "shared/bookable" flag |
| state | Selection(available, allocated, reserved, under\_maintenance, lost, retired, disposed) | NOT NULL, default available | lifecycle state |
| **Indexes** | idx on `asset_tag`, `serial_number`, `barcode`, `category_id`, `state`, `department_id` |  |  |
| **Validation** | `_sql_constraints`: unique(asset\_tag), unique(serial\_number) where not null; `@api.constrains` guards illegal `state` transitions (see Part 10 state diagram) |  |  |

## 4.5 assetflow\_allocation

| Column | Type | Key/Constraint | Notes |
| :---- | :---- | :---- | :---- |
| id | Integer | PK |  |
| asset\_id | Many2one → assetflow\_asset | FK, NOT NULL |  |
| employee\_id | Many2one → assetflow\_employee | FK, nullable | allocatee (if to a person) |
| department\_id | Many2one → assetflow\_department | FK, nullable | allocatee (if to a dept) |
| allocation\_date | Datetime | NOT NULL, default now |  |
| expected\_return\_date | Date | nullable |  |
| actual\_return\_date | Date | nullable | set on return |
| return\_condition\_notes | Text | nullable |  |
| status | Selection(active, returned, overdue) | NOT NULL, default active |  |
| **Indexes** | idx on `asset_id`, `employee_id`, `department_id`, `status` |  |  |
| **Constraint** | Partial unique index: only one row with `status='active'` per `asset_id` (enforces BR-02/BR-03) |  |  |
| **Validation** | `@api.constrains` blocks creation if an active allocation already exists for `asset_id` → raises `UserError` directing to Transfer Request |  |  |

## 4.6 assetflow\_transfer\_request

| Column | Type | Key/Constraint | Notes |
| :---- | :---- | :---- | :---- |
| id | Integer | PK |  |
| asset\_id | Many2one → assetflow\_asset | FK, NOT NULL |  |
| from\_allocation\_id | Many2one → assetflow\_allocation | FK, NOT NULL | current holder's allocation |
| requested\_by\_id | Many2one → assetflow\_employee | FK, NOT NULL |  |
| to\_employee\_id | Many2one → assetflow\_employee | FK, nullable | new holder |
| to\_department\_id | Many2one → assetflow\_department | FK, nullable |  |
| status | Selection(requested, approved, rejected, reallocated) | NOT NULL, default requested |  |
| approved\_by\_id | Many2one → assetflow\_employee | FK, nullable | must be Manager/Admin |
| request\_date | Datetime | NOT NULL, default now |  |
| decision\_date | Datetime | nullable |  |
| **Indexes** | idx on `asset_id`, `status` |  |  |
| **Validation** | Approving auto-creates new `assetflow_allocation` row and sets old one to `returned` (atomic) |  |  |

## 4.7 assetflow\_booking

| Column | Type | Key/Constraint | Notes |
| :---- | :---- | :---- | :---- |
| id | Integer | PK |  |
| resource\_asset\_id | Many2one → assetflow\_asset | FK, NOT NULL | must have `is_bookable=True` |
| booked\_by\_id | Many2one → assetflow\_employee | FK, NOT NULL |  |
| department\_id | Many2one → assetflow\_department | FK, nullable | on-behalf-of |
| start\_datetime | Datetime | NOT NULL |  |
| end\_datetime | Datetime | NOT NULL |  |
| status | Selection(upcoming, ongoing, completed, cancelled) | NOT NULL, default upcoming |  |
| **Indexes** | idx on `resource_asset_id`, composite idx on `(resource_asset_id, start_datetime, end_datetime)` |  |  |
| **Constraint** | `@api.constrains` overlap check: reject if another Upcoming/Ongoing booking for the same `resource_asset_id` has `start < new.end AND end > new.start` (strict overlap; touching boundaries allowed per BR-04) |  |  |
| **Validation** | `end_datetime > start_datetime`; resource must be `is_bookable=True` and not `retired/disposed` |  |  |

## 4.8 assetflow\_maintenance\_request

| Column | Type | Key/Constraint | Notes |
| :---- | :---- | :---- | :---- |
| id | Integer | PK |  |
| asset\_id | Many2one → assetflow\_asset | FK, NOT NULL |  |
| raised\_by\_id | Many2one → assetflow\_employee | FK, NOT NULL |  |
| issue\_description | Text | NOT NULL |  |
| priority | Selection(low, medium, high, critical) | NOT NULL, default medium |  |
| photo | Binary (ir.attachment) | nullable |  |
| status | Selection(pending, approved, rejected, technician\_assigned, in\_progress, resolved) | NOT NULL, default pending |  |
| approved\_by\_id | Many2one → assetflow\_employee | FK, nullable |  |
| technician\_name | Char(120) | nullable | free text — no separate technician master for hackathon scope **\[ASSUMPTION\]** |
| resolution\_notes | Text | nullable |  |
| request\_date | Datetime | NOT NULL, default now |  |
| resolved\_date | Datetime | nullable |  |
| **Indexes** | idx on `asset_id`, `status` |  |  |
| **Validation** | `state='approved'` triggers `asset_id.state = 'under_maintenance'`; `state='resolved'` reverts asset to `available` (BR-05/BR-06) |  |  |

## 4.9 assetflow\_audit\_cycle

| Column | Type | Key/Constraint | Notes |
| :---- | :---- | :---- | :---- |
| id | Integer | PK |  |
| name | Char(150) | NOT NULL |  |
| scope\_department\_id | Many2one → assetflow\_department | FK, nullable | null \= org-wide |
| scope\_location | Char(150) | nullable |  |
| date\_from | Date | NOT NULL |  |
| date\_to | Date | NOT NULL |  |
| auditor\_ids | Many2many → assetflow\_employee |  |  |
| status | Selection(draft, in\_progress, closed) | NOT NULL, default draft |  |
| **Indexes** | idx on `status`, `scope_department_id` |  |  |
| **Validation** | `action_close()` blocked unless every `assetflow_audit_line` under this cycle has `result != draft` (BR-07); on close, lines marked `missing` cascade `asset.state = 'lost'` (BR-08) |  |  |

## 4.10 assetflow\_audit\_line

| Column | Type | Key/Constraint | Notes |
| :---- | :---- | :---- | :---- |
| id | Integer | PK |  |
| audit\_cycle\_id | Many2one → assetflow\_audit\_cycle | FK, NOT NULL |  |
| asset\_id | Many2one → assetflow\_asset | FK, NOT NULL |  |
| verified\_by\_id | Many2one → assetflow\_employee | FK, nullable |  |
| result | Selection(draft, verified, missing, damaged) | NOT NULL, default draft |  |
| remarks | Text | nullable |  |
| verified\_date | Datetime | nullable |  |
| **Indexes** | unique composite `(audit_cycle_id, asset_id)`, idx on `result` |  |  |

## 4.11 assetflow\_discrepancy\_report

| Column | Type | Key/Constraint | Notes |
| :---- | :---- | :---- | :---- |
| id | Integer | PK |  |
| audit\_cycle\_id | Many2one → assetflow\_audit\_cycle | FK, NOT NULL |  |
| audit\_line\_id | Many2one → assetflow\_audit\_line | FK, NOT NULL |  |
| asset\_id | Many2one → assetflow\_asset | FK, NOT NULL |  |
| discrepancy\_type | Selection(missing, damaged) | NOT NULL |  |
| generated\_date | Datetime | NOT NULL, default now |  |
| resolution\_status | Selection(open, resolved) | NOT NULL, default open |  |
| resolved\_by\_id | Many2one → assetflow\_employee | FK, nullable | Manager/Admin |
| **Indexes** | idx on `audit_cycle_id`, `resolution_status` |  |  |
| **Validation** | Auto-created via server action when an `assetflow_audit_line.result` is set to `missing`/`damaged` |  |  |

## 4.12 assetflow\_notification

| Column | Type | Key/Constraint | Notes |
| :---- | :---- | :---- | :---- |
| id | Integer | PK |  |
| user\_id | Many2one → res.users | FK, NOT NULL | recipient |
| event\_type | Selection(asset\_assigned, maintenance\_approved, maintenance\_rejected, booking\_confirmed, booking\_cancelled, booking\_reminder, transfer\_approved, overdue\_return, audit\_discrepancy) | NOT NULL |  |
| model\_ref | Char(64) | NOT NULL | source model technical name |
| res\_id | Integer | NOT NULL | source record id |
| message | Text | NOT NULL |  |
| is\_read | Boolean | default False |  |
| created\_date | Datetime | NOT NULL, default now |  |
| **Indexes** | idx on `user_id, is_read` |  |  |

## 4.13 assetflow\_activity\_log

| Column | Type | Key/Constraint | Notes |
| :---- | :---- | :---- | :---- |
| id | Integer | PK |  |
| user\_id | Many2one → res.users | FK, NOT NULL | actor |
| action | Char(64) | NOT NULL | e.g. "approved\_transfer" |
| model\_ref | Char(64) | NOT NULL |  |
| res\_id | Integer | NOT NULL |  |
| description | Text | nullable |  |
| timestamp | Datetime | NOT NULL, default now |  |
| **Indexes** | idx on `user_id`, idx on `(model_ref, res_id)`, idx on `timestamp` |  |  |
| **Note** | Populated automatically by a mixin (`assetflow.loggable.mixin`) inherited on every transactional model — every `action_*` workflow method logs on entry |  |  |

## 4.14 Reporting Views (materialized as PostgreSQL VIEWs, read-only Odoo models)

| View | Purpose |
| :---- | :---- |
| `assetflow_report_utilization` | Asset usage frequency (allocation days / booking hours per asset) |
| `assetflow_report_maintenance_freq` | Maintenance count grouped by asset/category/month |
| `assetflow_report_booking_heatmap` | Booking count grouped by resource × hour-of-day × day-of-week |
| `assetflow_report_dept_allocation` | Department-wise active allocation summary |

## 4.15 Relationship Summary

assetflow\_department 1───\* assetflow\_employee

assetflow\_department 1───\* assetflow\_department (parent hierarchy)

assetflow\_department 1───\* assetflow\_asset (owning dept)

assetflow\_category    1───\* assetflow\_asset

assetflow\_asset       1───\* assetflow\_allocation

assetflow\_asset       1───\* assetflow\_booking

assetflow\_asset       1───\* assetflow\_maintenance\_request

assetflow\_asset       1───\* assetflow\_audit\_line

assetflow\_allocation  1───\* assetflow\_transfer\_request (via from\_allocation\_id)

assetflow\_audit\_cycle 1───\* assetflow\_audit\_line

assetflow\_audit\_line  1───1 assetflow\_discrepancy\_report (conditional)

assetflow\_employee    1───\* assetflow\_allocation / booking / maintenance\_request / audit\_line (as actor)

res.users             1───1 assetflow\_employee

res.users             1───\* assetflow\_notification

---

# PART 5 — ER DIAGRAM

┌─────────────────────┐        ┌──────────────────────┐        ┌─────────────────────┐

│  assetflow\_department│1      \*│  assetflow\_employee   │1      \*│ assetflow\_allocation │

│──────────────────────│◄───────│────────────────────────│◄───────│───────────────────────│

│ id (PK)              │        │ id (PK)                │        │ id (PK)               │

│ name                 │        │ user\_id (FK→res.users) │        │ asset\_id (FK)         │

│ parent\_id (FK, self) │        │ name, email            │        │ employee\_id (FK)      │

│ head\_manager\_id (FK) │        │ department\_id (FK)     │        │ department\_id (FK)    │

│ status               │        │ role, status            │        │ allocation\_date       │

└──────────┬────────────┘        └────────────┬────────────┘        │ expected\_return\_date  │

           │1                                  │1                    │ actual\_return\_date    │

           │                                    │                     │ status                │

           │\*                                   │\*                    └──────────┬─────────────┘

┌──────────▼────────────┐        ┌─────────────▼──────────┐                    │1

│   assetflow\_asset      │1      \*│ assetflow\_booking        │                    │\*

│─────────────────────────│◄───────│───────────────────────────│         ┌──────────▼──────────────┐

│ id (PK)                 │        │ id (PK)                    │         │ assetflow\_transfer\_request│

│ asset\_tag (unique)      │        │ resource\_asset\_id (FK)     │         │────────────────────────────│

│ category\_id (FK)        │        │ booked\_by\_id (FK)           │         │ id (PK)                   │

│ serial\_number, barcode  │        │ department\_id (FK)          │         │ asset\_id (FK)             │

│ acquisition\_date/cost   │        │ start\_datetime, end\_datetime│         │ from\_allocation\_id (FK)   │

│ condition, location     │        │ status                       │         │ requested\_by\_id (FK)      │

│ department\_id (FK)      │        └───────────────────────────────┘         │ to\_employee/dept\_id (FK)  │

│ is\_bookable, state       │                                                  │ status                    │

└─────┬──────────┬─────────┘                                                 └────────────────────────────┘

      │1          │1

      │\*          │\*

┌─────▼─────────┐ ┌▼──────────────────────┐         ┌───────────────────────┐        ┌──────────────────────┐

│ assetflow\_     │ │ assetflow\_maintenance\_ │         │ assetflow\_audit\_cycle  │1      \*│ assetflow\_audit\_line  │

│ category       │ │ request                │         │─────────────────────────│◄───────│────────────────────────│

│────────────────│ │─────────────────────────│         │ id (PK)                 │        │ id (PK)                │

│ id (PK)        │ │ id (PK)                 │         │ name                    │        │ audit\_cycle\_id (FK)    │

│ name           │ │ asset\_id (FK)           │         │ scope\_department\_id (FK)│        │ asset\_id (FK)          │

│ description    │ │ raised\_by\_id (FK)       │         │ date\_from/date\_to       │        │ verified\_by\_id (FK)    │

└────────────────┘ │ priority, photo         │         │ auditor\_ids (M2M)       │        │ result, remarks        │

                    │ status                  │         │ status                  │        └──────────┬──────────────┘

                    │ approved\_by\_id (FK)     │         └───────────────────────────┘                  │1 (conditional)

                    │ resolution\_notes        │                                                          │\*

                    └──────────────────────────┘                                          ┌──────────────▼──────────────┐

                                                                                            │ assetflow\_discrepancy\_report │

                                                                                            │────────────────────────────────│

                                                                                            │ id (PK)                       │

                                                                                            │ audit\_cycle\_id / line\_id (FK) │

                                                                                            │ asset\_id (FK)                 │

                                                                                            │ discrepancy\_type              │

                                                                                            │ resolution\_status             │

                                                                                            └────────────────────────────────┘

  res.users 1───1 assetflow\_employee        res.users 1───\* assetflow\_notification

  (every transactional model)  \*───1 assetflow\_activity\_log (polymorphic via model\_ref+res\_id)

---

# PART 6 — CLASS DIAGRAM (UML)

┌────────────────────────────┐        ┌────────────────────────────┐

│ «abstract» LoggableMixin    │        │ «abstract» NotifiableMixin  │

│──────────────────────────────│        │──────────────────────────────│

│ \+ log\_action(action, desc)  │        │ \+ notify(user, event, msg)  │

└──────────────┬────────────────┘        └──────────────┬────────────────┘

               ▲ (inherit)                               ▲ (inherit)

   ┌───────────┴───────────────────────────────────────────┴───────────┐

   │                                                                     │

┌──▼─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  ┌▼───────────────────────┐

│ Asset               │  │ Allocation        │  │ Booking              │  │ MaintenanceRequest      │

│──────────────────────│  │────────────────────│  │────────────────────────│  │───────────────────────────│

│ \- assetTag: str      │  │ \- allocationDate  │  │ \- startDatetime       │  │ \- priority: enum         │

│ \- category: Category │  │ \- expectedReturn  │  │ \- endDatetime         │  │ \- status: enum           │

│ \- state: enum         │  │ \- status: enum    │  │ \- status: enum        │  │ \+ approve()               │

│ \+ transitionTo(s)    │  │ \+ validate()      │  │ \+ validateOverlap()   │  │ \+ reject()                │

│ \+ isBookable(): bool │  │ \+ returnAsset()   │  │ \+ cancel()            │  │ \+ resolve()                │

└──────────┬────────────┘  └─────────┬────────────┘  └────────────────────────┘  └───────────────────────────┘

           │1                        │

           │\*                        │ generates

┌──────────▼────────────┐  ┌─────────▼────────────┐

│ AuditLine               │  │ TransferRequest        │

│──────────────────────────│  │────────────────────────────│

│ \- result: enum           │  │ \- status: enum              │

│ \+ markResult(r)          │  │ \+ approve()                 │

└──────────┬────────────────┘  │ \+ reject()                   │

           │ generates          └──────────────────────────────┘

┌──────────▼──────────────┐

│ DiscrepancyReport         │

│────────────────────────────│

│ \- discrepancyType: enum   │

│ \- resolutionStatus: enum  │

│ \+ resolve()                 │

└────────────────────────────┘

┌───────────────────┐   1        \*  ┌────────────────┐   1        \*  ┌───────────────────┐

│ Department          │◄────────────│ Employee         │◄────────────│ (actor on all      │

│──────────────────────│              │───────────────────│              │  transactional     │

│ \- name               │              │ \- role: enum       │              │  models above)      │

│ \- status              │              │ \- status: enum     │              └────────────────────┘

└───────────────────────┘              └────────────────────┘

┌──────────────────────┐

│ AuditCycle              │  1 ────\* AuditLine (composition)

│────────────────────────│

│ \- dateFrom/dateTo       │

│ \- status: enum           │

│ \+ close()                 │

└────────────────────────────┘

**Design notes:** `Asset`, `Allocation`, `Booking`, `MaintenanceRequest`, `TransferRequest`, `AuditCycle` all inherit `LoggableMixin` (→ `assetflow_activity_log`) and `NotifiableMixin` (→ `assetflow_notification`) — implemented in Odoo as Python mixin classes (`models.AbstractModel`), not deep OOP inheritance chains, keeping each concrete model flat and easy for a Python-only developer to read.

---

# PART 7 — USE CASE DIAGRAM (UML)

                                  ┌───────────────────────────────────────┐

                                  │              AssetFlow System            │

                                  │                                          │

      ┌───────┐   Sign Up / Login ├──────────────────────────────────────────┤

      │Employee│───────────────────▶│  (UC1) Authenticate                    │

      └───┬────┘                   │                                          │

          │  Book Resource          │  (UC2) Book Shared Resource             │

          ├─────────────────────────▶│                                          │

          │  Raise Maintenance       │  (UC3) Raise Maintenance Request        │

          ├─────────────────────────▶│                                          │

          │  Request Transfer/Return │  (UC4) Initiate Transfer/Return         │

          ├─────────────────────────▶│                                          │

          │  View My Assets          │  (UC5) View Allocated Assets            │

          └─────────────────────────▶│                                          │

                                     │                                          │

      ┌────────┐  Register Asset     │  (UC6) Register Asset «extends UC1»     │

      │Manager  │───────────────────▶│                                          │

      └───┬─────┘  Allocate Asset    │  (UC7) Allocate Asset ──uses──▶(UC-conflict-check)│

          ├─────────────────────────▶│                                          │

          │  Approve Transfer/Maint. │  (UC8) Approve Workflow Request         │

          ├─────────────────────────▶│                                          │

          │  Book on Behalf of Dept  │  (UC2, extended)                        │

          ├─────────────────────────▶│                                          │

          │  Perform Audit           │  (UC9) Verify Asset in Audit Cycle      │

          └─────────────────────────▶│                                          │

                                     │                                          │

      ┌────────┐  Manage Org Setup    │  (UC10) Manage Departments/Categories  │

      │ Admin   │───────────────────▶│                                          │

      └───┬─────┘  Promote Role       │  (UC11) Promote Employee to Manager    │

          ├─────────────────────────▶│                                          │

          │  Create/Close Audit Cycle│  (UC12) Manage Audit Cycle              │

          ├─────────────────────────▶│                                          │

          │  View Org Reports         │  (UC13) View Analytics & Export Reports │

          └─────────────────────────▶│                                          │

                                     └──────────────────────────────────────────┘

      ┌────────────┐  cron trigger      «uses»

      │ System/Cron │───────────────────▶ (UC14) Auto-Flag Overdue Items

      └────────────┘                     (UC15) Send Notifications

`UC7 Allocate Asset` **«includes»** a mandatory conflict-check sub-use-case; if the asset is already allocated the flow **«extends»** into `UC4 Initiate Transfer/Return` (offered to the requester automatically).

---

# PART 8 — ACTIVITY DIAGRAMS

### 8.1 Login

(start) → Enter Email/Password → Validate Credentials

   ├─ Invalid → Show Error → (back to Enter Credentials)

   └─ Valid → Session Created → Load Role-based Dashboard → (end)

Forgot Password branch: Enter Email → Send Reset Link → User Resets → (back to Login)

### 8.2 Asset Registration

(start) → Manager opens "Register Asset" → Select Category → Fill Name/Serial/Cost/Condition/Location

   → Upload Photo/Docs → Set is\_bookable flag → System auto-generates Asset Tag (ir.sequence)

   → Submit → Validate (unique serial, required fields)

        ├─ Invalid → Show field errors → (back to Fill Form)

        └─ Valid → Save Asset (state=Available) → Log Activity → (end)

### 8.3 Asset Allocation

(start) → Manager selects Asset \+ Employee/Department → Set Expected Return Date → Submit

   → System checks: is there an ACTIVE allocation for this asset?

        ├─ Yes → Block → Show "currently held by X" → Offer "Create Transfer Request" → (go to 8.4 or end)

        └─ No → Create Allocation (status=Active) → Asset.state \= Allocated

                 → Notify allocatee → Log Activity → (end)

### 8.4 Transfer

(start) → Employee/Manager clicks "Transfer Request" on allocated asset → Select new holder → Submit

   → TransferRequest.status \= Requested → Notify Manager/Admin of relevant department

   → Manager reviews

        ├─ Reject → status \= Rejected → Notify requester → (end)

        └─ Approve → status \= Approved → System atomically:

                 old Allocation.status \= Returned (actual\_return\_date=today)

                 new Allocation created (status=Active) for to\_employee/department

                 TransferRequest.status \= Reallocated

                 → Notify old & new holder → Log Activity → (end)

### 8.5 Return

(start) → Holder/Manager clicks "Mark Returned" on active allocation → Capture Condition Check-in Notes

   → Submit → Manager confirms condition → Allocation.status \= Returned, actual\_return\_date \= today

   → Asset.state \= Available → Notify holder → Log Activity → (end)

### 8.6 Booking

(start) → User opens Resource Booking → Select bookable Asset → View Calendar of existing bookings

   → Select Start/End time → Submit → System checks overlap against Upcoming/Ongoing bookings

        ├─ Overlap found → Reject → Show conflicting slot → (back to Select Time)

        └─ No overlap → Create Booking (status=Upcoming) → Notify booker

                 → Schedule reminder notification (cron, X minutes before start) → (end)

   Cancel branch: Select booking → Cancel → status=Cancelled → Notify booker → (end)

### 8.7 Maintenance

(start) → Holder raises request: select Asset, describe issue, set priority, attach photo → Submit

   → MaintenanceRequest.status \= Pending → Notify Manager

   → Manager reviews

        ├─ Reject → status \= Rejected → Notify raiser → (end)

        └─ Approve → status \= Approved → Asset.state \= Under Maintenance → Notify raiser

                 → Assign Technician → status \= Technician Assigned → status \= In Progress (on start)

                 → Technician completes → Manager marks Resolved → status \= Resolved

                 → Asset.state \= Available → Log maintenance history → Notify holder → (end)

### 8.8 Audit

(start) → Admin creates Audit Cycle (scope, date range) → Assigns Auditor(s) → status \= Draft

   → System auto-generates Audit Lines for every in-scope asset → status \= In Progress

   → Auditor(s) inspect each asset → Mark Verified / Missing / Damaged (+ remarks)

        └─ if Missing/Damaged → auto-create Discrepancy Report (status=Open)

   → Repeat until all lines have a result

   → Admin/Auditor attempts "Close Cycle"

        ├─ Lines still Draft → Block close → Show pending count → (back to inspection)

        └─ All lines resolved → Close Cycle → status \= Closed

                 → For each Missing line → Asset.state \= Lost

                 → Log Activity → Notify stakeholders → (end)

### 8.9 Notifications

(start) → Domain event occurs (allocation, approval, booking, overdue, discrepancy, etc.)

   → NotifiableMixin.notify() invoked → Create assetflow\_notification record

   → Push via bus.bus (real-time) \+ create mail.activity (persistent, actionable)

   → User views Notification Center → Marks as read / clicks through to source record → (end)

### 8.10 Reports

(start) → User opens Reports & Analytics → Selects report type (Utilization / Maintenance Freq /

   Due-for-maintenance / Dept Allocation / Booking Heatmap) → Applies filters (date range, department)

   → System queries reporting view (pivot/graph) → Renders chart/table

   → User optionally clicks "Export" → System generates PDF/XLSX via QWeb → Download → (end)

---

# PART 9 — SEQUENCE DIAGRAMS

### 9.1 Registration

Manager        WebClient        assetflow\_asset(ORM)      ir.sequence      PostgreSQL      NotifySvc

  │ fill form      │                    │                       │               │              │

  │───────────────►│                    │                       │               │              │

  │                │ create(vals)       │                       │               │              │

  │                │───────────────────►│                       │               │              │

  │                │                    │ next\_by\_code('asset') │               │              │

  │                │                    │──────────────────────►│               │              │

  │                │                    │◄──────────────────────│ AF-0001       │              │

  │                │                    │ INSERT INTO assetflow\_asset            │              │

  │                │                    │───────────────────────────────────────►│              │

  │                │                    │◄───────────────────────────────────────│ id            │

  │                │                    │ log\_action('register')                 │              │

  │                │                    │────────────────────────────────────────────────────────►│

  │                │◄───────────────────│ record                │               │              │

  │◄───────────────│ success \+ tag       │                       │               │              │

### 9.2 Allocation

Manager     WebClient     assetflow\_allocation(ORM)     assetflow\_asset      PostgreSQL     NotifySvc

  │ submit alloc │              │                              │                  │              │

  │──────────────►│              │                              │                  │              │

  │               │ create(vals)│                              │                  │              │

  │               │─────────────►│                              │                  │              │

  │               │              │ @api.constrains: check active allocation exists │              │

  │               │              │──────────────────────────────────────────────────►│              │

  │               │              │◄──────────────────────────────────────────────────│ none found   │

  │               │              │ INSERT allocation (status=active)               │              │

  │               │              │───────────────────────────────────────────────────►│              │

  │               │              │ asset.write(state='allocated')                    │              │

  │               │              │─────────────────────────────►│                     │              │

  │               │              │ log \+ notify(allocatee)                            │              │

  │               │              │──────────────────────────────────────────────────────────────────►│

  │               │◄─────────────│ ok                            │                     │              │

  │◄──────────────│ success       │                              │                     │              │

### 9.3 Transfer

Requester   WebClient    assetflow\_transfer\_request     assetflow\_allocation    Manager(approver)   NotifySvc

  │ request    │               │                                │                       │               │

  │───────────►│ create()      │                                │                       │               │

  │            │───────────────►│ status=requested               │                       │               │

  │            │                │ notify(manager)                │                       │               │

  │            │                │────────────────────────────────────────────────────────────────────────►│

  │            │                │                                                        │◄──────────────│ view

  │            │                │                                Manager clicks Approve   │

  │            │                │◄────────────────────────────────────────────────────────│

  │            │                │ action\_approve():                                       │

  │            │                │   old\_allocation.write(status='returned')               │

  │            │                │───────────────────────────────►│                        │

  │            │                │   new Allocation.create(status='active')                │

  │            │                │───────────────────────────────►│                        │

  │            │                │   self.status \= 'reallocated'                            │

  │            │                │   notify(old\_holder, new\_holder)                         │

  │            │                │──────────────────────────────────────────────────────────────────────────►│

### 9.4 Booking

User        WebClient        assetflow\_booking(ORM)          PostgreSQL         NotifySvc/Cron

  │ pick slot  │                    │                              │                  │

  │───────────►│ create(start,end)  │                              │                  │

  │            │───────────────────►│ @api.constrains overlap check│                  │

  │            │                    │ SELECT ... WHERE resource\_id=X AND status IN (upcoming,ongoing)

  │            │                    │   AND start \< :end AND end \> :start              │

  │            │                    │──────────────────────────────►│                  │

  │            │                    │◄──────────────────────────────│ 0 rows (ok)      │

  │            │                    │ INSERT booking (status=upcoming)                 │

  │            │                    │────────────────────────────────►│                  │

  │            │                    │ schedule reminder cron trigger                    │

  │            │                    │───────────────────────────────────────────────────►│

  │            │◄───────────────────│ success                       │                  │

  │◄───────────│ confirmed           │                              │                  │

### 9.5 Maintenance

Employee   WebClient   assetflow\_maintenance\_request   assetflow\_asset   Manager   NotifySvc

  │ raise    │               │                                │             │           │

  │─────────►│ create()      │                                │             │           │

  │          │───────────────►│ status=pending                │             │           │

  │          │                │ notify(manager)                │             │           │

  │          │                │─────────────────────────────────────────────────────────►│

  │          │                │                                            Manager approves

  │          │                │◄────────────────────────────────────────────│           │

  │          │                │ action\_approve():                            │           │

  │          │                │   asset.write(state='under\_maintenance')     │           │

  │          │                │──────────────────────────────►│              │           │

  │          │                │   status='approved'; notify(raiser)          │           │

  │          │                │───────────────────────────────────────────────────────────►│

  │          │                │  ... technician\_assigned → in\_progress → resolved         │

  │          │                │   on resolved: asset.write(state='available')             │

  │          │                │──────────────────────────────►│              │           │

### 9.6 Audit

Admin      WebClient   assetflow\_audit\_cycle    assetflow\_audit\_line    Auditor    assetflow\_asset

  │ create   │               │                          │                  │              │

  │─────────►│ create(scope) │                          │                  │              │

  │          │───────────────► generate lines for scope assets              │              │

  │          │               │─────────────────────────►│                  │              │

  │          │               │                          │◄─────────────────│ inspects & marks

  │          │               │                          │ result=missing → auto-create Discrepancy

  │          │               │                          │                  │              │

  │          │◄──────────────│ action\_close() \[after all lines resolved\]                    │

  │          │               │  for each missing line → asset.write(state='lost')          │

  │          │               │──────────────────────────────────────────────────────────────►│

  │          │               │  status='closed'; log \+ notify stakeholders                   │

---

# PART 10 — STATE DIAGRAMS

### 10.1 Asset Lifecycle

                         ┌────────────┐

              register   │            │  allocate

        ┌────────────────►  Available ◄───────────────┐

        │                │            │                │

        │                └─────┬──────┘                │

        │           book(resource)│  allocate            │ return / resolve

        │                        ▼                      │

        │                 ┌────────────┐          ┌─────┴──────┐

        │        cancel   │  Reserved  │          │ Allocated   │

        │       ◄─────────┤            │          │             │

        │                 └─────┬──────┘          └─────┬───────┘

        │                       │ maintenance approved     │ maintenance approved

        │                       ▼                          ▼

        │                 ┌───────────────────────────────────┐

        │       resolved  │        Under Maintenance            │

        │       ◄──────────┤                                     │

        │                 └───────────────┬─────────────────────┘

        │                                  │ audit: confirmed missing

        │                                  ▼

        │                          ┌──────────────┐   found/recovered   ┌────────────┐

        │                          │     Lost      │────────────────────►│ Available  │(manual admin action)

        │                          └──────┬─────────┘                    └────────────┘

        │                                 │ write-off

        │                                 ▼

        │                          ┌──────────────┐   dispose

        │                          │   Retired     │──────────────►┌──────────────┐

        └──────────────────────────┤ (admin action)│                │  Disposed     │ (terminal)

                                     └──────────────┘                └──────────────┘

**Guarded transitions:** `Available → Allocated` requires no active allocation exists; `Available/Allocated → Under Maintenance` requires an Approved maintenance request; `Under Maintenance → Available` requires Resolved status; `* → Lost` only via Audit Cycle closure with a Missing verification; `Retired/Disposed` are Admin-only manual terminal transitions and block all further allocation/booking.

### 10.2 Booking Lifecycle

        create (no overlap) ┌────────────┐  start\_datetime reached  ┌────────────┐

        ────────────────────► Upcoming    │────────────────────────►│  Ongoing    │

                             └─────┬──────┘                          └─────┬───────┘

                        cancel│                                    end\_datetime reached│

                               ▼                                              ▼

                        ┌────────────┐                              ┌────────────┐

                        │ Cancelled   │ (terminal)                  │ Completed   │ (terminal)

                        └────────────┘                              └────────────┘

### 10.3 Maintenance Lifecycle

   raise ┌──────────┐  approve  ┌───────────┐  assign  ┌──────────────────────┐  start work  ┌─────────────┐  resolve  ┌──────────┐

─────────►  Pending  │──────────► Approved   │─────────► Technician Assigned   │──────────────► In Progress │───────────► Resolved  │ (terminal)

         └────┬───────┘         └───────────┘          └──────────────────────┘               └─────────────┘           └──────────┘

              │ reject

              ▼

        ┌───────────┐

        │ Rejected  │ (terminal)

        └───────────┘

### 10.4 Audit Lifecycle

  create ┌──────────┐  lines generated / auditors start work  ┌──────────────┐  all lines resolved \+ close()  ┌──────────┐

─────────►  Draft    │───────────────────────────────────────► In Progress   │───────────────────────────────► Closed    │ (terminal)

         └──────────┘                                          └──────────────┘  (blocked if any line=draft)  └──────────┘

  Per-line sub-state:  Draft → {Verified | Missing | Damaged}   (Missing/Damaged auto-spawn Discrepancy Report)

---

# PART 11 — SCREEN WIREFRAMES

Each wireframe follows Odoo's native chrome: top **Header** (breadcrumb \+ app switcher \+ user menu), left **Sidebar** (app menu), and a content pane. ASCII sketches below represent the content pane only unless noted.

### 11.1 Login

┌─────────────────────────────────────────────┐

│                 AssetFlow Logo                │

│  ┌─────────────────────────────────────────┐ │

│  │ Email:    \[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]       │ │

│  │ Password: \[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]       │ │

│  │           \[ Login \]                       │ │

│  │  Forgot password? | Sign up               │ │

│  └─────────────────────────────────────────┘ │

└─────────────────────────────────────────────┘

- **Purpose:** Authenticate; realistic non-self-elevating signup.  
- **Components:** Email field, password field, Login button, Forgot Password link, Sign Up link.  
- **Buttons:** Login, Forgot Password, Sign Up.  
- **Validations:** Email format; required fields; lockout after N failed attempts (Odoo native).  
- **Business Rules:** Signup always creates Employee role only (BR-01).  
- **Navigation:** → Dashboard on success.  
- **Permissions:** Public (unauthenticated) screen.

### 11.2 Dashboard / Home

┌───────────────────────────────────────────────────────────────────┐

│ Header: AssetFlow | Dashboard          🔔(3)   👤 Manager Name ▾   │

├───────────┬───────────────────────────────────────────────────────┤

│ Sidebar   │ \[Available: 120\] \[Allocated: 340\] \[Maint. Today: 5\]   │

│ Dashboard │ \[Active Bookings: 12\] \[Pending Transfers: 2\] \[Returns: 7\]│

│ Org Setup │                                                        │

│ Assets    │ ⚠ Overdue Returns (4)         Upcoming Returns (7)     │

│ Allocation│ \[table\]                        \[table\]                 │

│ Booking   │                                                        │

│ Maint.    │ Quick Actions: \[Register Asset\] \[Book Resource\]        │

│ Audit     │                \[Raise Maintenance Request\]              │

│ Reports   │                                                        │

│ Notifs    │                                                        │

└───────────┴───────────────────────────────────────────────────────┘

- **Purpose:** Real-time operational snapshot per role.  
- **Components:** 6 KPI cards, Overdue table (highlighted red), Upcoming table, Quick Action buttons.  
- **Buttons:** Register Asset, Book Resource, Raise Maintenance Request.  
- **Validations:** N/A (read-only view); KPI cards computed via `read_group`.  
- **Business Rules:** Overdue \= past Expected Return/Booking End/Maintenance SLA (BR-09); scoped by role (Admin=org-wide, Manager=dept, Employee=personal).  
- **Navigation:** Cards/rows click through to source records.  
- **Permissions:** All roles, content scoped per `ir.rule`.

### 11.3 Organization Setup (Admin only, 3 tabs)

┌───────────────────────────────────────────────────────────────────┐

│ Tabs: \[Departments\] \[Asset Categories\] \[Employee Directory\]        │

├───────────────────────────────────────────────────────────────────┤

│ Tab A \- Departments                                                 │

│  \[+ New Department\]  Filter: \[Status ▾\]                            │

│  ┌───────────────────────────────────────────────────────────┐    │

│  │ Name       │ Parent Dept │ Head Manager │ Status │ Actions │    │

│  ├───────────────────────────────────────────────────────────┤    │

│  │ IT          │ —           │ R. Sharma    │ Active │ Edit    │    │

│  └───────────────────────────────────────────────────────────┘    │

└───────────────────────────────────────────────────────────────────┘

- **Purpose:** Maintain master data everything else depends on.  
- **Components:** Tab A (Department list/form: name, parent, head\_manager, status); Tab B (Category list/form: name, description, has\_warranty\_field toggle \+ dynamic extra fields); Tab C (Employee Directory list/form: name, email, department, role, status, "Promote to Manager" button).  
- **Buttons:** New Department/Category, Edit, Deactivate, Promote to Manager.  
- **Validations:** Department name unique; no circular parent hierarchy; category name unique; role change restricted to Admin group.  
- **Business Rules:** Role elevation only happens here (BR-01); this is the ONLY screen that writes to `res.groups`.  
- **Navigation:** Tab switch stays in-screen; department row → filtered Asset Directory.  
- **Permissions:** Admin only (full screen hidden from Manager/Employee menus).

### 11.4 Asset Registration & Directory

┌───────────────────────────────────────────────────────────────────┐

│ \[+ Register Asset\]   🔍\[Tag/Serial/QR\_\_\_\_\_\_\] Filters:\[Category▾\]\[Status▾\]\[Dept▾\]\[Location▾\] │

├───────────────────────────────────────────────────────────────────┤

│ Tag     │ Name        │ Category   │ Status     │ Dept  │ Location │

│ AF-0001 │ Dell Laptop │ Electronics│ Allocated  │ IT    │ Bldg A   │

│ AF-0002 │ Room B2     │ Rooms      │ Reserved   │ —     │ Floor 2  │

├───────────────────────────────────────────────────────────────────┤

│ Asset Detail Drawer: Photo | Tabs \[Details\]\[Allocation History\]\[Maintenance History\] │

└───────────────────────────────────────────────────────────────────┘

- **Purpose:** Register and centrally search/track assets.  
- **Components:** Register form (name, category, auto asset\_tag, serial, acquisition date/cost, condition, location, photo/docs, is\_bookable flag), search bar (tag/serial/QR), filter chips, list view, per-asset detail with Allocation & Maintenance history tabs.  
- **Buttons:** Register Asset, Edit, Scan QR, Deactivate/Retire.  
- **Validations:** Serial number unique if provided; required Name/Category/Location/Acquisition Date; barcode auto or scanned.  
- **Business Rules:** Asset Tag auto-generated (`ir.sequence`), never editable; Acquisition Cost hidden from Employee role.  
- **Navigation:** Row click → Asset Detail; "Allocate" quick action → Screen 11.5.  
- **Permissions:** Admin/Manager full CRUD; Employee read-only on assets in their allocation only.

### 11.5 Asset Allocation & Transfer

┌───────────────────────────────────────────────────────────────────┐

│ \[+ New Allocation\]                                                  │

│ Asset: \[AF-0114 Laptop ▾\]  Allocate To: (•)Employee ( )Department   │

│ Employee: \[Priya ▾\]   Expected Return Date: \[\_\_/\_\_/\_\_\_\_\]            │

│                     \[ Submit \]                                      │

│ ⚠ "AF-0114 is currently held by Priya Sharma."                     │

│    \[ Create Transfer Request \]                                       │

├───────────────────────────────────────────────────────────────────┤

│ Active Allocations table │ Transfer Requests table (Requested/Approved/Rejected/Reallocated) │

└───────────────────────────────────────────────────────────────────┘

- **Purpose:** Manage custody with explicit conflict rules.  
- **Components:** Allocation form, conflict-block banner, Transfer Request wizard (from/to, reason), Return wizard (condition check-in notes), Active Allocations list, Transfer Requests list.  
- **Buttons:** Allocate, Create Transfer Request, Approve/Reject Transfer, Mark Returned.  
- **Validations:** One active allocation per asset (BR-02/03); Expected Return Date ≥ today.  
- **Business Rules:** Allocating a held asset blocked, Transfer Request offered instead; Transfer approval only by scoped Manager/Admin; Return reverts asset to Available (BR-06).  
- **Navigation:** From Asset Directory "Allocate" quick action; row → detail; overdue rows link from Dashboard.  
- **Permissions:** Admin/Manager create & approve; Employee can only initiate Transfer/Return requests on their own allocations.

### 11.6 Resource Booking

┌───────────────────────────────────────────────────────────────────┐

│ Resource: \[Room B2 ▾\]         Calendar View:  ◄ Week of Jul 13 ►    │

│ ┌───────────────────────────────────────────────────────────────┐ │

│ │ 9:00 \[███ Booked \- Marketing Team ███\]                        │ │

│ │10:00 \[ open \]                                                   │ │

│ │10:30 \[ your request 10:00-11:00 → will be accepted \]           │ │

│ └───────────────────────────────────────────────────────────────┘ │

│ \[+ New Booking\]  Start:\[\_\_:\_\_\] End:\[\_\_:\_\_\]  \[ Submit \]              │

├───────────────────────────────────────────────────────────────────┤

│ My Bookings: Upcoming | Ongoing | Completed | Cancelled            │

└───────────────────────────────────────────────────────────────────┘

- **Purpose:** Time-slot booking of shared resources with zero overlap.  
- **Components:** Resource selector, weekly calendar view, new booking form, My Bookings list with status tabs, Cancel/Reschedule buttons.  
- **Buttons:** New Booking, Cancel, Reschedule.  
- **Validations:** `end > start`; overlap check against Upcoming/Ongoing bookings (BR-04); resource must be `is_bookable`.  
- **Business Rules:** Touching boundaries allowed (9-10 then 10-11 OK); reminder notification scheduled before start.  
- **Navigation:** From Dashboard "Book Resource" quick action; from Asset Directory bookable-asset row.  
- **Permissions:** All roles can create/cancel own bookings; Manager can book on behalf of department.

### 11.7 Maintenance Management

┌───────────────────────────────────────────────────────────────────┐

│ \[+ Raise Request\]                                                    │

│ Asset:\[AF-0044▾\] Issue:\[\_\_\_\_\_\_\_\_\_\_\_\] Priority:\[Medium▾\] Photo:\[📎\]   │

│                     \[ Submit \]                                        │

├───────────────────────────────────────────────────────────────────┤

│ Status Board (Kanban): Pending | Approved | Technician Assigned |    │

│                          In Progress | Resolved | Rejected            │

│ \[card: AF-0044 \- Screen flicker \- High priority\]                     │

└───────────────────────────────────────────────────────────────────┘

- **Purpose:** Route repairs through mandatory approval.  
- **Components:** Raise Request form, Kanban status board, per-request detail (assign technician, resolution notes), Maintenance History tab (mirrors on Asset Directory).  
- **Buttons:** Raise Request, Approve, Reject, Assign Technician, Mark In Progress, Mark Resolved.  
- **Validations:** Issue description required; priority required; asset must not already be `disposed/retired`.  
- **Business Rules:** Approval flips asset to Under Maintenance (BR-05); Resolved reverts to Available (BR-06).  
- **Navigation:** From Dashboard quick action; from Asset Detail "Raise Maintenance".  
- **Permissions:** Employee: raise \+ view own; Manager/Admin: approve/reject/assign/resolve.

### 11.8 Asset Audit

┌───────────────────────────────────────────────────────────────────┐

│ \[+ New Audit Cycle\]  Scope:\[Dept▾/Location\] Range:\[\_\_/\_\_ \- \_\_/\_\_\]   │

│ Auditors: \[Add Auditor ▾\]                        \[ Start Cycle \]    │

├───────────────────────────────────────────────────────────────────┤

│ Audit Lines: Tag │ Name │ Result(Verified/Missing/Damaged) │ Remarks │

│              AF-0001 │ Laptop │ \[ Verified ▾\]               │ \[\_\_\_\]  │

├───────────────────────────────────────────────────────────────────┤

│ Discrepancy Report (auto): AF-0032 Missing — \[Resolve\]               │

│                     \[ Close Audit Cycle \]  (disabled until all resolved)│

└───────────────────────────────────────────────────────────────────┘

- **Purpose:** Structured verification cycles with discrepancy reporting.  
- **Components:** Audit Cycle form (scope, date range, auditors), Audit Lines list (per-asset result dropdown \+ remarks), auto-generated Discrepancy Report list, Close button.  
- **Buttons:** Start Cycle, Mark Verified/Missing/Damaged, Resolve Discrepancy, Close Audit Cycle.  
- **Validations:** Close blocked while any line \= Draft (BR-07).  
- **Business Rules:** Missing on close → Asset.state \= Lost (BR-08); Audit history retained per cycle (read-only after close).  
- **Navigation:** From Dashboard/Reports; row → Discrepancy detail.  
- **Permissions:** Admin creates/closes; assigned Manager(auditor) verifies lines only.

### 11.9 Reports & Analytics

┌───────────────────────────────────────────────────────────────────┐

│ Report Type: \[Utilization▾\] Filters:\[Date Range\]\[Department\]\[Category\] │

│ ┌───────────────────────────────┐  ┌───────────────────────────┐   │

│ │  📊 Chart (pivot/graph view)   │  │  Table view                 │   │

│ └───────────────────────────────┘  └───────────────────────────┘   │

│                                                    \[ Export PDF/XLSX \]│

└───────────────────────────────────────────────────────────────────┘

- **Purpose:** Actionable operational insight for managers/admin.  
- **Components:** Report type selector (Utilization, Maintenance Frequency, Due-for-Maintenance/Retirement, Dept Allocation Summary, Booking Heatmap), filter bar, chart \+ pivot table, Export button.  
- **Buttons:** Export PDF, Export XLSX, Apply Filters.  
- **Validations:** Date range required for time-series reports.  
- **Business Rules:** Manager sees department-scoped data only; Admin sees org-wide.  
- **Navigation:** From sidebar "Reports"; drill-through from chart segment to underlying records.  
- **Permissions:** Admin (all), Manager (own department scope), Employee (no access).

### 11.10 Activity Logs & Notifications

┌───────────────────────────────────────────────────────────────────┐

│ Tabs: \[Notifications\] \[Activity Log (Admin/Manager only)\]           │

│ 🔔 Asset Assigned \- AF-0114 to you \- 2h ago            \[Mark Read\]   │

│ 🔔 Booking Reminder \- Room B2 in 30 min                \[Mark Read\]   │

├───────────────────────────────────────────────────────────────────┤

│ Activity Log: User │ Action │ Model │ Record │ Timestamp             │

│ R.Sharma │ approved\_transfer │ TransferRequest │ \#221 │ Jul 12 10:03 │

└───────────────────────────────────────────────────────────────────┘

- **Purpose:** Keep every role informed without digging.  
- **Components:** Notification list (unread badge), Mark Read/Mark All Read, Activity Log table (who/what/when) visible to Manager (own scope)/Admin (org-wide).  
- **Buttons:** Mark Read, Mark All Read, Filter by event type.  
- **Validations:** N/A (read/write of `is_read` only).  
- **Business Rules:** Notification types per SRS list (Asset Assigned, Maintenance Approved/Rejected, Booking Confirmed/Cancelled/Reminder, Transfer Approved, Overdue Return Alert, Audit Discrepancy Flagged).  
- **Navigation:** Notification click → source record; bell icon in header opens dropdown preview.  
- **Permissions:** Notifications: all roles (own only); Activity Log: Admin (all)/Manager (dept scope).

### 11.11 Settings

┌───────────────────────────────────────────────────────────────────┐

│ Tabs: \[My Profile\] \[Notification Preferences\] \[System (Admin)\]      │

│ My Profile: Name, Email, Password change                            │

│ System (Admin): Company info, Sequence prefix (AF-), Audit reminder cadence │

└───────────────────────────────────────────────────────────────────┘

- **Purpose:** Personal \+ system-level configuration.  
- **Components:** Profile fields, password change, notification channel toggles, (Admin) sequence/company/cron cadence config.  
- **Buttons:** Save, Change Password.  
- **Validations:** Password complexity (Odoo native), email format.  
- **Business Rules:** System tab hidden from non-Admin.  
- **Navigation:** From user menu (header).  
- **Permissions:** My Profile: all roles (own); System: Admin only.

---

# PART 12 — MENU STRUCTURE (Complete ERP Menu Tree)

AssetFlow

├── Dashboard

├── Organization Setup                         (Admin only)

│   ├── Departments

│   ├── Asset Categories

│   └── Employee Directory

├── Assets

│   ├── Asset Directory

│   ├── Register Asset

│   └── Asset Categories (shortcut, read-only for Manager)

├── Allocation & Transfer

│   ├── Active Allocations

│   ├── Transfer Requests

│   └── Return Processing

├── Resource Booking

│   ├── Booking Calendar

│   └── My Bookings

├── Maintenance

│   ├── Maintenance Requests (Kanban)

│   └── Maintenance History

├── Audit

│   ├── Audit Cycles

│   ├── Audit Lines (My Assigned)

│   └── Discrepancy Reports

├── Reports & Analytics

│   ├── Asset Utilization

│   ├── Maintenance Frequency

│   ├── Due for Maintenance / Retirement

│   ├── Department Allocation Summary

│   └── Booking Heatmap

├── Notifications

└── Settings

    ├── My Profile

    └── System Configuration                    (Admin only)

Menu items are registered via `ir.ui.menu` with `groups` attributes matching the Permission Matrix in Part 3.4; Odoo automatically hides inaccessible menu items per logged-in user's group.

---

# PART 13 — WORKFLOWS (Detailed)

## 13.1 End-to-End Onboarding Workflow

1. Admin logs in (seeded on install) → Organization Setup → creates Departments, Asset Categories.  
2. Admin promotes selected Employees (already signed up as Employee) to Manager, scoping each to department(s).  
3. Manager registers assets against categories/departments; each starts life as `Available`.  
4. Manager either allocates an asset to an employee/department, or flags it `is_bookable` for shared use.

## 13.2 Allocation & Conflict Workflow

Manager initiates Allocate → System validates no active allocation exists

   → PASS: create Allocation, asset→Allocated, notify

   → FAIL: block, show current holder, offer Transfer Request

       → Requester submits Transfer Request → routed to scoped Manager/Admin

       → Approve → atomic swap (old Returned / new Active) → notify both parties

       → Reject → requester notified, asset stays with current holder

**Business Rules:** BR-02, BR-03, BR-10. **Validation Rules:** partial unique index on `(asset_id) WHERE status='active'`. **Success Path:** allocation created / transfer completed. **Failure Path:** blocked creation with directive message. **Edge Cases:** simultaneous allocation attempts by two managers (handled by DB-level unique constraint, second request fails atomically, not by app-level race); allocation to a Retired/Disposed/Lost asset is blocked at the model layer regardless of active-allocation state.

## 13.3 Booking & Overlap Workflow

User selects resource \+ time slot → System runs overlap query against Upcoming/Ongoing bookings

   → No overlap: create Booking (Upcoming) → reminder scheduled

   → Overlap: reject, display conflicting booking window

Time progression (cron, every 5 min): Upcoming→Ongoing (start reached), Ongoing→Completed (end reached)

**Business Rules:** BR-04. **Validation Rules:** `end_datetime > start_datetime`; strict overlap `start < other.end AND end > other.start`. **Success Path:** booking confirmed. **Failure Path:** rejection with conflict details. **Edge Cases:** back-to-back bookings (9-10, 10-11) explicitly allowed; cancelling a booking frees the slot immediately for new requests; booking a non-bookable or disposed asset is blocked.

## 13.4 Maintenance Approval Workflow

Raise (Pending) → Manager decision

   → Approve: asset→Under Maintenance, status→Approved → Assign Technician → In Progress → Resolve → asset→Available

   → Reject: status→Rejected, asset unchanged, raiser notified

**Business Rules:** BR-05, BR-06. **Validation Rules:** cannot approve if asset already `Under Maintenance` (duplicate active request blocked); cannot resolve without prior Approved+In Progress. **Success Path:** asset returns to Available with logged history. **Failure Path:** Rejected requests remain visible in history for traceability. **Edge Cases:** asset requiring maintenance while actively allocated — asset flips to Under Maintenance regardless, holder notified; concurrent maintenance requests on the same asset are blocked once one is Approved.

## 13.5 Audit Cycle Workflow

Admin creates cycle (scope+range+auditors) → lines auto-generated for in-scope assets → In Progress

   → Auditors mark each line → Missing/Damaged auto-spawn Discrepancy Report (Open)

   → Manager/Admin resolves discrepancies (Resolved)

   → Close Cycle blocked until 100% lines have a result → Close → Missing lines cascade Asset.state=Lost

**Business Rules:** BR-07, BR-08. **Validation Rules:** unique `(audit_cycle_id, asset_id)` prevents duplicate lines. **Success Path:** cycle closed, all discrepancies logged, Lost assets flagged. **Failure Path:** close attempt blocked with count of pending lines. **Edge Cases:** asset scoped into two overlapping audit cycles is technically allowed (different cycles, different lines) but flagged as a soft warning; an asset already `Lost` from a prior cycle appearing again as `Missing` is a no-op (already in terminal-ish state, remains Lost).

# PART 14 — VALIDATIONS (Business Validation Catalogue)

| Domain | Validation | Enforcement Layer |
| :---- | :---- | :---- |
| Auth | Signup always creates Employee role (no role param accepted from signup form) | Controller \+ model default |
| Department | Name unique; no circular parent hierarchy | `_sql_constraints` \+ `@api.constrains` recursive check |
| Category | Name unique | `_sql_constraints` |
| Employee | Email unique; role changes writable only by Admin group | `_sql_constraints` \+ `ir.rule`/field `groups` |
| Asset | asset\_tag unique (system-generated, read-only); serial\_number unique if provided; required: name, category, location, acquisition\_date | `_sql_constraints` \+ field `required=True` |
| Asset Lifecycle | State transitions restricted to the graph in Part 10.1 | `@api.constrains` on `write()` override |
| Allocation | Only one active allocation per asset (BR-02/03); cannot allocate Retired/Disposed/Lost asset; Expected Return Date ≥ allocation date | Partial unique index \+ `@api.constrains` |
| Transfer | Approver must be Manager/Admin scoped to the asset's department (or Global Manager) | `ir.rule` on approve action |
| Booking | `end > start`; no overlap with Upcoming/Ongoing bookings on same resource; resource must have `is_bookable=True`; resource must not be Retired/Disposed | `@api.constrains` overlap query |
| Maintenance | Issue description required; cannot approve if asset already Under Maintenance from another active request; cannot resolve before Approved+In Progress | `@api.constrains` \+ state guard on `action_*` |
| Audit | Unique `(cycle, asset)` line; Close blocked unless all lines resolved (BR-07); date\_to ≥ date\_from | `_sql_constraints` \+ `action_close()` guard |
| Discrepancy | Auto-created only from Missing/Damaged line results; cannot be manually created standalone | model `create()` restricted to server action trigger |
| Notification | `is_read` toggle only by the owning `user_id` | `ir.rule` |
| Activity Log | Insert-only; no update/delete permitted for any role including Admin (immutability) | `ir.model.access.csv` (no write/unlink rights granted to any group) |
| Security | Role elevation only via Organization Setup → Employee Directory; no self-service group assignment anywhere else | `ir.rule` \+ hidden UI elsewhere |

---

# PART 15 — PROJECT STRUCTURE

## 15.1 Folder Structure (Odoo addons repo)

assetflow/

├── assetflow\_base/

├── assetflow\_org/

├── assetflow\_asset/

├── assetflow\_allocation/

├── assetflow\_booking/

├── assetflow\_maintenance/

├── assetflow\_audit/

├── assetflow\_notification/

├── assetflow\_reports/

├── requirements.txt

├── docker-compose.yml

└── README.md

## 15.2 Module Structure (example: assetflow\_asset)

assetflow\_asset/

├── \_\_init\_\_.py

├── \_\_manifest\_\_.py

├── models/

│   ├── \_\_init\_\_.py

│   └── asset.py

├── views/

│   ├── asset\_views.xml

│   └── asset\_menus.xml

├── security/

│   ├── ir.model.access.csv

│   └── asset\_security.xml        (record rules)

├── data/

│   ├── ir\_sequence\_data.xml

│   └── asset\_category\_defaults.xml

├── wizards/

│   └── asset\_retire\_wizard.py

├── report/

│   └── asset\_history\_report.xml

└── static/description/icon.png

## 15.3 Python Structure (example model skeleton)

\# models/asset.py

from odoo import models, fields, api

from odoo.exceptions import UserError

class AssetflowAsset(models.Model):

    \_name \= "assetflow.asset"

    \_description \= "AssetFlow Asset"

    \_inherit \= \["mail.thread", "assetflow.loggable.mixin", "assetflow.notifiable.mixin"\]

    asset\_tag \= fields.Char(required=True, copy=False, readonly=True, default=lambda s: s.\_default\_tag())

    name \= fields.Char(required=True)

    category\_id \= fields.Many2one("assetflow.category", required=True)

    serial\_number \= fields.Char()

    barcode \= fields.Char()

    acquisition\_date \= fields.Date(required=True)

    acquisition\_cost \= fields.Monetary(groups="assetflow.group\_manager")

    condition \= fields.Selection(\[...\], default="new")

    location \= fields.Char(required=True)

    department\_id \= fields.Many2one("assetflow.department")

    is\_bookable \= fields.Boolean()

    state \= fields.Selection(

        \[("available", "Available"), ("allocated", "Allocated"), ("reserved", "Reserved"),

         ("under\_maintenance", "Under Maintenance"), ("lost", "Lost"),

         ("retired", "Retired"), ("disposed", "Disposed")\],

        default="available", tracking=True)

    \_sql\_constraints \= \[

        ("asset\_tag\_uniq", "unique(asset\_tag)", "Asset Tag must be unique."),

        ("serial\_uniq", "unique(serial\_number)", "Serial Number must be unique."),

    \]

    def write(self, vals):

        if "state" in vals:

            self.\_check\_state\_transition(vals\["state"\])

        return super().write(vals)

## 15.4 XML Structure (example view skeleton)

\<\!-- views/asset\_views.xml \--\>

\<odoo\>

  \<record id="view\_asset\_list" model="ir.ui.view"\>

    \<field name="name"\>assetflow.asset.list\</field\>

    \<field name="model"\>assetflow.asset\</field\>

    \<field name="arch" type="xml"\>

      \<list decoration-danger="state=='lost'" decoration-muted="state in ('retired','disposed')"\>

        \<field name="asset\_tag"/\>

        \<field name="name"/\>

        \<field name="category\_id"/\>

        \<field name="state" widget="badge"/\>

        \<field name="department\_id"/\>

        \<field name="location"/\>

      \</list\>

    \</field\>

  \</record\>

  \<record id="action\_asset" model="ir.actions.act\_window"\>

    \<field name="name"\>Asset Directory\</field\>

    \<field name="res\_model"\>assetflow.asset\</field\>

    \<field name="view\_mode"\>list,form,kanban\</field\>

  \</record\>

\</odoo\>

## 15.5 Security Structure (example)

\# security/ir.model.access.csv

id,name,model\_id:id,group\_id:id,perm\_read,perm\_write,perm\_create,perm\_unlink

access\_asset\_admin,asset.admin,model\_assetflow\_asset,assetflow.group\_admin,1,1,1,1

access\_asset\_manager,asset.manager,model\_assetflow\_asset,assetflow.group\_manager,1,1,1,0

access\_asset\_employee,asset.employee,model\_assetflow\_asset,assetflow.group\_employee,1,0,0,0

\<\!-- security/asset\_security.xml \--\>

\<record id="rule\_asset\_manager\_dept" model="ir.rule"\>

  \<field name="name"\>Manager: own department assets\</field\>

  \<field name="model\_id" ref="model\_assetflow\_asset"/\>

  \<field name="groups" eval="\[(4, ref('assetflow.group\_manager'))\]"/\>

  \<field name="domain\_force"\>\[('department\_id.manager\_ids', 'in', \[user.employee\_id.id\])\]\</field\>

\</record\>

## 15.6 Manifest Structure

\# \_\_manifest\_\_.py

{

    "name": "AssetFlow \- Asset Directory",

    "version": "17.0.1.0.0",

    "category": "Operations/Asset Management",

    "summary": "Register and track organizational assets",

    "depends": \["assetflow\_base", "assetflow\_org", "assetflow\_notification"\],

    "data": \[

        "security/ir.model.access.csv",

        "security/asset\_security.xml",

        "data/ir\_sequence\_data.xml",

        "views/asset\_views.xml",

        "views/asset\_menus.xml",

    \],

    "application": False,

    "installable": True,

    "license": "LGPL-3",

}

---

# PART 16 — IMPLEMENTATION ROADMAP

## 16.1 Sprint Plan (mapped to Core → Supporting priority)

| Sprint | Focus | Modules |
| :---- | :---- | :---- |
| Sprint 0 | Environment setup, base module, security groups skeleton | `assetflow_base` |
| Sprint 1 | Master data \+ directory | `assetflow_org` |
| Sprint 2 | Asset lifecycle \+ registration | `assetflow_asset` |
| Sprint 3 | Allocation, conflict engine, transfer | `assetflow_allocation` |
| Sprint 4 | Booking \+ overlap engine | `assetflow_booking` |
| Sprint 5 | Maintenance workflow | `assetflow_maintenance` |
| Sprint 6 | Audit cycles \+ discrepancy | `assetflow_audit` |
| Sprint 7 | Notifications \+ activity log wiring | `assetflow_notification` |
| Sprint 8 | Dashboard \+ Reports \+ polish \+ demo prep | `assetflow_reports` |

## 16.2 Hackathon Timeline (illustrative 5-day sprint compression)

| Day | Deliverable |
| :---- | :---- |
| Day 1 | `assetflow_base` \+ `assetflow_org` complete; security groups live; Login/Signup working |
| Day 2 | `assetflow_asset` complete; Asset Directory \+ Registration screens functional |
| Day 3 | `assetflow_allocation` \+ `assetflow_booking` complete with conflict/overlap engines |
| Day 4 | `assetflow_maintenance` \+ `assetflow_audit` complete; Notifications wired |
| Day 5 | Dashboard \+ Reports; end-to-end QA; demo script rehearsal |

## 16.3 Team Split (suggested, adapt to team size)

| Track | Owner(s) | Modules |
| :---- | :---- | :---- |
| Platform/Security | 1 dev | `assetflow_base`, security groups, `ir.rule` |
| Master Data & Assets | 1-2 devs | `assetflow_org`, `assetflow_asset` |
| Allocation & Booking | 1-2 devs | `assetflow_allocation`, `assetflow_booking` |
| Maintenance & Audit | 1-2 devs | `assetflow_maintenance`, `assetflow_audit` |
| Notifications/Reports/Dashboard | 1 dev | `assetflow_notification`, `assetflow_reports` |
| UX/QA | 1 dev | Wireframe fidelity, demo data, cross-module testing |

## 16.4 Task Dependency & Critical Path

base ──► org ──► asset ──┬──► allocation ──┐

                          ├──► booking ──────┤──► audit ──► reports/dashboard

                          └──► maintenance ──┘

                notification (parallel, feeds every domain module from Sprint 1 onward)

**Critical Path:** `base → org → asset → allocation → audit → reports`. Booking and Maintenance can be built in parallel with Allocation once `asset` is stable, since none of the three depend on each other — only on `assetflow_asset` and `assetflow_notification`.

---

# PART 17 — EXCALIDRAW MASTER BOARD

A ready-to-import Excalidraw file (`AssetFlow_Excalidraw_Board.excalidraw`) is provided alongside this document. It contains **17 pre-arranged, color-coded, labeled frames** in a 4-column grid — one per required board section — so the board opens already organized, presentation-ready, and aligned. Excalidraw's native `.excalidraw` JSON format doesn't support pre-rendering complex UML/ER content programmatically at consulting-grade fidelity, so each frame is seeded with its title \+ a content pointer; use the guide below to redraw/paste each diagram from Parts 2–12 of this document directly into its matching frame (copy-paste from any diagramming tool, or hand-draw using the ASCII layouts above as your blueprint).

## 17.1 Frame-by-Frame Content Guide (color-coded by theme)

| \# | Frame (color) | Source Content |
| :---- | :---- | :---- |
| 1 | Overall Architecture *(blue)* | Part 2.1 system diagram |
| 2 | Module Architecture *(blue)* | Part 2.4 module dependency graph \+ Part 2.11 Core/Supporting/Future table |
| 3 | Deployment Diagram *(blue)* | Part 2.6 deployment architecture |
| 4 | Database ER Diagram *(green)* | Part 5 full ER diagram |
| 5 | Class Diagram *(green)* | Part 6 UML class diagram |
| 6 | Use Case Diagram *(green)* | Part 7 UML use case diagram |
| 7 | Role Matrix *(yellow)* | Part 3.4 permission matrix table |
| 8 | User Journey *(yellow)* | Part 3.1–3.3 per-role journeys, drawn as 3 parallel swimlanes |
| 9 | Menu Structure *(yellow)* | Part 12 menu tree |
| 10 | Allocation Flow *(pink)* | Part 8.3/8.4/8.5 activity diagrams \+ Part 9.2/9.3 sequence diagrams |
| 11 | Booking Flow *(pink)* | Part 8.6 activity diagram \+ Part 9.4 sequence diagram \+ Part 10.2 state diagram |
| 12 | Maintenance Flow *(pink)* | Part 8.7 activity diagram \+ Part 9.5 sequence diagram \+ Part 10.3 state diagram |
| 13 | Audit Flow *(pink)* | Part 8.8 activity diagram \+ Part 9.6 sequence diagram \+ Part 10.4 state diagram |
| 14 | Notification Flow *(purple)* | Part 8.9 activity diagram \+ Part 2.15 notification layer |
| 15 | Dashboard Mockup *(purple)* | Part 11.2 wireframe |
| 16 | Wireframes Overview *(purple)* | Thumbnail-style layout of all 11 screens from Part 11 |
| 17 | Folder Structure *(grey)* | Part 15.1–15.2 folder trees |

## 17.2 Board Usage Notes

- Open `AssetFlow_Excalidraw_Board.excalidraw` at app.excalidraw.com → **File → Open**.  
- Each frame is a first-class Excalidraw Frame element — moving/resizing a frame moves its contents together, and frames export individually if you need per-section slides.  
- Recommended palette (already applied to frame backgrounds): Architecture \= blue `#e7f5ff`, Data/UML \= green `#e6fcf5`, Roles/Navigation \= yellow `#fff9db`, Workflows \= pink `#fff0f6`, Ops/Notifications \= purple `#f3f0ff`, Code Structure \= grey `#f8f9fa`.  
- Suggested next step: paste the ASCII diagrams from this document into an intermediate tool (e.g. Mermaid Live Editor or draw.io) to get clean vector shapes, then import/trace those into the corresponding Excalidraw frame for the final polished board.


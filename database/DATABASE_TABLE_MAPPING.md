# AccessOne - Database Table to Function Mapping Matrix

**Project:** Corporate ID Card Issuing & Access Management System  
**Module:** SE2030 Software Engineering & Database Module (Year 2 Semester 1)  
**Group ID:** `2026-Y2-S1-MLB-B1G1-04`  

---

## 1. Executive Summary

The AccessOne database architecture consists of **26 total tables** (25 core tables defined in `V1__schema.sql` + 1 notification table in `V71__notifications.sql`), alongside **3 operational views**, **3 database triggers**, and **1 automated maintenance stored procedure**.

The tables are mapped directly across the **6 primary system functions** (individual functional components) and **1 shared core / security engine layer**.

---

## 2. Function-to-Database Tables Mapping Matrix

| # | System Function | Primary User Role / Member Role | Primary Database Tables | Supporting / Referenced Tables |
|---|---|---|---|---|
| **1** | **Employee Card Request & Status Tracking** | **Employee** (`EMPLOYEE`) | `card_requests`<br>`request_documents` | `employees`, `access_levels`, `users`, `id_cards` |
| **2** | **Card Request Verification & Approval Management** | **HR Manager** (`HR_MANAGER`) | `approvals`<br>`approval_comments` | `card_requests`, `employees`, `users`, `departments` |
| **3** | **Department, Area & Access Level Configuration** | **IT Administrator** (`IT_ADMIN`) | `departments`<br>`areas`<br>`access_levels`<br>`access_level_areas`<br>`card_access_assignments` | `id_cards`, `users` |
| **4** | **Card Generation — QR Code & NFC Payload Encoding** | **System / IT Admin** (`SYSTEM` / `IT_ADMIN`) | `id_cards`<br>`card_qr_nfc_data` | `card_requests`, `employees`, `access_levels` |
| **5** | **Visitor & Temporary Pass Management** | **Security Officer** (`SECURITY_OFFICER`) | `visitors`<br>`visitor_passes`<br>`visit_logs` | `employees`, `access_levels`, `areas`, `users` |
| **6** | **Print Production, Dispatch & Card Activation** | **Print Supervisor** (`PRINT_SUPERVISOR`) | `print_jobs`<br>`dispatch_records` | `id_cards`, `employees`, `users` |
| **7** | **Shared Security, Access Decision Engine & Audit** | **Security Officer / Admin / System** (`SECURITY_OFFICER`, `SYSTEM_ADMIN`) | `access_logs`<br>`blacklist`<br>`security_alerts`<br>`audit_logs`<br>`users`<br>`roles`<br>`permissions`<br>`role_permissions`<br>`employees`<br>`notifications` | Linked across all primary entities |

---

## 3. Detailed Breakdown by Function

---

### Function 1: Employee Card Request & Status Tracking
* **Primary Persona / Role:** Employee (`EMPLOYEE`)
* **Key Use Cases:**
  * Submit new, renewal, or lost replacement ID card requests.
  * Upload identity documents, photo proofs, and police reports.
  * Track real-time progress and history of submitted requests.
  * View current and previous digital card details.

#### Primary Tables:
1. `card_requests`
   * **Purpose:** Stores employee card requests with request type (`NEW`, `REPLACEMENT`, `RENEWAL`), reason, status transitions (`DRAFT`, `SUBMITTED`, `UNDER_VERIFICATION`, `APPROVED`, `REJECTED`, `WITHDRAWN`, `CANCELLED`), and timestamps.
   * **Foreign Keys:** `employee_id` &rarr; `employees(id)`, `requested_access_level_id` &rarr; `access_levels(id)`, `previous_card_id` &rarr; `id_cards(id)`, `created_by` &rarr; `users(id)`.
2. `request_documents`
   * **Purpose:** Stores binary metadata, file paths, and MIME types for uploaded files (`PHOTO`, `NIC_COPY`, `APPOINTMENT_LETTER`, `POLICE_REPORT`, `OTHER`).
   * **Foreign Keys:** `card_request_id` &rarr; `card_requests(id)`.

---

### Function 2: Card Request Verification & Approval Management
* **Primary Persona / Role:** HR Manager (`HR_MANAGER`)
* **Key Use Cases:**
  * Review submitted card requests in the pending queue.
  * Inspect attached identity documents and employment details.
  * Approve, reject, or request changes on card applications.
  * Add decision notes/comments.
  * Execute bulk approvals and handle employee exit/revocation workflows.

#### Primary Tables:
1. `approvals`
   * **Purpose:** Manages the formal approval workflow for each card request (`PENDING`, `VERIFIED`, `APPROVED`, `REJECTED`), storing timestamps and reviewer IDs.
   * **Foreign Keys:** `card_request_id` &rarr; `card_requests(id)`, `verified_by` &rarr; `users(id)`, `decided_by` &rarr; `users(id)`.
2. `approval_comments`
   * **Purpose:** Stores review discussions, audit comments, or rejection justifications recorded during the verification process.
   * **Foreign Keys:** `approval_id` &rarr; `approvals(id)`, `commented_by` &rarr; `users(id)`.

#### Database Views & Objects:
* `v_pending_request_queue` (View): Aggregates pending requests with turnaround time and ageing indicator (`NORMAL`, `AGEING`, `OVERDUE`).

---

### Function 3: Department, Area & Access Level Configuration
* **Primary Persona / Role:** IT Administrator (`IT_ADMIN`)
* **Key Use Cases:**
  * Manage corporate departments and structure.
  * Manage physical facility zones, buildings, and restricted rooms (`areas`).
  * Define named security access levels / profiles (`access_levels`).
  * Manage the permission matrix mapping access levels to areas (`access_level_areas`).
  * Assign or revoke specific access levels to employee cards (`card_access_assignments`).

#### Primary Tables:
1. `departments`
   * **Purpose:** Organizational departments (e.g., Engineering, HR, IT, Finance).
2. `areas`
   * **Purpose:** Physical security zones, building numbers, floor numbers, and restriction flags (`is_restricted`).
3. `access_levels`
   * **Purpose:** Access profiles grouping allowed zones (e.g., General Staff, Server Room Access, Executive Access).
4. `access_level_areas` *(Associative table)*
   * **Purpose:** Composite many-to-many link table mapping access levels to authorized physical areas.
   * **Foreign Keys:** `access_level_id` &rarr; `access_levels(id)`, `area_id` &rarr; `areas(id)`.
5. `card_access_assignments`
   * **Purpose:** Audit record and active assignment of access levels granted to issued ID cards over time.
   * **Foreign Keys:** `card_id` &rarr; `id_cards(id)`, `access_level_id` &rarr; `access_levels(id)`, `assigned_by` &rarr; `users(id)`.

---

### Function 4: Card Generation — QR Code & NFC Payload Encoding
* **Primary Persona / Role:** System / IT Administrator (`SYSTEM` / `IT_ADMIN`)
* **Key Use Cases:**
  * Automatic creation of ID card records upon request approval.
  * Cryptographic QR code generation with tamper-evident SHA-256 hash.
  * NFC digital payload formatting (`NDEF_TEXT`, `NDEF_URI`, `MIFARE_BLOCK`).
  * PDF card printing template data assembly.
  * Card lifecycle status management (`GENERATED`, `QUEUED_FOR_PRINT`, `PRINTED`, `DISPATCHED`, `ACTIVE`, `SUSPENDED`, `REVOKED`, `LOST`, `DAMAGED`, `VOID`, `REPLACED`).

#### Primary Tables:
1. `id_cards`
   * **Purpose:** Issued corporate ID card records, unique card serials (`CARD-YYYY-NNNNNN`), cardholder snapshot fields, version numbers, activation/revocation dates, and status.
   * **Foreign Keys:** `card_request_id` &rarr; `card_requests(id)`, `employee_id` &rarr; `employees(id)`, `access_level_id` &rarr; `access_levels(id)`, `replaced_by_card_id` &rarr; `id_cards(id)`.
2. `card_qr_nfc_data`
   * **Purpose:** Stores the generated QR payload, cryptographic SHA-256 hash (`qr_hash`), NFC payload, and encoding algorithm (`AES-256-GCM/BASE64`).
   * **Foreign Keys:** `card_id` &rarr; `id_cards(id)`.

#### Database Views & Triggers:
* `v_card_status_summary` (View): Department-level summary of active, revoked, lost, and in-progress cards.
* `trg_id_cards_status_audit` (Trigger): Automated trigger logging card state changes into `audit_logs`.
* `trg_id_cards_create_audit` (Trigger): Automated trigger logging card issuance into `audit_logs`.

---

### Function 5: Visitor & Temporary Pass Management
* **Primary Persona / Role:** Security Officer (`SECURITY_OFFICER`)
* **Key Use Cases:**
  * Register external visitors with national IDs, company, and host employee.
  * Issue temporary time-bound visitor passes with unique QR tokens.
  * Record visitor check-in and check-out logs.
  * Monitor real-time on-site visitor headcount and overdue visit alerts.
  * Automated pass expiry management.

#### Primary Tables:
1. `visitors`
   * **Purpose:** Master repository of external visitors, company affiliation, contact info, photo, and government identification (`NIC`, `PASSPORT`, `DRIVING_LICENCE`).
   * **Foreign Keys:** `host_employee_id` &rarr; `employees(id)`.
2. `visitor_passes`
   * **Purpose:** Temporary pass records containing pass numbers (`PASS-YYYY-NNNNNN`), strict time windows (`valid_from`, `valid_until`), assigned access level, and QR token.
   * **Foreign Keys:** `visitor_id` &rarr; `visitors(id)`, `host_employee_id` &rarr; `employees(id)`, `access_level_id` &rarr; `access_levels(id)`, `issued_by` &rarr; `users(id)`.
3. `visit_logs`
   * **Purpose:** Live and historical entry/exit records with check-in timestamp, check-out timestamp, entry gate area, and recording officer.
   * **Foreign Keys:** `visitor_pass_id` &rarr; `visitor_passes(id)`, `entry_area_id` &rarr; `areas(id)`, `recorded_by` &rarr; `users(id)`.

#### Database Views, Stored Procedures & Triggers:
* `v_current_visitors` (View): Active visitors currently inside the facility (`check_out_at IS NULL`), elapsed minutes, and overdue status.
* `sp_expire_visitor_passes` (Stored Procedure): Automated job procedure marking expired passes and closing open visit logs.
* `trg_visitor_passes_status_audit` (Trigger): Database trigger logging visitor pass status updates to `audit_logs`.

---

### Function 6: Print Production, Dispatch & Card Activation
* **Primary Persona / Role:** Print Supervisor (`PRINT_SUPERVISOR`)
* **Key Use Cases:**
  * Manage print queue and physical printer assignments.
  * Track card printing progress and handle reprint requests.
  * Record Quality Control (QC) inspection outcomes (`PASS`, `FAIL`).
  * Manage dispatch and delivery logistics (`COLLECTION`, `INTERNAL_MAIL`, `COURIER`).
  * Capture recipient employee signature and activate card upon handover.

#### Primary Tables:
1. `print_jobs`
   * **Purpose:** Print production queue records (`INITIAL`, `REPRINT`), printer assignments, print timestamps, QC outcome (`PENDING`, `PASS`, `FAIL`), and cancellation logs.
   * **Foreign Keys:** `card_id` &rarr; `id_cards(id)`, `created_by` &rarr; `users(id)`.
2. `dispatch_records`
   * **Purpose:** Tracks card delivery lifecycle (`PENDING`, `DISPATCHED`, `DELIVERED`, `RETURNED`), handover timestamp, signature image path, and receiving employee.
   * **Foreign Keys:** `print_job_id` &rarr; `print_jobs(id)`, `received_by_employee_id` &rarr; `employees(id)`.

---

### Shared Subsystems: Identity, Security Engine & Audit
* **Primary Persona / Role:** System Administrator (`SYSTEM_ADMIN`), Security Officer (`SECURITY_OFFICER`), Access Decision Engine (`SYSTEM`)
* **Key Use Cases:**
  * User authentication, password hashing (BCrypt), session handling, and RBAC authorization.
  * Turnstile/gate access decision validation (evaluates QR/NFC against active card status, validity window, blacklist, and area permissions).
  * Security incident tracking and blacklist barring.
  * Comprehensive immutable JSON audit logging and in-app user notifications.

#### Tables:
1. `employees`: Central employee master data (name, NIC, email, department, designation, status).
2. `users`: User login accounts and credentials.
3. `roles`: System role tiers (`EMPLOYEE`, `HR_MANAGER`, `IT_ADMIN`, `SECURITY_OFFICER`, `PRINT_SUPERVISOR`, `SYSTEM_ADMIN`).
4. `permissions`: Granular system authorization permission codes.
5. `role_permissions`: Associative role-to-permission mapping table.
6. `access_logs`: Immutable audit log recording every physical access attempt (`GRANTED` / `DENIED`, directional `IN`/`OUT`, denial reason, snapshot holder name).
7. `blacklist`: Restricts blacklisted cards or barred visitors from facility entry.
8. `security_alerts`: Automated alerts triggered by suspicious gate events (repeated denials, blacklisted scans, after-hours attempts).
9. `audit_logs`: Central compliance audit log tracking old/new entity state in JSON format.
10. `notifications`: In-app notification queue delivering alerts to users based on system events.

---

## 4. Entity-Relationship & Dependency Flow

```
[employees] <────────── [users] <────────── [roles] <─── [role_permissions] ───> [permissions]
     │                      │
     ├──────────┐           │
     ▼          ▼           ▼
[departments] [card_requests] ───> [request_documents]
                    │
                    ├───> [approvals] ───> [approval_comments]
                    │
                    ▼
               [id_cards] ────────> [card_qr_nfc_data]
                    │
                    ├───> [card_access_assignments] ───> [access_levels] ───> [access_level_areas] ───> [areas]
                    │                                          ▲
                    ├───> [print_jobs] ───> [dispatch_records] │
                    │                                          │
                    │   ┌──────────────────────────────────────┘
                    ▼   ▼
               [visitor_passes] ───> [visit_logs]
                    ▲
                    │
               [visitors]

Cross-Cutting / Engine:
[access_logs]  <── Evaluates credentials from [id_cards] & [visitor_passes] against [areas]
[blacklist]    <── Blocks specific [id_cards] or [visitors]
[security_alerts] <── Triggered by violations in [access_logs]
[audit_logs]   <── Database & application-level audit trail
[notifications]<── User-specific event notifications
```

---

## 5. Complete Table Reference List

| Table Name | Total Columns | Module / Function | Primary Purpose |
|---|---|---|---|
| `departments` | 7 | Function 3 / Org | Company departments |
| `roles` | 5 | Security / Auth | User system roles |
| `permissions` | 4 | Security / Auth | Granular permissions |
| `role_permissions` | 3 | Security / Auth | Role-permission join table |
| `employees` | 14 | Org / Core Master | Employee master records |
| `users` | 10 | Security / Auth | User login accounts |
| `areas` | 10 | Function 3 / Access | Physical facility areas/rooms |
| `access_levels` | 7 | Function 3 / Access | Access level profiles |
| `access_level_areas` | 3 | Function 3 / Access | Access level to area join table |
| `card_requests` | 14 | Function 1 (Employee) | Card issuance & renewal requests |
| `request_documents` | 8 | Function 1 (Employee) | Uploaded request attachments |
| `approvals` | 10 | Function 2 (HR) | Verification & approval workflow |
| `approval_comments` | 6 | Function 2 (HR) | Approval notes and discussions |
| `id_cards` | 17 | Function 4 (Card Gen) | Issued corporate ID cards |
| `card_qr_nfc_data` | 8 | Function 4 (Card Gen) | QR hash & NFC digital credentials |
| `card_access_assignments`| 8 | Function 3 / Function 4 | Card access level assignments |
| `print_jobs` | 13 | Function 6 (Print) | Card printing queue & QC |
| `dispatch_records` | 10 | Function 6 (Print) | Card delivery & employee handover |
| `visitors` | 14 | Function 5 (Visitor) | Visitor master data |
| `visitor_passes` | 14 | Function 5 (Visitor) | Temporary visitor passes |
| `visit_logs` | 8 | Function 5 (Visitor) | Check-in / check-out log records |
| `access_logs` | 13 | Security / Gate Engine| Gate access attempt audit log |
| `blacklist` | 9 | Security / Gate Engine| Barred cards and visitors |
| `security_alerts` | 10 | Security / Gate Engine| Automated security alarms |
| `audit_logs` | 10 | Shared Audit | Entity mutation audit history |
| `notifications` | 10 | Shared Notification | In-app user notifications |

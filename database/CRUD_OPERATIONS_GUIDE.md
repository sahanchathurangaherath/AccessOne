# AccessOne - Member-Wise CRUD Database Query Demonstration Guide

**Project:** Corporate ID Card Issuing & Access Management System  
**Module:** SE2030 Software Engineering & Database Module (Year 2 Semester 1)  
**Database:** Microsoft SQL Server (`accessone`) / SSMS / Azure Data Studio  
**SQL File:** [`database/CRUD_DEMO_QUERIES.sql`](./CRUD_DEMO_QUERIES.sql)

---

## Overview

This guide provides each of the **6 team members** with isolated, executable **CRUD (Create, Read, Update, Delete)** SQL queries tailored to their respective assigned functions and database tables.

---

## Member 1: Function 1 — Employee Card Request & Status Tracking
* **Role / User:** Employee (`EMPLOYEE`)
* **Database Tables:** `card_requests`, `request_documents`

### 1. CREATE (Insert New Card Request & Document Attachment)
```sql
-- Create a new draft card request
INSERT INTO dbo.card_requests (
    request_no, employee_id, request_type, reason,
    requested_access_level_id, status, submitted_at, created_by, created_at, updated_at
) VALUES (
    'REQ-DEMO-001', 7, 'NEW', 'Initial corporate smart ID card issuance',
    1, 'DRAFT', NULL, 7, SYSUTCDATETIME(), SYSUTCDATETIME()
);

-- Attach document metadata to the request
DECLARE @ReqId BIGINT = (SELECT id FROM dbo.card_requests WHERE request_no = 'REQ-DEMO-001');

INSERT INTO dbo.request_documents (
    card_request_id, document_type, file_name, file_path,
    mime_type, file_size_bytes, uploaded_at
) VALUES (
    @ReqId, 'PHOTO', 'passport_photo.jpg', '/uploads/requests/REQ-DEMO-001/photo.jpg',
    'image/jpeg', 245000, SYSUTCDATETIME()
);
```

### 2. READ (Query Requests with Document Attachments)
```sql
SELECT 
    r.id                AS request_id,
    r.request_no,
    r.request_type,
    r.status            AS request_status,
    r.reason,
    r.submitted_at,
    al.level_name       AS requested_level,
    d.document_type,
    d.file_name,
    d.file_size_bytes
FROM dbo.card_requests r
LEFT JOIN dbo.access_levels al     ON al.id = r.requested_access_level_id
LEFT JOIN dbo.request_documents d  ON d.card_request_id = r.id
WHERE r.request_no = 'REQ-DEMO-001';
```

### 3. UPDATE (Edit Draft & Submit Request)
```sql
UPDATE dbo.card_requests
   SET status       = 'SUBMITTED',
       submitted_at = SYSUTCDATETIME(),
       reason       = 'Initial corporate smart ID card issuance (Confirmed)',
       updated_at   = SYSUTCDATETIME()
 WHERE request_no   = 'REQ-DEMO-001'
   AND status       = 'DRAFT';
```

### 4. DELETE (Remove Document Attachment & Draft Request)
```sql
DELETE FROM dbo.request_documents
 WHERE card_request_id = (SELECT id FROM dbo.card_requests WHERE request_no = 'REQ-DEMO-001');

DELETE FROM dbo.card_requests
 WHERE request_no = 'REQ-DEMO-001';
```

---

## Member 2: Function 2 — Card Request Verification & Approval Management
* **Role / User:** HR Manager (`HR_MANAGER`)
* **Database Tables:** `approvals`, `approval_comments` *(and `v_pending_request_queue`)*

### 1. CREATE (Initiate Approval Record & Add Review Note)
```sql
-- Initiate approval record for submitted request
DECLARE @ReqId BIGINT = 1; -- Existing submitted request ID

INSERT INTO dbo.approvals (
    card_request_id, decision, verified_by, verified_at,
    decided_by, decided_at, rejection_reason, created_at, updated_at
) VALUES (
    @ReqId, 'PENDING', 2, SYSUTCDATETIME(),
    NULL, NULL, NULL, SYSUTCDATETIME(), SYSUTCDATETIME()
);

-- Add HR reviewer comment
DECLARE @ApprId BIGINT = (SELECT id FROM dbo.approvals WHERE card_request_id = @ReqId);

INSERT INTO dbo.approval_comments (
    approval_id, comment_text, commented_by, commented_at
) VALUES (
    @ApprId, 'Employee identity verified against HR records. Ready for approval.', 2, SYSUTCDATETIME()
);
```

### 2. READ (View Pending Approvals Queue with Comments)
```sql
SELECT 
    ap.id               AS approval_id,
    r.request_no,
    r.request_type,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    e.emp_id,
    ap.decision         AS approval_decision,
    u_ver.username      AS verified_by_user,
    ap.verified_at,
    ac.comment_text,
    ac.commented_at
FROM dbo.approvals ap
JOIN dbo.card_requests r          ON r.id = ap.card_request_id
JOIN dbo.employees e              ON e.id = r.employee_id
LEFT JOIN dbo.users u_ver         ON u_ver.id = ap.verified_by
LEFT JOIN dbo.approval_comments ac ON ac.approval_id = ap.id
WHERE ap.decision = 'PENDING';
```

### 3. UPDATE (Approve Request & Record Final Decision)
```sql
DECLARE @ReqId BIGINT = 1;

UPDATE dbo.approvals
   SET decision   = 'APPROVED',
       decided_by = 2,
       decided_at = SYSUTCDATETIME(),
       updated_at = SYSUTCDATETIME()
 WHERE card_request_id = @ReqId;

UPDATE dbo.card_requests
   SET status     = 'APPROVED',
       updated_at = SYSUTCDATETIME()
 WHERE id = @ReqId;
```

### 4. DELETE (Remove Comment / Reset Approval Record)
```sql
DECLARE @ApprId BIGINT = (SELECT id FROM dbo.approvals WHERE card_request_id = 1);

DELETE FROM dbo.approval_comments WHERE approval_id = @ApprId;
DELETE FROM dbo.approvals WHERE id = @ApprId;
```

---

## Member 3: Function 3 — Department, Area & Access Level Configuration
* **Role / User:** IT Administrator (`IT_ADMIN`)
* **Database Tables:** `departments`, `areas`, `access_levels`, `access_level_areas`, `card_access_assignments`

### 1. CREATE (Create Department, Area, Access Level & Mapping)
```sql
-- Insert Department and Area
INSERT INTO dbo.departments (dept_code, dept_name, description, is_active)
VALUES ('DEMO_DEPT', 'Robotics & Automation', 'Automated robotics and AI testing lab', 1);

INSERT INTO dbo.areas (area_code, area_name, building, floor_no, is_restricted, is_active, description)
VALUES ('AREA-DEMO-01', 'Robotics Lab Alpha', 'Tech Tower', '3rd Floor', 1, 1, 'High security lab');

-- Insert Access Level Profile
INSERT INTO dbo.access_levels (level_code, level_name, description, is_active)
VALUES ('LVL-ROBOTICS', 'Robotics Specialist Access', 'Grants entry to robotics test lab', 1);

-- Map Area to Access Level
DECLARE @LevelId BIGINT = (SELECT id FROM dbo.access_levels WHERE level_code = 'LVL-ROBOTICS');
DECLARE @AreaId  BIGINT = (SELECT id FROM dbo.areas WHERE area_code = 'AREA-DEMO-01');

INSERT INTO dbo.access_level_areas (access_level_id, area_id, created_at)
VALUES (@LevelId, @AreaId, SYSUTCDATETIME());

-- Assign Access Level to Employee ID Card (Card ID 1)
INSERT INTO dbo.card_access_assignments (
    card_id, access_level_id, assigned_by, valid_from, is_current, remarks
) VALUES (
    1, @LevelId, 3, CAST(SYSUTCDATETIME() AS DATE), 1, 'Assigned special project access'
);
```

### 2. READ (Query Permission Matrix & Assigned Access)
```sql
SELECT 
    al.id               AS access_level_id,
    al.level_code,
    al.level_name,
    a.area_code,
    a.area_name,
    a.building,
    a.floor_no,
    a.is_restricted
FROM dbo.access_levels al
JOIN dbo.access_level_areas ala ON ala.access_level_id = al.id
JOIN dbo.areas a                ON a.id = ala.area_id
WHERE al.level_code = 'LVL-ROBOTICS';
```

### 3. UPDATE (Modify Area Properties & Revoke Card Assignment)
```sql
UPDATE dbo.areas
   SET description   = 'Updated: High security hardware and firmware lab',
       is_restricted = 1,
       updated_at    = SYSUTCDATETIME()
 WHERE area_code     = 'AREA-DEMO-01';

-- Revoke card access assignment
DECLARE @LevelId BIGINT = (SELECT id FROM dbo.access_levels WHERE level_code = 'LVL-ROBOTICS');

UPDATE dbo.card_access_assignments
   SET is_current = 0,
       revoked_at = SYSUTCDATETIME(),
       remarks    = 'Revoked at project conclusion'
 WHERE card_id = 1 AND access_level_id = @LevelId;
```

### 4. DELETE (Remove Area Link & Configuration Records)
```sql
DECLARE @LevelId BIGINT = (SELECT id FROM dbo.access_levels WHERE level_code = 'LVL-ROBOTICS');
DECLARE @AreaId  BIGINT = (SELECT id FROM dbo.areas WHERE area_code = 'AREA-DEMO-01');

DELETE FROM dbo.card_access_assignments WHERE access_level_id = @LevelId;
DELETE FROM dbo.access_level_areas WHERE access_level_id = @LevelId;
DELETE FROM dbo.access_levels WHERE id = @LevelId;
DELETE FROM dbo.areas WHERE id = @AreaId;
DELETE FROM dbo.departments WHERE dept_code = 'DEMO_DEPT';
```

---

## Member 4: Function 4 — Card Generation — QR Code & NFC Payload Encoding
* **Role / User:** System / IT Administrator (`SYSTEM` / `IT_ADMIN`)
* **Database Tables:** `id_cards`, `card_qr_nfc_data`

### 1. CREATE (Generate New ID Card & Digital QR/NFC Credentials)
```sql
-- Generate ID Card Master
INSERT INTO dbo.id_cards (
    card_serial, card_request_id, employee_id, access_level_id,
    status, version_no, issue_date, activated_at,
    printed_name, printed_designation, printed_department, photo_path,
    created_at, updated_at
) VALUES (
    'CARD-2026-999001', 1, 7, 1,
    'GENERATED', 1, CAST(SYSUTCDATETIME() AS DATE), NULL,
    'Chaminda Rajapaksa', 'Senior Software Engineer', 'Engineering', '/uploads/photos/emp7.jpg',
    SYSUTCDATETIME(), SYSUTCDATETIME()
);

-- Generate Encoded QR & NFC Credential Payload
DECLARE @CardId BIGINT = (SELECT id FROM dbo.id_cards WHERE card_serial = 'CARD-2026-999001');

INSERT INTO dbo.card_qr_nfc_data (
    card_id, qr_payload, qr_hash, nfc_payload,
    nfc_format, encoding_algorithm, generated_at
) VALUES (
    @CardId,
    'ACC1:EMP:CARD-2026-999001:SIG_e9f1a2b3c4d5',
    'e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
    '{"serial":"CARD-2026-999001","emp_id":"EMP-007","ver":1,"sec_token":"tok_999001"}',
    'NDEF_TEXT', 'AES-256-GCM/BASE64', SYSUTCDATETIME()
);
```

### 2. READ (View Card Details & Encrypted Credential Payloads)
```sql
SELECT 
    c.id                AS card_id,
    c.card_serial,
    c.status            AS card_status,
    c.printed_name,
    c.printed_designation,
    c.printed_department,
    c.issue_date,
    q.qr_payload,
    q.qr_hash,
    q.nfc_format,
    q.encoding_algorithm
FROM dbo.id_cards c
JOIN dbo.card_qr_nfc_data q ON q.card_id = c.id
WHERE c.card_serial = 'CARD-2026-999001';
```

### 3. UPDATE (Lifecycle Transition — Activate or Revoke Card)
```sql
-- Activate Card
UPDATE dbo.id_cards
   SET status       = 'ACTIVE',
       activated_at = SYSUTCDATETIME(),
       updated_at   = SYSUTCDATETIME()
 WHERE card_serial  = 'CARD-2026-999001';

-- Revoke Card
UPDATE dbo.id_cards
   SET status            = 'REVOKED',
       revoked_at        = SYSUTCDATETIME(),
       revocation_reason = 'Card reported damaged by cardholder',
       updated_at        = SYSUTCDATETIME()
 WHERE card_serial       = 'CARD-2026-999001';
```

### 4. DELETE (Delete Digital Payload & Card Record)
```sql
DECLARE @CardId BIGINT = (SELECT id FROM dbo.id_cards WHERE card_serial = 'CARD-2026-999001');

DELETE FROM dbo.card_qr_nfc_data WHERE card_id = @CardId;
DELETE FROM dbo.id_cards WHERE id = @CardId;
```

---

## Member 5: Function 5 — Visitor & Temporary Pass Management
* **Role / User:** Security Officer (`SECURITY_OFFICER`)
* **Database Tables:** `visitors`, `visitor_passes`, `visit_logs` *(and `v_current_visitors`)*

### 1. CREATE (Register Visitor, Issue Pass & Log Entry)
```sql
-- Register Visitor
INSERT INTO dbo.visitors (
    visitor_code, full_name, id_document_no, id_document_type,
    company, phone, email, visitor_type, host_employee_id,
    photo_path, is_deleted, created_at, updated_at
) VALUES (
    'VIS-DEMO-001', 'Sunil Jayawardena', '198512345678', 'NIC',
    'Apex Technologies Ltd', '+94771234567', 'sunil.j@apex.com', 'VENDOR', 3,
    '/uploads/visitors/vis_demo.jpg', 0, SYSUTCDATETIME(), SYSUTCDATETIME()
);

-- Issue Temporary Pass
DECLARE @VisId BIGINT = (SELECT id FROM dbo.visitors WHERE visitor_code = 'VIS-DEMO-001');

INSERT INTO dbo.visitor_passes (
    pass_no, visitor_id, host_employee_id, access_level_id,
    purpose, valid_from, valid_until, status, qr_payload,
    issued_by, issued_at, created_at, updated_at
) VALUES (
    'PASS-DEMO-001', @VisId, 3, 1,
    'Vendor hardware maintenance and audit',
    SYSUTCDATETIME(), DATEADD(HOUR, 8, SYSUTCDATETIME()), 'ISSUED',
    'PASS:TOKEN:VIS-DEMO-001:VALID_8H', 4, SYSUTCDATETIME(),
    SYSUTCDATETIME(), SYSUTCDATETIME()
);

-- Record Check-in Log
DECLARE @PassId BIGINT = (SELECT id FROM dbo.visitor_passes WHERE pass_no = 'PASS-DEMO-001');

INSERT INTO dbo.visit_logs (
    visitor_pass_id, entry_area_id, check_in_at, check_out_at, recorded_by, remarks
) VALUES (
    @PassId, 1, SYSUTCDATETIME(), NULL, 4, 'Checked in at Main Reception Gate'
);
```

### 2. READ (View Active On-Site Visitors Currently Inside)
```sql
SELECT 
    vl.id                   AS visit_log_id,
    v.visitor_code,
    v.full_name             AS visitor_name,
    v.company,
    v.visitor_type,
    vp.pass_no,
    vp.status               AS pass_status,
    vp.valid_until,
    CONCAT(h.first_name, ' ', h.last_name) AS host_employee,
    vl.check_in_at,
    DATEDIFF(MINUTE, vl.check_in_at, SYSUTCDATETIME()) AS minutes_on_site
FROM dbo.visit_logs vl
JOIN dbo.visitor_passes vp ON vp.id = vl.visitor_pass_id
JOIN dbo.visitors v        ON v.id = vp.visitor_id
JOIN dbo.employees h       ON h.id = vp.host_employee_id
WHERE vl.check_out_at IS NULL;
```

### 3. UPDATE (Record Visitor Check-out / Exit & Close Pass)
```sql
DECLARE @PassId BIGINT = (SELECT id FROM dbo.visitor_passes WHERE pass_no = 'PASS-DEMO-001');

-- Record Check-out
UPDATE dbo.visit_logs
   SET check_out_at = SYSUTCDATETIME(),
       remarks      = 'Checked out normally via Main Gate'
 WHERE visitor_pass_id = @PassId
   AND check_out_at IS NULL;

-- Update Pass Status
UPDATE dbo.visitor_passes
   SET status     = 'RETURNED',
       updated_at = SYSUTCDATETIME()
 WHERE id = @PassId;
```

### 4. DELETE (Remove Visit Logs, Pass & Visitor Record)
```sql
DECLARE @PassId BIGINT = (SELECT id FROM dbo.visitor_passes WHERE pass_no = 'PASS-DEMO-001');
DECLARE @VisId  BIGINT = (SELECT id FROM dbo.visitors WHERE visitor_code = 'VIS-DEMO-001');

DELETE FROM dbo.visit_logs WHERE visitor_pass_id = @PassId;
DELETE FROM dbo.visitor_passes WHERE id = @PassId;
DELETE FROM dbo.visitors WHERE id = @VisId;
```

---

## Member 6: Function 6 — Print Production, Dispatch & Card Activation
* **Role / User:** Print Supervisor (`PRINT_SUPERVISOR`)
* **Database Tables:** `print_jobs`, `dispatch_records`

### 1. CREATE (Queue Print Job & Create Dispatch Record)
```sql
-- Queue Card Print Job
INSERT INTO dbo.print_jobs (
    job_no, card_id, job_type, status, printer_name,
    queued_at, printed_at, qc_result, qc_notes, created_by, created_at, updated_at
) VALUES (
    'JOB-DEMO-001', 1, 'INITIAL', 'QUEUED', 'Zebra ZXP Series 7 - Printer 01',
    SYSUTCDATETIME(), NULL, 'PENDING', NULL, 5, SYSUTCDATETIME(), SYSUTCDATETIME()
);

-- Create Dispatch Record
DECLARE @JobId BIGINT = (SELECT id FROM dbo.print_jobs WHERE job_no = 'JOB-DEMO-001');

INSERT INTO dbo.dispatch_records (
    print_job_id, dispatch_method, status, dispatched_at,
    received_by_employee_id, handed_over_at, handover_signature_path,
    remarks, created_at, updated_at
) VALUES (
    @JobId, 'COLLECTION', 'PENDING', NULL,
    NULL, NULL, NULL,
    'Scheduled for HR reception in-person collection',
    SYSUTCDATETIME(), SYSUTCDATETIME()
);
```

### 2. READ (View Print Queue & Dispatch Delivery Status)
```sql
SELECT 
    pj.id               AS print_job_id,
    pj.job_no,
    pj.job_type,
    pj.status           AS print_status,
    pj.printer_name,
    pj.qc_result,
    c.card_serial,
    c.printed_name,
    dr.dispatch_method,
    dr.status           AS dispatch_status,
    dr.remarks
FROM dbo.print_jobs pj
JOIN dbo.id_cards c             ON c.id = pj.card_id
JOIN dbo.dispatch_records dr    ON dr.print_job_id = pj.id
WHERE pj.job_no = 'JOB-DEMO-001';
```

### 3. UPDATE (Pass QC Inspection & Record Delivery Handover)
```sql
DECLARE @JobId BIGINT = (SELECT id FROM dbo.print_jobs WHERE job_no = 'JOB-DEMO-001');

-- Update Print Job QC
UPDATE dbo.print_jobs
   SET status     = 'QC_PASSED',
       qc_result  = 'PASS',
       printed_at = SYSUTCDATETIME(),
       qc_notes   = 'Color calibration and QR scanner readability 100% verified',
       updated_at = SYSUTCDATETIME()
 WHERE id = @JobId;

-- Record Handover / Delivery
UPDATE dbo.dispatch_records
   SET status                  = 'DELIVERED',
       dispatched_at           = SYSUTCDATETIME(),
       received_by_employee_id = 1,
       handed_over_at          = SYSUTCDATETIME(),
       handover_signature_path = '/uploads/signatures/sig_job_demo001.png',
       remarks                 = 'Collected by employee at security desk',
       updated_at              = SYSUTCDATETIME()
 WHERE print_job_id = @JobId;
```

### 4. DELETE (Remove Dispatch Record & Print Job)
```sql
DECLARE @JobId BIGINT = (SELECT id FROM dbo.print_jobs WHERE job_no = 'JOB-DEMO-001');

DELETE FROM dbo.dispatch_records WHERE print_job_id = @JobId;
DELETE FROM dbo.print_jobs WHERE id = @JobId;
```

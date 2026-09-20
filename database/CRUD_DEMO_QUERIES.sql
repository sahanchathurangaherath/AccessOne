-- =====================================================================
-- AccessOne - CRUD Demonstration Queries per Functional Module
-- Target: Microsoft SQL Server 2022 / SSMS / Azure Data Studio
--
-- This script provides standalone Create, Read, Update, and Delete (CRUD)
-- SQL queries organized by the 6 individual member functions.
--
-- Each member can execute their section independently to demonstrate
-- database operations on their respective tables.
-- =====================================================================

USE accessone;
GO

-- =====================================================================
-- MEMBER 1: FUNCTION 1 - EMPLOYEE CARD REQUEST & STATUS TRACKING
-- Primary Tables: card_requests, request_documents
-- Primary Role  : Employee (EMPLOYEE)
-- =====================================================================

PRINT '--- MEMBER 1: FUNCTION 1 - CARD REQUESTS & DOCUMENTS (CRUD) ---';

-- 1. [CREATE] Insert a new card request and upload supporting document metadata
-- Employee (ID: 7) requests a new ID card
INSERT INTO dbo.card_requests (
    request_no, employee_id, request_type, reason,
    requested_access_level_id, status, submitted_at, created_by, created_at, updated_at
) VALUES (
    'REQ-DEMO-001', 7, 'NEW', 'Initial corporate smart ID card issuance',
    1, 'DRAFT', NULL, 7, SYSUTCDATETIME(), SYSUTCDATETIME()
);

-- Attach photo document metadata to the created request
DECLARE @M1_ReqId BIGINT = (SELECT id FROM dbo.card_requests WHERE request_no = 'REQ-DEMO-001');

INSERT INTO dbo.request_documents (
    card_request_id, document_type, file_name, file_path,
    mime_type, file_size_bytes, uploaded_at
) VALUES (
    @M1_ReqId, 'PHOTO', 'passport_photo.jpg', '/uploads/requests/REQ-DEMO-001/photo.jpg',
    'image/jpeg', 245000, SYSUTCDATETIME()
);
GO

-- 2. [READ] Query submitted requests and their attached documents for an employee
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
GO

-- 3. [UPDATE] Modify draft details and submit the card request
UPDATE dbo.card_requests
   SET status       = 'SUBMITTED',
       submitted_at = SYSUTCDATETIME(),
       reason       = 'Initial corporate smart ID card issuance (Confirmed)',
       updated_at   = SYSUTCDATETIME()
 WHERE request_no   = 'REQ-DEMO-001'
   AND status       = 'DRAFT';
GO

-- 4. [DELETE] Delete an attached document or delete/withdraw a draft request
-- Delete the document attachment
DELETE FROM dbo.request_documents
 WHERE card_request_id = (SELECT id FROM dbo.card_requests WHERE request_no = 'REQ-DEMO-001');

-- Delete the card request record
DELETE FROM dbo.card_requests
 WHERE request_no = 'REQ-DEMO-001';
GO



-- =====================================================================
-- MEMBER 2: FUNCTION 2 - CARD REQUEST VERIFICATION & APPROVAL MANAGEMENT
-- Primary Tables: approvals, approval_comments
-- Primary Role  : HR Manager (HR_MANAGER)
-- =====================================================================

PRINT '--- MEMBER 2: FUNCTION 2 - APPROVALS & COMMENTS (CRUD) ---';

-- Setup temporary test request for Member 2 demonstration
INSERT INTO dbo.card_requests (
    request_no, employee_id, request_type, requested_access_level_id,
    status, submitted_at, created_by, created_at, updated_at
) VALUES (
    'REQ-DEMO-002', 1, 'NEW', 1, 'SUBMITTED', SYSUTCDATETIME(), 1, SYSUTCDATETIME(), SYSUTCDATETIME()
);

-- 1. [CREATE] Insert approval workflow record and initial review comment
DECLARE @M2_ReqId BIGINT = (SELECT id FROM dbo.card_requests WHERE request_no = 'REQ-DEMO-002');

INSERT INTO dbo.approvals (
    card_request_id, decision, verified_by, verified_at,
    decided_by, decided_at, rejection_reason, created_at, updated_at
) VALUES (
    @M2_ReqId, 'PENDING', 2, SYSUTCDATETIME(),
    NULL, NULL, NULL, SYSUTCDATETIME(), SYSUTCDATETIME()
);

DECLARE @M2_ApprId BIGINT = (SELECT id FROM dbo.approvals WHERE card_request_id = @M2_ReqId);

INSERT INTO dbo.approval_comments (
    approval_id, comment_text, commented_by, commented_at
) VALUES (
    @M2_ApprId, 'Employee identity verified against HR records. Ready for final approval.', 2, SYSUTCDATETIME()
);
GO

-- 2. [READ] View pending approval queue with comments and reviewer history
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
WHERE r.request_no = 'REQ-DEMO-002';
GO

-- 3. [UPDATE] Approve the request and update decision
DECLARE @M2_ReqId BIGINT = (SELECT id FROM dbo.card_requests WHERE request_no = 'REQ-DEMO-002');

UPDATE dbo.approvals
   SET decision   = 'APPROVED',
       decided_by = 2,
       decided_at = SYSUTCDATETIME(),
       updated_at = SYSUTCDATETIME()
 WHERE card_request_id = @M2_ReqId;

UPDATE dbo.card_requests
   SET status     = 'APPROVED',
       updated_at = SYSUTCDATETIME()
 WHERE id = @M2_ReqId;
GO

-- 4. [DELETE] Delete review comments and approval record
DECLARE @M2_ReqId BIGINT = (SELECT id FROM dbo.card_requests WHERE request_no = 'REQ-DEMO-002');
DECLARE @M2_ApprId BIGINT = (SELECT id FROM dbo.approvals WHERE card_request_id = @M2_ReqId);

DELETE FROM dbo.approval_comments WHERE approval_id = @M2_ApprId;
DELETE FROM dbo.approvals WHERE id = @M2_ApprId;
DELETE FROM dbo.card_requests WHERE id = @M2_ReqId;
GO



-- =====================================================================
-- MEMBER 3: FUNCTION 3 - DEPARTMENT & ACCESS LEVEL CONFIGURATION
-- Primary Tables: departments, areas, access_levels, access_level_areas, card_access_assignments
-- Primary Role  : IT Administrator (IT_ADMIN)
-- =====================================================================

PRINT '--- MEMBER 3: FUNCTION 3 - DEPARTMENTS, AREAS & ACCESS CONFIG (CRUD) ---';

-- 1. [CREATE] Insert new Department, Area, Access Level, and map Area to Access Level
INSERT INTO dbo.departments (dept_code, dept_name, description, is_active)
VALUES ('DEMO_DEPT', 'Robotics & Automation', 'Department for automated robotics and AI testing', 1);

INSERT INTO dbo.areas (area_code, area_name, building, floor_no, is_restricted, is_active, description)
VALUES ('AREA-DEMO-01', 'Robotics Lab Alpha', 'Tech Tower', '3rd Floor', 1, 1, 'High security hardware lab');

INSERT INTO dbo.access_levels (level_code, level_name, description, is_active)
VALUES ('LVL-ROBOTICS', 'Robotics Specialist Access', 'Grants entry to robotics lab and test facility', 1);

-- Map area to the new access level in associative table
DECLARE @M3_LevelId BIGINT = (SELECT id FROM dbo.access_levels WHERE level_code = 'LVL-ROBOTICS');
DECLARE @M3_AreaId  BIGINT = (SELECT id FROM dbo.areas WHERE area_code = 'AREA-DEMO-01');

INSERT INTO dbo.access_level_areas (access_level_id, area_id, created_at)
VALUES (@M3_LevelId, @M3_AreaId, SYSUTCDATETIME());

-- Assign access level to an existing ID card (Card ID 1)
INSERT INTO dbo.card_access_assignments (
    card_id, access_level_id, assigned_by, valid_from, is_current, remarks
) VALUES (
    1, @M3_LevelId, 3, CAST(SYSUTCDATETIME() AS DATE), 1, 'Assigned special project access'
);
GO

-- 2. [READ] Query the Permission Matrix (Access Levels -> Permitted Areas)
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
GO

-- 3. [UPDATE] Update area attributes and revoke a card access assignment
UPDATE dbo.areas
   SET description   = 'Updated: High security hardware and firmware lab',
       is_restricted = 1,
       updated_at    = SYSUTCDATETIME()
 WHERE area_code     = 'AREA-DEMO-01';

-- Revoke card access assignment
DECLARE @M3_LevelId BIGINT = (SELECT id FROM dbo.access_levels WHERE level_code = 'LVL-ROBOTICS');

UPDATE dbo.card_access_assignments
   SET is_current = 0,
       revoked_at = SYSUTCDATETIME(),
       remarks    = 'Revoked at project conclusion'
 WHERE card_id = 1 AND access_level_id = @M3_LevelId;
GO

-- 4. [DELETE] Remove card assignment, area mapping, and test entities
DECLARE @M3_LevelId BIGINT = (SELECT id FROM dbo.access_levels WHERE level_code = 'LVL-ROBOTICS');
DECLARE @M3_AreaId  BIGINT = (SELECT id FROM dbo.areas WHERE area_code = 'AREA-DEMO-01');

DELETE FROM dbo.card_access_assignments WHERE access_level_id = @M3_LevelId;
DELETE FROM dbo.access_level_areas WHERE access_level_id = @M3_LevelId;
DELETE FROM dbo.access_levels WHERE id = @M3_LevelId;
DELETE FROM dbo.areas WHERE id = @M3_AreaId;
DELETE FROM dbo.departments WHERE dept_code = 'DEMO_DEPT';
GO



-- =====================================================================
-- MEMBER 4: FUNCTION 4 - CARD GENERATION — QR & NFC PAYLOAD ENCODING
-- Primary Tables: id_cards, card_qr_nfc_data
-- Primary Role  : System / IT Administrator (SYSTEM / IT_ADMIN)
-- =====================================================================

PRINT '--- MEMBER 4: FUNCTION 4 - ID CARDS & QR/NFC ENCODING (CRUD) ---';

-- Setup temporary approved request for Member 4
INSERT INTO dbo.card_requests (
    request_no, employee_id, request_type, requested_access_level_id,
    status, submitted_at, created_by, created_at, updated_at
) VALUES (
    'REQ-DEMO-004', 7, 'NEW', 1, 'APPROVED', SYSUTCDATETIME(), 7, SYSUTCDATETIME(), SYSUTCDATETIME()
);

-- 1. [CREATE] Generate new ID Card and its digital QR/NFC credential payload
DECLARE @M4_ReqId BIGINT = (SELECT id FROM dbo.card_requests WHERE request_no = 'REQ-DEMO-004');

INSERT INTO dbo.id_cards (
    card_serial, card_request_id, employee_id, access_level_id,
    status, version_no, issue_date, activated_at,
    printed_name, printed_designation, printed_department, photo_path,
    created_at, updated_at
) VALUES (
    'CARD-2026-999001', @M4_ReqId, 7, 1,
    'GENERATED', 1, CAST(SYSUTCDATETIME() AS DATE), NULL,
    'Chaminda Rajapaksa', 'Senior Software Engineer', 'Engineering', '/uploads/photos/emp7.jpg',
    SYSUTCDATETIME(), SYSUTCDATETIME()
);

DECLARE @M4_CardId BIGINT = (SELECT id FROM dbo.id_cards WHERE card_serial = 'CARD-2026-999001');

INSERT INTO dbo.card_qr_nfc_data (
    card_id, qr_payload, qr_hash, nfc_payload,
    nfc_format, encoding_algorithm, generated_at
) VALUES (
    @M4_CardId,
    'ACC1:EMP:CARD-2026-999001:SIG_e9f1a2b3c4d5',
    'e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
    '{"serial":"CARD-2026-999001","emp_id":"EMP-007","ver":1,"sec_token":"tok_999001"}',
    'NDEF_TEXT', 'AES-256-GCM/BASE64', SYSUTCDATETIME()
);
GO

-- 2. [READ] Query card details with digital credential payloads
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
GO

-- 3. [UPDATE] Activate card or revoke card status
-- Transition card to ACTIVE upon physical handover
UPDATE dbo.id_cards
   SET status       = 'ACTIVE',
       activated_at = SYSUTCDATETIME(),
       updated_at   = SYSUTCDATETIME()
 WHERE card_serial  = 'CARD-2026-999001';

-- Example: Revoke card
UPDATE dbo.id_cards
   SET status            = 'REVOKED',
       revoked_at        = SYSUTCDATETIME(),
       revocation_reason = 'Employee transferred to international branch',
       updated_at        = SYSUTCDATETIME()
 WHERE card_serial       = 'CARD-2026-999001';
GO

-- 4. [DELETE] Delete digital credentials and ID card record
DECLARE @M4_CardId BIGINT = (SELECT id FROM dbo.id_cards WHERE card_serial = 'CARD-2026-999001');
DECLARE @M4_ReqId  BIGINT = (SELECT card_request_id FROM dbo.id_cards WHERE id = @M4_CardId);

DELETE FROM dbo.card_qr_nfc_data WHERE card_id = @M4_CardId;
DELETE FROM dbo.id_cards WHERE id = @M4_CardId;
IF @M4_ReqId IS NOT NULL DELETE FROM dbo.card_requests WHERE id = @M4_ReqId;
GO



-- =====================================================================
-- MEMBER 5: FUNCTION 5 - VISITOR & TEMPORARY PASS MANAGEMENT
-- Primary Tables: visitors, visitor_passes, visit_logs
-- Primary Role  : Security Officer (SECURITY_OFFICER)
-- =====================================================================

PRINT '--- MEMBER 5: FUNCTION 5 - VISITORS, PASSES & LOGS (CRUD) ---';

-- 1. [CREATE] Register visitor, issue temporary pass, and record gate check-in log
INSERT INTO dbo.visitors (
    visitor_code, full_name, id_document_no, id_document_type,
    company, phone, email, visitor_type, host_employee_id,
    photo_path, is_deleted, created_at, updated_at
) VALUES (
    'VIS-DEMO-001', 'Sunil Jayawardena', '198512345678', 'NIC',
    'Apex Technologies Ltd', '+94771234567', 'sunil.j@apex.com', 'VENDOR', 3,
    '/uploads/visitors/vis_demo.jpg', 0, SYSUTCDATETIME(), SYSUTCDATETIME()
);

DECLARE @M5_VisId BIGINT = (SELECT id FROM dbo.visitors WHERE visitor_code = 'VIS-DEMO-001');

INSERT INTO dbo.visitor_passes (
    pass_no, visitor_id, host_employee_id, access_level_id,
    purpose, valid_from, valid_until, status, qr_payload,
    issued_by, issued_at, created_at, updated_at
) VALUES (
    'PASS-DEMO-001', @M5_VisId, 3, 1,
    'Vendor hardware maintenance and audit',
    SYSUTCDATETIME(), DATEADD(HOUR, 8, SYSUTCDATETIME()), 'ISSUED',
    'PASS:TOKEN:VIS-DEMO-001:VALID_8H', 4, SYSUTCDATETIME(),
    SYSUTCDATETIME(), SYSUTCDATETIME()
);

DECLARE @M5_PassId BIGINT = (SELECT id FROM dbo.visitor_passes WHERE pass_no = 'PASS-DEMO-001');

INSERT INTO dbo.visit_logs (
    visitor_pass_id, entry_area_id, check_in_at, check_out_at, recorded_by, remarks
) VALUES (
    @M5_PassId, 1, SYSUTCDATETIME(), NULL, 4, 'Checked in at Main Reception Gate'
);
GO

-- 2. [READ] Query active on-site visitors currently inside building (check_out_at IS NULL)
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
WHERE vp.pass_no = 'PASS-DEMO-001';
GO

-- 3. [UPDATE] Record visitor checkout / exit and update pass status
DECLARE @M5_PassId BIGINT = (SELECT id FROM dbo.visitor_passes WHERE pass_no = 'PASS-DEMO-001');

UPDATE dbo.visit_logs
   SET check_out_at = SYSUTCDATETIME(),
       remarks      = 'Checked out normally via Main Gate'
 WHERE visitor_pass_id = @M5_PassId
   AND check_out_at IS NULL;

UPDATE dbo.visitor_passes
   SET status     = 'RETURNED',
       updated_at = SYSUTCDATETIME()
 WHERE id = @M5_PassId;
GO

-- 4. [DELETE] Delete visit logs, visitor passes, and visitor profile
DECLARE @M5_PassId BIGINT = (SELECT id FROM dbo.visitor_passes WHERE pass_no = 'PASS-DEMO-001');
DECLARE @M5_VisId  BIGINT = (SELECT id FROM dbo.visitors WHERE visitor_code = 'VIS-DEMO-001');

DELETE FROM dbo.visit_logs WHERE visitor_pass_id = @M5_PassId;
DELETE FROM dbo.visitor_passes WHERE id = @M5_PassId;
DELETE FROM dbo.visitors WHERE id = @M5_VisId;
GO



-- =====================================================================
-- MEMBER 6: FUNCTION 6 - PRINT PRODUCTION, DISPATCH & CARD ACTIVATION
-- Primary Tables: print_jobs, dispatch_records
-- Primary Role  : Print Supervisor (PRINT_SUPERVISOR)
-- =====================================================================

PRINT '--- MEMBER 6: FUNCTION 6 - PRINT JOBS & DISPATCH RECORDS (CRUD) ---';

-- 1. [CREATE] Queue a new card print job and create dispatch tracking record
-- Using existing generated card (Card ID 1) for demonstration
INSERT INTO dbo.print_jobs (
    job_no, card_id, job_type, status, printer_name,
    queued_at, printed_at, qc_result, qc_notes, created_by, created_at, updated_at
) VALUES (
    'JOB-DEMO-001', 1, 'INITIAL', 'QUEUED', 'Zebra ZXP Series 7 - Printer 01',
    SYSUTCDATETIME(), NULL, 'PENDING', NULL, 5, SYSUTCDATETIME(), SYSUTCDATETIME()
);

DECLARE @M6_JobId BIGINT = (SELECT id FROM dbo.print_jobs WHERE job_no = 'JOB-DEMO-001');

INSERT INTO dbo.dispatch_records (
    print_job_id, dispatch_method, status, dispatched_at,
    received_by_employee_id, handed_over_at, handover_signature_path,
    remarks, created_at, updated_at
) VALUES (
    @M6_JobId, 'COLLECTION', 'PENDING', NULL,
    NULL, NULL, NULL,
    'Scheduled for HR reception in-person collection',
    SYSUTCDATETIME(), SYSUTCDATETIME()
);
GO

-- 2. [READ] Query active print queue and dispatch handover records
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
GO

-- 3. [UPDATE] Update print job to PRINTED/QC_PASSED and record handover/delivery
DECLARE @M6_JobId BIGINT = (SELECT id FROM dbo.print_jobs WHERE job_no = 'JOB-DEMO-001');

-- Update print job as completed with QC passed
UPDATE dbo.print_jobs
   SET status     = 'QC_PASSED',
       qc_result  = 'PASS',
       printed_at = SYSUTCDATETIME(),
       qc_notes   = 'Color calibration and QR scanner readability 100% verified',
       updated_at = SYSUTCDATETIME()
 WHERE id = @M6_JobId;

-- Mark card as delivered/handed over to employee
UPDATE dbo.dispatch_records
   SET status                  = 'DELIVERED',
       dispatched_at           = SYSUTCDATETIME(),
       received_by_employee_id = 1,
       handed_over_at          = SYSUTCDATETIME(),
       handover_signature_path = '/uploads/signatures/sig_job_demo001.png',
       remarks                 = 'Collected by employee at security desk',
       updated_at              = SYSUTCDATETIME()
 WHERE print_job_id = @M6_JobId;
GO

-- 4. [DELETE] Delete dispatch records and print job record
DECLARE @M6_JobId BIGINT = (SELECT id FROM dbo.print_jobs WHERE job_no = 'JOB-DEMO-001');

DELETE FROM dbo.dispatch_records WHERE print_job_id = @M6_JobId;
DELETE FROM dbo.print_jobs WHERE id = @M6_JobId;
GO

PRINT '=====================================================================';
PRINT 'All CRUD Demonstration Queries executed successfully.';
PRINT '=====================================================================';

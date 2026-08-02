-- =====================================================================
-- AccessOne - V4__sample_data.sql
-- Target: Microsoft SQL Server 2022 or later
--
-- Initial Reference & Demonstration Seed Data Script
--
-- Note on Identity Seeding:
--   IDENTITY_INSERT is enabled temporarily for each table to allow deterministic
--   foreign key referencing across seed records. At the end of the script, DBCC CHECKIDENT
--   reseeds identity values so application runtime inserts continue seamlessly.
-- =====================================================================

-- Set session context for audit tracking during seed execution
EXEC sys.sp_set_session_context @key = N'app_username', @value = N'SEED_SCRIPT';


-- departments
SET IDENTITY_INSERT dbo.departments ON;
INSERT INTO departments (id, dept_code, dept_name, description) VALUES
(1, 'HR',  'Human Resources',        'Recruitment, employee relations, card approvals'),
(2, 'IT',  'Information Technology',  'Infrastructure, systems and access administration'),
(3, 'FIN', 'Finance',                 'Accounts, payroll and audit'),
(4, 'OPS', 'Operations',              'Day-to-day corporate operations'),
(5, 'SEC', 'Security',                'Physical security and access control'),
(6, 'MKT', 'Marketing',               'Brand, communications and campaigns'),
(7, 'ADM', 'Administration',          'Facilities, records and card production'),
(8, 'LOG', 'Logistics',               'Warehousing and distribution');
SET IDENTITY_INSERT dbo.departments OFF;


-- roles
SET IDENTITY_INSERT dbo.roles ON;
INSERT INTO roles (id, role_name, description) VALUES
(1, 'EMPLOYEE',         'Requests and tracks their own ID card'),
(2, 'HR_MANAGER',       'Verifies and approves card requests'),
(3, 'IT_ADMIN',         'Configures departments, areas and access levels'),
(4, 'SECURITY_OFFICER', 'Manages visitor passes, monitors access and revokes cards'),
(5, 'PRINT_SUPERVISOR', 'Runs print production, dispatch and handover'),
(6, 'SYSTEM_ADMIN',     'Full administrative access');
SET IDENTITY_INSERT dbo.roles OFF;


-- permissions
SET IDENTITY_INSERT dbo.permissions ON;
INSERT INTO permissions (id, permission_code, description) VALUES
(1,  'CARD_REQUEST_CREATE',   'Create a card request'),
(2,  'CARD_REQUEST_VIEW_OWN', 'View own card requests'),
(3,  'CARD_REQUEST_VIEW_ALL', 'View all card requests'),
(4,  'CARD_APPROVE',          'Approve a verified card request'),
(5,  'CARD_REJECT',           'Reject a card request'),
(6,  'CARD_GENERATE',         'Generate a card record, QR and NFC payload'),
(7,  'CARD_REVOKE',           'Revoke or suspend an issued card'),
(8,  'ACCESS_LEVEL_MANAGE',   'Create and modify access levels and areas'),
(9,  'PRINT_JOB_MANAGE',      'Manage the print queue and quality checks'),
(10, 'DISPATCH_MANAGE',       'Record dispatch and handover'),
(11, 'VISITOR_PASS_ISSUE',    'Register visitors and issue temporary passes'),
(12, 'ACCESS_LOG_VIEW',       'View access logs and security alerts'),
(13, 'AUDIT_LOG_VIEW',        'View the system audit trail'),
(14, 'USER_MANAGE',           'Create and manage user accounts');
SET IDENTITY_INSERT dbo.permissions OFF;


-- role_permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- EMPLOYEE
(1, 1), (1, 2),
-- HR_MANAGER
(2, 1), (2, 3), (2, 4), (2, 5), (2, 12),
-- IT_ADMIN
(3, 3), (3, 6), (3, 8), (3, 12), (3, 13),
-- SECURITY_OFFICER
(4, 3), (4, 7), (4, 11), (4, 12),
-- PRINT_SUPERVISOR
(5, 3), (5, 9), (5, 10),
-- SYSTEM_ADMIN
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6), (6, 7),
(6, 8), (6, 9), (6, 10), (6, 11), (6, 12), (6, 13), (6, 14);


-- employees  (22)
SET IDENTITY_INSERT dbo.employees ON;
INSERT INTO employees
    (id, emp_id, first_name, last_name, nic, email, phone, designation,
     department_id, date_joined, date_left, employment_status) VALUES
(1,  'EMP0001', 'Ajith',    'Silva',          '197412345678V', 'ajith.silva@accessone.lk',      '+94112345001', 'Director of Corporate Operations',      4, '2012-03-01', NULL, 'ACTIVE'),
(2,  'EMP0002', 'Nadeesha', 'Perera',         '198523456789V', 'nadeesha.perera@accessone.lk',  '+94112345002', 'HR Operations Manager',                 1, '2015-06-15', NULL, 'ACTIVE'),
(3,  'EMP0003', 'Kasun',    'Jayasinghe',     '198834567890V', 'kasun.jayasinghe@accessone.lk', '+94112345003', 'IT Infrastructure Administrator',       2, '2017-01-09', NULL, 'ACTIVE'),
(4,  'EMP0004', 'Ruwani',   'Fernando',       '199045678901V', 'ruwani.fernando@accessone.lk',  '+94112345004', 'Security and Access Control Supervisor',5, '2018-04-02', NULL, 'ACTIVE'),
(5,  'EMP0005', 'Tharindu', 'Wickramaratne',  '199156789012V', 'tharindu.w@accessone.lk',       '+94112345005', 'ID Card Production Coordinator',        7, '2019-08-19', NULL, 'ACTIVE'),
(6,  'EMP0006', 'Dinesh',   'Gunawardena',    '198267890123V', 'dinesh.g@accessone.lk',         '+94112345006', 'Senior Employee Relations Officer',     1, '2014-02-10', NULL, 'ACTIVE'),
(7,  'EMP0007', 'Chamari',  'Rajapaksa',      '199378901234V', 'chamari.r@accessone.lk',        '+94112345007', 'Finance Executive',                     3, '2020-01-06', NULL, 'ACTIVE'),
(8,  'EMP0008', 'Suresh',   'Bandara',        '198989012345V', 'suresh.bandara@accessone.lk',   '+94112345008', 'Senior Accountant',                     3, '2016-11-21', NULL, 'ACTIVE'),
(9,  'EMP0009', 'Ishara',   'Weerasinghe',    '199490123456V', 'ishara.w@accessone.lk',         '+94112345009', 'Software Engineer',                     2, '2021-03-15', NULL, 'ACTIVE'),
(10, 'EMP0010', 'Malith',   'Ranasinghe',     '199501234567V', 'malith.r@accessone.lk',         '+94112345010', 'Network Engineer',                      2, '2021-07-01', NULL, 'ACTIVE'),
(11, 'EMP0011', 'Sanduni',  'Dissanayake',    '199612345670V', 'sanduni.d@accessone.lk',        '+94112345011', 'Marketing Executive',                   6, '2022-02-14', NULL, 'ACTIVE'),
(12, 'EMP0012', 'Pradeep',  'Kumara',         '198712345671V', 'pradeep.kumara@accessone.lk',   '+94112345012', 'Operations Supervisor',                 4, '2015-09-28', NULL, 'ACTIVE'),
(13, 'EMP0013', 'Hasini',   'Abeywickrama',   '199712345672V', 'hasini.a@accessone.lk',         '+94112345013', 'HR Assistant',                          1, '2022-06-06', NULL, 'ACTIVE'),
(14, 'EMP0014', 'Nuwan',    'Senanayake',     '199212345673V', 'nuwan.s@accessone.lk',          '+94112345014', 'Security Officer',                      5, '2019-11-11', NULL, 'ACTIVE'),
(15, 'EMP0015', 'Tharuka',  'Amarasinghe',    '199812345674V', 'tharuka.a@accessone.lk',        '+94112345015', 'Junior Accountant',                     3, '2023-01-16', NULL, 'ACTIVE'),
(16, 'EMP0016', 'Kavindu',  'Herath',         '199912345675V', 'kavindu.h@accessone.lk',        '+94112345016', 'Trainee Engineer',                      2, '2023-08-01', NULL, 'ACTIVE'),
(17, 'EMP0017', 'Dilani',   'Wijesinghe',     '199112345676V', 'dilani.w@accessone.lk',         '+94112345017', 'Administrative Officer',                7, '2018-05-21', NULL, 'ACTIVE'),
(18, 'EMP0018', 'Roshan',   'Gamage',         '198612345677V', 'roshan.gamage@accessone.lk',    '+94112345018', 'Logistics Manager',                     8, '2013-10-07', NULL, 'ACTIVE'),
(19, 'EMP0019', 'Amali',    'Karunaratne',    '199312345679V', 'amali.k@accessone.lk',          '+94112345019', 'Warehouse Coordinator',                 8, '2020-09-14', NULL, 'ACTIVE'),
(20, 'EMP0020', 'Lahiru',   'Ekanayake',      '199423456781V', 'lahiru.e@accessone.lk',         '+94112345020', 'Marketing Assistant',                   6, '2022-11-28', '2026-05-30', 'RESIGNED'),
(21, 'EMP0021', 'Sachini',  'Liyanage',       '199534567892V', 'sachini.l@accessone.lk',        '+94112345021', 'Operations Executive',                  4, '2021-04-19', NULL, 'ACTIVE'),
(22, 'EMP0022', 'Buddhika', 'Rathnayake',     '199045678903V', 'buddhika.r@accessone.lk',       '+94112345022', 'Facilities Officer',                    7, '2019-02-25', '2026-06-15', 'TERMINATED');
SET IDENTITY_INSERT dbo.employees OFF;


-- users   password for every account: Password@123
SET IDENTITY_INSERT dbo.users ON;
INSERT INTO users (id, username, password_hash, employee_id, role_id, is_active) VALUES
(1,  'admin',          '$2b$10$ofnyeE2UdKWKiDJpPhk2Eu89Tbgcqv7RMZHx3Pgj35wXX5pGraVbq', NULL, 6, 1),
(2,  'nperera',        '$2b$10$ofnyeE2UdKWKiDJpPhk2Eu89Tbgcqv7RMZHx3Pgj35wXX5pGraVbq', 2,    2, 1),
(3,  'kjayasinghe',    '$2b$10$ofnyeE2UdKWKiDJpPhk2Eu89Tbgcqv7RMZHx3Pgj35wXX5pGraVbq', 3,    3, 1),
(4,  'rfernando',      '$2b$10$ofnyeE2UdKWKiDJpPhk2Eu89Tbgcqv7RMZHx3Pgj35wXX5pGraVbq', 4,    4, 1),
(5,  'twickramaratne', '$2b$10$ofnyeE2UdKWKiDJpPhk2Eu89Tbgcqv7RMZHx3Pgj35wXX5pGraVbq', 5,    5, 1),
(6,  'dgunawardena',   '$2b$10$ofnyeE2UdKWKiDJpPhk2Eu89Tbgcqv7RMZHx3Pgj35wXX5pGraVbq', 6,    2, 1),
(7,  'crajapaksa',     '$2b$10$ofnyeE2UdKWKiDJpPhk2Eu89Tbgcqv7RMZHx3Pgj35wXX5pGraVbq', 7,    1, 1),
(8,  'iweerasinghe',   '$2b$10$ofnyeE2UdKWKiDJpPhk2Eu89Tbgcqv7RMZHx3Pgj35wXX5pGraVbq', 9,    1, 1),
(9,  'nsenanayake',    '$2b$10$ofnyeE2UdKWKiDJpPhk2Eu89Tbgcqv7RMZHx3Pgj35wXX5pGraVbq', 14,   4, 1),
(10, 'asilva',         '$2b$10$ofnyeE2UdKWKiDJpPhk2Eu89Tbgcqv7RMZHx3Pgj35wXX5pGraVbq', 1,    1, 1);
SET IDENTITY_INSERT dbo.users OFF;


-- areas
SET IDENTITY_INSERT dbo.areas ON;
INSERT INTO areas (id, area_code, area_name, building, floor_no, is_restricted, description) VALUES
(1,  'A-LOBBY',  'Main Lobby',        'Tower A', 'G',  0, 'Primary entry point'),
(2,  'A-REC',    'Reception',         'Tower A', 'G',  0, 'Visitor registration desk'),
(3,  'A-CAF',    'Cafeteria',         'Tower A', 'G',  0, 'Staff and escorted visitor dining'),
(4,  'A-F1-OPS', 'Operations Floor',  'Tower A', '1',  0, 'General office floor'),
(5,  'A-F2-FIN', 'Finance Floor',     'Tower A', '2',  1,  'Payroll and accounts records'),
(6,  'A-F3-HR',  'HR Floor',          'Tower A', '3',  1,  'Personnel files'),
(7,  'A-F4-MGT', 'Executive Floor',   'Tower A', '4',  1,  'Board and executive offices'),
(8,  'B-SRV',    'Server Room',       'Tower B', 'B1', 1,  'Core network equipment'),
(9,  'B-DC',     'Data Centre',       'Tower B', 'B2', 1,  'Primary data centre'),
(10, 'C-WH',     'Warehouse',         'Block C', 'G',  0, 'Logistics and stores');
SET IDENTITY_INSERT dbo.areas OFF;


-- access_levels
SET IDENTITY_INSERT dbo.access_levels ON;
INSERT INTO access_levels (id, level_code, level_name, description) VALUES
(1, 'AL-GEN',  'General Staff',        'Common areas and the general office floor'),
(2, 'AL-FIN',  'Finance Staff',        'General access plus the finance floor'),
(3, 'AL-HR',   'HR Staff',             'General access plus the HR floor'),
(4, 'AL-IT',   'IT Infrastructure',    'General access plus server room and data centre'),
(5, 'AL-EXEC', 'Executive',            'Unrestricted access to all areas'),
(6, 'AL-VIS',  'Visitor (Escorted)',   'Lobby, reception and cafeteria only');
SET IDENTITY_INSERT dbo.access_levels OFF;


-- access_level_areas
INSERT INTO access_level_areas (access_level_id, area_id) VALUES
-- AL-GEN
(1, 1), (1, 2), (1, 3), (1, 4),
-- AL-FIN
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5),
-- AL-HR
(3, 1), (3, 2), (3, 3), (3, 4), (3, 6),
-- AL-IT
(4, 1), (4, 2), (4, 3), (4, 4), (4, 8), (4, 9),
-- AL-EXEC
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6), (5, 7), (5, 8), (5, 9), (5, 10),
-- AL-VIS
(6, 1), (6, 2), (6, 3);


-- card_requests
SET IDENTITY_INSERT dbo.card_requests ON;
INSERT INTO card_requests
    (id, request_no, employee_id, request_type, reason, requested_access_level_id,
     photo_path, status, submitted_at, closed_at, created_by) VALUES
(1,  'REQ-2026-0001', 7,  'NEW', NULL, 2, '/photos/emp0007.jpg', 'APPROVED',           '2026-06-02 09:14:00', '2026-06-03 11:20:00', 7),
(2,  'REQ-2026-0002', 8,  'NEW', NULL, 2, '/photos/emp0008.jpg', 'APPROVED',           '2026-06-02 10:02:00', '2026-06-03 11:25:00', 2),
(3,  'REQ-2026-0003', 9,  'NEW', NULL, 4, '/photos/emp0009.jpg', 'APPROVED',           '2026-06-04 08:45:00', '2026-06-05 09:10:00', 8),
(4,  'REQ-2026-0004', 10, 'NEW', NULL, 4, '/photos/emp0010.jpg', 'APPROVED',           '2026-06-04 09:30:00', '2026-06-05 09:15:00', 2),
(5,  'REQ-2026-0005', 11, 'NEW', NULL, 1, '/photos/emp0011.jpg', 'APPROVED',           '2026-07-08 14:20:00', '2026-07-09 10:05:00', 2),
(6,  'REQ-2026-0006', 12, 'NEW', NULL, 1, '/photos/emp0012.jpg', 'APPROVED',           '2026-07-20 11:00:00', '2026-07-21 08:40:00', 2),
(7,  'REQ-2026-0007', 13, 'NEW', NULL, 3, '/photos/emp0013.jpg', 'SUBMITTED',          '2026-07-29 16:12:00', NULL, 2),
(8,  'REQ-2026-0008', 15, 'NEW', NULL, 2, '/photos/emp0015.jpg', 'UNDER_VERIFICATION', '2026-07-28 10:55:00', NULL, 2),
(9,  'REQ-2026-0009', 16, 'NEW', NULL, 4, NULL,                  'REJECTED',           '2026-07-15 13:40:00', '2026-07-16 09:00:00', 2),
(10, 'REQ-2026-0010', 17, 'REPLACEMENT', 'Original card lost while travelling on duty', 1, '/photos/emp0017.jpg', 'APPROVED', '2026-07-10 08:20:00', '2026-07-10 15:30:00', 2),
(11, 'REQ-2026-0011', 18, 'NEW', NULL, 1, NULL,                  'DRAFT',              NULL, NULL, 1),
(12, 'REQ-2026-0012', 19, 'NEW', NULL, 1, '/photos/emp0019.jpg', 'WITHDRAWN',          '2026-07-12 09:00:00', '2026-07-13 10:00:00', 1),
(13, 'REQ-2026-0013', 21, 'NEW', NULL, 1, '/photos/emp0021.jpg', 'CANCELLED',          '2026-07-05 11:30:00', '2026-07-06 14:00:00', 2),
(14, 'REQ-2026-0014', 22, 'NEW', NULL, 1, '/photos/emp0022.jpg', 'APPROVED',           '2026-03-11 09:00:00', '2026-03-12 10:00:00', 2),
(15, 'REQ-2026-0015', 17, 'NEW', NULL, 1, '/photos/emp0017.jpg', 'APPROVED',           '2026-02-04 10:15:00', '2026-02-05 09:45:00', 2);
SET IDENTITY_INSERT dbo.card_requests OFF;


-- request_documents
SET IDENTITY_INSERT dbo.request_documents ON;
INSERT INTO request_documents
    (id, card_request_id, document_type, file_name, file_path, mime_type, file_size_bytes) VALUES
(1, 1,  'PHOTO',              'emp0007.jpg',        '/uploads/photos/emp0007.jpg',      'image/jpeg',      184320),
(2, 1,  'NIC_COPY',           'nic_emp0007.pdf',    '/uploads/docs/nic_emp0007.pdf',    'application/pdf', 421888),
(3, 3,  'PHOTO',              'emp0009.jpg',        '/uploads/photos/emp0009.jpg',      'image/jpeg',      201728),
(4, 8,  'PHOTO',              'emp0015.jpg',        '/uploads/photos/emp0015.jpg',      'image/jpeg',      176128),
(5, 8,  'APPOINTMENT_LETTER', 'appt_emp0015.pdf',   '/uploads/docs/appt_emp0015.pdf',   'application/pdf', 312320),
(6, 10, 'POLICE_REPORT',      'loss_report_17.pdf', '/uploads/docs/loss_report_17.pdf', 'application/pdf', 289792),
(7, 10, 'PHOTO',              'emp0017.jpg',        '/uploads/photos/emp0017.jpg',      'image/jpeg',      192512);
SET IDENTITY_INSERT dbo.request_documents OFF;


-- approvals
SET IDENTITY_INSERT dbo.approvals ON;
INSERT INTO approvals
    (id, card_request_id, decision, verified_by, verified_at, decided_by, decided_at, rejection_reason) VALUES
(1,  1,  'APPROVED', 6, '2026-06-02 15:00:00', 2, '2026-06-03 11:20:00', NULL),
(2,  2,  'APPROVED', 6, '2026-06-02 15:20:00', 2, '2026-06-03 11:25:00', NULL),
(3,  3,  'APPROVED', 6, '2026-06-04 14:10:00', 2, '2026-06-05 09:10:00', NULL),
(4,  4,  'APPROVED', 6, '2026-06-04 14:25:00', 2, '2026-06-05 09:15:00', NULL),
(5,  5,  'APPROVED', 6, '2026-07-08 16:40:00', 2, '2026-07-09 10:05:00', NULL),
(6,  6,  'APPROVED', 6, '2026-07-20 15:15:00', 2, '2026-07-21 08:40:00', NULL),
(7,  7,  'PENDING',  NULL, NULL, NULL, NULL, NULL),
(8,  8,  'VERIFIED', 6, '2026-07-28 15:30:00', NULL, NULL, NULL),
(9,  9,  'REJECTED', 6, '2026-07-15 16:00:00', 2, '2026-07-16 09:00:00',
     'Submitted photograph does not meet the specification: background is not plain and the face is partly obscured. Please upload a compliant photograph and resubmit.'),
(10, 10, 'APPROVED', 6, '2026-07-10 11:00:00', 2, '2026-07-10 15:30:00', NULL),
(11, 12, 'PENDING',  NULL, NULL, NULL, NULL, NULL),
(12, 13, 'PENDING',  NULL, NULL, NULL, NULL, NULL),
(13, 14, 'APPROVED', 6, '2026-03-11 14:00:00', 2, '2026-03-12 10:00:00', NULL),
(14, 15, 'APPROVED', 6, '2026-02-04 15:30:00', 2, '2026-02-05 09:45:00', NULL);
SET IDENTITY_INSERT dbo.approvals OFF;


-- approval_comments
SET IDENTITY_INSERT dbo.approval_comments ON;
INSERT INTO approval_comments (id, approval_id, comment_text, commented_by, commented_at) VALUES
(1, 9,  'Photograph rejected at verification. Advised the employee by email with the photo specification attached.', 6, '2026-07-15 16:05:00'),
(2, 9,  'Employee acknowledged. Awaiting a fresh submission.',                                                      2, '2026-07-16 09:05:00'),
(3, 10, 'Police loss report attached and verified against the original card serial.',                               6, '2026-07-10 11:05:00'),
(4, 8,  'Appointment letter checked. Holding for the department head to confirm the access level.',                  6, '2026-07-28 15:35:00');
SET IDENTITY_INSERT dbo.approval_comments OFF;


-- id_cards
SET IDENTITY_INSERT dbo.id_cards ON;
INSERT INTO id_cards
    (id, card_serial, card_request_id, employee_id, access_level_id, status, version_no,
     issue_date, activated_at, revoked_at, revocation_reason, replaced_by_card_id,
     printed_name, printed_designation, printed_department, photo_path) VALUES
(1, 'ACO-2026-000001', 1,  7,  2, 'ACTIVE',           1, '2026-06-03', '2026-06-06 10:15:00', NULL, NULL, NULL, 'Chamari Rajapaksa',   'Finance Executive',      'Finance',        '/photos/emp0007.jpg'),
(2, 'ACO-2026-000002', 2,  8,  2, 'ACTIVE',           1, '2026-06-03', '2026-06-06 10:20:00', NULL, NULL, NULL, 'Suresh Bandara',      'Senior Accountant',      'Finance',        '/photos/emp0008.jpg'),
(3, 'ACO-2026-000003', 3,  9,  4, 'ACTIVE',           1, '2026-06-05', '2026-06-09 09:05:00', NULL, NULL, NULL, 'Ishara Weerasinghe',  'Software Engineer',      'Information Technology', '/photos/emp0009.jpg'),
(4, 'ACO-2026-000004', 4,  10, 4, 'ACTIVE',           1, '2026-06-05', '2026-06-09 09:10:00', NULL, NULL, NULL, 'Malith Ranasinghe',   'Network Engineer',       'Information Technology', '/photos/emp0010.jpg'),
(5, 'ACO-2026-000005', 5,  11, 1, 'PRINTED',          1, '2026-07-09', NULL, NULL, NULL, NULL, 'Sanduni Dissanayake', 'Marketing Executive',    'Marketing',      '/photos/emp0011.jpg'),
(6, 'ACO-2026-000006', 6,  12, 1, 'QUEUED_FOR_PRINT', 1, '2026-07-21', NULL, NULL, NULL, NULL, 'Pradeep Kumara',      'Operations Supervisor',  'Operations',     '/photos/emp0012.jpg'),
(7, 'ACO-2026-000007', 15, 17, 1, 'REPLACED',         1, '2026-02-05', '2026-02-09 08:50:00', NULL, NULL, NULL, 'Dilani Wijesinghe',   'Administrative Officer', 'Administration', '/photos/emp0017.jpg'),
(8, 'ACO-2026-000008', 10, 17, 1, 'ACTIVE',           2, '2026-07-10', '2026-07-14 09:30:00', NULL, NULL, NULL, 'Dilani Wijesinghe',   'Administrative Officer', 'Administration', '/photos/emp0017.jpg'),
(9, 'ACO-2026-000009', 14, 22, 1, 'REVOKED',          1, '2026-03-12', '2026-03-16 08:40:00', '2026-06-15 17:05:00', 'Employment terminated. Card revoked and blacklisted on the same day.', NULL, 'Buddhika Rathnayake', 'Facilities Officer', 'Administration', '/photos/emp0022.jpg');
SET IDENTITY_INSERT dbo.id_cards OFF;

-- Close the replacement chain: card 7 was superseded by card 8.
UPDATE id_cards SET replaced_by_card_id = 8 WHERE id = 7;

-- Link the replacement request back to the card it replaced.
UPDATE card_requests SET previous_card_id = 7 WHERE id = 10;


-- card_qr_nfc_data
SET IDENTITY_INSERT dbo.card_qr_nfc_data ON;
INSERT INTO card_qr_nfc_data
    (id, card_id, qr_payload, qr_hash, nfc_payload, nfc_format, generated_at) VALUES
(1, 1, 'ACO-2026-000001|V1|7f3a9c', CONVERT(NCHAR(64), HASHBYTES('SHA2_256', 'ACO-2026-000001|V1|7f3a9c'), 2), 'QUNPLTIwMjYtMDAwMDAxOjc=', 'NDEF_TEXT', '2026-06-03 11:22:00'),
(2, 2, 'ACO-2026-000002|V1|b41e07', CONVERT(NCHAR(64), HASHBYTES('SHA2_256', 'ACO-2026-000002|V1|b41e07'), 2), 'QUNPLTIwMjYtMDAwMDAyOjg=', 'NDEF_TEXT', '2026-06-03 11:27:00'),
(3, 3, 'ACO-2026-000003|V1|29dd5b', CONVERT(NCHAR(64), HASHBYTES('SHA2_256', 'ACO-2026-000003|V1|29dd5b'), 2), 'QUNPLTIwMjYtMDAwMDAzOjk=', 'NDEF_TEXT', '2026-06-05 09:12:00'),
(4, 4, 'ACO-2026-000004|V1|6c8f12', CONVERT(NCHAR(64), HASHBYTES('SHA2_256', 'ACO-2026-000004|V1|6c8f12'), 2), 'QUNPLTIwMjYtMDAwMDA0OjEw', 'NDEF_TEXT', '2026-06-05 09:17:00'),
(5, 5, 'ACO-2026-000005|V1|a017e4', CONVERT(NCHAR(64), HASHBYTES('SHA2_256', 'ACO-2026-000005|V1|a017e4'), 2), 'QUNPLTIwMjYtMDAwMDA1OjEx', 'NDEF_TEXT', '2026-07-09 10:07:00'),
(6, 6, 'ACO-2026-000006|V1|3b6620', CONVERT(NCHAR(64), HASHBYTES('SHA2_256', 'ACO-2026-000006|V1|3b6620'), 2), 'QUNPLTIwMjYtMDAwMDA2OjEy', 'NDEF_TEXT', '2026-07-21 08:42:00'),
(7, 7, 'ACO-2026-000007|V1|d5920a', CONVERT(NCHAR(64), HASHBYTES('SHA2_256', 'ACO-2026-000007|V1|d5920a'), 2), 'QUNPLTIwMjYtMDAwMDA3OjE3', 'NDEF_TEXT', '2026-02-05 09:47:00'),
(8, 8, 'ACO-2026-000008|V2|e88b31', CONVERT(NCHAR(64), HASHBYTES('SHA2_256', 'ACO-2026-000008|V2|e88b31'), 2), 'QUNPLTIwMjYtMDAwMDA4OjE3', 'NDEF_TEXT', '2026-07-10 15:32:00'),
(9, 9, 'ACO-2026-000009|V1|f4470d', CONVERT(NCHAR(64), HASHBYTES('SHA2_256', 'ACO-2026-000009|V1|f4470d'), 2), 'QUNPLTIwMjYtMDAwMDA5OjIy', 'NDEF_TEXT', '2026-03-12 10:02:00');
SET IDENTITY_INSERT dbo.card_qr_nfc_data OFF;


-- card_access_assignments
SET IDENTITY_INSERT dbo.card_access_assignments ON;
INSERT INTO card_access_assignments
    (id, card_id, access_level_id, assigned_by, valid_from, revoked_at, is_current, remarks) VALUES
(1,  1, 2, 3, '2026-06-03', NULL, 1,  'Finance floor access per department standard'),
(2,  2, 2, 3, '2026-06-03', NULL, 1,  'Finance floor access per department standard'),
(3,  3, 1, 3, '2026-06-05', '2026-06-20 10:00:00', 0, 'Initial general access on issue'),
(4,  3, 4, 3, '2026-06-20', NULL, 1,  'Upgraded to IT Infrastructure after data centre induction'),
(5,  4, 4, 3, '2026-06-05', NULL, 1,  'IT Infrastructure access on issue'),
(6,  5, 1, 3, '2026-07-09', NULL, 1,  'General staff access'),
(7,  6, 1, 3, '2026-07-21', NULL, 1,  'General staff access'),
(8,  7, 1, 3, '2026-02-05', '2026-07-10 15:35:00', 0, 'Withdrawn when the card was reported lost'),
(9,  8, 1, 3, '2026-07-10', NULL, 1,  'Replacement card, same access level as the original'),
(10, 9, 1, 3, '2026-03-12', '2026-06-15 17:05:00', 0, 'Revoked on termination');
SET IDENTITY_INSERT dbo.card_access_assignments OFF;


-- print_jobs   (11 — covers every status and both job types)
SET IDENTITY_INSERT dbo.print_jobs ON;
INSERT INTO print_jobs
    (id, job_no, card_id, job_type, status, printer_name, queued_at, printed_at,
     qc_result, qc_notes, cancelled_reason, created_by) VALUES
(1,  'PJ-2026-0001', 1, 'INITIAL', 'QC_PASSED', 'Zebra-ZC300-01', '2026-06-03 11:30:00', '2026-06-04 09:05:00', 'PASS', 'Print and lamination within tolerance', NULL, 5),
(2,  'PJ-2026-0002', 2, 'INITIAL', 'QC_PASSED', 'Zebra-ZC300-01', '2026-06-03 11:35:00', '2026-06-04 09:12:00', 'PASS', 'Print and lamination within tolerance', NULL, 5),
(3,  'PJ-2026-0003', 3, 'INITIAL', 'QC_FAILED', 'Zebra-ZC300-01', '2026-06-05 09:20:00', '2026-06-06 08:40:00', 'FAIL', 'Photograph printed with visible banding', NULL, 5),
(4,  'PJ-2026-0004', 3, 'REPRINT', 'QC_PASSED', 'Zebra-ZC300-02', '2026-06-06 09:00:00', '2026-06-08 10:15:00', 'PASS', 'Reprint accepted after printer head clean',  NULL, 5),
(5,  'PJ-2026-0005', 4, 'INITIAL', 'QC_PASSED', 'Zebra-ZC300-02', '2026-06-05 09:25:00', '2026-06-08 10:30:00', 'PASS', 'Print and lamination within tolerance', NULL, 5),
(6,  'PJ-2026-0006', 5, 'INITIAL', 'PRINTED',   'Zebra-ZC300-01', '2026-07-09 10:10:00', '2026-07-30 14:20:00', 'PENDING', NULL, NULL, 5),
(7,  'PJ-2026-0007', 6, 'INITIAL', 'QUEUED',    NULL,             '2026-07-21 08:45:00', NULL, 'PENDING', NULL, NULL, 5),
(8,  'PJ-2026-0008', 7, 'INITIAL', 'QC_PASSED', 'Zebra-ZC300-01', '2026-02-05 09:50:00', '2026-02-06 11:00:00', 'PASS', 'Print and lamination within tolerance', NULL, 5),
(9,  'PJ-2026-0009', 8, 'REPRINT', 'QC_PASSED', 'Zebra-ZC300-02', '2026-07-10 15:40:00', '2026-07-13 09:20:00', 'PASS', 'Replacement card, serial verified',    NULL, 5),
(10, 'PJ-2026-0010', 9, 'INITIAL', 'QC_PASSED', 'Zebra-ZC300-01', '2026-03-12 10:05:00', '2026-03-13 09:30:00', 'PASS', 'Print and lamination within tolerance', NULL, 5),
(11, 'PJ-2026-0011', 5, 'INITIAL', 'CANCELLED', NULL,             '2026-07-09 10:12:00', NULL, 'PENDING', NULL, 'Duplicate job raised for the same card in error', 5);
SET IDENTITY_INSERT dbo.print_jobs OFF;


-- dispatch_records   (1:1 with a print job)
SET IDENTITY_INSERT dbo.dispatch_records ON;
INSERT INTO dispatch_records
    (id, print_job_id, dispatch_method, status, dispatched_at,
     received_by_employee_id, handed_over_at, handover_signature_path, remarks) VALUES
(1, 1,  'COLLECTION',    'DELIVERED', '2026-06-05 15:00:00', 7,  '2026-06-06 10:15:00', '/signatures/dsp0001.png', 'Collected in person at the card desk'),
(2, 2,  'COLLECTION',    'DELIVERED', '2026-06-05 15:00:00', 8,  '2026-06-06 10:20:00', '/signatures/dsp0002.png', 'Collected in person at the card desk'),
(3, 4,  'INTERNAL_MAIL', 'DELIVERED', '2026-06-08 14:00:00', 9,  '2026-06-09 09:05:00', '/signatures/dsp0003.png', 'Delivered to the IT floor supervisor'),
(4, 5,  'INTERNAL_MAIL', 'DELIVERED', '2026-06-08 14:00:00', 10, '2026-06-09 09:10:00', '/signatures/dsp0004.png', 'Delivered to the IT floor supervisor'),
(5, 6,  'COLLECTION',    'PENDING',   NULL, NULL, NULL, NULL, 'Awaiting quality check before dispatch'),
(6, 8,  'COLLECTION',    'DELIVERED', '2026-02-06 15:30:00', 17, '2026-02-09 08:50:00', '/signatures/dsp0006.png', 'Collected in person at the card desk'),
(7, 9,  'COURIER',       'DELIVERED', '2026-07-13 11:00:00', 17, '2026-07-14 09:30:00', '/signatures/dsp0007.png', 'Replacement card delivered to the branch office'),
(8, 10, 'COLLECTION',    'DELIVERED', '2026-03-13 15:00:00', 22, '2026-03-16 08:40:00', '/signatures/dsp0008.png', 'Collected in person at the card desk');
SET IDENTITY_INSERT dbo.dispatch_records OFF;


-- visitors
SET IDENTITY_INSERT dbo.visitors ON;
INSERT INTO visitors
    (id, visitor_code, full_name, id_document_no, id_document_type, company,
     phone, email, visitor_type, host_employee_id, is_deleted) VALUES
(1, 'VIS-0001', 'Anura Peiris',        '197845612378V', 'NIC',      'ABC Consulting (Pvt) Ltd', '+94771234501', 'anura.peiris@abc.lk',    'GUEST',       1, 0),
(2, 'VIS-0002', 'Sunil Fernando',      '198756423190V', 'NIC',      'LankaTech Solutions',      '+94771234502', 'sunil.f@lankatech.lk',   'CONTRACTOR',  3, 0),
(3, 'VIS-0003', 'Menaka Silva',        '199034567812V', 'NIC',      'Ceylon Auditors',          '+94771234503', 'menaka.s@ceyaudit.lk',   'VENDOR',      8, 0),
(4, 'VIS-0004', 'James Whitfield',     'GB4471902',     'PASSPORT', 'Global Systems Ltd',       '+442071234567','j.whitfield@gsl.co.uk',  'GUEST',       1, 0),
(5, 'VIS-0005', 'Nimali Jayawardena',  '199723456789V', 'NIC',      NULL,                       '+94771234505', 'nimali.j@gmail.com',     'INTERVIEWEE', 2, 0),
(6, 'VIS-0006', 'Rangana Silva',       '198912345098V', 'NIC',      'QuickFix Services',        '+94771234506', 'rangana@quickfix.lk',    'CONTRACTOR',  5, 1);
SET IDENTITY_INSERT dbo.visitors OFF;


-- visitor_passes
-- Anchored to the current date so the "on site now" view is never empty.
SET IDENTITY_INSERT dbo.visitor_passes ON;
INSERT INTO visitor_passes
    (id, pass_no, visitor_id, host_employee_id, access_level_id, purpose,
     valid_from, valid_until, status, qr_payload, issued_by, issued_at, cancelled_reason) VALUES
(1, 'VP-2026-0001', 1, 1, 6, 'Quarterly operations review with the Director',
    DATEADD(SECOND, 28800, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), DATEADD(SECOND, 64800, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'ACTIVE',
    'VP-2026-0001|VIS|c19a4e', 4, DATEADD(SECOND, 28500, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), NULL),
(2, 'VP-2026-0002', 2, 3, 6, 'Scheduled network maintenance, escorted at all times',
    DATEADD(SECOND, 32400, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), DATEADD(SECOND, 61200, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'ACTIVE',
    'VP-2026-0002|VIS|7d02b8', 9, DATEADD(SECOND, 31800, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), NULL),
(3, 'VP-2026-0003', 3, 8, 6, 'External audit sampling visit',
    '2026-07-20 09:00:00', '2026-07-20 17:00:00', 'EXPIRED',
    'VP-2026-0003|VIS|4ba166', 4, '2026-07-20 08:45:00', NULL),
(4, 'VP-2026-0004', 4, 1, 6, 'Overseas partner introduction meeting',
    DATEADD(SECOND, 34200, CAST(DATEADD(DAY, 1, CAST(SYSUTCDATETIME() AS DATE)) AS DATETIME2(0))),
    DATEADD(SECOND, 57600, CAST(DATEADD(DAY, 1, CAST(SYSUTCDATETIME() AS DATE)) AS DATETIME2(0))), 'ISSUED',
    'VP-2026-0004|VIS|91ce03', 4, DATEADD(SECOND, 40800, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), NULL),
(5, 'VP-2026-0005', 5, 2, 6, 'Interview for the marketing assistant vacancy',
    '2026-07-28 10:00:00', '2026-07-28 13:00:00', 'RETURNED',
    'VP-2026-0005|VIS|2f7740', 9, '2026-07-28 09:50:00', NULL),
(6, 'VP-2026-0006', 6, 5, 6, 'Air conditioning servicing',
    '2026-07-15 08:00:00', '2026-07-15 17:00:00', 'CANCELLED',
    'VP-2026-0006|VIS|68d5a1', 4, '2026-07-14 16:00:00',
    'Contractor failed the site safety induction. Visit rescheduled.'),
(7, 'VP-2026-0007', 1, 1, 6, 'Follow-up document handover',
    '2026-07-30 10:00:00', '2026-07-30 12:00:00', 'SUSPENDED',
    'VP-2026-0007|VIS|0ac93f', 4, '2026-07-30 09:45:00', NULL);
SET IDENTITY_INSERT dbo.visitor_passes OFF;


-- visit_logs
-- Passes 1 and 2 have no check-out, so both visitors show as on site.
SET IDENTITY_INSERT dbo.visit_logs ON;
INSERT INTO visit_logs
    (id, visitor_pass_id, entry_area_id, check_in_at, check_out_at, recorded_by, remarks) VALUES
(1, 1, 1, DATEADD(SECOND, 29700, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), NULL,                                  9, 'Escorted to the executive floor by the host'),
(2, 2, 1, DATEADD(SECOND, 32700, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), NULL,                                  9, 'Escorted by IT throughout'),
(3, 3, 1, '2026-07-20 09:12:00', '2026-07-20 16:40:00',                            9, 'Audit sampling completed'),
(4, 5, 1, '2026-07-28 10:05:00', '2026-07-28 11:20:00',                            9, 'Interview concluded, pass returned at reception'),
(5, 7, 1, '2026-07-30 10:10:00', '2026-07-30 10:35:00',                            9, 'Pass suspended mid-visit pending host confirmation');
SET IDENTITY_INSERT dbo.visit_logs OFF;


-- access_logs
-- Both credential types, GRANTED and DENIED, every denial with a reason.
SET IDENTITY_INSERT dbo.access_logs ON;
INSERT INTO access_logs
    (id, credential_type, card_id, visitor_pass_id, area_id, credential_ref,
     holder_name, area_name, access_time, direction, decision, denial_reason) VALUES
-- Employee cards, granted
(1,  'EMPLOYEE_CARD', 1, NULL, 1, 'ACO-2026-000001', 'Chamari Rajapaksa',   'Main Lobby',       DATEADD(SECOND, 28920, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'GRANTED', NULL),
(2,  'EMPLOYEE_CARD', 1, NULL, 5, 'ACO-2026-000001', 'Chamari Rajapaksa',   'Finance Floor',    DATEADD(SECOND, 29160, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'GRANTED', NULL),
(3,  'EMPLOYEE_CARD', 2, NULL, 1, 'ACO-2026-000002', 'Suresh Bandara',      'Main Lobby',       DATEADD(SECOND, 29460, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'GRANTED', NULL),
(4,  'EMPLOYEE_CARD', 2, NULL, 5, 'ACO-2026-000002', 'Suresh Bandara',      'Finance Floor',    DATEADD(SECOND, 29640, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'GRANTED', NULL),
(5,  'EMPLOYEE_CARD', 3, NULL, 1, 'ACO-2026-000003', 'Ishara Weerasinghe',  'Main Lobby',       DATEADD(SECOND, 30600, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'GRANTED', NULL),
(6,  'EMPLOYEE_CARD', 3, NULL, 8, 'ACO-2026-000003', 'Ishara Weerasinghe',  'Server Room',      DATEADD(SECOND, 35100, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'GRANTED', NULL),
(7,  'EMPLOYEE_CARD', 3, NULL, 8, 'ACO-2026-000003', 'Ishara Weerasinghe',  'Server Room',      DATEADD(SECOND, 37200, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'OUT', 'GRANTED', NULL),
(8,  'EMPLOYEE_CARD', 4, NULL, 1, 'ACO-2026-000004', 'Malith Ranasinghe',   'Main Lobby',       DATEADD(SECOND, 30840, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'GRANTED', NULL),
(9,  'EMPLOYEE_CARD', 4, NULL, 9, 'ACO-2026-000004', 'Malith Ranasinghe',   'Data Centre',      DATEADD(SECOND, 39720, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'GRANTED', NULL),
(10, 'EMPLOYEE_CARD', 8, NULL, 1, 'ACO-2026-000008', 'Dilani Wijesinghe',   'Main Lobby',       DATEADD(SECOND, 31620, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'GRANTED', NULL),
(11, 'EMPLOYEE_CARD', 8, NULL, 3, 'ACO-2026-000008', 'Dilani Wijesinghe',   'Cafeteria',        DATEADD(SECOND, 44100, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'GRANTED', NULL),

-- Employee cards, denied
(12, 'EMPLOYEE_CARD', 1, NULL, 8, 'ACO-2026-000001', 'Chamari Rajapaksa',   'Server Room',      DATEADD(SECOND, 36300, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'DENIED',  'AREA_NOT_IN_ACCESS_LEVEL'),
(13, 'EMPLOYEE_CARD', 2, NULL, 7, 'ACO-2026-000002', 'Suresh Bandara',      'Executive Floor',  DATEADD(SECOND, 38400, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'DENIED',  'AREA_NOT_IN_ACCESS_LEVEL'),
(14, 'EMPLOYEE_CARD', 5, NULL, 1, 'ACO-2026-000005', 'Sanduni Dissanayake', 'Main Lobby',       DATEADD(SECOND, 33600, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'DENIED',  'CARD_NOT_ACTIVATED'),
(15, 'EMPLOYEE_CARD', 7, NULL, 1, 'ACO-2026-000007', 'Dilani Wijesinghe',   'Main Lobby',       '2026-07-12 08:40:00',            'IN',  'DENIED',  'CARD_REPLACED'),
(16, 'EMPLOYEE_CARD', 9, NULL, 1, 'ACO-2026-000009', 'Buddhika Rathnayake', 'Main Lobby',       '2026-06-16 08:05:00',            'IN',  'DENIED',  'CARD_REVOKED'),
(17, 'EMPLOYEE_CARD', 9, NULL, 1, 'ACO-2026-000009', 'Buddhika Rathnayake', 'Main Lobby',       '2026-06-16 08:06:00',            'IN',  'DENIED',  'CARD_REVOKED'),
(18, 'EMPLOYEE_CARD', 9, NULL, 1, 'ACO-2026-000009', 'Buddhika Rathnayake', 'Main Lobby',       '2026-06-16 08:07:00',            'IN',  'DENIED',  'CREDENTIAL_BLACKLISTED'),

-- Visitor passes, granted
(19, 'VISITOR_PASS', NULL, 1, 1, 'VP-2026-0001', 'Anura Peiris',      'Main Lobby', DATEADD(SECOND, 29700, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'GRANTED', NULL),
(20, 'VISITOR_PASS', NULL, 1, 3, 'VP-2026-0001', 'Anura Peiris',      'Cafeteria',  DATEADD(SECOND, 45000, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'GRANTED', NULL),
(21, 'VISITOR_PASS', NULL, 2, 1, 'VP-2026-0002', 'Sunil Fernando',    'Main Lobby', DATEADD(SECOND, 32700, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN',  'GRANTED', NULL),
(22, 'VISITOR_PASS', NULL, 3, 1, 'VP-2026-0003', 'Menaka Silva',      'Main Lobby', '2026-07-20 09:12:00',            'IN',  'GRANTED', NULL),

-- Visitor passes, denied
(23, 'VISITOR_PASS', NULL, 2, 8, 'VP-2026-0002', 'Sunil Fernando',    'Server Room', DATEADD(SECOND, 36900, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0))), 'IN', 'DENIED', 'AREA_NOT_IN_ACCESS_LEVEL'),
(24, 'VISITOR_PASS', NULL, 3, 1, 'VP-2026-0003', 'Menaka Silva',      'Main Lobby',  '2026-07-21 09:00:00',            'IN', 'DENIED', 'PASS_EXPIRED'),
(25, 'VISITOR_PASS', NULL, 6, 1, 'VP-2026-0006', 'Rangana Silva',     'Main Lobby',  '2026-07-15 08:10:00',            'IN', 'DENIED', 'PASS_CANCELLED'),
(26, 'VISITOR_PASS', NULL, 7, 1, 'VP-2026-0007', 'Anura Peiris',      'Main Lobby',  '2026-07-30 10:40:00',            'IN', 'DENIED', 'PASS_SUSPENDED');
SET IDENTITY_INSERT dbo.access_logs OFF;


-- blacklist
SET IDENTITY_INSERT dbo.blacklist ON;
INSERT INTO blacklist
    (id, card_id, visitor_id, reason, blacklisted_by, blacklisted_at,
     released_at, released_by, is_active) VALUES
(1, 9,    NULL, 'Employment terminated on 15 June 2026. Card not returned at exit interview.', 4, '2026-06-15 17:10:00', NULL, NULL, 1),
(2, NULL, 6,    'Failed the mandatory site safety induction. Barred pending re-induction.',    4, '2026-07-15 09:00:00', '2026-07-26 10:00:00', 4, 0);
SET IDENTITY_INSERT dbo.blacklist OFF;


-- security_alerts
SET IDENTITY_INSERT dbo.security_alerts ON;
INSERT INTO security_alerts
    (id, alert_type, severity, message, related_access_log_id, area_id,
     status, acknowledged_by, acknowledged_at) VALUES
(1, 'REVOKED_CARD_USE',        'HIGH',     'Revoked card ACO-2026-000009 presented at Main Lobby three times within two minutes by a terminated employee.', 18, 1, 'OPEN', NULL, NULL),
(2, 'REPEATED_DENIAL',         'MEDIUM',   'Three consecutive denials on credential ACO-2026-000009 at Main Lobby on 16 June 2026.',                        17, 1, 'ACKNOWLEDGED', 4, '2026-06-16 09:15:00'),
(3, 'RESTRICTED_AREA_ATTEMPT', 'HIGH',     'Visitor pass VP-2026-0002 attempted entry to the Server Room, which is outside the escorted visitor access level.', 23, 8, 'RESOLVED', 9, DATEADD(SECOND, 37500, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0)))),
(4, 'EXPIRED_PASS_USE',        'LOW',      'Expired visitor pass VP-2026-0003 presented at Main Lobby the day after its validity window closed.',            24, 1, 'DISMISSED', 4, '2026-07-21 09:30:00');
SET IDENTITY_INSERT dbo.security_alerts OFF;


-- audit_logs
INSERT INTO audit_logs (entity_name, entity_id, action, old_value, new_value, performed_by, performed_by_username, ip_address, performed_at)
VALUES ('card_requests', 1,  'CREATE',        NULL, JSON_OBJECT('request_no':'REQ-2026-0001', 'status':'DRAFT'), 7, 'crajapaksa', '192.168.10.41', '2026-06-02 09:10:00');

INSERT INTO audit_logs (entity_name, entity_id, action, old_value, new_value, performed_by, performed_by_username, ip_address, performed_at)
VALUES ('card_requests', 1,  'STATUS_CHANGE', JSON_OBJECT('status':'DRAFT'), JSON_OBJECT('status':'SUBMITTED'), 7, 'crajapaksa', '192.168.10.41', '2026-06-02 09:14:00');

INSERT INTO audit_logs (entity_name, entity_id, action, old_value, new_value, performed_by, performed_by_username, ip_address, performed_at)
VALUES ('approvals',     1,  'APPROVE',       JSON_OBJECT('decision':'VERIFIED'), JSON_OBJECT('decision':'APPROVED'), 2, 'nperera',    '192.168.10.12', '2026-06-03 11:20:00');

INSERT INTO audit_logs (entity_name, entity_id, action, old_value, new_value, performed_by, performed_by_username, ip_address, performed_at)
VALUES ('approvals',     9,  'REJECT',        JSON_OBJECT('decision':'VERIFIED'), JSON_OBJECT('decision':'REJECTED'), 2, 'nperera',    '192.168.10.12', '2026-07-16 09:00:00');

INSERT INTO audit_logs (entity_name, entity_id, action, old_value, new_value, performed_by, performed_by_username, ip_address, performed_at)
VALUES ('card_requests', 12, 'STATUS_CHANGE', JSON_OBJECT('status':'SUBMITTED'), JSON_OBJECT('status':'WITHDRAWN'), 1, 'admin',      '192.168.10.05', '2026-07-13 10:00:00');

INSERT INTO audit_logs (entity_name, entity_id, action, old_value, new_value, performed_by, performed_by_username, ip_address, performed_at)
VALUES ('blacklist',     1,  'CREATE',        NULL, JSON_OBJECT('card_serial':'ACO-2026-000009', 'is_active':1), 4, 'rfernando',  '192.168.10.31', '2026-06-15 17:10:00');

INSERT INTO audit_logs (entity_name, entity_id, action, old_value, new_value, performed_by, performed_by_username, ip_address, performed_at)
VALUES ('users',         7,  'LOGIN',         NULL, NULL, 7, 'crajapaksa', '192.168.10.41', '2026-06-02 09:05:00');

INSERT INTO audit_logs (entity_name, entity_id, action, old_value, new_value, performed_by, performed_by_username, ip_address, performed_at)
VALUES ('users',         2,  'LOGIN',         NULL, NULL, 2, 'nperera',    '192.168.10.12', '2026-06-03 11:10:00');

INSERT INTO audit_logs (entity_name, entity_id, action, old_value, new_value, performed_by, performed_by_username, ip_address, performed_at)
VALUES ('users',         2,  'LOGOUT',        NULL, NULL, 2, 'nperera',    '192.168.10.12', '2026-06-03 12:05:00');


-- Reset the session marker
EXEC sys.sp_set_session_context @key = N'app_username', @value = NULL;

-- =====================================================================
-- Reset identity seeds
--
-- After IDENTITY_INSERT, the next generated value must continue from
-- the highest seeded id. RESEED with no value recalculates it from the
-- current maximum, which is exactly what is wanted here.
-- =====================================================================

DBCC CHECKIDENT ('dbo.access_levels', RESEED);
DBCC CHECKIDENT ('dbo.access_logs', RESEED);
DBCC CHECKIDENT ('dbo.approval_comments', RESEED);
DBCC CHECKIDENT ('dbo.approvals', RESEED);
DBCC CHECKIDENT ('dbo.areas', RESEED);
DBCC CHECKIDENT ('dbo.blacklist', RESEED);
DBCC CHECKIDENT ('dbo.card_access_assignments', RESEED);
DBCC CHECKIDENT ('dbo.card_qr_nfc_data', RESEED);
DBCC CHECKIDENT ('dbo.card_requests', RESEED);
DBCC CHECKIDENT ('dbo.departments', RESEED);
DBCC CHECKIDENT ('dbo.dispatch_records', RESEED);
DBCC CHECKIDENT ('dbo.employees', RESEED);
DBCC CHECKIDENT ('dbo.id_cards', RESEED);
DBCC CHECKIDENT ('dbo.permissions', RESEED);
DBCC CHECKIDENT ('dbo.print_jobs', RESEED);
DBCC CHECKIDENT ('dbo.request_documents', RESEED);
DBCC CHECKIDENT ('dbo.roles', RESEED);
DBCC CHECKIDENT ('dbo.security_alerts', RESEED);
DBCC CHECKIDENT ('dbo.users', RESEED);
DBCC CHECKIDENT ('dbo.visit_logs', RESEED);
DBCC CHECKIDENT ('dbo.visitor_passes', RESEED);
DBCC CHECKIDENT ('dbo.visitors', RESEED);

GO

-- =====================================================================
-- End of Migration Script V4__sample_data.sql
-- =====================================================================
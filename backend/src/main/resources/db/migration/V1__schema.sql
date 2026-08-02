-- =====================================================================
-- AccessOne - Corporate ID Card Issuing & Access Management System
-- V1__schema.sql   Core Database Schema Initialization
--
-- Target    : Microsoft SQL Server 2022 (or later)
-- Tooling   : SQL Server Management Studio (SSMS) / Flyway Migrations
-- Schema    : dbo
-- Collation : Database created with UTF-8 / CI_AI collation; text
--             columns use NVARCHAR to support international character sets.
--
-- Architecture Conventions:
--   * Primary Keys: Auto-incrementing BIGINT IDENTITY(1,1) surrogate key `id`
--     on all primary entity tables; composite primary keys on associative tables.
--   * Business Keys: Unique natural identifiers (emp_id, card_serial, request_no)
--     are indexed with UNIQUE constraints for domain integrity.
--   * Status Definitions: Domain statuses use NVARCHAR with CHECK constraints
--     to enforce valid state transitions aligned with application enums.
--   * Constraint Naming: All DEFAULT constraints are explicitly named
--     (df_<table>_<column>) for predictable schema management and migrations.
--   * Audit Timestamps: created_at defaults to SYSUTCDATETIME() via database;
--     updated_at is maintained by application entity lifecycles.
--   * Foreign Keys: Configured with ON DELETE NO ACTION by default to preserve
--     referential integrity; CASCADE applied selectively for tight parent-child ownership.
--
-- Table creation order is structured according to foreign key dependency hierarchy.
-- =====================================================================

SET NOCOUNT ON;
GO

-- 1. departments
CREATE TABLE departments (
    id              BIGINT IDENTITY(1,1) NOT NULL,
    dept_code       NVARCHAR(10)     NOT NULL,
    dept_name       NVARCHAR(100)    NOT NULL,
    description     NVARCHAR(255)        NULL,
    is_active       BIT         NOT NULL CONSTRAINT df_departments_is_active DEFAULT 1,
    created_at      DATETIME2(0)       NOT NULL CONSTRAINT df_departments_created_at DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2(0)       NOT NULL CONSTRAINT df_departments_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_departments       PRIMARY KEY (id),
    CONSTRAINT uq_departments_code  UNIQUE (dept_code),
    CONSTRAINT uq_departments_name  UNIQUE (dept_name)
);


-- 2. roles
CREATE TABLE roles (
    id              BIGINT IDENTITY(1,1) NOT NULL,
    role_name       NVARCHAR(40)     NOT NULL,
    description     NVARCHAR(255)        NULL,
    created_at      DATETIME2(0)       NOT NULL CONSTRAINT df_roles_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_roles             PRIMARY KEY (id),
    CONSTRAINT uq_roles_name        UNIQUE (role_name),
    CONSTRAINT chk_roles_name       CHECK (role_name IN (
                                        'EMPLOYEE',
                                        'HR_MANAGER',
                                        'IT_ADMIN',
                                        'SECURITY_OFFICER',
                                        'PRINT_SUPERVISOR',
                                        'SYSTEM_ADMIN'))
);


-- 3. permissions
CREATE TABLE permissions (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    permission_code     NVARCHAR(60)     NOT NULL,
    description         NVARCHAR(255)        NULL,
    CONSTRAINT pk_permissions           PRIMARY KEY (id),
    CONSTRAINT uq_permissions_code      UNIQUE (permission_code)
);


-- 4. role_permissions   (associative table mapping roles to permissions)
CREATE TABLE role_permissions (
    role_id             BIGINT NOT NULL,
    permission_id       BIGINT NOT NULL,
    granted_at          DATETIME2(0)       NOT NULL CONSTRAINT df_role_permissions_granted_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_role_permissions      PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rolepermissions_role  FOREIGN KEY (role_id)
        REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_rolepermissions_perm  FOREIGN KEY (permission_id)
        REFERENCES permissions (id) ON DELETE CASCADE
);


-- 5. employees
CREATE TABLE employees (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    emp_id              NVARCHAR(20)     NOT NULL,
    first_name          NVARCHAR(60)     NOT NULL,
    last_name           NVARCHAR(60)     NOT NULL,
    nic                 NVARCHAR(20)     NOT NULL,
    email               NVARCHAR(120)    NOT NULL,
    phone               NVARCHAR(20)         NULL,
    designation         NVARCHAR(100)    NOT NULL,
    department_id       BIGINT NOT NULL,
    date_joined         DATE            NOT NULL,
    date_left           DATE                NULL,
    employment_status   NVARCHAR(20)     NOT NULL CONSTRAINT df_employees_employment_status DEFAULT 'ACTIVE',
    photo_path          NVARCHAR(255)        NULL,
    created_at          DATETIME2(0)       NOT NULL CONSTRAINT df_employees_created_at DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2(0)       NOT NULL CONSTRAINT df_employees_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_employees             PRIMARY KEY (id),
    CONSTRAINT uq_employees_emp_id      UNIQUE (emp_id),
    CONSTRAINT uq_employees_nic         UNIQUE (nic),
    CONSTRAINT uq_employees_email       UNIQUE (email),
    CONSTRAINT fk_employees_department  FOREIGN KEY (department_id)
        REFERENCES departments (id) ON DELETE NO ACTION,
    CONSTRAINT chk_employees_status     CHECK (employment_status IN (
                                            'ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED')),
    CONSTRAINT chk_employees_dates      CHECK (date_left IS NULL OR date_left >= date_joined)
);


-- 6. users
CREATE TABLE users (
    id                      BIGINT IDENTITY(1,1) NOT NULL,
    username                NVARCHAR(50)     NOT NULL,
    password_hash           NVARCHAR(100)    NOT NULL,
    employee_id             BIGINT     NULL,
    role_id                 BIGINT NOT NULL,
    is_active               BIT         NOT NULL CONSTRAINT df_users_is_active DEFAULT 1,
    failed_login_attempts   SMALLINT NOT NULL CONSTRAINT df_users_failed_login_attempts DEFAULT 0,
    last_login_at           DATETIME2(0)            NULL,
    created_at              DATETIME2(0)       NOT NULL CONSTRAINT df_users_created_at DEFAULT SYSUTCDATETIME(),
    updated_at              DATETIME2(0)       NOT NULL CONSTRAINT df_users_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_users                 PRIMARY KEY (id),
    CONSTRAINT uq_users_username        UNIQUE (username),
    CONSTRAINT fk_users_employee        FOREIGN KEY (employee_id)
        REFERENCES employees (id) ON DELETE NO ACTION,
    CONSTRAINT fk_users_role            FOREIGN KEY (role_id)
        REFERENCES roles (id) ON DELETE NO ACTION,
    CONSTRAINT chk_users_password_hash  CHECK (LEN(password_hash) >= 20)
);


-- 7. areas
CREATE TABLE areas (
    id              BIGINT IDENTITY(1,1) NOT NULL,
    area_code       NVARCHAR(15)     NOT NULL,
    area_name       NVARCHAR(100)    NOT NULL,
    building        NVARCHAR(60)         NULL,
    floor_no        NVARCHAR(10)         NULL,
    is_restricted   BIT         NOT NULL CONSTRAINT df_areas_is_restricted DEFAULT 0,
    is_active       BIT         NOT NULL CONSTRAINT df_areas_is_active DEFAULT 1,
    description     NVARCHAR(255)        NULL,
    created_at      DATETIME2(0)       NOT NULL CONSTRAINT df_areas_created_at DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2(0)       NOT NULL CONSTRAINT df_areas_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_areas             PRIMARY KEY (id),
    CONSTRAINT uq_areas_code        UNIQUE (area_code),
    CONSTRAINT uq_areas_name        UNIQUE (area_name)
);


-- 8. access_levels
CREATE TABLE access_levels (
    id              BIGINT IDENTITY(1,1) NOT NULL,
    level_code      NVARCHAR(15)     NOT NULL,
    level_name      NVARCHAR(80)     NOT NULL,
    description     NVARCHAR(255)        NULL,
    is_active       BIT         NOT NULL CONSTRAINT df_access_levels_is_active DEFAULT 1,
    created_at      DATETIME2(0)       NOT NULL CONSTRAINT df_access_levels_created_at DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2(0)       NOT NULL CONSTRAINT df_access_levels_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_access_levels     PRIMARY KEY (id),
    CONSTRAINT uq_access_levels_code UNIQUE (level_code),
    CONSTRAINT uq_access_levels_name UNIQUE (level_name)
);


-- 9. access_level_areas   (associative table mapping access levels to areas)
CREATE TABLE access_level_areas (
    access_level_id BIGINT NOT NULL,
    area_id         BIGINT NOT NULL,
    created_at      DATETIME2(0)       NOT NULL CONSTRAINT df_access_level_areas_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_access_level_areas    PRIMARY KEY (access_level_id, area_id),
    CONSTRAINT fk_ala_access_level      FOREIGN KEY (access_level_id)
        REFERENCES access_levels (id) ON DELETE CASCADE,
    CONSTRAINT fk_ala_area              FOREIGN KEY (area_id)
        REFERENCES areas (id) ON DELETE NO ACTION
);


-- 10. card_requests
CREATE TABLE card_requests (
    id                          BIGINT IDENTITY(1,1) NOT NULL,
    request_no                  NVARCHAR(20)     NOT NULL,
    employee_id                 BIGINT NOT NULL,
    request_type                NVARCHAR(20)     NOT NULL,
    reason                      NVARCHAR(255)        NULL,
    requested_access_level_id   BIGINT     NULL,
    previous_card_id            BIGINT     NULL,
    photo_path                  NVARCHAR(255)        NULL,
    status                      NVARCHAR(25)     NOT NULL CONSTRAINT df_card_requests_status DEFAULT 'DRAFT',
    submitted_at                DATETIME2(0)            NULL,
    closed_at                   DATETIME2(0)            NULL,
    created_by                  BIGINT     NULL,
    created_at                  DATETIME2(0)       NOT NULL CONSTRAINT df_card_requests_created_at DEFAULT SYSUTCDATETIME(),
    updated_at                  DATETIME2(0)       NOT NULL CONSTRAINT df_card_requests_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_card_requests         PRIMARY KEY (id),
    CONSTRAINT uq_card_requests_no      UNIQUE (request_no),
    CONSTRAINT fk_card_requests_emp     FOREIGN KEY (employee_id)
        REFERENCES employees (id) ON DELETE NO ACTION,
    CONSTRAINT fk_card_requests_level   FOREIGN KEY (requested_access_level_id)
        REFERENCES access_levels (id) ON DELETE NO ACTION,
    CONSTRAINT fk_card_requests_creator FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE NO ACTION,
    CONSTRAINT chk_card_requests_type   CHECK (request_type IN (
                                            'NEW', 'REPLACEMENT', 'RENEWAL')),
    CONSTRAINT chk_card_requests_status CHECK (status IN (
                                            'DRAFT', 'SUBMITTED', 'UNDER_VERIFICATION',
                                            'APPROVED', 'REJECTED', 'WITHDRAWN', 'CANCELLED')),
    -- Replacement requests must provide a justification reason
    CONSTRAINT chk_card_requests_reason CHECK (
        request_type <> 'REPLACEMENT' OR reason IS NOT NULL),
    -- Non-draft requests must maintain a submission timestamp
    CONSTRAINT chk_card_requests_submit CHECK (
        status = 'DRAFT' OR submitted_at IS NOT NULL)
);


-- 11. request_documents
CREATE TABLE request_documents (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    card_request_id     BIGINT NOT NULL,
    document_type       NVARCHAR(30)     NOT NULL,
    file_name           NVARCHAR(150)    NOT NULL,
    file_path           NVARCHAR(255)    NOT NULL,
    mime_type           NVARCHAR(80)     NOT NULL,
    file_size_bytes     INT    NOT NULL,
    uploaded_at         DATETIME2(0)       NOT NULL CONSTRAINT df_request_documents_uploaded_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_request_documents     PRIMARY KEY (id),
    CONSTRAINT fk_reqdocs_request       FOREIGN KEY (card_request_id)
        REFERENCES card_requests (id) ON DELETE CASCADE,
    CONSTRAINT chk_reqdocs_type         CHECK (document_type IN (
                                            'PHOTO', 'NIC_COPY', 'APPOINTMENT_LETTER',
                                            'POLICE_REPORT', 'OTHER')),
    CONSTRAINT chk_reqdocs_size         CHECK (file_size_bytes > 0
                                               AND file_size_bytes <= 5242880)
);


-- 12. approvals   (card request verification and approval flow)
CREATE TABLE approvals (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    card_request_id     BIGINT NOT NULL,
    decision            NVARCHAR(20)     NOT NULL CONSTRAINT df_approvals_decision DEFAULT 'PENDING',
    verified_by         BIGINT     NULL,
    verified_at         DATETIME2(0)            NULL,
    decided_by          BIGINT     NULL,
    decided_at          DATETIME2(0)            NULL,
    rejection_reason    NVARCHAR(500)        NULL,
    created_at          DATETIME2(0)       NOT NULL CONSTRAINT df_approvals_created_at DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2(0)       NOT NULL CONSTRAINT df_approvals_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_approvals             PRIMARY KEY (id),
    CONSTRAINT uq_approvals_request     UNIQUE (card_request_id),
    CONSTRAINT fk_approvals_request     FOREIGN KEY (card_request_id)
        REFERENCES card_requests (id) ON DELETE CASCADE,
    CONSTRAINT fk_approvals_verifier    FOREIGN KEY (verified_by)
        REFERENCES users (id) ON DELETE NO ACTION,
    CONSTRAINT fk_approvals_decider     FOREIGN KEY (decided_by)
        REFERENCES users (id) ON DELETE NO ACTION,
    CONSTRAINT chk_approvals_decision   CHECK (decision IN (
                                            'PENDING', 'VERIFIED', 'APPROVED', 'REJECTED')),
    -- Rejection decisions require an explicit reason explanation
    CONSTRAINT chk_approvals_reason     CHECK (
        decision <> 'REJECTED' OR rejection_reason IS NOT NULL),
    -- Finalized decisions must record the deciding user and timestamp
    CONSTRAINT chk_approvals_decider    CHECK (
        decision IN ('PENDING', 'VERIFIED')
        OR (decided_by IS NOT NULL AND decided_at IS NOT NULL))
);


-- 13. approval_comments
CREATE TABLE approval_comments (
    id              BIGINT IDENTITY(1,1) NOT NULL,
    approval_id     BIGINT NOT NULL,
    comment_text    NVARCHAR(1000)   NOT NULL,
    commented_by    BIGINT NOT NULL,
    commented_at    DATETIME2(0)       NOT NULL CONSTRAINT df_approval_comments_commented_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_approval_comments     PRIMARY KEY (id),
    CONSTRAINT fk_apprcomments_approval FOREIGN KEY (approval_id)
        REFERENCES approvals (id) ON DELETE CASCADE,
    CONSTRAINT fk_apprcomments_user     FOREIGN KEY (commented_by)
        REFERENCES users (id) ON DELETE NO ACTION,
    CONSTRAINT chk_apprcomments_text    CHECK (LEN(TRIM(comment_text)) > 0)
);


-- 14. id_cards
CREATE TABLE id_cards (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    card_serial         NVARCHAR(30)     NOT NULL,
    card_request_id     BIGINT NOT NULL,
    employee_id         BIGINT NOT NULL,
    access_level_id     BIGINT     NULL,
    status              NVARCHAR(25)     NOT NULL CONSTRAINT df_id_cards_status DEFAULT 'GENERATED',
    version_no          SMALLINT NOT NULL CONSTRAINT df_id_cards_version_no DEFAULT 1,
    issue_date          DATE            NOT NULL,
    activated_at        DATETIME2(0)            NULL,
    revoked_at          DATETIME2(0)            NULL,
    revocation_reason   NVARCHAR(255)        NULL,
    replaced_by_card_id BIGINT     NULL,
    printed_name        NVARCHAR(120)    NOT NULL,
    printed_designation NVARCHAR(100)    NOT NULL,
    printed_department  NVARCHAR(100)    NOT NULL,
    photo_path          NVARCHAR(255)        NULL,
    created_at          DATETIME2(0)       NOT NULL CONSTRAINT df_id_cards_created_at DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2(0)       NOT NULL CONSTRAINT df_id_cards_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_id_cards              PRIMARY KEY (id),
    CONSTRAINT uq_id_cards_serial       UNIQUE (card_serial),
    CONSTRAINT uq_id_cards_request      UNIQUE (card_request_id),
    CONSTRAINT fk_id_cards_request      FOREIGN KEY (card_request_id)
        REFERENCES card_requests (id) ON DELETE NO ACTION,
    CONSTRAINT fk_id_cards_employee     FOREIGN KEY (employee_id)
        REFERENCES employees (id) ON DELETE NO ACTION,
    CONSTRAINT fk_id_cards_level        FOREIGN KEY (access_level_id)
        REFERENCES access_levels (id) ON DELETE NO ACTION,
    CONSTRAINT fk_id_cards_replacement  FOREIGN KEY (replaced_by_card_id)
        REFERENCES id_cards (id) ON DELETE NO ACTION,
    CONSTRAINT chk_id_cards_status      CHECK (status IN (
                                            'GENERATED', 'QUEUED_FOR_PRINT', 'PRINTED',
                                            'DISPATCHED', 'ACTIVE', 'SUSPENDED',
                                            'REVOKED', 'LOST', 'DAMAGED', 'VOID', 'REPLACED')),
    CONSTRAINT chk_id_cards_revocation  CHECK (
        status <> 'REVOKED' OR (revoked_at IS NOT NULL AND revocation_reason IS NOT NULL)),
    CONSTRAINT chk_id_cards_activation  CHECK (
        status <> 'ACTIVE' OR activated_at IS NOT NULL),
    CONSTRAINT chk_id_cards_not_self    CHECK (replaced_by_card_id IS NULL
                                               OR replaced_by_card_id <> id)
);


-- Foreign key linking replacement card requests to the previous card entity
ALTER TABLE card_requests
    ADD CONSTRAINT fk_card_requests_prevcard
        FOREIGN KEY (previous_card_id)
        REFERENCES id_cards (id) ON DELETE NO ACTION;


-- 15. card_qr_nfc_data   (digital credential payloads for printed cards)
CREATE TABLE card_qr_nfc_data (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    card_id             BIGINT NOT NULL,
    qr_payload          NVARCHAR(255)    NOT NULL,
    qr_hash             NCHAR(64)        NOT NULL,
    nfc_payload         NVARCHAR(MAX)                NULL,
    nfc_format          NVARCHAR(30)         NULL,
    encoding_algorithm  NVARCHAR(30)     NOT NULL CONSTRAINT df_card_qr_nfc_data_encoding_algorithm DEFAULT 'AES-256-GCM/BASE64',
    generated_at        DATETIME2(0)       NOT NULL CONSTRAINT df_card_qr_nfc_data_generated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_card_qr_nfc_data      PRIMARY KEY (id),
    CONSTRAINT uq_cardqrnfc_card        UNIQUE (card_id),
    CONSTRAINT uq_cardqrnfc_hash        UNIQUE (qr_hash),
    CONSTRAINT fk_cardqrnfc_card        FOREIGN KEY (card_id)
        REFERENCES id_cards (id) ON DELETE CASCADE,
    CONSTRAINT chk_cardqrnfc_nfcformat  CHECK (nfc_format IS NULL
                                               OR nfc_format IN ('NDEF_TEXT', 'NDEF_URI', 'MIFARE_BLOCK'))
);


-- 16. card_access_assignments
CREATE TABLE card_access_assignments (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    card_id             BIGINT NOT NULL,
    access_level_id     BIGINT NOT NULL,
    assigned_by         BIGINT NOT NULL,
    valid_from          DATE            NOT NULL,
    revoked_at          DATETIME2(0)            NULL,
    is_current          BIT         NOT NULL CONSTRAINT df_card_access_assignments_is_current DEFAULT 1,
    remarks             NVARCHAR(255)        NULL,
    created_at          DATETIME2(0)       NOT NULL CONSTRAINT df_card_access_assignments_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_card_access_assignments   PRIMARY KEY (id),
    CONSTRAINT uq_caa_card_level_from       UNIQUE (card_id, access_level_id, valid_from),
    CONSTRAINT fk_caa_card                  FOREIGN KEY (card_id)
        REFERENCES id_cards (id) ON DELETE CASCADE,
    CONSTRAINT fk_caa_level                 FOREIGN KEY (access_level_id)
        REFERENCES access_levels (id) ON DELETE NO ACTION,
    CONSTRAINT fk_caa_assigner              FOREIGN KEY (assigned_by)
        REFERENCES users (id) ON DELETE NO ACTION,
    CONSTRAINT chk_caa_current              CHECK (is_current = 0 OR revoked_at IS NULL)
);


-- 17. print_jobs
CREATE TABLE print_jobs (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    job_no              NVARCHAR(20)     NOT NULL,
    card_id             BIGINT NOT NULL,
    job_type            NVARCHAR(15)     NOT NULL CONSTRAINT df_print_jobs_job_type DEFAULT 'INITIAL',
    status              NVARCHAR(20)     NOT NULL CONSTRAINT df_print_jobs_status DEFAULT 'QUEUED',
    printer_name        NVARCHAR(60)         NULL,
    queued_at           DATETIME2(0)        NOT NULL,
    printed_at          DATETIME2(0)            NULL,
    qc_result           NVARCHAR(10)     NOT NULL CONSTRAINT df_print_jobs_qc_result DEFAULT 'PENDING',
    qc_notes            NVARCHAR(255)        NULL,
    cancelled_reason    NVARCHAR(255)        NULL,
    created_by          BIGINT NOT NULL,
    created_at          DATETIME2(0)       NOT NULL CONSTRAINT df_print_jobs_created_at DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2(0)       NOT NULL CONSTRAINT df_print_jobs_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_print_jobs            PRIMARY KEY (id),
    CONSTRAINT uq_print_jobs_no         UNIQUE (job_no),
    CONSTRAINT fk_printjobs_card        FOREIGN KEY (card_id)
        REFERENCES id_cards (id) ON DELETE NO ACTION,
    CONSTRAINT fk_printjobs_creator     FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE NO ACTION,
    CONSTRAINT chk_printjobs_type       CHECK (job_type IN ('INITIAL', 'REPRINT')),
    CONSTRAINT chk_printjobs_status     CHECK (status IN (
                                            'QUEUED', 'IN_PROGRESS', 'PRINTED',
                                            'QC_PASSED', 'QC_FAILED', 'CANCELLED')),
    CONSTRAINT chk_printjobs_qc         CHECK (qc_result IN ('PENDING', 'PASS', 'FAIL')),
    CONSTRAINT chk_printjobs_printed    CHECK (
        status NOT IN ('PRINTED', 'QC_PASSED', 'QC_FAILED') OR printed_at IS NOT NULL),
    CONSTRAINT chk_printjobs_cancel     CHECK (
        status <> 'CANCELLED' OR cancelled_reason IS NOT NULL)
);


-- 18. dispatch_records   (card dispatch and handover tracking)
CREATE TABLE dispatch_records (
    id                          BIGINT IDENTITY(1,1) NOT NULL,
    print_job_id                BIGINT NOT NULL,
    dispatch_method             NVARCHAR(20)     NOT NULL,
    status                      NVARCHAR(15)     NOT NULL CONSTRAINT df_dispatch_records_status DEFAULT 'PENDING',
    dispatched_at               DATETIME2(0)            NULL,
    received_by_employee_id     BIGINT     NULL,
    handed_over_at              DATETIME2(0)            NULL,
    handover_signature_path     NVARCHAR(255)        NULL,
    remarks                     NVARCHAR(255)        NULL,
    created_at                  DATETIME2(0)       NOT NULL CONSTRAINT df_dispatch_records_created_at DEFAULT SYSUTCDATETIME(),
    updated_at                  DATETIME2(0)       NOT NULL CONSTRAINT df_dispatch_records_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_dispatch_records      PRIMARY KEY (id),
    CONSTRAINT uq_dispatch_printjob     UNIQUE (print_job_id),
    CONSTRAINT fk_dispatch_printjob     FOREIGN KEY (print_job_id)
        REFERENCES print_jobs (id) ON DELETE NO ACTION,
    CONSTRAINT fk_dispatch_receiver     FOREIGN KEY (received_by_employee_id)
        REFERENCES employees (id) ON DELETE NO ACTION,
    CONSTRAINT chk_dispatch_method      CHECK (dispatch_method IN (
                                            'COLLECTION', 'INTERNAL_MAIL', 'COURIER')),
    CONSTRAINT chk_dispatch_status      CHECK (status IN (
                                            'PENDING', 'DISPATCHED', 'DELIVERED', 'RETURNED')),
    -- Delivered status requires recipient employee record and handover timestamp
    CONSTRAINT chk_dispatch_delivered   CHECK (
        status <> 'DELIVERED'
        OR (received_by_employee_id IS NOT NULL AND handed_over_at IS NOT NULL))
);


-- 19. visitors
CREATE TABLE visitors (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    visitor_code        NVARCHAR(20)     NOT NULL,
    full_name           NVARCHAR(120)    NOT NULL,
    id_document_no      NVARCHAR(30)     NOT NULL,
    id_document_type    NVARCHAR(15)     NOT NULL CONSTRAINT df_visitors_id_document_type DEFAULT 'NIC',
    company             NVARCHAR(120)        NULL,
    phone               NVARCHAR(20)         NULL,
    email               NVARCHAR(120)        NULL,
    visitor_type        NVARCHAR(20)     NOT NULL,
    host_employee_id    BIGINT NOT NULL,
    photo_path          NVARCHAR(255)        NULL,
    is_deleted          BIT         NOT NULL CONSTRAINT df_visitors_is_deleted DEFAULT 0,
    created_at          DATETIME2(0)       NOT NULL CONSTRAINT df_visitors_created_at DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2(0)       NOT NULL CONSTRAINT df_visitors_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_visitors              PRIMARY KEY (id),
    CONSTRAINT uq_visitors_code         UNIQUE (visitor_code),
    CONSTRAINT fk_visitors_host         FOREIGN KEY (host_employee_id)
        REFERENCES employees (id) ON DELETE NO ACTION,
    CONSTRAINT chk_visitors_type        CHECK (visitor_type IN (
                                            'GUEST', 'CONTRACTOR', 'VENDOR', 'INTERVIEWEE')),
    CONSTRAINT chk_visitors_doctype     CHECK (id_document_type IN (
                                            'NIC', 'PASSPORT', 'DRIVING_LICENCE'))
);


-- 20. visitor_passes
CREATE TABLE visitor_passes (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    pass_no             NVARCHAR(20)     NOT NULL,
    visitor_id          BIGINT NOT NULL,
    host_employee_id    BIGINT NOT NULL,
    access_level_id     BIGINT NOT NULL,
    purpose             NVARCHAR(255)    NOT NULL,
    valid_from          DATETIME2(0)        NOT NULL,
    valid_until         DATETIME2(0)        NOT NULL,
    status              NVARCHAR(15)     NOT NULL CONSTRAINT df_visitor_passes_status DEFAULT 'ISSUED',
    qr_payload          NVARCHAR(255)    NOT NULL,
    issued_by           BIGINT NOT NULL,
    issued_at           DATETIME2(0)        NOT NULL,
    cancelled_reason    NVARCHAR(255)        NULL,
    created_at          DATETIME2(0)       NOT NULL CONSTRAINT df_visitor_passes_created_at DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2(0)       NOT NULL CONSTRAINT df_visitor_passes_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_visitor_passes        PRIMARY KEY (id),
    CONSTRAINT uq_visitor_passes_no     UNIQUE (pass_no),
    CONSTRAINT uq_visitor_passes_qr     UNIQUE (qr_payload),
    CONSTRAINT fk_passes_visitor        FOREIGN KEY (visitor_id)
        REFERENCES visitors (id) ON DELETE NO ACTION,
    CONSTRAINT fk_passes_host           FOREIGN KEY (host_employee_id)
        REFERENCES employees (id) ON DELETE NO ACTION,
    CONSTRAINT fk_passes_level          FOREIGN KEY (access_level_id)
        REFERENCES access_levels (id) ON DELETE NO ACTION,
    CONSTRAINT fk_passes_issuer         FOREIGN KEY (issued_by)
        REFERENCES users (id) ON DELETE NO ACTION,
    CONSTRAINT chk_passes_status        CHECK (status IN (
                                            'ISSUED', 'ACTIVE', 'EXPIRED',
                                            'SUSPENDED', 'CANCELLED', 'RETURNED')),
    -- Unlike employee cards, a visitor pass MUST have a validity window.
    CONSTRAINT chk_passes_window        CHECK (valid_until > valid_from),
    CONSTRAINT chk_passes_cancel        CHECK (
        status <> 'CANCELLED' OR cancelled_reason IS NOT NULL)
);


-- 21. visit_logs
CREATE TABLE visit_logs (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    visitor_pass_id     BIGINT NOT NULL,
    entry_area_id       BIGINT     NULL,
    check_in_at         DATETIME2(0)        NOT NULL,
    check_out_at        DATETIME2(0)            NULL,
    recorded_by         BIGINT NOT NULL,
    remarks             NVARCHAR(255)        NULL,
    created_at          DATETIME2(0)       NOT NULL CONSTRAINT df_visit_logs_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_visit_logs            PRIMARY KEY (id),
    CONSTRAINT fk_visitlogs_pass        FOREIGN KEY (visitor_pass_id)
        REFERENCES visitor_passes (id) ON DELETE NO ACTION,
    CONSTRAINT fk_visitlogs_area        FOREIGN KEY (entry_area_id)
        REFERENCES areas (id) ON DELETE NO ACTION,
    CONSTRAINT fk_visitlogs_recorder    FOREIGN KEY (recorded_by)
        REFERENCES users (id) ON DELETE NO ACTION,
    CONSTRAINT chk_visitlogs_times      CHECK (check_out_at IS NULL
                                               OR check_out_at >= check_in_at)
);


-- 22. access_logs        (physical access audit logs with snapshot fields)
CREATE TABLE access_logs (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    credential_type     NVARCHAR(20)     NOT NULL,
    card_id             BIGINT     NULL,
    visitor_pass_id     BIGINT     NULL,
    area_id             BIGINT     NULL,
    -- Historical snapshot attributes preserved for audit permanence
    credential_ref      NVARCHAR(30)     NOT NULL,
    holder_name         NVARCHAR(150)    NOT NULL,
    area_name           NVARCHAR(120)    NOT NULL,
    access_time         DATETIME2(0)        NOT NULL,
    direction           NVARCHAR(5)      NOT NULL CONSTRAINT df_access_logs_direction DEFAULT 'IN',
    decision            NVARCHAR(10)     NOT NULL,
    denial_reason       NVARCHAR(60)         NULL,
    created_at          DATETIME2(0)       NOT NULL CONSTRAINT df_access_logs_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_access_logs           PRIMARY KEY (id),
    CONSTRAINT fk_accesslogs_card       FOREIGN KEY (card_id)
        REFERENCES id_cards (id) ON DELETE NO ACTION,
    CONSTRAINT fk_accesslogs_pass       FOREIGN KEY (visitor_pass_id)
        REFERENCES visitor_passes (id) ON DELETE NO ACTION,
    CONSTRAINT fk_accesslogs_area       FOREIGN KEY (area_id)
        REFERENCES areas (id) ON DELETE NO ACTION,
    CONSTRAINT chk_accesslogs_credtype  CHECK (credential_type IN (
                                            'EMPLOYEE_CARD', 'VISITOR_PASS')),
    CONSTRAINT chk_accesslogs_direction CHECK (direction IN ('IN', 'OUT')),
    CONSTRAINT chk_accesslogs_decision  CHECK (decision IN ('GRANTED', 'DENIED')),
    -- Denied access attempts must state a specific denial reason
    CONSTRAINT chk_accesslogs_reason    CHECK (
        decision <> 'DENIED' OR denial_reason IS NOT NULL),
    -- Log entry must associate with at most one credential type
    CONSTRAINT chk_accesslogs_onecred   CHECK (
        (CASE WHEN card_id IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN visitor_pass_id IS NOT NULL THEN 1 ELSE 0 END) <= 1)
);


-- 23. blacklist
CREATE TABLE blacklist (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    card_id             BIGINT     NULL,
    visitor_id          BIGINT     NULL,
    reason              NVARCHAR(255)    NOT NULL,
    blacklisted_by      BIGINT NOT NULL,
    blacklisted_at      DATETIME2(0)        NOT NULL,
    released_at         DATETIME2(0)            NULL,
    released_by         BIGINT     NULL,
    is_active           BIT         NOT NULL CONSTRAINT df_blacklist_is_active DEFAULT 1,
    CONSTRAINT pk_blacklist             PRIMARY KEY (id),
    CONSTRAINT fk_blacklist_card        FOREIGN KEY (card_id)
        REFERENCES id_cards (id) ON DELETE CASCADE,
    CONSTRAINT fk_blacklist_visitor     FOREIGN KEY (visitor_id)
        REFERENCES visitors (id) ON DELETE CASCADE,
    CONSTRAINT fk_blacklist_creator     FOREIGN KEY (blacklisted_by)
        REFERENCES users (id) ON DELETE NO ACTION,
    CONSTRAINT fk_blacklist_releaser    FOREIGN KEY (released_by)
        REFERENCES users (id) ON DELETE NO ACTION,
    -- Blacklist entry must reference either a card or a visitor entity
    CONSTRAINT chk_blacklist_onetarget  CHECK (
        (CASE WHEN card_id IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN visitor_id IS NOT NULL THEN 1 ELSE 0 END) = 1),
    CONSTRAINT chk_blacklist_release    CHECK (
        is_active = 1 OR (released_at IS NOT NULL AND released_by IS NOT NULL))
);


-- 24. security_alerts
CREATE TABLE security_alerts (
    id                      BIGINT IDENTITY(1,1) NOT NULL,
    alert_type              NVARCHAR(30)     NOT NULL,
    severity                NVARCHAR(10)     NOT NULL CONSTRAINT df_security_alerts_severity DEFAULT 'MEDIUM',
    message                 NVARCHAR(500)    NOT NULL,
    related_access_log_id   BIGINT     NULL,
    area_id                 BIGINT     NULL,
    status                  NVARCHAR(15)     NOT NULL CONSTRAINT df_security_alerts_status DEFAULT 'OPEN',
    acknowledged_by         BIGINT     NULL,
    acknowledged_at         DATETIME2(0)            NULL,
    created_at              DATETIME2(0)       NOT NULL CONSTRAINT df_security_alerts_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_security_alerts       PRIMARY KEY (id),
    CONSTRAINT fk_alerts_accesslog      FOREIGN KEY (related_access_log_id)
        REFERENCES access_logs (id) ON DELETE NO ACTION,
    CONSTRAINT fk_alerts_area           FOREIGN KEY (area_id)
        REFERENCES areas (id) ON DELETE NO ACTION,
    CONSTRAINT fk_alerts_ackuser        FOREIGN KEY (acknowledged_by)
        REFERENCES users (id) ON DELETE NO ACTION,
    CONSTRAINT chk_alerts_type          CHECK (alert_type IN (
                                            'REPEATED_DENIAL', 'BLACKLIST_ATTEMPT',
                                            'REVOKED_CARD_USE', 'EXPIRED_PASS_USE',
                                            'RESTRICTED_AREA_ATTEMPT', 'AFTER_HOURS_ACCESS')),
    CONSTRAINT chk_alerts_severity      CHECK (severity IN (
                                            'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_alerts_status        CHECK (status IN (
                                            'OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED')),
    CONSTRAINT chk_alerts_ack           CHECK (
        status = 'OPEN'
        OR (acknowledged_by IS NOT NULL AND acknowledged_at IS NOT NULL))
);


-- 25. audit_logs
CREATE TABLE audit_logs (
    id                      BIGINT IDENTITY(1,1) NOT NULL,
    entity_name             NVARCHAR(60)     NOT NULL,
    entity_id               BIGINT NOT NULL,
    action                  NVARCHAR(20)     NOT NULL,
    old_value               NVARCHAR(MAX)                NULL,
    new_value               NVARCHAR(MAX)                NULL,
    performed_by            BIGINT     NULL,
    performed_by_username   NVARCHAR(50)     NOT NULL CONSTRAINT df_audit_logs_performed_by_username DEFAULT 'SYSTEM',
    ip_address              NVARCHAR(45)         NULL,
    performed_at            DATETIME2(0)        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_audit_logs            PRIMARY KEY (id),
    CONSTRAINT fk_auditlogs_user        FOREIGN KEY (performed_by)
        REFERENCES users (id) ON DELETE NO ACTION,
    -- Enforce valid JSON structure on audit payload columns
    CONSTRAINT chk_auditlogs_oldjson    CHECK (old_value IS NULL OR ISJSON(old_value) = 1),
    CONSTRAINT chk_auditlogs_newjson    CHECK (new_value IS NULL OR ISJSON(new_value) = 1),
    CONSTRAINT chk_auditlogs_action     CHECK (action IN (
                                            'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE',
                                            'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'REVOKE'))
);


-- =====================================================================
-- End of Core Schema Definitions
-- =====================================================================
GO


-- =====================================================================
-- Filtered Unique Index
--
-- A filtered unique index is used on users.employee_id to allow multiple
-- system administrator accounts with NULL employee_id values while enforcing
-- uniqueness across all non-NULL employee user mappings.
-- =====================================================================
GO

CREATE UNIQUE INDEX uq_users_employee
    ON dbo.users (employee_id)
    WHERE employee_id IS NOT NULL;
GO


-- =====================================================================
-- Extended Properties (Database Documentation Metadata)
-- =====================================================================
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Organizational departments for employee and access management.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'departments';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'System access roles defining user administrative authorization tiers.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'roles';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Fine-grained application permission codes.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'permissions';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Associative table mapping system roles to granted permissions.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'role_permissions';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Employee master records containing personal, contact, and employment status data.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'employees';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'User login accounts and authentication credentials.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'users';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Physical zones and facility access points.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'areas';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Named access security profiles containing groups of authorized physical areas.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'access_levels';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Associative table linking access profiles to physical facility areas.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'access_level_areas';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Employee ID card issuance, renewal, and replacement requests.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'card_requests';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Uploaded supporting documents attached to ID card requests.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'request_documents';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Verification and approval workflow records for card requests.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'approvals';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Review notes and comments attached during request approvals.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'approval_comments';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Issued corporate ID cards and credential status lifecycles.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'id_cards';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'QR code hashes and NFC data payloads generated for physical card encoding.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'card_qr_nfc_data';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Historical record of access level assignments granted to ID cards over time.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'card_access_assignments';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Card printing queue, production status, and quality control results.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'print_jobs';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Physical card dispatch methods and employee handover confirmations.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'dispatch_records';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'External visitor master details and contact records.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'visitors';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Temporary access passes issued to site visitors.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'visitor_passes';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Visitor check-in and check-out tracking logs.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'visit_logs';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Central access event log storing entry attempts and validation results.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'access_logs';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Revoked cards and barred visitors restricted from site access.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'blacklist';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Automated security alerts generated by access violation events.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'security_alerts';
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'System-wide audit trail recording administrative entity changes and user actions.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'audit_logs';
GO

-- =====================================================================
-- End of Migration Script V1__schema.sql
-- =====================================================================
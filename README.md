# AccessOne

**Corporate ID Card Issuing & Access Management System**

A web-based system for issuing, tracking and controlling corporate employee ID cards and visitor passes — from the initial card request through approval, generation, printing, handover, and finally access decisions at building entry points.

Built for the SE2030 Software Engineering module and the Database module, Year 2 Semester 1.
Group ID: `2026-Y2-S1-MLB-B1G1-04`

---



## Table of contents

- [What the system does](#what-the-system-does)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the system](#running-the-system)
- [Seeded test accounts](#seeded-test-accounts)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
- [Scope and limitations](#scope-and-limitations)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)

---

## What the system does

Six major functions, each serving a distinct user role:

| # | Function | Primary user |
|---|---|---|
| 1 | Employee Card Request & Status Tracking | Employee |
| 2 | Card Request Verification & Approval Management | HR Manager |
| 3 | Department & Access Level Configuration | IT Administrator |
| 4 | Card Generation — Printed Details, QR Code & NFC Payload | System / IT Administrator |
| 5 | Visitor & Temporary Pass Management | Security Officer |
| 6 | Print Production, Dispatch & Card Activation | Print Supervisor |

Supporting these is a shared access decision engine that evaluates both employee cards and visitor passes against configured area permissions, and writes a complete, queryable audit trail of every decision.

---

## Tech stack

**Backend**

| | |
|---|---|
| Language | Java 21 (LTS) |
| Framework | Spring Boot 4.1.x |
| Data access | Spring Data JPA / Hibernate 7 |
| Database | MySQL 8.4 |
| Migrations | Flyway |
| Security | Spring Security 7 — session-based, BCrypt |
| API docs | springdoc-openapi 3.0.x |
| QR codes | ZXing |
| PDF output | openhtmltopdf + Thymeleaf |
| Build | Maven |

**Frontend**

| | |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + shadcn/ui |
| Server state | TanStack Query |
| Forms | react-hook-form + zod |
| API types | Generated from the OpenAPI spec |



---

## Prerequisites

| Tool | Version | Verify with |
|---|---|---|
| JDK (Temurin) | 21 | `java -version` |
| Node.js | 22 LTS or newer | `node -v` |
| MySQL Community Server | 8.4 | `mysql --version` |
| Git | any recent | `git --version` |



---

## Setup

### 1. Clone

```bash
git clone https://github.com/YOUR-USERNAME/accessone.git
cd accessone
```

### 2. Create the databases and application user

Connect as root:

```bash
mysql -u root -p
```

Then run:

```sql
CREATE DATABASE accessone
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE DATABASE accessone_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE USER 'accessone_app'@'localhost' IDENTIFIED BY 'accessone@1234';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES,
      CREATE VIEW, SHOW VIEW, TRIGGER, CREATE ROUTINE, ALTER ROUTINE, EXECUTE
  ON accessone.* TO 'accessone_app'@'localhost';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES,
      CREATE VIEW, SHOW VIEW, TRIGGER, CREATE ROUTINE, ALTER ROUTINE, EXECUTE
  ON accessone_test.* TO 'accessone_app'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

`utf8mb4` is required — employee names in the sample data contain Sinhala and Tamil characters, and the legacy `utf8` alias will corrupt them.

### 3. Configure the backend

Credentials are never committed. Copy the example file and fill in your own password:

```bash
cd backend
cp application-local.yml.example application-local.yml
```

Windows PowerShell: `Copy-Item application-local.yml.example application-local.yml`

Then edit `backend/application-local.yml`:

```yaml
spring:
  datasource:
    username: accessone_app
    password: PasswordHere
```

This file is git-ignored. The committed `application.yml` imports it optionally at startup, so the application will fail fast with a clear message if it is missing.

### 4. Configure the frontend

```bash
cd ../frontend
cp .env.local.example .env.local
```

The defaults point at `http://localhost:8080` and need no editing for local development.

### 5. Install frontend dependencies

```bash
npm install
```

---

## Running the system

Three processes. MySQL usually runs as a system service already; the other two need a terminal each.

**Terminal 1 — database** (only if not already running)

```bash
# Windows
net start MySQL84

# macOS
brew services start mysql@8.4

# Linux
sudo systemctl start mysql
```

**Terminal 2 — backend**

```bash
cd backend
./mvnw spring-boot:run          # Windows: .\mvnw.cmd spring-boot:run
```

**Terminal 3 — frontend**

```bash
cd frontend
npm run dev
```

Then open **http://localhost:3000**.

### Ports

| Service | Port | URL |
|---|---|---|
| Next.js frontend | 3000 | http://localhost:3000 |
| Spring Boot API | 8080 | http://localhost:8080 |
| MySQL | 3306 | — |

Requests to `/api/*` from the frontend are proxied to the backend by a Next.js rewrite, so the browser sees a single origin. There is no CORS configuration anywhere in this project, and that is deliberate — it lets session cookies work without special handling.

### Verify the setup

```bash
curl http://localhost:3000/api/actuator/health
```

Expected: `{"status":"UP"}`. Note that the request goes to port 3000 and is answered by the backend on 8080 — that round trip is the proof the proxy is wired correctly.

### API documentation

With the backend running, the interactive OpenAPI documentation is at
**http://localhost:8080/swagger-ui.html**

---

## Seeded test accounts

`V4__sample_data.sql` seeds ten accounts covering every role. All of them share one password: **`Password@123`**.

| Username | Role | Employee ID |
|---|---|---|
| `admin` | SYSTEM_ADMIN | — (not linked to an employee) |
| `nperera` | HR_MANAGER | 2 |
| `kjayasinghe` | IT_ADMIN | 3 |
| `rfernando` | SECURITY_OFFICER | 4 |
| `twickramaratne` | PRINT_SUPERVISOR | 5 |
| `dgunawardena` | HR_MANAGER | 6 |
| `crajapaksa` | EMPLOYEE | 7 |
| `iweerasinghe` | EMPLOYEE | 9 |
| `nsenanayake` | SECURITY_OFFICER | 14 |
| `asilva` | EMPLOYEE | 1 |

These are for local development and testing only — never reuse this password scheme outside seeded sample data.

---

## Project structure

```
accessone/
├── backend/                    Spring Boot REST API
│   ├── src/main/java/lk/accessone/
│   │   ├── cardrequest/        Module 1 — requests and status tracking
│   │   ├── approval/           Module 2 — verification and approval
│   │   ├── access/             Module 3 — departments, areas, access levels
│   │   ├── card/               Module 4 — generation, QR, NFC payload, PDF
│   │   ├── visitor/            Module 5 — visitors and temporary passes
│   │   ├── print/              Module 6 — print jobs, dispatch, activation
│   │   ├── entry/              Access decision engine and entry simulator
│   │   └── shared/             Auth, audit, config, error handling
│   ├── src/main/resources/
│   │   └── db/migration/       Flyway SQL migrations — the schema source of truth
│   └── pom.xml
├── frontend/                   Next.js application
│   └── src/
│       ├── app/                Routes, one folder per role area
│       ├── components/         Shared UI and the reusable CRUD layer
│       ├── lib/                API client, auth context, utilities
│       └── types/              Types generated from the OpenAPI spec
├── database/                   ER diagram, normalisation notes, DB module deliverables
├── docs/                       Phase plan, project plan, UML diagrams, test cases
└── README.md
```

### Database schema

The schema is defined by hand in `backend/src/main/resources/db/migration/` and applied by Flyway at startup. JPA runs with `ddl-auto: validate` and will refuse to start if the entities and the tables disagree.

**Never set `ddl-auto` to `update` or `create`, and never edit a migration that has already been applied.** Schema changes are made by adding a new versioned migration file.

---

## Development workflow

The project is built in 18 sequenced phases, ordered by dependency rather than by module number — a card cannot be printed before it is generated, and cannot be generated before it is approved. See [`docs/phase-plan.md`](docs/phase-plan.md).

One branch per phase:

```bash
git checkout -b phase/3-authentication
# ... work ...
git checkout main
git merge phase/3-authentication
```

A branch is merged only when every exit criterion for that phase is met.

---

## Scope and limitations

Four components are deliberately simulated. Each exclusion is a considered decision, not an omission:

| Real-world component | What is built | Why |
|---|---|---|
| Company HRMS | Mock service over seeded employee data | No real HRMS is available; the integration design is still demonstrated |
| NFC chip writing | Payload generated, encoded, stored and displayed | No card-encoding hardware; the data model and encoding are the assessable software work |
| Physical entry reader | Entry Point Simulator screen | Demonstrates the full access rule engine live and reproducibly |
| Physical card printing | Print job queue plus downloadable print-ready PDF | Physical production is outside the software scope |

Two further design decisions worth noting:

- **Employee cards have no expiry date.** Validity is controlled by card status and revocation, because an employee's need for access ends when their employment does, not on a fixed calendar date.
- **Visitor passes do expire automatically**, and expiry is enforced at decision time as well as by a scheduled job — an unaccounted visitor is a materially larger risk than an unaccounted employee.




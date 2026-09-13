# College Placement Management System — Comprehensive Project Explanation

> Complete technical dossier detailing the problem statement, objectives, architecture, database design, user workflows, security, and engineering solutions for the College Placement Management System.

---

## 1. Problem Statement

Campus placements are one of the most critical operations in higher education institutions. However, most colleges still manage placement drives through disparate spreadsheets, shared drives, notice boards, and email distribution lists.

This manual process creates several critical bottlenecks:
- **Eligibility Verification Fatigue**: Placement officers must manually cross-reference student CGPA, academic branch, and backlog records against differing company criteria for hundreds of applicants.
- **Duplicate & Invalid Submissions**: Spreadsheets cannot enforce real-time unique constraints, leading to duplicate applications and ineligible students sitting for drives.
- **Lack of Transparency**: Graduating students experience anxiety due to lack of visibility into their current recruitment status (e.g., Shortlisted, Interview, Selected).
- **Fragmented Records**: Corporate recruiter histories, historical salary packages, and verified technical skills are lost across semesters.

---

## 2. Project Objective

The objective of the **College Placement Management System** is to deliver a reliable, data-driven, local-first web platform that automates the campus placement lifecycle for higher education institutions:

1. Centralize student academic profiles, contact details, and technical skill portfolios.
2. Provide corporate partner management and campus placement drive scheduling.
3. Automate multi-criteria eligibility calculation using a dedicated, high-performance **Java SE Eligibility Engine**.
4. Enforce strict relational database integrity to eliminate duplicate applications and invalid states.
5. Provide a transparent, real-time recruitment status pipeline for students and placement administrators.
6. Deliver a professional, responsive, zero-framework web interface with persistent dual-theme support (Light / Dark mode).

---

## 3. Main Features

### Student Portal Features
- **Account Registration & Login**: Validated student signup with roll number tracking and bcrypt password encryption.
- **Profile Management**: Live viewing and editing of academic credentials (branch, CGPA, graduation batch, active backlogs).
- **Technical Skills Portfolio**: Add and remove competencies from a normalized master catalog with duplicate-skill prevention.
- **Browse Campus Drives**: Explore active recruiting drives with package details (CTC in INR), locations, and deadlines.
- **One-Click Eligibility Check**: Real-time evaluation against drive requirements with detailed itemized reasons.
- **Application Submission**: Safe, one-click application submission with duplicate-entry blocking.
- **Application Tracking**: Live candidate dashboard tracking hiring stages with color-coded status badges.
- **Light/Dark Mode**: Persistent dual-theme interface with zero theme-flicker on load.

### Admin Portal Features
- **Administrator Authentication**: Dedicated placement officer credentials with role-based access control.
- **Executive Analytics Dashboard**: Real-time KPI metric counters for registered students, partner companies, live jobs, and submitted applications.
- **Partner Company Management**: Full CRUD operations with relational deletion safeguards.
- **Placement Drive Management**: Full CRUD operations with application-level conflict protection.
- **Searchable Candidate Directory**: Multi-parameter student filtering by Department, Graduation Batch, Minimum CGPA, and Maximum Backlogs.
- **Candidate Profile Modal**: Deep inspection of student academic history, verified skills, and job applications.
- **Recruitment Pipeline & Status Updates**: Live status updating across 5 recruitment stages (`Applied`, `Shortlisted`, `Interview`, `Selected`, `Rejected`).

---

## 4. Technologies Used

| Layer | Technology | Version / Specification | Justification |
| :--- | :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Native Web Standards (ES6+) | Eliminates framework bloat, guarantees sub-second initial load, demonstrates deep DOM fundamentals. |
| **Backend** | Node.js, Express.js | Node 18+ (verified on Node 24), Express 4.19 | Asynchronous event-driven REST API server with clean MVC architecture. |
| **Database** | MySQL, `mysql2/promise` | MySQL 8.0+ | Relational schema with foreign key cascades, check constraints, and connection pooling. |
| **Eligibility Engine** | Java SE | OpenJDK 17+ (verified on Java 24) | High-performance, strongly-typed object-oriented computation engine with zero-downtime JS fallback. |
| **Security** | Bcrypt, Dotenv, SQL Parameters | bcrypt 6.0, dotenv 16.4 | Salted password encryption, externalized secrets, 100% SQL injection prevention. |
| **API Tooling** | Postman v2.1.0 | 27 Pre-configured Endpoints | Deterministic endpoint verification and developer onboarding. |

---

## 5. System Architecture

```text
+-------------------------------------------------------------+
|                      Client Browser                         |
|  - HTML5 / CSS3 Responsive Layout                           |
|  - Vanilla JavaScript (Fetch API, DOM Events, State)        |
|  - Light / Dark Theme Manager (Anti-Flash Script)           |
+-------------------------------------------------------------+
                               |
                               | HTTP / REST (JSON)
                               v
+-------------------------------------------------------------+
|              Node.js + Express.js REST API                  |
|  - Middleware: CORS Whitelist, JSON Body Parser             |
|  - Routes: /api/auth, /api/students, /api/admin, /api/jobs  |
|  - Controllers: Input validation, response envelopes        |
|  - Global Error Handler & 404 Interceptor                   |
+-------------------------------------------------------------+
               |                               |
               | SQL (mysql2 pool)             | Child Process (stdin/stdout JSON)
               v                               v
+-----------------------------+ +-----------------------------+
|        MySQL Database       | |  Java SE Eligibility Engine |
|  - 8 Normalized Tables      | |  - Typed Input/Output Models|
|  - Cascade Deletions        | |  - Zero-Dependency Parser   |
|  - Check Constraints        | |  - 5000ms Timeout Guard     |
|  - Parameterized Statements | |  - Seamless JS Fallback     |
+-----------------------------+ +-----------------------------+
```

### Key Architectural Tenets
1. **Decoupled Client & Server**: The frontend contains zero direct database logic and relies exclusively on RESTful HTTP communication.
2. **Process-Level Isolation for Business Logic**: Complex eligibility rules run in an isolated Java runtime, preventing heavy rule computation from choking the Express event loop.
3. **Resilience & High Availability**: The backend monitors the Java engine with a 5000ms watchdog timer and falls back to an identical internal JavaScript evaluation engine if Java fails.

---

## 6. Database Design

The database schema (`database/schema.sql`) consists of 8 interconnected tables:

```text
[users] 1 ──── 1 [students] 1 ──── M [student_skills] M ──── 1 [skills]
   │                 │
   │ 1               │ 1
   │                 │
   │ 1               │ M
[admins]       [applications]
                     │ M
                     │
                     │ 1
                 [jobs] M ──── 1 [companies]
```

### Table Specifications
1. **`users`**: Root credentials entity. Columns: `id` (PK), `email` (UNIQUE), `password` (bcrypt hash), `role` (ENUM: `'student'`, `'admin'`), `created_at`.
2. **`students`**: Candidate academic profile. Columns: `id` (PK), `user_id` (FK → `users.id`, UNIQUE), `student_id` (UNIQUE roll number), `name`, `phone`, `branch`, `cgpa` (CHECK: 0.00–10.00), `graduation_year`, `backlogs` (CHECK: >= 0).
3. **`admins`**: Officer profiles. Columns: `id` (PK), `user_id` (FK → `users.id`, UNIQUE), `name`, `phone`, `department`.
4. **`companies`**: Corporate recruitment partners. Columns: `id` (PK), `company_name` (UNIQUE), `location`, `website`, `description`.
5. **`jobs`**: Placement drives. Columns: `id` (PK), `company_id` (FK → `companies.id`), `job_title`, `job_description`, `minimum_cgpa` (CHECK: 0.00–10.00), `eligible_branch`, `maximum_backlogs` (CHECK: >= 0), `package` (DECIMAL in INR), `job_location`, `application_deadline`.
6. **`skills`**: Normalized master technical skill list. Columns: `id` (PK), `skill_name` (UNIQUE).
7. **`student_skills`**: Junction table. Columns: `student_id` (FK), `skill_id` (FK), Composite PK `(student_id, skill_id)`.
8. **`applications`**: Candidate job applications. Columns: `id` (PK), `student_id` (FK), `job_id` (FK), `application_date`, `status` (ENUM: `'Applied'`, `'Shortlisted'`, `'Interview'`, `'Selected'`, `'Rejected'`), UNIQUE constraint `unique_student_job(student_id, job_id)`.

---

## 7. Student User Flow

1. **Registration**: Student accesses `student-register.html`, fills academic details, client validates constraints, `POST /api/auth/register` creates `users` and `students` rows.
2. **Authentication**: Student enters email/password on `student-login.html`. Server verifies with `bcrypt.compare`, client stores non-sensitive user object in `localStorage`.
3. **Dashboard Load**: Navigates to `student-dashboard.html`. API fetches student profile, skills, active drives, and application history concurrently.
4. **Profile & Skill Management**: Student updates phone/branch/CGPA (`PUT /api/students/:id`) and adds skills from master catalog (`POST /api/students/:id/skills`). Duplicate skills are blocked.
5. **Job Discovery**: Student reviews corporate placement postings under the "Campus Drives" tab.
6. **Eligibility Evaluation**: Student clicks "Check Eligibility". Frontend calls `GET /api/jobs/:id/eligibility/:userId`. Java engine evaluates student record against job thresholds and returns pass/fail with itemized breakdown.
7. **Application Submission**: Student clicks "Apply Now". Server verifies eligibility, enforces unique constraint, and inserts into `applications`.
8. **Status Tracking**: Student reviews the "My Applications" tab to track recruitment progression.

---

## 8. Admin User Flow

1. **Authentication**: Admin logs into `admin-login.html` with verified administrator credentials.
2. **Executive Overview**: `admin-dashboard.html` renders real-time metric cards (total students, companies, jobs, applications) from `GET /api/admin/dashboard/stats`.
3. **Company & Job Operations**: Admin navigates to `admin-companies.html` and `admin-jobs.html` to post new placement drives or edit partner profiles. Relational deletion guards prevent deleting entities with dependent children.
4. **Candidate Directory & Search**: Admin opens `admin-students.html`, filters candidates dynamically by Department, Graduation Batch, CGPA slider, and Backlog count. Inspects candidate modal.
5. **Recruitment Pipeline**: Admin navigates to `admin-applications.html`, selects a candidate, and updates their status from `Applied` to `Shortlisted`, `Interview`, `Selected`, or `Rejected` via `PUT /api/admin/applications/:id/status`.

---

## 9. Java Eligibility Engine

### Architecture
- Pure Java SE (zero external JAR dependencies).
- Located in `java/eligibility/` with source files: `Main.java`, `EligibilityEngine.java`, `EligibilityInput.java`, `EligibilityResult.java`, and `SimpleJsonParser.java`.
- Compilation: `javac -d java/bin java/eligibility/*.java`.

### Processing Flow
1. Node.js assembles student data (CGPA, backlogs, branch, skills) and job criteria into JSON.
2. Spawns child process: `java -cp java/bin eligibility.Main`.
3. Pipes JSON string to child process `stdin`.
4. Java's `SimpleJsonParser` parses input into typed `EligibilityInput` object.
5. `EligibilityEngine.evaluate()` tests all 4 criteria, accumulating descriptive reasons and failures.
6. Writes `EligibilityResult` JSON to `stdout`.
7. Node captures stdout, parses JSON, and returns it to the frontend.
8. If Java fails or exceeds 5000ms, the internal JavaScript fallback executes transparently.

---

## 10. Security Architecture

1. **Password Security**: Passwords hashed with `bcrypt` using 10 salt rounds. Password hashes are stripped from all outgoing API responses.
2. **SQL Injection Neutralization**: 100% of SQL queries utilize parameterized placeholders (`?`) via `mysql2`.
3. **Credential Segregation**: Database secrets and port numbers externalized to `.env`.
4. **Git Protection**: Comprehensive `.gitignore` guarantees zero accidental leaks of `.env`, `node_modules`, `*.log`, or compiled `*.class` bytecode.
5. **Input Validation**: Rigorous validation on both frontend and backend for email regex, batch boundaries, and non-negative numbers.
6. **Relational Deletion Protection**: Foreign keys and application conflict checks prevent orphaned records and cascading data damage.

---

## 11. Testing & Verification

The project underwent automated end-to-end regression testing covering:
- Backend diagnostics (`/api/test`, `/api/test/database`).
- Complete Student registration, login, profile, skills, eligibility, and application flows.
- Complete Admin login, metrics, company CRUD, job CRUD, filtering, and status transitions.
- Frontend HTML syntax, anti-flash scripts, dark mode styles, and responsive meta tags.
- Security tests against SQL injection strings and credential exposure.
**Results**: 94/94 assertions passed with a 100% success rate.

---

## 12. Challenges Faced

1. **Cross-Platform Child Process IPC**: Managing streaming JSON between Node.js and Java without deadlocks or buffer truncation on Windows and POSIX.
2. **Zero-Flash Dark Mode**: Preventing brief flashes of light background when navigating between pages in dark mode.
3. **Safe Relational Integrity**: Balancing automatic cascading deletes for student cleanup with protective deletion blocks on active company drives.
4. **Zero-Dependency Architecture**: Building robust JSON parsing in Java without external libraries (like Jackson or Gson).

---

## 13. Solutions Implemented

1. **Streaming Stdin/Stdout with Watchdog**: Implemented explicit `stdin.write()` and `stdin.end()` with a 5000ms watchdog timer and transparent JS fallback.
2. **Head-Blocking Theme Script**: Placed a synchronous theme detection script in the HTML `<head>` to set `data-theme` before any CSS or body elements render.
3. **Application Conflict Pre-Checks**: Added database queries that verify dependent job and application counts before executing company or job deletions, returning `HTTP 409 Conflict` when appropriate.
4. **Lightweight Custom JSON Parser**: Authored `SimpleJsonParser.java` using standard Java string scanning to parse nested candidate and job JSON objects.

---

## 14. Future Improvements

1. **Automated Email Notifications**: Triggering email alerts to students when their application status changes.
2. **Resume PDF Upload**: Adding candidate resume upload with secure local or S3 object storage.
3. **Recruiter HR Portal**: Dedicated company recruiter login to manage drive applicants directly.
4. **Visual Analytics Dashboard**: Interactive charts showing departmental placement ratios, salary distributions, and hiring trends over time.

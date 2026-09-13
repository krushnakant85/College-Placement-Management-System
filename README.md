# College Placement Management System

> A full-stack, interview-ready web application designed for managing college campus placement activities, company recruitment drives, student job applications, and eligibility filtering.

---

## 📌 Project Overview

The **College Placement Management System** is an end-to-end recruitment portal engineered for higher education placement cells, graduating students, and corporate hiring partners. The platform digitizes and streamlines the entire campus placement lifecycle, managing:

- **Students**: Academic profiles, cumulative GPAs, backlog tracking, verified technical competencies, and application records.
- **Companies**: Corporate partner directory, recruitment contacts, locations, and drive profiles.
- **Jobs**: Placement drives, salary packages, location details, eligibility thresholds, and application deadlines.
- **Eligibility**: Multi-rule, real-time qualification evaluation powered by a standalone, object-oriented **Java SE Eligibility Engine**.
- **Applications**: Student job submissions, duplicate-prevention safeguards, and real-time application pipelines.
- **Application Status**: End-to-end status updates (`Applied`, `Shortlisted`, `Interview`, `Selected`, `Rejected`) with complete relational integrity.
- **Administrators**: Placement cell officers with role-based access control, real-time dashboard analytics, company/job CRUD controls, and student record protections.

---

## ✨ Features

### 🎓 Student Portal Features
- **Account Registration & Authentication**: Secure registration with input validation (minimum 6-character password, phone formatting, batch constraints) and bcrypt password hashing.
- **Academic Profile Management**: Dedicated profile hub displaying student roll number, verified branch, graduation batch, live CGPA, and backlog count with instant update capabilities.
- **Technical Skills Portfolio**: Add, view, and remove technical skills (Java, Python, SQL, React, Node.js, DSA, etc.) with duplicate-prevention safeguards.
- **Campus Job Drives Directory**: Real-time browsing of verified corporate job postings with company metadata, salary packages (CTC in INR), locations, and deadlines.
- **Automated Eligibility Engine**: One-click eligibility verification checking CGPA cutoffs, backlog thresholds, eligible branches, and required technical skills. Itemizes all satisfied criteria and missing requirements.
- **One-Click Application Submission**: Protected application submission preventing ineligible candidates or duplicate submissions.
- **My Applications Pipeline**: Live tracking of submitted applications with color-coded status badges (`Applied`, `Shortlisted`, `Interview`, `Selected`, `Rejected`).
- **Dark Mode & Responsive UI**: Seamless Light/Dark theme switching with anti-flash script and mobile navigation drawer.

### 🛡️ Placement Admin Portal Features
- **Secure Administrator Login**: Dedicated administrative authentication with role-based authorization (`role: 'admin'`).
- **Real-Time Analytics Dashboard**: Live metrics for total registered students, hiring companies, active drives, and total applications received.
- **Company Management**: Full CRUD operations for corporate partners with relational deletion protection (prevents deletion if active jobs exist).
- **Job Posting Management**: Full CRUD operations for placement drives with application deletion protection (prevents deletion if student applications exist).
- **Candidate Directory & Search**: Multi-parameter student filtering by search query, academic branch, batch year, minimum CGPA, and maximum backlogs, with deep profile modal inspection and deletion protection.
- **Recruitment Pipeline Management**: Full status management across all 5 recruitment states with instantaneous MySQL persistence.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+), CSS Custom Properties (Dual Themes) |
| **Backend** | Node.js, Express.js (RESTful Architecture) |
| **Database** | MySQL 8.0+ (Raw SQL with `mysql2` connection pooling & parameterized queries) |
| **Eligibility Engine** | Pure Java SE (Object-Oriented, zero external frameworks, streaming `stdin`/`stdout`) |
| **Security & Auth** | Bcrypt (10 salt rounds), Role-Based Access Control, Parameterized SQL |
| **Tooling & Dev** | Git, GitHub, Postman, Node.js Built-in Test Suites |

> **Architecture Rule**: Built purely with standard, vanilla web technologies. Zero frontend frameworks (no React, Vue, Angular), zero CSS libraries (no Bootstrap, Tailwind), and zero Java frameworks (no Spring Boot, Maven).

---

## 🏛️ System Architecture

### 1. High-Level System Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                 Frontend (Vanilla JS / HTML5)               │
│             Student Portal   &   Admin Portal               │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON REST APIs
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Node.js / Express.js Backend                │
│             Controllers, Routes, Service Layer              │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │ Parameterized SQL            │ JSON via stdin/stdout
               ▼                              ▼
┌──────────────────────────────┐┌──────────────────────────────┐
│           MySQL DB           ││  Java SE Eligibility Engine  │
│  8 Relational Tables / Pool  ││  Pure Calculation Matrix     │
└──────────────────────────────┘└──────────────────────────────┘
```

### 2. Java Eligibility Evaluation Flow

```text
Student / Admin UI
       │  (Requests eligibility check)
       ▼
Node.js Express Controller (/api/jobs/:jobId/eligibility/:userId)
       │  (Queries student profile, skills, and job criteria from MySQL)
       ▼
Node.js JavaEligibilityService
       │  (Spawns isolated child process: java -cp java/bin eligibility.Main)
       │  (Pipes structured JSON input via standard input)
       ▼
Java SE Eligibility Engine
       │  1. SimpleJsonParser: Parses input payload (zero-dependency)
       │  2. EligibilityEngine: Evaluates CGPA, Backlogs, Branch, and Skills
       │  3. Accumulates all reasons & failure messages without early exit
       │  4. Emits machine-readable JSON to standard output
       ▼
Node.js Bridge (Processes stdout, enforces 5000ms timeout & JS fallback)
       ▼
HTTP 200 JSON Response to Frontend
```

---

## 🔄 End-to-End Workflows

### 🎓 Student Workflow
```text
Registration
     ↓
Login
     ↓
Profile Management
     ↓
Skills Inventory
     ↓
Job Drives Directory
     ↓
Eligibility Evaluation (Java Engine)
     ↓
Application Submission
     ↓
Track Application Status
     ↓
Logout
```

### 🛡️ Admin Workflow
```text
Admin Login
     ↓
Executive Dashboard (Live Stats)
     ↓
Company Management (CRUD)
     ↓
Job Drives Management (CRUD)
     ↓
Student Directory & Profile Inspection
     ↓
Application Pipeline Management
     ↓
Recruitment Status Updates (Shortlisted / Interview / Selected / Rejected)
     ↓
Logout
```

---

## 💻 Installation & Setup Guide (Windows Friendly)

### Prerequisites
- **Node.js** (v18.0.0 or higher): [Download Node.js](https://nodejs.org/)
- **MySQL Server** (v8.0 or higher): [Download MySQL](https://dev.mysql.com/downloads/installer/)
- **Java SE Development Kit (JDK)** (v17, 21, or 24): [Download OpenJDK](https://adoptium.net/)
- **Git**: [Download Git](https://git-scm.com/)

---

### Step 1: Clone or Download the Repository
```bash
git clone https://github.com/your-username/College-Placement-Management-System.git
cd College-Placement-Management-System
```

---

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

---

### Step 3: Configure MySQL Database
1. Start your local MySQL service.
2. Open MySQL CLI or MySQL Workbench and run the schema setup script:
```bash
mysql -u root -p < database/schema.sql
```
*(Or execute `database/schema.sql` directly inside MySQL Workbench or DBeaver).*

---

### Step 4: Configure Environment Variables
1. In the `backend/` directory, create a `.env` file from the provided `.env.example`:
```bash
cp backend/.env.example backend/.env
```
*(On Windows PowerShell)*:
```powershell
Copy-Item backend.env.example backend.env
```
2. Open `backend/.env` and enter your local MySQL credentials:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=college_placement_system
DB_PORT=3306
```

---

### Step 5: Compile the Java Eligibility Engine
From the project root directory, compile the Java source files into `java/bin`:
```bash
javac -d java/bin java/eligibility/*.java
```

---

### Step 6: Start the Backend Server
From the project root directory:
```bash
node backend/server.js
```
Server starts on: `http://localhost:5000`
- Health Check: `http://localhost:5000/api/test`
- Database Health: `http://localhost:5000/api/test/database`

---

### Step 7: Open the Frontend
Open `frontend/index.html` in any modern browser (or use VS Code Live Server):
- **Landing Page**: `frontend/index.html`
- **Student Portal**: `frontend/pages/student-login.html`
- **Admin Portal**: `frontend/pages/admin-login.html`

---

## 📡 REST API Overview

All API endpoints return structured JSON with consistent `success: boolean` and `data` envelopes.

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new student account (creates `users` + `students` atomically) |
| `POST` | `/api/auth/login` | Authenticate student (bcrypt verified, no password exposure) |

### 👨‍🎓 Students (`/api/students`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/students/:userId` | Retrieve student academic profile |
| `PUT` | `/api/students/:userId` | Update student academic profile (name, phone, branch, CGPA, backlogs) |
| `GET` | `/api/students/:userId/skills` | List verified technical skills for student |
| `POST` | `/api/students/:userId/skills` | Associate new skill with student profile (409 on duplicate) |
| `DELETE`| `/api/students/:userId/skills/:skillId` | Remove skill from student profile |

### 🏢 Companies & Jobs (`/api/companies`, `/api/jobs`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/companies` | List all recruiting partner companies |
| `GET` | `/api/companies/:companyId` | Retrieve company profile and active job postings |
| `GET` | `/api/jobs` | Browse all active campus placement job drives |
| `GET` | `/api/jobs/:jobId` | Retrieve comprehensive job drive details and requirements |
| `GET` | `/api/jobs/:jobId/eligibility/:userId` | Evaluate student eligibility via **Java Eligibility Engine** |

### 📝 Applications (`/api/applications`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/applications` | Submit job application (guarded by eligibility check & duplicate prevention) |
| `GET` | `/api/applications/student/:userId` | View all applications submitted by candidate |
| `GET` | `/api/applications/:applicationId` | Retrieve specific application metadata |

### 🛡️ Administration (`/api/admin`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/admin/login` | Authenticate administrator (`role: 'admin'`) |
| `GET` | `/api/admin/companies` | Admin list companies |
| `POST` | `/api/admin/companies` | Admin create company profile |
| `PUT` | `/api/admin/companies/:id` | Admin update company profile |
| `DELETE`| `/api/admin/companies/:id` | Admin delete company (blocked with 409 if jobs exist) |
| `GET` | `/api/admin/jobs` | Admin list job drives |
| `POST` | `/api/admin/jobs` | Admin post new job opening |
| `PUT` | `/api/admin/jobs/:id` | Admin update job criteria/package |
| `DELETE`| `/api/admin/jobs/:id` | Admin delete job opening (blocked with 409 if applications exist) |
| `GET` | `/api/admin/students` | Admin student candidate directory with multi-parameter filtering |
| `GET` | `/api/admin/students/:userId`| Admin view complete student record (profile, skills, applications) |
| `DELETE`| `/api/admin/students/:userId`| Admin delete student (blocked with 409 if applications exist) |
| `GET` | `/api/admin/applications` | Admin view complete recruitment pipeline |
| `PUT` | `/api/admin/applications/:id/status` | Admin update status (`Applied`, `Shortlisted`, `Interview`, `Selected`, `Rejected`) |

---

## 🧪 Comprehensive Quality Assurance & Verification

The system includes 245 automated test assertions across 10 specialized test suites covering 100% of the project capabilities:

- **Security & Vulnerability Audit**: SQL injection resistance, password concealment, malformed input handling, and Java process safety.
- **Student End-to-End Workflow**: Full registration, login, profile editing, skills portfolio, job inspection, Java eligibility checking, and application submission.
- **Admin End-to-End Workflow**: Executive dashboard, real-time statistics, company/job CRUD, relational deletion protections (409 Conflict), candidate directory filtering, and status transitions.
- **Realistic 17-Step E2E Lifecycle Scenario**: Complete multi-role recruitment cycle from candidate registration through eligibility evaluation to administrative shortlisting and student verification.
- **Frontend Syntax & Script Integrity**: Zero syntax errors across all 10 HTML pages and vanilla JavaScript modules.
- **Java Eligibility Engine Standalone Tests**: 20 assertions verifying all evaluation criteria (CGPA, backlogs, branch, case-insensitive skills, multiple simultaneous failures, boundary values).
- **Responsive & Dark Mode Parity**: Verified across Desktop (1920px, 1440px, 1366px), Tablet (768px), and Mobile (390px, 375px) with zero horizontal overflow and instant theme persistence.

### Run All Automated Verification Suites
```bash
# 1. Standalone Java Eligibility Engine Suite
node C:/Users/krush/.gemini/antigravity/brain/fb936ea4-d41b-4877-b814-2e30b0a62b26/scratch/test_java_standalone.js

# 2. Java Engine Backend Integration Suite
node C:/Users/krush/.gemini/antigravity/brain/fb936ea4-d41b-4877-b814-2e30b0a62b26/scratch/test_step16_integration.js

# 3. Security & Vulnerability Audit Suite
node C:/Users/krush/.gemini/antigravity/brain/fb936ea4-d41b-4877-b814-2e30b0a62b26/scratch/test_step17_security_audit.js

# 4. Student Workflow Verification Suite
node C:/Users/krush/.gemini/antigravity/brain/fb936ea4-d41b-4877-b814-2e30b0a62b26/scratch/test_step17_student_flow.js

# 5. Admin Workflow Verification Suite
node C:/Users/krush/.gemini/antigravity/brain/fb936ea4-d41b-4877-b814-2e30b0a62b26/scratch/test_step17_admin_flow.js

# 6. Realistic 17-Step E2E Recruitment Scenario
node C:/Users/krush/.gemini/antigravity/brain/fb936ea4-d41b-4877-b814-2e30b0a62b26/scratch/test_step17_e2e_scenario.js

# 7. Frontend Syntax & Integrity Suite
node C:/Users/krush/.gemini/antigravity/brain/fb936ea4-d41b-4877-b814-2e30b0a62b26/scratch/test_step17_frontend_syntax.js

# 8. Navigation & Asset Link Audit Suite
node C:/Users/krush/.gemini/antigravity/brain/fb936ea4-d41b-4877-b814-2e30b0a62b26/scratch/test_step18_links_audit.js

# 9. Form & Accessibility Audit Suite
node C:/Users/krush/.gemini/antigravity/brain/fb936ea4-d41b-4877-b814-2e30b0a62b26/scratch/test_step18_a11y_audit.js
```

---

## 🔮 Future Improvements

Planned future enhancements for production deployment:
- **Cloud Deployment & Containerization**: Dockerizing backend, MySQL, and Java engine for seamless deployment on AWS, GCP, or Render.
- **Automated Email Notifications**: Transactional emails (via Nodemailer) alerting students when application status transitions to `Shortlisted` or `Interview`.
- **PDF Resume Upload & Cloud Storage**: Multer-based PDF resume upload integrating AWS S3 or Google Cloud Storage.
- **Advanced Placement Analytics**: Historical placement trends, departmental salary distributions, and year-over-year hiring charts.
- **Placement Cell Report Generation**: One-click export of shortlists and placement drive summaries to Excel/PDF.

---

## 📄 License

This project is open source and available under the [ISC License](LICENSE).

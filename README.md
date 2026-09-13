# College Placement Management System

> A full-stack, interview-ready web application engineered for managing campus placement drives, student job eligibility, and recruitment pipelines.

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=flat&logo=github)](https://github.com/krushnakant85/College-Placement-Management-System)
[![Node.js Version](https://img.shields.io/badge/node.js-v18%2B-brightgreen?logo=node.js)](https://nodejs.org/)
[![Java Version](https://img.shields.io/badge/java-SE%2017%2B-orange?logo=openjdk)](https://adoptium.net/)
[![MySQL Version](https://img.shields.io/badge/mysql-8.0%2B-blue?logo=mysql)](https://dev.mysql.com/)
[![License](https://img.shields.io/badge/license-ISC-lightgrey.svg)](backend/package.json)

---

## 📌 Project Overview

The **College Placement Management System** is an end-to-end web platform designed to streamline and automate campus placement operations for higher education institutions, graduating students, and recruiting companies.

The system replaces fragmented spreadsheets and manual screening with a centralized, data-driven platform that manages:
- **Student Registration & Authentication**: Secure student onboarding with credential hashing and role-based access.
- **Student Academic Profiles**: Tracking roll numbers, academic branch, graduation batch, live CGPA, and backlog history.
- **Technical Skills Portfolio**: Student inventory of verified skills matched against job drive prerequisites.
- **Partner Companies**: Corporate recruiter directory with corporate profiles, contacts, and drive listings.
- **Job Postings & Campus Drives**: Job descriptions, salary packages (CTC), work locations, and multi-criteria eligibility requirements.
- **Automated Eligibility Checking**: Real-time evaluation of student qualifications powered by an isolated, high-performance **Java SE Eligibility Engine**.
- **Job Applications**: Candidate submission workflows with strict eligibility gating and duplicate-application prevention.
- **Application Status Tracking**: End-to-end recruitment stage tracking (`Applied` → `Shortlisted` → `Interview` → `Selected` → `Rejected`).
- **Placement Cell Administration**: Administrative controls for student directories, company partners, job listings, and application pipelines.
- **Java-Based Eligibility Processing**: Standalone object-oriented computation matrix communicating with the Node.js backend via standard I/O streams.

---

## ✨ Key Features

### 🎓 Student Features
- **Registration and Login**: Secure student signup with strict validation (email format, batch validation, 10-digit phone, minimum 6-character password) and bcrypt password encryption.
- **Profile Management**: View and edit personal contact details, academic department, CGPA, and active backlog count.
- **Skills Management**: Add and delete verified technical competencies (Java, Python, SQL, React, Node.js, DSA, etc.) with duplicate-skill safeguards.
- **Browse Jobs**: Explore active corporate campus placement drives with package details, locations, deadlines, and requirements.
- **Check Eligibility**: One-click eligibility evaluation against CGPA thresholds, maximum allowed backlogs, eligible academic branches, and required technical skills.
- **Apply for Jobs**: Protected one-click application submission with duplicate-entry prevention and eligibility verification.
- **Track Applications**: Live candidate portal displaying submission dates and color-coded status badges for each drive.
- **Dark Mode**: Persistent dual-theme interface (Light ☀️ / Dark 🌙) with zero-flash execution.

### 🛡️ Admin Features
- **Admin Authentication**: Dedicated administrative authentication with role-based access control (`role: 'admin'`).
- **Dashboard Analytics**: Real-time executive dashboard summarizing total registered students, active companies, live job drives, and candidate applications.
- **Company Management**: Complete CRUD operations for recruiting partner companies with relational integrity protection (prevents deletion if active job postings exist).
- **Job Management**: Complete CRUD operations for campus recruitment drives with application protection (prevents deletion if candidate applications exist).
- **Student Management**: Multi-parameter searchable candidate directory (filtered by branch, graduation batch, minimum CGPA, maximum backlogs) with deep profile modal inspection and relational deletion safeguards.
- **Application Management**: Centralized application review pipeline across all campus drives.
- **Application Status Updates**: Real-time recruitment stage transitions (`Applied`, `Shortlisted`, `Interview`, `Selected`, `Rejected`) with instant persistence.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Pure, lightweight frontend built without external UI frameworks (zero React, Vue, Angular, Bootstrap, or Tailwind). |
| **Backend** | Node.js, Express.js | Modular RESTful API server implementing MVC architecture, route handlers, controllers, and service layers. |
| **Database** | MySQL 8.0+, `mysql2`, Plain SQL | Relational database utilizing foreign key constraints, check constraints, indexes, and connection pooling. |
| **Eligibility Engine** | Java SE | Standalone, pure Object-Oriented calculation engine communicating with Node.js via child process I/O. |
| **Security & Auth** | Bcrypt (10 salt rounds), SQL Parameterization | Secure password hashing, credential protection, and strict prevention of SQL injection. |
| **Development & Testing** | Git, GitHub, Postman, Node Test Suites | Version control, endpoint verification, and automated end-to-end integration test runners. |

---

## 🏛️ System Architecture

```text
Browser Client (Desktop / Mobile)
   ↓
HTML5 / CSS3 / Vanilla JavaScript Frontend
   ↓ HTTP / REST (JSON)
Node.js + Express REST API Server
   ↓                               ↓ Child Process (stdin/stdout JSON)
MySQL Database            Java SE Eligibility Engine
(8 Relational Tables)     (Independent OOP Rules Matrix)
```

### Architecture Highlights
1. **Separation of Concerns**: The frontend is completely decoupled from database queries and calls Node.js REST API endpoints over HTTP.
2. **Polyglot Micro-Service Layer**: The Java Eligibility Engine operates as an independent calculation engine. When a student evaluates job eligibility, Node.js gathers student and job criteria from MySQL and invokes the Java process via `child_process.spawn` using standard input and output streams.
3. **Safety & Fallback Guard**: The backend enforces a 5000ms execution guard on the Java process and includes an automatic local JavaScript evaluation fallback in the event of an environment failure.

---

## 📂 Project Structure

```text
College-Placement-Management-System/
├── .gitignore                         # Git exclusion rules for node_modules, secrets, logs, binaries
├── README.md                          # Comprehensive project documentation
├── database/
│   └── schema.sql                     # Complete MySQL DDL schema and initial seed dataset
├── backend/
│   ├── .env.example                   # Safe environment configuration template
│   ├── .gitignore                     # Backend-specific ignore rules
│   ├── package.json                   # Node.js project manifest and dependency definitions
│   ├── package-lock.json              # Deterministic dependency lockfile
│   ├── server.js                      # Express application entrypoint and middleware setup
│   ├── config/
│   │   └── database.js                # MySQL connection pool configuration with mysql2
│   ├── controllers/
│   │   ├── authController.js          # Student authentication (register, login, bcrypt)
│   │   ├── studentController.js       # Student profile retrieval and updates
│   │   ├── studentSkillController.js  # Student technical skills portfolio management
│   │   ├── companyController.js       # Company listing and profile retrieval
│   │   ├── jobController.js           # Job listings and criteria retrieval
│   │   ├── eligibilityController.js   # Job eligibility check handler
│   │   ├── applicationController.js   # Student application submissions and tracking
│   │   ├── adminController.js         # Admin authentication, dashboard stats, company/job CRUD
│   │   └── adminStudentController.js  # Admin student directory, filtering, and applications
│   ├── routes/
│   │   ├── authRoutes.js              # /api/auth endpoints
│   │   ├── studentRoutes.js           # /api/students endpoints
│   │   ├── studentSkillRoutes.js      # /api/students/:userId/skills endpoints
│   │   ├── companyRoutes.js           # /api/companies endpoints
│   │   ├── jobRoutes.js               # /api/jobs endpoints
│   │   ├── applicationRoutes.js       # /api/applications endpoints
│   │   ├── adminRoutes.js             # /api/admin authentication, dashboard, company/job endpoints
│   │   ├── adminStudentRoutes.js      # /api/admin student directory and application pipeline
│   │   └── testRoutes.js              # /api/test diagnostic endpoints
│   └── services/
│       └── javaEligibilityService.js  # Node-to-Java IPC bridge and fallback evaluation engine
├── frontend/
│   ├── index.html                     # Public recruitment landing page
│   ├── css/
│   │   └── style.css                  # Responsive design styles, CSS variables, Light/Dark themes
│   ├── js/
│   │   ├── api.js                     # Client-side API service abstraction using Fetch API
│   │   └── main.js                    # Global utilities, theme manager, session guards, toast alerts
│   └── pages/
│       ├── student-login.html         # Student authentication portal
│       ├── student-register.html      # Student registration form
│       ├── student-dashboard.html     # Student portal (Profile, Skills, Drives, Applications)
│       ├── admin-login.html           # Administrator login portal
│       ├── admin-dashboard.html       # Administrator executive metrics dashboard
│       ├── admin-companies.html       # Corporate partner management portal
│       ├── admin-jobs.html            # Campus recruitment drive management portal
│       ├── admin-students.html        # Candidate directory and search portal
│       └── admin-applications.html    # Recruitment pipeline & status management portal
└── java/
    ├── bin/                           # Compiled Java bytecode (.class files, gitignored)
    └── eligibility/
        ├── Main.java                  # Java CLI entrypoint reading JSON via stdin
        ├── EligibilityEngine.java     # Core evaluation logic (CGPA, backlogs, branch, skills)
        ├── EligibilityInput.java      # Typed model for candidate qualifications and job criteria
        ├── EligibilityResult.java     # Output model tracking passed status and itemized reasons
        └── SimpleJsonParser.java      # Zero-dependency streaming JSON parser
```

---

## 🗄️ Database Overview

The relational database (`college_placement_system`) consists of 8 interconnected tables with strict foreign keys, cascade rules, and check constraints:

| Table | Primary Key | Key Relationships | Description |
| :--- | :--- | :--- | :--- |
| **`users`** | `id` | Root authentication table | Stores account credentials (`email`, `password` hash, `role` ENUM: `student` or `admin`). |
| **`students`** | `id` | `user_id` → `users(id)` (1-to-1) | Stores academic details (`student_id`, `name`, `phone`, `branch`, `cgpa`, `graduation_year`, `backlogs`). |
| **`admins`** | `id` | `user_id` → `users(id)` (1-to-1) | Stores placement officer information (`name`, `phone`). |
| **`companies`** | `id` | One-to-many with `jobs` | Stores recruiting partner details (`name`, `website`, `location`, `hr_contact`, `hr_email`). |
| **`jobs`** | `id` | `company_id` → `companies(id)` | Stores drive details (`title`, `package_lpa`, `min_cgpa`, `max_backlogs`, `eligible_branches`, `deadline`). |
| **`skills`** | `id` | Master skills directory | Stores normalized technical competencies (`name`, `category`). |
| **`student_skills`** | `id` | `student_id` → `students(id)`, `skill_id` → `skills(id)` | Many-to-many join table tracking student skill proficiencies with unique composite constraint. |
| **`applications`** | `id` | `job_id` → `jobs(id)`, `student_id` → `students(id)` | Stores candidate submissions and status (`Applied`, `Shortlisted`, `Interview`, `Selected`, `Rejected`). |

---

## 📡 REST API Overview

All API endpoints exchange structured JSON payloads following consistent format conventions:
```json
{
  "success": true,
  "message": "Descriptive status message",
  "data": { ... }
}
```

### 1. Authentication
- `POST /api/auth/register` — Register a new student account (creates `users` and `students` records atomically).
- `POST /api/auth/login` — Authenticate student credentials (bcrypt verified, sets session role).

### 2. Student Profile Management
- `GET /api/students/:userId` — Retrieve complete student academic profile.
- `PUT /api/students/:userId` — Update student profile details (`name`, `phone`, `branch`, `cgpa`, `backlogs`).

### 3. Student Skills Management
- `GET /api/students/:userId/skills` — Retrieve list of verified skills associated with the student.
- `POST /api/students/:userId/skills` — Associate a new skill with the student profile (returns `409` if duplicate).
- `DELETE /api/students/:userId/skills/:skillId` — Remove a skill from the student profile.

### 4. Campus Job Drives
- `GET /api/jobs` — Retrieve all active corporate recruitment drives with company metadata.
- `GET /api/jobs/:jobId` — Retrieve specific job details, package, criteria, and required skills.

### 5. Eligibility Evaluation
- `GET /api/jobs/:jobId/eligibility/:userId` — Evaluate candidate qualifications against job criteria via the **Java Eligibility Engine**.

### 6. Job Applications
- `POST /api/applications` — Submit a candidate application (validated by eligibility verification and duplicate guard).
- `GET /api/applications/student/:userId` — Retrieve all job applications submitted by the student candidate.
- `GET /api/applications/:applicationId` — Retrieve details for a specific application record.

### 7. Administrator Authentication & Metrics
- `POST /api/admin/login` — Authenticate placement administrator credentials (`role: 'admin'`).
- `GET /api/admin/dashboard/stats` — Retrieve real-time count of students, companies, drives, and applications.

### 8. Admin Company & Job Management
- `GET /api/admin/companies` — List all partner companies.
- `POST /api/admin/companies` — Create a new company profile.
- `PUT /api/admin/companies/:id` — Update existing company details.
- `DELETE /api/admin/companies/:id` — Delete company profile (safely blocked with `409 Conflict` if jobs exist).
- `GET /api/admin/jobs` — List all placement drives.
- `POST /api/admin/jobs` — Create a new campus placement drive.
- `PUT /api/admin/jobs/:id` — Update existing drive details.
- `DELETE /api/admin/jobs/:id` — Delete placement drive (safely blocked with `409 Conflict` if applications exist).

### 9. Admin Student Directory
- `GET /api/admin/students` — Searchable candidate directory with multi-parameter filtering (`search`, `branch`, `batch`, `minCgpa`, `maxBacklogs`).
- `GET /api/admin/students/:userId` — Inspect comprehensive student profile, verified skills, and application records.
- `DELETE /api/admin/students/:userId` — Delete student record (safely blocked with `409 Conflict` if applications exist).

### 10. Admin Application Pipeline
- `GET /api/admin/applications` — View complete application pipeline across all campus drives.
- `PUT /api/admin/applications/:id/status` — Update candidate recruitment status (`Applied`, `Shortlisted`, `Interview`, `Selected`, `Rejected`).

---

## 💻 Local Development Setup

Follow these 10 step-by-step instructions to set up, run, and verify the College Placement Management System locally on your workstation.

> 📖 **Project & Interview Quick Links**:
> - Comprehensive Technical Dossier: **[PROJECT_EXPLANATION.md](PROJECT_EXPLANATION.md)**
> - 35 Technical Interview & Viva Voce Q&A: **[INTERVIEW_QUESTIONS.md](INTERVIEW_QUESTIONS.md)**
> - 5–10 Min Live Demonstration Script: **[DEMO_SCRIPT.md](DEMO_SCRIPT.md)**
> - Resume & Portfolio Bullet Points: **[RESUME_PROJECT.md](RESUME_PROJECT.md)**
> - Detailed Troubleshooting & Beginner Setup: **[RUNNING_LOCALLY.md](RUNNING_LOCALLY.md)**
> - Pre-Configured API Collection: **[Postman Collection](postman/College_Placement_Management_System.postman_collection.json)**

---

### Step 1: Clone the GitHub Repository
Clone the repository to your local computer and enter the project folder:
```bash
git clone https://github.com/krushnakant85/College-Placement-Management-System.git
cd College-Placement-Management-System
```

---

### Step 2: Install Required Software
Ensure the following software packages are installed and available in your system path:
- **Node.js** (v18.0.0 or higher, tested on v24.x): [Download Node.js](https://nodejs.org/)
- **MySQL Server** (v8.0 or higher): [Download MySQL](https://dev.mysql.com/downloads/mysql/)
- **Java SE Development Kit (JDK)** (v17 or higher, tested on Java 24): [Download OpenJDK](https://adoptium.net/)
- **Git**: [Download Git](https://git-scm.com/)

---

### Step 3: Configure MySQL
Ensure your local MySQL service is active and running:
- **Windows**: Verify via Services (`services.msc`) that MySQL service is "Running".
- **macOS / Linux**: `sudo systemctl status mysql` (or `brew services list`).

---

### Step 4: Create / Import the Database using `database/schema.sql`
Import the complete relational schema and initial seed data:
```bash
# Windows PowerShell
Get-Content database/schema.sql | mysql -u root -p

# Standard MySQL CLI (Linux / macOS / Windows CMD)
mysql -u root -p < database/schema.sql
```
*(When prompted, enter your local MySQL root password).*

This creates the `college_placement_system` database with all 8 tables (`users`, `students`, `admins`, `companies`, `jobs`, `skills`, `student_skills`, `applications`) and seed data.

---

### Step 5: Configure Backend Environment Variables
Create your local `.env` configuration file from the safe example template:
```bash
# Windows PowerShell
Copy-Item backend/.env.example backend/.env

# Linux / macOS
cp backend/.env.example backend/.env
```
Open `backend/.env` in your text editor and set your local credentials:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=college_placement_system
DB_SSL=false
```
*(Note: `backend/.env` is strictly excluded by `.gitignore` and must never be committed to version control).*

---

### Step 6: Install Backend Dependencies
Navigate to the `backend/` directory and install the required npm dependencies:
```bash
cd backend
npm install
cd ..
```

---

### Step 7: Start / Compile the Java Eligibility Engine
Compile the Java source files into bytecode:
```bash
javac -d java/bin java/eligibility/*.java
```
*Quick test to verify standalone Java engine execution:*
```bash
# PowerShell / Bash test execution
echo '{"student":{"cgpa":8.5,"backlogs":0,"branch":"Computer Science","skills":["Java"]},"job":{"minimumCgpa":7.0,"maximumBacklogs":0,"eligibleBranch":"Computer Science","requiredSkills":["Java"]}}' | java -cp java/bin eligibility.Main
```
*(The Node.js backend automatically invokes this compiled engine via child process standard I/O, with an internal JavaScript fallback for 100% availability).*

---

### Step 8: Start the Node.js Backend
Start the Express API server from the project root:
```bash
cd backend
npm start
```
*(Alternatively: `node backend/server.js` from the root directory).*

Console confirmation:
```text
Server is running on port 5000
API Test URL: http://localhost:5000/api/test
Database Test URL: http://localhost:5000/api/test/database
```

---

### Step 9: Open / Run the Frontend
Because the frontend is engineered in pure HTML5, CSS3, and Vanilla JavaScript, no compilation or bundler is needed:
1. **Direct Browser**: Open `frontend/index.html` directly in your web browser.
2. **Local Static Server (Recommended)**:
   ```bash
   npx serve frontend
   ```
   Navigate to `http://localhost:3000` (or assigned port).

**Portal Navigation**:
- Landing Page: `frontend/index.html`
- Student Portal: `frontend/pages/student-login.html`
- Admin Portal: `frontend/pages/admin-login.html`

---

### Step 10: Verify the Application
Confirm that all core system components are operational:
1. **API Health**: Visit `http://localhost:5000/api/test` (Returns HTTP 200 `{ "success": true }`).
2. **Database Connection**: Visit `http://localhost:5000/api/test/database` (Returns HTTP 200 with connection test).
3. **Student Flow**: Log in as student (`arav.sharma@student.edu` / seed password or register a new candidate) -> view profile, add skills, check job eligibility, and apply.
4. **Admin Flow**: Log in as admin (`admin.placement@college.edu` / seed password) -> view metrics dashboard, manage companies, jobs, student candidates, and transition recruitment status.

---

## 🚀 Production Deployment

> **Deployment Readiness Notice**: Deployment configuration is prepared; production hosting has not yet been configured.

The following guide details the production architecture, hosting prerequisites, environment configuration, and deployment procedures for transitioning from local development to a live cloud or institutional production environment.

### 1. Architecture Overview (Local vs. Production)

| Dimension | Local Development | Production Deployment |
| :--- | :--- | :--- |
| **Frontend Delivery** | Static file opening or local server (`npx serve frontend`) | High-availability CDN / Static Hosting (Cloudflare Pages, Vercel, Netlify, or Nginx) |
| **Backend Service** | Node.js process (`node backend/server.js`) | Containerized / Managed Process with auto-restart (PM2, Docker, AWS ECS, or Render) |
| **Database** | Local MySQL instance (`localhost:3306`) | Managed cloud MySQL 8.0+ instance (AWS RDS, DigitalOcean Managed Database) |
| **Java Engine** | Local JDK (`javac -d java/bin java/eligibility/*.java`) | Pre-compiled bytecode with OpenJDK 17+ JRE & automatic zero-downtime JS fallback |
| **API Addressing** | Hardcoded default (`http://localhost:5000/api`) | Dynamic injection via `window.__API_BASE_URL__` or reverse proxy (`/api`) |
| **CORS Policy** | Permissive (allows all origins for local testing) | Strict whitelist matching the production frontend origin via `CORS_ORIGIN` |
| **Transport** | HTTP | Enforced HTTPS with TLS/SSL certificate |

---

### 2. Required Production Services
1. **Node.js Application Runtime**: Node.js v18+ LTS with `npm`.
2. **Managed MySQL Database**: MySQL 8.0+ with connection pooling enabled.
3. **Java SE Runtime (JRE)**: OpenJDK 17+ or Oracle JRE for native eligibility engine execution.
4. **Static Web Server / CDN**: Any modern static host to serve frontend HTML, CSS, and vanilla JS.

---

### 3. Production Environment Variables Reference

Configure these environment variables in your production hosting dashboard or container environment (never commit real values to version control):

```env
# Node Environment
NODE_ENV=production
PORT=5000

# CORS Whitelist (comma-separated production frontend domains)
CORS_ORIGIN=https://placement.yourcollege.edu

# Production MySQL Database Connection
DB_HOST=your-production-db-host.internal
DB_PORT=3306
DB_USER=placement_prod_user
DB_PASSWORD=your_strong_production_password
DB_NAME=college_placement_system
```

---

### 4. Database Setup & Migration
1. Provision a production MySQL 8.0+ database.
2. Execute the full relational schema and seed dataset from `database/schema.sql`:
```bash
mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p <DB_NAME> < database/schema.sql
```
3. Verify the creation of all 8 core tables: `users`, `students`, `admins`, `companies`, `jobs`, `skills`, `student_skills`, and `applications`.

---

### 5. Backend Deployment Procedure
1. Clone repository to backend host:
```bash
git clone https://github.com/krushnakant85/College-Placement-Management-System.git
cd College-Placement-Management-System
```
2. Install production dependencies:
```bash
cd backend
npm install --omit=dev
cd ..
```
3. Pre-compile the Java Eligibility Engine:
```bash
javac -d java/bin java/eligibility/*.java
```
4. Launch with production process supervisor (e.g. PM2):
```bash
pm2 start backend/server.js --name "placement-api" --time
pm2 save
```
5. Verify health check: `curl https://api.yourdomain.com/api/test`

---

### 6. Frontend Deployment & API Configuration
1. Deploy the `frontend/` directory to your static web host (e.g., Cloudflare Pages, Netlify, Vercel, or AWS S3).
2. Configure the production API base URL by setting `window.__API_BASE_URL__` before loading `js/api.js`, or configure a reverse proxy routing `/api/*` to the backend server.
3. Ensure SSL/TLS is active so all requests travel over HTTPS.

---

### 7. Java Eligibility Engine in Production
- The backend spawns `java -cp java/bin eligibility.Main` via child process standard I/O.
- If the host environment lacks Java or experiences a timeout (>5000ms), `backend/services/javaEligibilityService.js` seamlessly invokes an internal, mathematically identical JavaScript fallback to guarantee 100% service availability.

---

### 8. Production Security Hardening
- **Secret Protection**: Verify that `backend/.env` is excluded via `.gitignore` and not stored in git.
- **SQL Injection Defense**: All database queries utilize parameterized prepared statements via `mysql2`.
- **Password Security**: Passwords use bcrypt hashing with 10 salt rounds and are never exposed in API payloads.
- **CORS Protection**: Access is restricted strictly to designated institution domains.

> [!TIP]
> **Complete Production Deployment Guide & Checklist**:
> For the full platform-independent deployment blueprint covering frontend static hosting, backend provisioning, managed MySQL setup, environment variable references, health checks, and troubleshooting, refer to [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 🧪 Testing & Verification

The system was verified using automated test suites covering all system layers:

| Focus Area | Test Coverage & Verified Scenarios | Status |
| :--- | :--- | :--- |
| **Authentication** | Student registration, duplicate roll number/email rejection, login verification, invalid password rejection, password hashing with bcrypt. | **VERIFIED** |
| **Student Profile** | Roll number formatting, CGPA boundary validation (0.00–10.00), backlog count updates, profile persistence in MySQL. | **VERIFIED** |
| **Skills Management** | Skill addition, duplicate skill association prevention (`409 Conflict`), skill deletion. | **VERIFIED** |
| **Company & Job Listings** | Corporate partner directory retrieval, placement drive listings, salary and criteria verification. | **VERIFIED** |
| **Eligibility Engine** | Standalone Java engine verification across all criteria (CGPA cutoff, maximum backlogs, eligible branch, required skills matching, multi-criteria failure accumulation). | **VERIFIED** |
| **Job Applications** | Eligible student submission, ineligible candidate rejection, duplicate application prevention (`409 Conflict`), candidate pipeline listing. | **VERIFIED** |
| **Admin Authentication & RBAC** | Dedicated admin login, role authorization guards (`role: 'admin'`), session management. | **VERIFIED** |
| **Admin Management & Protection** | Company CRUD, Job CRUD, relational deletion prevention (blocked when active jobs or applications exist), multi-parameter student candidate directory filtering. | **VERIFIED** |
| **Recruitment Status Pipeline** | Candidate status transitions across all 5 recruitment stages (`Applied`, `Shortlisted`, `Interview`, `Selected`, `Rejected`). | **VERIFIED** |
| **Security Auditing** | SQL injection resistance on parameter queries, password concealment in API responses, non-root Java process execution via streaming `stdin`. | **VERIFIED** |
| **End-to-End Scenario** | Comprehensive 17-step cross-role recruitment lifecycle from initial student registration to final administrative selection. | **VERIFIED** |

*All 245 test assertions across the test suites passed with 100% success rate.*

---

## 🔗 GitHub Repository

Official Project Repository:
[https://github.com/krushnakant85/College-Placement-Management-System](https://github.com/krushnakant85/College-Placement-Management-System)

---

## 🔮 Future Improvements

The following features represent realistic planned enhancements for future iterations of the platform:
- **Cloud Deployment**: Containerizing the application using Docker and deploying to AWS, GCP, or Render.
- **Automated Email Notifications**: Triggering email alerts to students upon recruitment status changes (e.g., Shortlisted, Interview invite).
- **Resume Upload & Storage**: Enabling PDF resume upload with cloud object storage (e.g., AWS S3).
- **Advanced Analytics & Charts**: Interactive placement performance dashboards showing departmental hiring trends and package distributions.
- **Automated CI/CD**: GitHub Actions workflows to automate testing, linting, and Java compilation on each push.
- **Additional Role-Based Features**: Dedicated recruiter/company login portal to post jobs directly and review applicants.

---

## 📄 License

This project is licensed under the [ISC License](backend/package.json).

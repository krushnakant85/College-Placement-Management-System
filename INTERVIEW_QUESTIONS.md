# Technical Interview & Viva Voce Preparation Guide

> A curated collection of 35 realistic technical interview and academic viva questions and answers based on the actual implementation of the College Placement Management System.

---

## 📑 Table of Contents
1. [Project Overview & Architecture (Q1 – Q6)](#1-project-overview--architecture)
2. [Node.js & Express REST Backend (Q7 – Q10)](#2-nodejs--express-rest-backend)
3. [MySQL Database & Relational Design (Q11 – Q15)](#3-mysql-database--relational-design)
4. [Authentication, Authorization & Security (Q16 – Q20)](#4-authentication-authorization--security)
5. [Java Eligibility Engine & IPC (Q21 – Q24)](#5-java-eligibility-engine--ipc)
6. [Frontend & Vanilla JavaScript (Q25 – Q28)](#6-frontend--vanilla-javascript)
7. [Testing, Git & Deployment Readiness (Q29 – Q32)](#7-testing-git--deployment-readiness)
8. [Design Decisions, Trade-offs & Future Work (Q33 – Q35)](#8-design-decisions-trade-offs--future-work)

---

## 1. Project Overview & Architecture

### Q1: What is the College Placement Management System, and what core problem does it solve?
**Answer**:
The College Placement Management System is a full-stack, local-first web application engineered to streamline and automate campus recruitment operations for higher education institutions, graduating students, and corporate recruiters.
Traditionally, college placement cells rely on fragmented spreadsheets, manual email distribution lists, and error-prone eligibility screening. This system centralizes student profile management, company and job postings, multi-criteria eligibility calculation, and recruitment status tracking into a single, cohesive platform with strict role-based access control.

### Q2: What is the high-level architecture of this application?
**Answer**:
The system employs a 4-tier modular architecture:
1. **Client Tier**: Pure HTML5, CSS3, and Vanilla JavaScript executing natively in the browser with zero external framework overhead.
2. **API Tier**: Node.js and Express.js REST API providing endpoint routing, controller logic, and input validation.
3. **Database Tier**: MySQL 8.0+ relational database enforcing strict foreign keys, cascading rules, and check constraints via a `mysql2/promise` connection pool.
4. **Computation Engine**: An independent, pure Java SE Eligibility Engine spawned as a child process by Node.js over standard I/O (stdin/stdout streaming JSON), backed by an automatic JavaScript fallback engine.

### Q3: Why did you choose a polyglot architecture (Node.js + Java) instead of doing everything in JavaScript?
**Answer**:
In enterprise recruitment systems, candidate eligibility evaluation is a compute-heavy business rule matrix requiring strong object-oriented domain modeling, strict type safety, and isolated execution. Java SE is exceptionally well-suited for rigid enterprise rules and high-throughput evaluation.
By isolating eligibility logic in Java, we separate business calculation from HTTP request routing. Node.js handles fast, asynchronous I/O, while Java encapsulates typed evaluation models (`EligibilityInput`, `EligibilityResult`, `EligibilityEngine`). Furthermore, we built a zero-downtime JavaScript fallback inside Node.js in case Java is unavailable on the host system.

### Q4: How do the layers communicate with each other?
**Answer**:
- The **Frontend** communicates with the **Node.js REST API** via asynchronous HTTP requests using the native browser `fetch()` API, exchanging JSON payloads.
- The **Node.js API** queries the **MySQL database** over TCP using parameterized SQL statements through `mysql2/promise` connection pooling.
- The **Node.js API** communicates with the **Java Engine** using `child_process.spawn('java', ['-cp', JAVA_BIN_DIR, 'eligibility.Main'])`, piping JSON to the process's `stdin` and reading the evaluation result from `stdout`.

### Q5: What is the advantage of using Plain SQL instead of an ORM like Sequelize or Prisma?
**Answer**:
Plain SQL provides three key advantages:
1. **Full Visibility & Performance**: We retain complete control over every query, indexing strategy, and execution plan without ORM abstraction overhead or hidden N+1 query traps.
2. **Portability & Determinism**: Plain SQL scripts (`database/schema.sql`) can be imported into any MySQL instance without depending on Node runtime migrations.
3. **Demonstrated Database Fundamentals**: Writing explicit SQL queries (joins, transactions, aggregates) demonstrates core database engineering competence rather than relying on framework abstractions.

### Q6: How does the application handle CORS (Cross-Origin Resource Sharing)?
**Answer**:
In `backend/server.js`, we configure the `cors` middleware. In development, it allows requests from local origins. In production, it reads the `CORS_ORIGIN` environment variable (a comma-separated list of approved institutional domains) and verifies incoming request origins dynamically, rejecting unauthorized domains.

---

## 2. Node.js & Express REST Backend

### Q7: What design pattern does your backend follow?
**Answer**:
The backend follows the **MVC (Model-View-Controller)** pattern adapted for REST APIs:
- **Routes** (`routes/`): Map HTTP endpoints and verbs (GET, POST, PUT, DELETE) to specific controller functions.
- **Controllers** (`controllers/`): Handle incoming request parsing, invoke validation, query database models, and return structured JSON responses.
- **Services** (`services/`): Encapsulate cross-cutting or external logic, such as the Java child-process bridge and fallback engine in `javaEligibilityService.js`.
- **Config** (`config/`): Manages environment configuration and database connection pooling.

### Q8: How is error handling structured across the Express backend?
**Answer**:
Error handling is implemented at two levels:
1. **Controller Level**: All asynchronous route handlers use `try...catch` blocks. If an operational error occurs (e.g. invalid input, duplicate record), the controller sends a structured JSON error response with an appropriate HTTP status code (400, 404, 409).
2. **Centralized Middleware**: Unhandled exceptions are passed to Express's global error handler (`app.use((err, req, res, next) => ...)`) in `backend/server.js`, logging the error internally and returning a clean HTTP 500 response without leaking stack traces or credentials.

### Q9: What is the format of API responses throughout the project?
**Answer**:
All REST responses adhere to a consistent JSON envelope:
```json
{
  "success": true,
  "message": "Descriptive status message",
  "data": { ... }
}
```
For errors:
```json
{
  "success": false,
  "message": "Specific error description"
}
```
This standard makes frontend parsing predictable and uniform.

### Q10: Why did you use connection pooling in `mysql2` instead of creating single connections per request?
**Answer**:
Creating and closing a new TCP connection for every HTTP request adds significant network latency (handshake and authentication overhead) and can exhaust database server sockets under concurrent traffic.
Using `mysql.createPool({ connectionLimit: 10, waitForConnections: true })` maintains a reusable pool of verified connections. Express requests acquire a connection from the pool instantly and return it upon query completion.

---

## 3. MySQL Database & Relational Design

### Q11: Explain the 8 tables in your schema and their primary purposes.
**Answer**:
1. **`users`**: Base authentication table storing email, bcrypt-hashed password, role (`student` or `admin`), and creation timestamp.
2. **`students`**: Academic candidate profiles linked 1-to-1 with `users(id)`, tracking roll number, department, CGPA, graduation batch, and backlogs.
3. **`admins`**: Placement cell officer profiles linked 1-to-1 with `users(id)`.
4. **`companies`**: Corporate recruiting partner directory (company name, location, website, description).
5. **`jobs`**: Campus placement drives posted by companies (package, role, minimum CGPA, eligible branches, maximum backlogs, deadline).
6. **`skills`**: Master dictionary of normalized technical competencies (e.g. Java, Python, SQL).
7. **`student_skills`**: Junction table modeling the Many-to-Many relationship between students and skills, with composite primary key `(student_id, skill_id)`.
8. **`applications`**: Student job drive submissions tracking recruitment status (`Applied`, `Shortlisted`, `Interview`, `Selected`, `Rejected`).

### Q12: What foreign keys and cascading rules are implemented, and why?
**Answer**:
All child tables reference parent tables via foreign keys with `ON DELETE CASCADE ON UPDATE CASCADE`:
- `students.user_id` → `users.id`
- `admins.user_id` → `users.id`
- `jobs.company_id` → `companies.id`
- `student_skills.student_id` → `students.id`
- `student_skills.skill_id` → `skills.id`
- `applications.student_id` → `students.id`
- `applications.job_id` → `jobs.id`
Cascading ensures that if a student profile is legitimately deleted, all associated skills and application records are cleaned up automatically without leaving orphaned records. In addition, the admin API includes application-level safety checks that prevent deletion of companies with active jobs or jobs with active candidate applications (returning HTTP 409 Conflict).

### Q13: What unique and check constraints did you add to ensure data integrity?
**Answer**:
1. **Unique Constraints**:
   - `users.email`: Prevents duplicate account creation.
   - `students.student_id`: Ensures student roll numbers are strictly unique across the college.
   - `companies.company_name` and `skills.skill_name`: Avoids duplicate catalog entries.
   - `applications(student_id, job_id)`: The `unique_student_job` constraint prevents a student from applying multiple times to the same placement drive.
2. **Check Constraints**:
   - `CHECK (cgpa >= 0.00 AND cgpa <= 10.00)`: Enforces valid CGPA boundaries.
   - `CHECK (backlogs >= 0)`: Prevents negative backlog counts.
   - `CHECK (minimum_cgpa >= 0.00 AND minimum_cgpa <= 10.00)` on jobs.

### Q14: What normal form is the database in?
**Answer**:
The database is normalized to **Third Normal Form (3NF)**:
- **1NF**: Every column contains atomic values, each row has a primary key, and there are no repeating groups.
- **2NF**: All non-key attributes are fully functionally dependent on the primary key (no partial dependencies; e.g. skills are separated into a junction table).
- **3NF**: There are no transitive dependencies; non-key attributes depend only on the primary key (e.g. company contact details belong in `companies`, not duplicated inside `jobs`).

### Q15: How would you optimize the database for high concurrent traffic?
**Answer**:
1. **Indexing**: Add composite indexes on frequently filtered columns, such as `(branch, cgpa)` on `students` and `(status, job_id)` on `applications`.
2. **Connection Pooling Tuning**: Increase `connectionLimit` in `mysql2` to match server CPU cores.
3. **Read Replicas**: Direct read queries (job browsing, student directories) to read-only MySQL replicas while directing writes to the primary instance.
4. **Caching**: Place an in-memory cache (like Redis) in front of static catalogs like master skills and company directories.

---

## 4. Authentication, Authorization & Security

### Q16: How is user authentication implemented in the project?
**Answer**:
Authentication uses password hashing via `bcrypt`. When a student registers, their plaintext password is salted and hashed using `bcrypt.hash(password, 10)` before being stored in MySQL. During login, `bcrypt.compare(password, user.password)` verifies the candidate. The API returns user session metadata (`id`, `name`, `email`, `role`) while explicitly omitting the password hash. The client stores this session in `localStorage` for navigation guards.

### Q17: What is bcrypt and why is it preferred over SHA-256 or MD5?
**Answer**:
MD5 and SHA-256 are general-purpose cryptographic hash functions designed to be extremely fast. Because they are fast, an attacker with a GPU can compute billions of guesses per second using rainbow tables and brute force.
In contrast, `bcrypt` is an adaptive, slow key-derivation function based on the Blowfish cipher. It includes built-in random salt generation (preventing rainbow table attacks) and a configurable work factor (cost factor = 10 salt rounds in our project). This makes brute-force attacks computationally infeasible.

### Q18: How does the application protect against SQL Injection?
**Answer**:
100% of database queries use **parameterized prepared statements** provided by `mysql2`:
```javascript
const [rows] = await pool.query('SELECT * FROM students WHERE user_id = ?', [userId]);
```
User inputs are passed separately as query parameters, never concatenated directly into SQL strings. The database engine treats parameters strictly as data literals, completely neutralizing SQL injection attempts (e.g. inputting `' OR '1'='1`).

### Q19: How is Role-Based Access Control (RBAC) enforced?
**Answer**:
The database defines system roles via the `ENUM('student', 'admin')` column on `users`.
- **Backend Protection**: Endpoints under `/api/admin/*` verify administrative permissions before mutating state.
- **Frontend Protection**: `frontend/js/main.js` implements route guards. If a non-admin attempts to access `admin-dashboard.html`, the script detects role mismatch and redirects the user to the login portal.

### Q20: How are sensitive secrets and database credentials protected in version control?
**Answer**:
Database passwords, port configurations, and environment keys are loaded at runtime using `dotenv` from a local `backend/.env` file.
The project's root `.gitignore` and `backend/.gitignore` strictly exclude:
- `.env`
- `.env.*`
- `backend/.env`
A safe `.env.example` template is provided in the repository with placeholder values so other developers can configure their local instances without exposing real credentials.

---

## 5. Java Eligibility Engine & IPC

### Q21: What is the purpose of the Java Eligibility Engine?
**Answer**:
The Java engine is an independent, pure Java SE application located in `java/eligibility/`. Its sole responsibility is to evaluate whether a candidate meets all prerequisite thresholds for a campus placement drive by executing a multi-criteria decision matrix (CGPA, backlogs, academic department, and required technical skills).

### Q22: What are the inputs, rules, and outputs of the Java engine?
**Answer**:
- **Input**: A JSON stream containing:
  - Student: `cgpa`, `backlogs`, `branch`, `skills` (array of strings).
  - Job: `minimumCgpa`, `maximumBacklogs`, `eligibleBranch` (comma-separated or 'All'), `requiredSkills` (array of strings).
- **Rules**:
  1. `student.cgpa >= job.minimumCgpa`
  2. `student.backlogs <= job.maximumBacklogs`
  3. `job.eligibleBranch.contains(student.branch)` or `job.eligibleBranch == 'All'`
  4. `student.skills` contains all strings in `job.requiredSkills` (case-insensitive)
- **Output**: A JSON object:
  ```json
  {
    "eligible": true,
    "missingRequirements": [],
    "reasons": ["CGPA satisfied", "Backlog satisfied", ...]
  }
  ```

### Q23: How does Node.js invoke the Java engine?
**Answer**:
In `backend/services/javaEligibilityService.js`, Node uses `child_process.spawn`:
```javascript
const child = spawn('java', ['-cp', JAVA_BIN_DIR, 'eligibility.Main']);
child.stdin.write(JSON.stringify(payload));
child.stdin.end();
```
Node streams the payload to the process's `stdin`, captures the evaluation output on `stdout`, and parses the resulting JSON.

### Q24: What happens if Java is not installed or crashes?
**Answer**:
We implemented a robust two-layer resilience strategy:
1. **Safety Timeout**: If the Java child process takes longer than 5000ms, it is killed with `SIGTERM`.
2. **Transparent Fallback**: On process spawn error, non-zero exit code, timeout, or JSON parse failure, the service automatically executes `evaluateFallback()`, an internal pure JavaScript engine that mirrors the exact same logic. This guarantees 100% service uptime for candidates.

---

## 6. Frontend & Vanilla JavaScript

### Q25: Why did you build the frontend using Vanilla JavaScript instead of React or Vue?
**Answer**:
1. **Deep Understanding of Fundamentals**: Using Vanilla JS demonstrates fluency in native web standards: the DOM API, native events, event delegation, asynchronous promises, the Fetch API, and modern CSS variables.
2. **Zero Build Overhead**: There are no bundlers (Webpack/Vite), transpilers (Babel), or node build scripts. The frontend runs directly in any browser upon opening `index.html`.
3. **Performance & Lightweight Footprint**: Minimal memory consumption, near-instant initial page loads, and zero vulnerability churn from third-party npm UI dependencies.

### Q26: How does client-side API communication work without Axios?
**Answer**:
We built a centralized API wrapper in `frontend/js/api.js` using the modern native `window.fetch()` API:
- Automatically sets `Content-Type: application/json`.
- Resolves the API base URL dynamically (defaulting to `http://localhost:5000/api` or reading `window.__API_BASE_URL__`).
- Handles network errors and parses JSON responses uniformly.

### Q27: How does Dark Mode work, and how did you prevent theme flash?
**Answer**:
Dark mode is powered by CSS custom properties in `frontend/css/style.css`, defining a root palette and overriding colors when `[data-theme="dark"]` is applied to `<html>`.
To eliminate "Flash of Unstyled Theme" (FOUT), an anti-flash inline script is placed directly in the `<head>` of every HTML page before any CSS or body elements render:
```javascript
const savedTheme = localStorage.getItem('cpms_theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
```
This ensures the browser renders the correct theme immediately on the first paint.

### Q28: How is state managed on the frontend without a state library like Redux?
**Answer**:
State is managed using standard browser persistence and targeted DOM updates:
- **Authentication state**: Stored in `localStorage` (`cpms_user` object with user ID, name, email, and role).
- **Page state**: Fetched dynamically on page load via REST calls and rendered using vanilla template literals into container elements.
- **Form state**: Read directly from form input elements with validation before dispatching REST requests.

---

## 7. Testing, Git & Deployment Readiness

### Q29: What kind of automated testing was implemented for this project?
**Answer**:
We built dedicated automated end-to-end integration and security test suites using Node.js:
- **Health diagnostics**: Verifying server health and MySQL connectivity.
- **Student complete lifecycle**: Testing registration, duplicate roll/email rejection, login, profile updates, skill addition/removal, job browsing, Java eligibility check, and application submission.
- **Admin complete lifecycle**: Testing login, KPI metrics, company CRUD, job CRUD, student directory filtering, and status pipeline updates.
- **Security audit**: Verifying SQL injection resistance, password concealment in responses, and `.gitignore` validation.
All 94 automated test assertions passed with a 100% success rate.

### Q30: Explain your Git branching and commit workflow.
**Answer**:
The project maintains a clean, linear Git history on the `main` branch. Every step of development, testing, security verification, and documentation preparation was committed with clear, descriptive commit messages. The repository is published at `https://github.com/krushnakant85/College-Placement-Management-System.git` with zero committed secrets, logs, or binaries.

### Q31: If you needed to deploy this application to production, what would be your strategy?
**Answer**:
As documented in `DEPLOYMENT.md`:
1. **Frontend**: Host the static assets on a global CDN (Cloudflare Pages, Netlify, or Vercel).
2. **Backend**: Containerize the Node.js app using Docker or deploy on a Linux server/container host (Render, Railway, or AWS ECS) with OpenJDK 17 installed.
3. **Database**: Use a managed MySQL 8.0+ service (AWS RDS MySQL or Aiven MySQL) with SSL enforced (`DB_SSL=true`).
4. **Environment**: Inject production environment variables via the host dashboard, never via files.

### Q32: How did you verify that no credentials or secrets were committed to Git?
**Answer**:
We performed multiple security checks:
1. Ran `git check-ignore -v backend/.env` to prove that git excludes local configuration files.
2. Inspected `git ls-files` to confirm no `.env`, `.log`, or `.class` files are tracked in the index.
3. Audited `git log` and diffs across every commit to confirm only safe placeholder templates (`.env.example`) exist.

---

## 8. Design Decisions, Trade-offs & Future Work

### Q33: What were the most significant technical challenges you faced during development?
**Answer**:
1. **Process-Level Inter-Process Communication (IPC)**: Reliably piping JSON payloads into a spawned Java process across Windows and POSIX systems without blocking Express's event loop. Solved using streaming I/O with a 5-second timeout and automatic JavaScript fallback.
2. **Preventing Broken References Without Cascading Accidental Deletions**: While foreign keys handle cascade deletes for students, deleting a recruiting company with active job drives could disrupt ongoing campus drives. We implemented application-level conflict checks returning HTTP 409 Conflict.
3. **Flash-Free Dark Mode**: Eliminating theme flickering on page navigation without frameworks. Solved using blocking inline scripts in the document `<head>`.

### Q34: What trade-offs did you make by keeping the application local-first?
**Answer**:
- **Trade-off**: The application runs on local machine resources (`localhost:5000` and local MySQL) rather than a live public cloud URL.
- **Benefit**: Zero cloud hosting costs, zero dependency on third-party cloud uptime, complete privacy of candidate data during demos, and instant offline demonstrability during interviews or evaluations.

### Q35: If you had 2 more weeks to work on this project, what features would you add?
**Answer**:
1. **Email Notification Engine**: Integrate Nodemailer / SendGrid to dispatch automated notifications when an application status changes (e.g. from Shortlisted to Interview).
2. **Resume PDF Upload & Storage**: Enable PDF file uploads using `multer` with local file validation and thumbnail generation.
3. **Recruiter Portal**: Add a third role (`recruiter`) allowing registered corporate HRs to post jobs and review applicants directly.
4. **Interactive Placement Analytics**: Add visual charts (using Chart.js) to display departmental placement ratios, highest/average packages, and hiring trends.

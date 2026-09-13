# Production Deployment Plan & Platform Readiness Guide

> **Deployment Readiness Notice**: Deployment configuration is prepared; production hosting has not yet been configured.

This guide provides a comprehensive, platform-independent production deployment blueprint for the **College Placement Management System**. It outlines step-by-step procedures for deploying the frontend, Node.js backend, MySQL database, and Java Eligibility Engine across modern hosting platforms.

---

## 🏛️ Production Architecture

The application follows a decoupled multi-tier architecture:

```text
   Frontend (HTML5 / CSS3 / Vanilla JavaScript)
      ↓ HTTP / REST (JSON)
   Node.js + Express backend
      ↓ Parameterized SQL
   MySQL database

   Java Eligibility Engine (Standalone OOP Process)
      ↓ Child Process IPC (stdin / stdout)
   Backend integration (with zero-downtime JS fallback)
```

---

## 📋 Comprehensive Deployment Plan

### A. Frontend Deployment
The frontend consists of static HTML5, CSS3, and Vanilla JavaScript files located in `frontend/`. It requires no bundler, compiler, or build step.

- **Recommended Platforms**: Cloudflare Pages, Vercel, Netlify, AWS S3 + CloudFront, GitHub Pages, or Nginx.
- **Deployment Steps**:
  1. Set the publish/root directory to `frontend/`.
  2. Configure the production API base URL (see Section G).
  3. Ensure HTTPS is enabled and enforced with valid TLS/SSL certificates.
  4. Test that static assets (CSS stylesheets, JS modules, icons) load without 404 errors.

---

### B. Node.js / Express Backend Deployment
The backend is an Express.js REST API located in `backend/`.

- **Recommended Platforms**: Render (Web Service), Railway, AWS EC2 / ECS / App Runner, DigitalOcean App Platform, or Docker container.
- **Prerequisites**: Node.js v18+ LTS and OpenJDK 17+.
- **Build Command**:
  ```bash
  cd backend && npm install --omit=dev && cd .. && javac -d java/bin java/eligibility/*.java
  ```
- **Production Start Command**:
  ```bash
  node backend/server.js
  # Or with process manager:
  npm start
  ```
- **Health Verification**:
  - `GET /api/test` (verifies Express API responsiveness)
  - `GET /api/test/database` (verifies live MySQL connectivity)

---

### C. Production MySQL Database Preparation & Setup Guide (Aiven MySQL)

> **Provider Notice**: **Aiven MySQL** is the designated production cloud database provider for the College Placement Management System. Aiven provides managed MySQL 8.x with TLS/SSL encryption. The local database (`localhost:3306`) is strictly for local development and testing. Real credentials must never be committed to Git.

Follow this exact 10-step manual procedure (A through J) to provision and configure the Aiven MySQL database:

#### 1. Manual Aiven Provisioning Procedure (Steps A through J)

1. **A. Open Aiven**: Navigate to [https://console.aiven.io/](https://console.aiven.io/) in your web browser.
2. **B. Create / Sign Into Account**: Sign up for a new account or log into your existing Aiven account.
3. **C. Create a New Project**: In the top project dropdown, click **Create Project** (e.g., `placement-system-prod`).
4. **D. Create a MySQL Service**: Click **Create service** and choose **MySQL** (MySQL 8.x engine).
5. **E. Select Plan**: Select the **Free plan** (if available) or the lowest-tier developer plan (Startup/Hobby).
6. **F. Select Cloud & Region**: Select a cloud provider (AWS / GCP / Azure) and geographic region closest to where your backend will be hosted (e.g., `us-east-1`, `eu-west-1`, or `ap-south-1`).
7. **G. Create the Service**: Assign a descriptive service name (e.g., `mysql-placement-prod`) and click **Create service**.
8. **H. Wait for RUNNING Status**: Monitor the dashboard until the service state changes from *Rebuilding/Initializing* to **RUNNING** (typically 2–4 minutes).
9. **I. Open Service Connection Information**:
   - In the Aiven Console, open your service **Overview** tab.
   - Locate the **Connection information** card (Host, Port, User, Password, Database Name, CA Certificate / SSL mode).
10. **J. Record Connection Details Securely**:
    - Record these values in a local password manager.
    - **Never** paste them into code files, chat windows, public forums, or Git commits.

#### 2. Required Production Environment Variables

Configure the following variables in your production backend hosting provider dashboard (e.g. Render, Railway, AWS ECS), replacing the `<...>` placeholders with your actual Aiven connection details:

```env
DB_HOST=<Aiven host>
DB_PORT=<Aiven port>
DB_USER=<Aiven username>
DB_PASSWORD=<Aiven password>
DB_NAME=<Aiven database name>
DB_SSL=true
```

> **IMPORTANT**:
> - Aiven assigns a unique port (often high-range, e.g. `10000`–`30000`, or standard `3306`).
> - Aiven requires TLS/SSL encrypted connections (`sslmode=REQUIRED`). Set `DB_SSL=true` so `backend/config/database.js` enables SSL pooling.
> - These values must **ONLY** be entered into the hosting provider's environment-variable settings. **NEVER** commit a `.env` file to Git.

#### 3. Importing `database/schema.sql` into Aiven MySQL

Once the Aiven service is `RUNNING`, import the canonical schema using either of the following methods:

- **Method 1: MySQL Command-Line Client**:
  ```bash
  mysql -h <Aiven host> -P <Aiven port> -u <Aiven username> -p --ssl-mode=REQUIRED < database/schema.sql
  ```
  *(When prompted, enter your `<Aiven password>`).*

- **Method 2: GUI Database Client (MySQL Workbench / DBeaver)**:
  1. Create a new MySQL connection with your Aiven Host, Port, Username, and Password.
  2. In the SSL settings tab, set SSL Mode to **Require** or **Verify CA**.
  3. Connect to the instance.
  4. Open `database/schema.sql` and execute all statements.

- **Method 3: Aiven Web Query Editor**:
  1. In the Aiven Console service page, navigate to the **Query editor** tab.
  2. Paste the contents of `database/schema.sql` and click **Run**.

#### 4. Verifying Production Database & Tables

After importing the schema, connect and execute read-only verification queries:

```sql
-- 1. Verify database exists
SHOW DATABASES;

-- 2. Select placement database
USE college_placement_system;

-- 3. Verify all 8 tables are present
SHOW TABLES;
```

**Expected 8 Tables**:
1. `users` (User authentication & role ENUM)
2. `students` (Student academic profiles, roll numbers, CGPA, backlogs)
3. `admins` (Placement cell officers)
4. `companies` (Corporate recruitment partners)
5. `jobs` (Active campus placement drives & eligibility criteria)
6. `skills` (Master list of normalized technical competencies)
7. `student_skills` (Student technical skills junction table)
8. `applications` (Job application records & status pipeline)

**Verify Foreign Key Relationships**:
```sql
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    REFERENCED_TABLE_SCHEMA = 'college_placement_system'
    AND REFERENCED_TABLE_NAME IS NOT NULL;
```

#### 5. Network Security & Public Exposure Controls

- **Allowed IP Addresses (IP Whitelisting)**: In Aiven Console -> Service Settings -> **Allowed IP addresses**, restrict incoming traffic strictly to the egress IP addresses or CIDR blocks of your production backend server (or VPC peering if on AWS/GCP). Do not leave open to `0.0.0.0/0` unless required during initial setup.
- **SSL Enforcement**: All data in transit between the Express backend and Aiven is encrypted over TLS 1.2/1.3 via `DB_SSL=true`.
- **Credential Segregation**: Only the production backend runner receives credentials at runtime via environment variables. No credentials are stored in code or repository assets.

#### 6. Live Health Verification

Once the backend is deployed with the Aiven environment variables configured, verify database connectivity:
```bash
curl https://<your-backend-domain>/api/test/database
```
Expected HTTP 200 response:
```json
{
  "success": true,
  "message": "Database connection successful",
  "data": [{"connection_test": 1}]
}
```

---

### D. Java Eligibility Engine Deployment
The eligibility evaluation engine is an independent, pure Java SE object-oriented application located in `java/eligibility/`.

- **Runtime Requirement**: OpenJDK 17+ or Oracle JRE.
- **Build / Compilation Step**:
  ```bash
  javac -d java/bin java/eligibility/*.java
  ```
- **Execution Model**: The backend invokes `java -cp java/bin eligibility.Main` via `child_process.spawn`, passing candidate and job data as JSON through `stdin` and reading the evaluation result from `stdout`.
- **High-Availability Fallback**: If the Java runtime is unavailable on the production host or encounters a timeout (>5000ms), the backend automatically and seamlessly executes an identical pure JavaScript fallback (`evaluateFallback`), guaranteeing 100% service uptime.
- **Custom Java Path**: If compiled classes reside in a custom location, configure `JAVA_BIN_DIR` in the environment.

---

### E. Environment Variables Reference

The application dynamically reads all environment variables at startup. Never commit real credentials to source control.

Configure the following placeholders in your hosting dashboard or production `.env`:

```env
# Node Environment & Port
NODE_ENV=production
PORT=5000

# Production API Base URL (Frontend Configuration)
API_BASE_URL=https://api.yourdomain.com/api

# Production Frontend URL for CORS Whitelisting
CORS_ORIGIN=https://placement.yourdomain.com

# Production Database Credentials (Standard DB_* format)
DB_HOST=your-db-host.internal
DB_PORT=3306
DB_USER=placement_prod_user
DB_PASSWORD=your_secure_production_password
DB_NAME=college_placement_system
DB_SSL=true

# Alternative Standard Cloud Placeholders (Supported by database.js)
DATABASE_HOST=your-db-host.internal
DATABASE_PORT=3306
DATABASE_USER=placement_prod_user
DATABASE_PASSWORD=your_secure_production_password
DATABASE_NAME=college_placement_system

# Optional Microservice / Java Custom Path
JAVA_SERVICE_URL=
JAVA_BIN_DIR=./java/bin
```

---

### F. CORS Configuration
- In development, CORS is open to facilitate testing across local ports.
- In production, configure `CORS_ORIGIN` with your frontend domain:
  ```env
  CORS_ORIGIN=https://placement.yourdomain.com
  ```
- To allow multiple origins (e.g., student and admin subdomains), provide a comma-separated list:
  ```env
  CORS_ORIGIN=https://placement.college.edu,https://admin.placement.college.edu
  ```

---

### G. Production API URL Configuration
The frontend automatically resolves its API base URL using the following cascade in `frontend/js/api.js`:

1. `window.API_BASE_URL` (globally injected variable)
2. `window.APP_CONFIG.API_BASE_URL` (configuration object)
3. `window.__API_BASE_URL__` (runtime environment global)
4. `http://localhost:5000/api` (fallback for standard local development)

**Setting Production API URL**:
In your frontend HTML or deployment injection script:
```html
<script>
  window.API_BASE_URL = 'https://api.yourdomain.com/api';
</script>
```
If deploying frontend and backend under the same domain or behind a reverse proxy (e.g., Nginx), set:
```html
<script>
  window.API_BASE_URL = '/api';
</script>
```

---

### H. Database Connection Configuration
Database connections are managed using an efficient connection pool (`mysql2/promise`) in `backend/config/database.js`:

- **Connection Limit**: 10 pooled connections with automatic connection reuse and recycling.
- **SSL Support**: Automatically enabled if `DB_SSL=true` or `DATABASE_SSL=true` is provided (essential for managed cloud providers like AWS RDS and DigitalOcean).
- **Graceful Error Handling**: Database failures return structured JSON errors without crashing the Express server.

---

### I. Final Health Checks & Verification
Perform these health checks immediately following deployment:

1. **API Service Check**:
   ```bash
   curl -I https://api.yourdomain.com/api/test
   # Expected: HTTP 200 OK
   ```
2. **Database Connectivity Check**:
   ```bash
   curl https://api.yourdomain.com/api/test/database
   # Expected: {"success": true, "message": "Database connection successful", ...}
   ```
3. **Public Landing Page**: Navigate to `https://placement.yourdomain.com` in a browser.
4. **End-to-End Smoke Test**:
   - Register a new student account.
   - Login and verify the Student Dashboard.
   - Test eligibility checking on a campus drive.
   - Submit an application and confirm it appears in "My Applications".
   - Login as administrator (`admin.placement@college.edu`) and verify the executive dashboard.

---

### J. Rollback & Basic Troubleshooting

| Symptom | Probable Cause | Corrective Action |
| :--- | :--- | :--- |
| **CORS error in browser console** | `CORS_ORIGIN` mismatch | Ensure `CORS_ORIGIN` in backend `.env` matches the exact protocol and domain of the frontend (e.g. `https://...`). |
| **`ECONNREFUSED` on database** | Incorrect host/port or firewall | Verify `DB_HOST`, `DB_PORT`, and ensure cloud database security group allows inbound traffic from backend IP. |
| **`ER_ACCESS_DENIED_ERROR`** | Bad database credentials | Double-check `DB_USER` and `DB_PASSWORD` in hosting provider dashboard. |
| **Java eligibility timeout** | JRE missing or high CPU | Ensure OpenJDK 17+ is installed. Note that the backend will automatically invoke the JavaScript fallback to prevent user errors. |
| **Frontend displays 404 on API calls** | Misconfigured API base URL | Verify `window.API_BASE_URL` points to the live backend URL with `/api` suffix. |

---

## 📋 Final Production Deployment Checklist

The following items must be verified during and immediately following public deployment:

- [ ] Frontend deployed
- [ ] Backend deployed
- [ ] MySQL configured
- [ ] Java engine configured
- [ ] Production API URL configured
- [ ] CORS configured
- [ ] Environment variables configured
- [ ] Health endpoint verified
- [ ] Student flow verified
- [ ] Admin flow verified
- [ ] Java eligibility verified
- [ ] HTTPS configured
- [ ] GitHub repository clean

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

### C. MySQL Database Deployment
The system utilizes a relational MySQL 8.0+ database named `college_placement_system`.

- **Recommended Platforms**: AWS RDS (MySQL), DigitalOcean Managed Database, PlanetScale, Aiven, or self-hosted MySQL on a private VPC.
- **Deployment Steps**:
  1. Provision a MySQL 8.0+ database instance with UTF8MB4 character encoding.
  2. Execute the schema migration and initial seed data from `database/schema.sql`:
     ```bash
     mysql -h <DATABASE_HOST> -P <DATABASE_PORT> -u <DATABASE_USER> -p <DATABASE_NAME> < database/schema.sql
     ```
  3. Verify that all 8 tables are created:
     - `users`
     - `students`
     - `admins`
     - `companies`
     - `jobs`
     - `skills`
     - `student_skills`
     - `applications`
  4. Verify relational integrity constraints, foreign keys, and default seed administrative records.

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

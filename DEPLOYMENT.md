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

### C. Production MySQL Database Preparation & Setup Guide

> **Provider Selection Notice**: No external cloud database provider has been selected automatically. The user must manually choose and create a production MySQL 8.0+ database (e.g. AWS RDS MySQL, DigitalOcean Managed Database, Aiven, PlanetScale, or an institutional server). The local database (\`localhost:3306\`) is for local development only and must not be treated as the production database.

Follow these 10 steps (A through J) to prepare and initialize the production database:

1. **A. Create a Production MySQL Database**:
   - Log into your chosen cloud provider console (e.g., AWS RDS, DigitalOcean, Aiven, or private VPS).
   - Create a MySQL 8.0+ instance configured with UTF-8 (\`utf8mb4\`) character set and a robust root/admin password.
   - Configure firewall or security groups to allow inbound MySQL traffic from your backend hosting provider's IP range or VPC.

2. **B. Obtain the Production Database Host**:
   - Copy the public or private endpoint address (e.g. \`<production-db-host>\`).

3. **C. Obtain the Production Database Port**:
   - The default MySQL port is \`3306\`. If your cloud provider assigns a custom port, note it down.

4. **D. Obtain the Production Database Username**:
   - Obtain the administrative or application user (e.g. \`<production-db-user>\`).

5. **E. Obtain the Production Database Password**:
   - Securely record the generated password (\`<production-db-password>\`). Never commit this secret into source control.

6. **F. Create/Select the Database Name**:
   - Select or create the database name (e.g. \`college_placement_system\` or \`<production-db-name>\`).

7. **G. Import \`database/schema.sql\`**:
   - From your local terminal or a CI/CD bastion machine, run the schema import command:
     \`\`\`bash
     mysql -h <production-db-host> -P 3306 -u <production-db-user> -p <production-db-name> < database/schema.sql
     \`\`\`
   - *(Alternatively, open MySQL Workbench or DBeaver connected to the cloud instance, open \`database/schema.sql\`, and execute all statements).*

8. **H. Verify the Tables**:
   - Connect to the production database and confirm all 8 relational tables were created successfully:
     \`\`\`sql
     SHOW TABLES;
     \`\`\`
   - Verified expected tables:
     1. \`users\` (Authentication credentials and role ENUM)
     2. \`students\` (Student academic profiles, roll numbers, CGPA, backlogs)
     3. \`admins\` (Placement cell officers)
     4. \`companies\` (Corporate recruitment partners)
     5. \`jobs\` (Active campus placement drives and eligibility criteria)
     6. \`skills\` (Master list of normalized technical competencies)
     7. \`student_skills\` (Student technical skills junction table)
     8. \`applications\` (Job application records and status pipeline)

9. **I. Configure Backend Environment Variables**:
   - In your backend hosting provider dashboard (e.g. Render, Railway, AWS ECS), set the following production environment variables using the credentials obtained above:
     \`\`\`env
     DB_HOST=<production-db-host>
     DB_PORT=3306
     DB_USER=<production-db-user>
     DB_PASSWORD=<production-db-password>
     DB_NAME=<production-db-name>
     DB_SSL=<production-db-ssl-setting>
     \`\`\`
   *(Note: Set \`DB_SSL=true\` if your cloud provider enforces TLS/SSL encrypted connections, as on AWS RDS or DigitalOcean).*

10. **J. Test Database Connectivity**:
    - Once the backend is started in production, verify connectivity via the live health check endpoint:
      \`\`\`bash
      curl https://<your-backend-domain>/api/test/database
      \`\`\`
    - Expected HTTP 200 response:
      \`\`\`json
      {
        "success": true,
        "message": "Database connection successful",
        "data": [{"connection_test": 1}]
      }
      \`\`\`

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

# Production Deployment Guide & Checklist

> **Deployment Readiness Notice**: Deployment configuration is prepared; production hosting has not yet been configured.

This document outlines the architecture, environment configurations, and step-by-step checklist for deploying the **College Placement Management System** to a production cloud or on-premise infrastructure.

---

## 🏛️ Production Architecture Overview

The system follows a decoupled, headless client-server architecture:

```text
[ Client Browsers / Mobile Devices ]
                 │
                 │ HTTPS (Static Asset Delivery)
                 ▼
[ Frontend Web Host ]
  (Static Hosting: Cloudflare Pages / Vercel / Netlify / Nginx / S3)
                 │
                 │ REST API (JSON over HTTPS)
                 ▼
[ Backend Application Server ]
  (Node.js / Express Server on Render / AWS EC2 / DigitalOcean)
       │                                │
       │ SQL (Connection Pool)          │ Child Process IPC (stdin/stdout)
       ▼                                ▼
[ Managed MySQL Database ]     [ Java SE Eligibility Engine ]
  (AWS RDS / DigitalOcean /      (Compiled Bytecode in java/bin
   Local Managed MySQL)           with Automatic JS Fallback)
```

---

## 📋 Production Deployment Checklist

The following checklist tracks required tasks when deploying to a live production environment. All tasks must remain unchecked until production provisioning begins:

- [ ] **1. Production MySQL Database**
  - [ ] Provision managed MySQL 8.0+ instance (e.g. AWS RDS, DigitalOcean, PlanetScale)
  - [ ] Secure database with non-default administrative credentials and restricted firewall/VPC access
  - [ ] Import complete DDL schema from `database/schema.sql`
  - [ ] Confirm tables created: `users`, `students`, `admins`, `companies`, `jobs`, `skills`, `student_skills`, `applications`
  - [ ] Verify seed admin account and reference skills exist

- [ ] **2. Backend Server Provisioning**
  - [ ] Provision Linux environment or container with Node.js v18+ LTS and OpenJDK 17+
  - [ ] Clone repository: `https://github.com/krushnakant85/College-Placement-Management-System.git`
  - [ ] Install production dependencies in `backend/`: `npm install --omit=dev`
  - [ ] Compile Java Eligibility Engine: `javac -d java/bin java/eligibility/*.java`
  - [ ] Test standalone Java compilation: `java -cp java/bin eligibility.Main`

- [ ] **3. Production Environment Variables Configuration**
  - [ ] Set `NODE_ENV=production`
  - [ ] Configure `PORT` (assigned by platform or default `5000`)
  - [ ] Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - [ ] Configure `CORS_ORIGIN` to whitelist the production frontend domain
  - [ ] Verify `backend/.env` is NOT committed or exposed

- [ ] **4. Process Management & Background Supervision**
  - [ ] Configure process supervisor (PM2, systemd, or Docker) to ensure automatic restarts:
    ```bash
    # Example using PM2:
    pm2 start backend/server.js --name "placement-backend"
    ```
  - [ ] Verify health diagnostic endpoints: `GET /api/test` and `GET /api/test/database`

- [ ] **5. Frontend Deployment**
  - [ ] Deploy static contents of `frontend/` to CDN or static host (Vercel, Netlify, Cloudflare Pages, S3, or Nginx)
  - [ ] Set API Base URL by injecting `window.__API_BASE_URL__ = 'https://api.yourdomain.com/api'` or reverse proxying `/api`
  - [ ] Verify HTML pages load with correct asset paths (CSS, JS)
  - [ ] Verify theme toggle (Light/Dark) persists across page reloads

- [ ] **6. Security & Infrastructure Hardening**
  - [ ] Enforce HTTPS / SSL certificates (Let's Encrypt / Cloudflare SSL)
  - [ ] Verify credentials and secrets are concealed from all client API responses
  - [ ] Test SQL injection resistance on route parameters
  - [ ] Verify CORS policy rejects unauthorized cross-origin requests

- [ ] **7. Post-Deployment Smoke Testing**
  - [ ] Test Student Registration with new candidate account
  - [ ] Test Student Login and dashboard access
  - [ ] Test Student Profile updates and skill additions
  - [ ] Test Job Drives directory listing
  - [ ] Test Java Eligibility Engine on active drive
  - [ ] Test Job Application submission and duplicate prevention
  - [ ] Test Admin Login with production credentials
  - [ ] Test Admin Dashboard metrics aggregation
  - [ ] Test Admin Company & Job CRUD controls
  - [ ] Test Admin Student Directory and search filters
  - [ ] Test Recruitment Pipeline status updates (`Applied` → `Selected`)
  - [ ] Inspect production logs for unexpected errors or warnings

---

## 🔧 Environment Variables Reference

| Variable | Required | Default (Dev) | Production Example | Description |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Recommended | `development` | `production` | Optimizes Express performance and error handling. |
| `PORT` | Optional | `5000` | `5000` or dynamic | Port on which the Express HTTP server listens. |
| `CORS_ORIGIN` | Optional | `*` (unrestricted) | `https://placement.college.edu` | Comma-separated allowed origins for cross-domain requests. |
| `DB_HOST` | **Required** | `localhost` | `db.college.internal` | Hostname or IP of the production MySQL server. |
| `DB_PORT` | Optional | `3306` | `3306` | Port for the MySQL server connection pool. |
| `DB_USER` | **Required** | `root` | `placement_user` | Production database user with schema permissions. |
| `DB_PASSWORD` | **Required** | *(empty)* | *(strong secret)* | Password for production database user. |
| `DB_NAME` | **Required** | `college_placement_system` | `college_placement_system` | Name of the application database. |

---

## ☕ Java Eligibility Engine Notes

- **Runtime Requirement**: The Java engine requires an OpenJDK / Oracle JRE (v17 or higher) present on the backend host system.
- **Compilation**: Must be compiled prior to application startup:
  ```bash
  javac -d java/bin java/eligibility/*.java
  ```
- **Automated Fallback**: If Java runtime is unavailable or times out (>5000ms), `backend/services/javaEligibilityService.js` automatically executes the identical pure JavaScript evaluation fallback, ensuring 100% uptime.

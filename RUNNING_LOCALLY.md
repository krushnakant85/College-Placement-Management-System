# Running Locally — College Placement Management System

> Comprehensive, step-by-step local setup and execution guide for developers, evaluators, and interviewers.

---

## 📋 Prerequisites

Before running the application locally, ensure you have installed the following software:

1. **Node.js** (v18.0.0 or higher, tested on v24.x)
   - Verify: `node -v`
   - Download: [https://nodejs.org/](https://nodejs.org/)
2. **npm** (v9.0.0 or higher, bundled with Node.js)
   - Verify: `npm -v`
3. **MySQL Server** (v8.0 or higher)
   - Verify: `mysql --version`
   - Download: [https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)
4. **Java SE Development Kit (JDK)** (v17 or higher, tested on Java 24)
   - Verify: `javac -version` and `java -version`
   - Download: [https://adoptium.net/](https://adoptium.net/)
5. **Git**
   - Verify: `git --version`

---

## 📂 Project Structure Overview

```text
College-Placement-Management-System/
├── frontend/               # Vanilla HTML5, CSS3, JavaScript web interface
│   ├── index.html          # Public landing page
│   ├── css/style.css       # Responsive design & Light/Dark theme styles
│   ├── js/api.js           # Client HTTP communication service
│   ├── js/main.js          # Shared UI helpers, session guards, theme manager
│   └── pages/              # Role-specific portals (Student & Admin)
├── backend/                # Node.js + Express RESTful API server
│   ├── server.js           # Main Express server entry point
│   ├── config/database.js  # MySQL connection pool (mysql2/promise)
│   ├── controllers/        # Business logic controllers
│   ├── routes/             # REST route declarations
│   ├── services/           # Java IPC service & fallback evaluator
│   └── .env.example        # Environment variable template
├── database/
│   └── schema.sql          # Complete MySQL 8.x schema DDL and initial seed data
├── java/
│   ├── eligibility/        # Pure Java SE Object-Oriented Eligibility Engine
│   └── bin/                # Compiled Java bytecode (.class files)
└── postman/                # Complete Postman v2.1.0 API collection
```

---

## 🚀 Step-by-Step Local Setup

### Step 1: Clone the Repository
Clone the project repository to your local computer:
```bash
git clone https://github.com/krushnakant85/College-Placement-Management-System.git
cd College-Placement-Management-System
```

---

### Step 2: Set Up MySQL Database
1. Ensure your local MySQL server is running.
2. Open a terminal or MySQL command-line client and import the canonical schema:
   ```bash
   # On Windows (PowerShell or Command Prompt)
   Get-Content database/schema.sql | mysql -u root -p

   # Or standard MySQL CLI
   mysql -u root -p < database/schema.sql
   ```
   *(When prompted, enter your MySQL root password).*
3. Verify that the database and all 8 tables were created:
   ```sql
   USE college_placement_system;
   SHOW TABLES;
   ```
   Expected 8 tables:
   - `users`
   - `students`
   - `admins`
   - `companies`
   - `jobs`
   - `skills`
   - `student_skills`
   - `applications`

---

### Step 3: Configure Environment Variables
1. Navigate to the `backend/` directory and create your `.env` file from `.env.example`:
   ```bash
   # On Windows PowerShell
   Copy-Item backend/.env.example backend/.env

   # On Linux / macOS
   cp backend/.env.example backend/.env
   ```
2. Open `backend/.env` in your preferred text editor and update your database credentials:
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
   > **Note**: `backend/.env` is explicitly excluded by `.gitignore` and will never be committed to Git.

---

### Step 4: Install Backend Dependencies
From the project root, navigate to `backend/` and install the required npm packages:
```bash
cd backend
npm install
cd ..
```

---

### Step 5: Compile the Java Eligibility Engine
The eligibility calculation module is written in pure Java SE. Compile it into bytecode:
```bash
javac -d java/bin java/eligibility/*.java
```
To test that the Java engine executes correctly, run:
```bash
# On Windows PowerShell
'{"student":{"cgpa":8.5,"backlogs":0,"branch":"Computer Science","skills":["Java"]},"job":{"minimumCgpa":7.0,"maximumBacklogs":0,"eligibleBranch":"Computer Science","requiredSkills":["Java"]}}' | java -cp java/bin eligibility.Main
```
Expected output:
```json
{"eligible":true,"missingRequirements":[],"reasons":["CGPA requirement satisfied (Minimum required: 7.00, Student CGPA: 8.50)","Backlog requirement satisfied (Max allowed: 0, Student backlogs: 0)","Branch requirement satisfied (Eligible: Computer Science, Student Branch: Computer Science)","All required technical skills satisfied."]}
```

---

### Step 6: Start the Node.js Backend Server
From the project root:
```bash
cd backend
npm start
```
*(Alternatively: `node server.js`)*

The console will confirm:
```text
Server is running on port 5000
API Test URL: http://localhost:5000/api/test
Database Test URL: http://localhost:5000/api/test/database
```

Verify connectivity in your web browser:
- Health Check: `http://localhost:5000/api/test`
- Database Check: `http://localhost:5000/api/test/database` (should return HTTP 200 with `"connection_test": 1`)

---

### Step 7: Launch the Frontend
The frontend uses pure Vanilla HTML5, CSS3, and JavaScript—no build step or bundler is required.

**Option A: Open directly in your browser**:
Double-click `frontend/index.html` or open it in Google Chrome, Microsoft Edge, Firefox, or Safari.

**Option B: Serve via static HTTP server (Recommended)**:
From the project root directory:
```bash
npx serve frontend
```
Then navigate to `http://localhost:3000` (or the port reported by `serve`).

**Portal Quick Links**:
- **Landing Page**: `frontend/index.html`
- **Student Portal**: `frontend/pages/student-login.html`
- **Admin Portal**: `frontend/pages/admin-login.html`

---

## 🛠️ Testing APIs with Postman

A complete, pre-configured Postman collection is included in:
```text
postman/College_Placement_Management_System.postman_collection.json
```

1. Open Postman.
2. Click **Import** and select `postman/College_Placement_Management_System.postman_collection.json`.
3. The collection contains 27 categorized requests for:
   - **Health & Diagnostics** (server health, live database connection)
   - **Student APIs** (registration, login, profile, skills, job browsing, Java eligibility, job applications)
   - **Admin APIs** (admin login, dashboard metrics, student directory, company CRUD, job CRUD, recruitment status pipeline)
4. The collection variable `{{base_url}}` defaults to `http://localhost:5000`.

---

## 🔍 Troubleshooting & Common Errors

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL server is stopped. | Start your local MySQL service via Windows Services (`services.msc`) or macOS/Linux `sudo systemctl start mysql`. |
| `Access denied for user 'root'@'localhost'` | Incorrect MySQL password in `backend/.env`. | Verify your MySQL root password and update `DB_PASSWORD` in `backend/.env`. |
| `ER_BAD_DB_ERROR: Unknown database 'college_placement_system'` | Schema has not been imported yet. | Execute `mysql -u root -p < database/schema.sql` to create the database. |
| `EADDRINUSE: address already in use :::5000` | Another service is using port 5000. | Change `PORT=5001` in `backend/.env` or terminate the process on port 5000. |
| `javac: command not found` | JDK is not installed or not in system PATH. | Install JDK 17+ and add the JDK `bin` directory to your system `PATH`. Note: If Java is unavailable, the backend automatically uses its built-in JavaScript fallback engine. |
| Frontend API errors (`Failed to fetch`) | Backend is not running or CORS blocked. | Ensure the Node.js server is running on port 5000 before navigating the frontend. |

---

## ⏹️ Shutdown Procedure

1. **Stop Node.js Backend**: In the terminal running `npm start`, press `Ctrl + C` and confirm exit.
2. **Close Frontend**: Close browser tabs. If running `npx serve`, press `Ctrl + C` in that terminal.
3. **Stop MySQL (Optional)**: If you do not need MySQL running in the background, stop the MySQL service.

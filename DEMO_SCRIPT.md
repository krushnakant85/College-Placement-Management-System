# Live Project Demonstration Script

> A concise 5–10 minute step-by-step walkthrough to present the College Placement Management System during technical interviews, portfolio reviews, or project evaluations.

---

## ⏱️ Pre-Demo Setup Checklist (1 Minute)

Before launching the demonstration, ensure:
1. **MySQL Server** is running on `localhost:3306` with `college_placement_system` imported.
2. **Backend Server** is running on port 5000 (`cd backend && npm start`).
3. **Browser** is opened to `frontend/index.html`.

---

## 🎬 12-Step Demonstration Walkthrough

### Step 1: Public Landing Page
- **URL**: `frontend/index.html`
- **Action**: Show the hero section, key system features, and role navigation cards.
- **Talking Point**:
  > *"The College Placement Management System is a full-stack, local-first platform built with pure Vanilla JavaScript, Node.js, MySQL, and a Java SE Eligibility Engine. The landing page allows students and administrators to navigate directly to their dedicated portals."*

---

### Step 2: Student Registration
- **URL**: Click **Student Portal** → Click **"Register here"** (`student-register.html`)
- **Action**: Register a new student:
  - Name: `Vikram Malhotra`
  - Roll Number: `CS2026888`
  - Email: `vikram.malhotra@student.edu`
  - Password: `Password123!`
  - Department: `Computer Science`
  - CGPA: `8.80`
  - Graduation Batch: `2026`
  - Active Backlogs: `0`
- **Talking Point**:
  > *"The registration form enforces strict client and server validation. Passwords are encrypted with bcrypt using 10 salt rounds before storage in MySQL. Trying to register with an existing roll number or email is rejected immediately."*

---

### Step 3: Student Login & Session Management
- **URL**: `student-login.html`
- **Action**: Log in using the newly created credentials.
- **Talking Point**:
  > *"Login authenticates credentials against MySQL. The API returns user session details while explicitly stripping the password hash for security. The session is stored in localStorage, and navigation guards protect role boundaries."*

---

### Step 4: Student Dashboard & Academic Profile
- **URL**: `student-dashboard.html`
- **Action**: Show the **Profile** card with candidate roll number, department, CGPA, and backlog count.
- **Demonstration**: Edit the phone number or CGPA and click **"Update Profile"**. Show the instant toast notification.
- **Talking Point**:
  > *"The student dashboard aggregates the candidate's academic profile, verified skills, active campus drives, and application history in a single, responsive view."*

---

### Step 5: Technical Skills Portfolio
- **Action**: Switch to the **Skills** tab on the student dashboard.
- **Demonstration**:
  1. Select `Java` from the master dropdown and click **"Add Skill"**.
  2. Select `SQL` and add it.
  3. Try adding `Java` again → show that duplicate skills are rejected with an alert.
  4. Remove a skill to demonstrate real-time synchronization with the `student_skills` junction table.
- **Talking Point**:
  > *"Technical competencies are normalized into a master catalog in MySQL. Candidates can associate verified skills with their profile, which the eligibility engine uses during drive screening."*

---

### Step 6: Browse Campus Placement Drives
- **Action**: Switch to the **Campus Drives** tab.
- **Talking Point**:
  > *"Here, students can explore all active recruitment drives posted by partner companies (e.g. Microsoft India, Google Cloud). Each posting displays the annual CTC package in INR, job role, location, deadline, eligible branches, minimum CGPA, and required skills."*

---

### Step 7: Java Eligibility Engine in Action (🌟 Core Highlight)
- **Action**: On any drive card, click **"Check Eligibility"**.
- **Demonstration**: The eligibility modal appears displaying an "ELIGIBLE" badge with an itemized breakdown of CGPA, backlogs, branch, and required skills.
- **Talking Point**:
  > *"When 'Check Eligibility' is clicked, Node.js gathers candidate data from MySQL and pipes it via stdin to our compiled Java SE process. The Java engine evaluates the decision matrix and returns the pass/fail breakdown. If Java ever times out, the backend automatically falls back to an internal JavaScript engine for zero downtime."*

---

### Step 8: Job Application Submission
- **Action**: Click **"Apply Now"** on the eligible job drive.
- **Demonstration**:
  1. Show the success notification confirming submission.
  2. Try clicking "Apply Now" again → show that duplicate applications are prevented.
  3. Switch to the **"My Applications"** tab to view the submission record with status badge `Applied`.
- **Talking Point**:
  > *"Applications are protected by relational constraints and eligibility checks, completely preventing ineligible candidates or duplicate submissions."*

---

### Step 9: Admin Authentication & RBAC
- **URL**: Click **Logout** → Navigate to **Admin Portal** (`admin-login.html`).
- **Action**: Log in using administrator credentials (`admin.placement@college.edu` / seed password).
- **Talking Point**:
  > *"The placement officer logs in through a dedicated administrative portal. Strict role-based access control prevents students from accessing administrative endpoints or data."*

---

### Step 10: Executive Metrics & Partner Management
- **URL**: `admin-dashboard.html`
- **Action**:
  1. Review real-time KPI metric cards (Students, Companies, Jobs, Applications).
  2. Navigate to `admin-companies.html` to show recruiting partner CRUD operations.
  3. Navigate to `admin-jobs.html` to show placement drive creation.
- **Talking Point**:
  > *"The admin dashboard provides live placement cell analytics. Company and job management includes relational conflict safeguards: an officer cannot delete a company that has active jobs, or a job that has active student applications."*

---

### Step 11: Candidate Directory & Recruitment Pipeline
- **URL**: `admin-applications.html`
- **Action**:
  1. Find the application submitted in Step 8.
  2. Update the status dropdown from `Applied` → `Shortlisted` → `Interview` → `Selected`.
  3. Open an incognito window, log back in as the student, and show that the student's dashboard reflects the new `Selected` status badge immediately!
- **Talking Point**:
  > *"Placement officers can manage the entire recruitment status pipeline in real time. Changes persist directly to MySQL and synchronize with candidate views."*

---

### Step 12: Dark Mode & Architectural Recap
- **Action**: Click the theme toggle icon (☀️/🌙) in the navigation bar.
- **Demonstration**: Toggle themes across multiple pages to show persistent dark mode and zero theme flash on refresh.
- **Closing Talking Point**:
  > *"The frontend features zero-flash dark mode powered by CSS variables and an inline head script. In summary, this project showcases clean separation of concerns, strong relational database design, polyglot microservice integration with Java, and enterprise-grade security."*

-- ============================================================================
-- College Placement Management System
-- Database Schema Definition & Sample Seed Data
-- Database: MySQL 8.0+
-- ============================================================================

-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS college_placement_system;
USE college_placement_system;

-- Drop tables if they exist (in reverse dependency order to avoid Foreign Key errors)
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS student_skills;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;

-- ============================================================================
-- 2. CREATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: users
-- Stores authentication login details and system roles (student or admin).
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Table: students
-- Stores detailed profile information for student candidates.
-- Linked 1-to-1 with users table.
-- ----------------------------------------------------------------------------
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    cgpa DECIMAL(4, 2) NOT NULL CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    graduation_year INT NOT NULL,
    backlogs INT NOT NULL DEFAULT 0 CHECK (backlogs >= 0),
    resume_path VARCHAR(255) DEFAULT NULL,
    CONSTRAINT fk_students_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ----------------------------------------------------------------------------
-- Table: admins
-- Stores Placement Cell Administrator information.
-- Linked 1-to-1 with users table.
-- ----------------------------------------------------------------------------
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'Placement Cell',
    CONSTRAINT fk_admins_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ----------------------------------------------------------------------------
-- Table: companies
-- Stores recruiting company profiles.
-- ----------------------------------------------------------------------------
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL UNIQUE,
    location VARCHAR(150) NOT NULL,
    website VARCHAR(255) DEFAULT NULL,
    description TEXT DEFAULT NULL
);

-- ----------------------------------------------------------------------------
-- Table: jobs
-- Stores job postings created by recruiting companies.
-- Linked Many-to-1 with companies table.
-- ----------------------------------------------------------------------------
CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    job_title VARCHAR(150) NOT NULL,
    job_description TEXT NOT NULL,
    minimum_cgpa DECIMAL(4, 2) NOT NULL DEFAULT 0.00 CHECK (minimum_cgpa >= 0.00 AND minimum_cgpa <= 10.00),
    eligible_branch VARCHAR(100) NOT NULL,
    maximum_backlogs INT NOT NULL DEFAULT 0 CHECK (maximum_backlogs >= 0),
    package DECIMAL(10, 2) NOT NULL COMMENT 'Annual CTC package in INR (e.g. 1200000.00)',
    job_location VARCHAR(150) NOT NULL,
    application_deadline DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jobs_companies FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ----------------------------------------------------------------------------
-- Table: skills
-- Master list of technical skills (e.g., Java, Python, SQL).
-- ----------------------------------------------------------------------------
CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL UNIQUE
);

-- ----------------------------------------------------------------------------
-- Table: student_skills
-- Junction/Join table establishing Many-to-Many relationship between students & skills.
-- ----------------------------------------------------------------------------
CREATE TABLE student_skills (
    student_id INT NOT NULL,
    skill_id INT NOT NULL,
    PRIMARY KEY (student_id, skill_id),
    CONSTRAINT fk_student_skills_students FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_student_skills_skills FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ----------------------------------------------------------------------------
-- Table: applications
-- Tracks job applications submitted by students for specific job postings.
-- Linked Many-to-1 with students and jobs.
-- ----------------------------------------------------------------------------
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    job_id INT NOT NULL,
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected') NOT NULL DEFAULT 'Applied',
    CONSTRAINT unique_student_job UNIQUE (student_id, job_id),
    CONSTRAINT fk_applications_students FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_applications_jobs FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE ON UPDATE CASCADE
);


-- ============================================================================
-- 3. SAMPLE DATA INSERTS
-- ============================================================================

-- Insert Users (2 Admins + 5 Students)
INSERT INTO users (id, email, password, role) VALUES
(1, 'admin.placement@college.edu', 'adminhash123', 'admin'),
(2, 'officer.placement@college.edu', 'adminhash456', 'admin'),
(3, 'arav.sharma@student.edu', 'studhash101', 'student'),
(4, 'priya.patel@student.edu', 'studhash102', 'student'),
(5, 'rahul.verma@student.edu', 'studhash103', 'student'),
(6, 'ananya.sen@student.edu', 'studhash104', 'student'),
(7, 'vikram.singh@student.edu', 'studhash105', 'student');

-- Insert Admins
INSERT INTO admins (id, user_id, name, phone, department) VALUES
(1, 1, 'Dr. Rajesh Kumar', '+91-9876543210', 'Head of Placement Cell'),
(2, 2, 'Prof. Sunita Mehta', '+91-9876543211', 'Corporate Relations');

-- Insert Students
INSERT INTO students (id, user_id, student_id, name, phone, branch, cgpa, graduation_year, backlogs, resume_path) VALUES
(1, 3, 'CSBS2023001', 'Arav Sharma', '+91-9123456780', 'CSBS', 8.85, 2025, 0, 'resumes/arav_sharma.pdf'),
(2, 4, 'CSE2023045', 'Priya Patel', '+91-9123456781', 'CSE', 9.10, 2025, 0, 'resumes/priya_patel.pdf'),
(3, 5, 'CSBS2023012', 'Rahul Verma', '+91-9123456782', 'CSBS', 7.40, 2025, 1, 'resumes/rahul_verma.pdf'),
(4, 6, 'ECE2023089', 'Ananya Sen', '+91-9123456783', 'ECE', 8.20, 2025, 0, 'resumes/ananya_sen.pdf'),
(5, 7, 'ME2023015', 'Vikram Singh', '+91-9123456784', 'ME', 6.90, 2025, 2, 'resumes/vikram_singh.pdf');

-- Insert Companies
INSERT INTO companies (id, company_name, location, website, description) VALUES
(1, 'TCS (Tata Consultancy Services)', 'Mumbai, India', 'https://www.tcs.com', 'Global leader in IT services, consulting, and business solutions.'),
(2, 'Microsoft India', 'Bengaluru, India', 'https://www.microsoft.com', 'Multinational technology corporation producing computer software, electronics, and services.'),
(3, 'Infosys', 'Bengaluru, India', 'https://www.infosys.com', 'Next-generation digital services and consulting firm.'),
(4, 'Accenture', 'Hyderabad, India', 'https://www.accenture.com', 'Professional services company providing strategy, consulting, digital, and technology solutions.');

-- Insert Jobs
INSERT INTO jobs (id, company_id, job_title, job_description, minimum_cgpa, eligible_branch, maximum_backlogs, package, job_location, application_deadline) VALUES
(1, 2, 'Software Development Engineer (SDE-1)', 'Develop high-scale cloud platforms, distributed systems, and microservices.', 8.00, 'CSBS,CSE', 0, 1800000.00, 'Bengaluru', '2026-10-31'),
(2, 1, 'Systems Engineer (TCS Digital)', 'Design enterprise applications, backend databases, and automation tools.', 7.00, 'CSBS,CSE,ECE', 1, 700000.00, 'Pune', '2026-11-15'),
(3, 3, 'Specialist Programmer', 'Focus on full-stack development, algorithmic optimization, and cloud architecture.', 7.50, 'CSBS,CSE', 0, 950000.00, 'Bengaluru', '2026-11-20'),
(4, 4, 'Application Development Associate', 'Assist in software application design, deployment, and testing workflows.', 6.50, 'CSBS,CSE,ECE,ME', 2, 450000.00, 'Hyderabad', '2026-12-05');

-- Insert Skills
INSERT INTO skills (id, skill_name) VALUES
(1, 'Java'),
(2, 'Python'),
(3, 'SQL'),
(4, 'C++'),
(5, 'JavaScript'),
(6, 'Node.js'),
(7, 'React'),
(8, 'Data Structures & Algorithms'),
(9, 'Machine Learning');

-- Insert Student Skills (Many-to-Many mapping)
INSERT INTO student_skills (student_id, skill_id) VALUES
(1, 1), (1, 3), (1, 5), (1, 6), (1, 8), -- Arav: Java, SQL, JS, Node.js, DSA
(2, 1), (2, 2), (2, 3), (2, 4), (2, 8), -- Priya: Java, Python, SQL, C++, DSA
(3, 3), (3, 5), (3, 6),                 -- Rahul: SQL, JS, Node.js
(4, 1), (4, 2), (4, 3),                 -- Ananya: Java, Python, SQL
(5, 2), (5, 3);                         -- Vikram: Python, SQL

-- Insert Applications
INSERT INTO applications (id, student_id, job_id, application_date, status) VALUES
(1, 1, 1, '2026-09-01 10:00:00', 'Shortlisted'),
(2, 1, 2, '2026-09-02 11:30:00', 'Selected'),
(3, 2, 1, '2026-09-01 09:15:00', 'Interview'),
(4, 2, 3, '2026-09-03 14:00:00', 'Applied'),
(5, 3, 2, '2026-09-04 16:45:00', 'Applied'),
(6, 4, 4, '2026-09-05 12:20:00', 'Shortlisted'),
(7, 5, 4, '2026-09-06 15:10:00', 'Rejected');

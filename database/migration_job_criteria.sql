-- ============================================================================
-- College Placement Management System
-- Migration: Add Job-Specific Eligibility Criteria (Graduation Year & Required Skills)
-- Database: MySQL 8.0+
-- ============================================================================

USE college_placement_system;

-- 1. Add graduation_year column to jobs table (if not exists)
-- Safe, nullable with DEFAULT NULL ensuring 100% backward compatibility
ALTER TABLE jobs
ADD COLUMN graduation_year INT NULL DEFAULT NULL AFTER eligible_branch;

-- 2. Create job_skills relational junction table
CREATE TABLE IF NOT EXISTS job_skills (
    job_id INT NOT NULL,
    skill_id INT NOT NULL,
    PRIMARY KEY (job_id, skill_id),
    CONSTRAINT fk_job_skills_jobs FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_job_skills_skills FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_job_skills_skill (skill_id)
);

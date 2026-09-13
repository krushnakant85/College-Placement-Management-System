const pool = require('../config/database');
const { computeEligibility } = require('./eligibilityController');

/**
 * Controller: Apply for a Job
 * Route: POST /api/applications
 * Access: Public
 */
const applyForJob = async (req, res, next) => {
  try {
    const { user_id, job_id } = req.body;

    // ==========================================
    // STEP 1: VALIDATE REQUEST INPUT
    // ==========================================
    if (user_id === undefined || job_id === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: user_id and job_id are required in the request body.',
      });
    }

    const parsedUserId = parseInt(user_id, 10);
    if (isNaN(parsedUserId) || parsedUserId <= 0 || String(parsedUserId) !== String(user_id).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Invalid user ID. User ID must be a positive integer.',
      });
    }

    const parsedJobId = parseInt(job_id, 10);
    if (isNaN(parsedJobId) || parsedJobId <= 0 || String(parsedJobId) !== String(job_id).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Invalid job ID. Job ID must be a positive integer.',
      });
    }

    // ==========================================
    // STEP 2: CHECK WHETHER STUDENT EXISTS
    // ==========================================
    const studentQuery = `
      SELECT 
        s.id,
        s.user_id,
        s.student_id,
        s.name,
        u.email,
        s.branch,
        s.cgpa,
        s.graduation_year,
        s.backlogs
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `;

    const [studentRows] = await pool.query(studentQuery, [parsedUserId]);

    if (studentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    const student = studentRows[0];
    const internalStudentId = student.id; // Primary key of students table

    // ==========================================
    // STEP 3: CHECK WHETHER JOB EXISTS
    // ==========================================
    const jobQuery = `
      SELECT 
        j.id,
        j.company_id,
        c.company_name,
        j.job_title,
        j.minimum_cgpa,
        j.eligible_branch,
        j.maximum_backlogs,
        j.package,
        j.job_location,
        j.application_deadline
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = ?
    `;

    const [jobRows] = await pool.query(jobQuery, [parsedJobId]);

    if (jobRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.',
      });
    }

    const job = jobRows[0];

    // ==========================================
    // STEP 4: REUSE JAVA ELIGIBILITY CHECK
    // ==========================================
    const [skillsRows] = await pool.query(
      'SELECT sk.skill_name FROM skills sk JOIN student_skills ss ON sk.id = ss.skill_id WHERE ss.student_id = ?',
      [internalStudentId]
    );
    const studentSkillNames = skillsRows.map((s) => s.skill_name);

    const eligibility = await computeEligibility(job, student, studentSkillNames);
    const isEligible = eligibility.isEligible ?? eligibility.eligible;

    if (!isEligible) {
      return res.status(403).json({
        success: false,
        message: 'Student is not eligible for this job.',
        data: {
          eligible: false,
          missing_requirements: eligibility.missingRequirements,
        },
      });
    }

    // ==========================================
    // STEP 5: CHECK FOR DUPLICATE APPLICATION
    // ==========================================
    const [existingApplication] = await pool.query(
      'SELECT id FROM applications WHERE student_id = ? AND job_id = ?',
      [internalStudentId, parsedJobId]
    );

    if (existingApplication.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Student has already applied for this job.',
      });
    }

    // ==========================================
    // STEP 6: CREATE APPLICATION RECORD
    // ==========================================
    const insertQuery = `
      INSERT INTO applications (student_id, job_id, status)
      VALUES (?, ?, 'Applied')
    `;

    const [insertResult] = await pool.query(insertQuery, [
      internalStudentId,
      parsedJobId,
    ]);

    const newApplicationId = insertResult.insertId;

    // Fetch the newly created record with job and company details
    const fetchCreatedQuery = `
      SELECT 
        a.id,
        a.student_id,
        a.job_id,
        j.job_title,
        c.company_name,
        a.status,
        a.application_date
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.id = ?
    `;

    const [createdRows] = await pool.query(fetchCreatedQuery, [newApplicationId]);
    const createdApplication = createdRows[0];

    return res.status(201).json({
      success: true,
      message: 'Job application submitted successfully',
      data: {
        application: createdApplication,
      },
    });
  } catch (error) {
    // Handle database unique constraint error if caught at DB level
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Student has already applied for this job.',
      });
    }

    console.error('Error submitting job application:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit job application.',
    });
  }
};

/**
 * Controller: View all applications for a student
 * Route: GET /api/applications/student/:userId
 * Access: Public
 */
const getStudentApplications = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // 1. Validate userId
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId) || parsedUserId <= 0 || String(parsedUserId) !== userId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID. User ID must be a positive integer.',
      });
    }

    // 2. Check if student exists
    const [studentRows] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [parsedUserId]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    const internalStudentId = studentRows[0].id;

    // 3. Query all applications submitted by this student
    const query = `
      SELECT 
        a.id,
        a.job_id,
        j.job_title,
        c.company_name,
        a.status,
        a.application_date
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.student_id = ?
      ORDER BY a.application_date DESC
    `;

    const [applications] = await pool.query(query, [internalStudentId]);

    return res.status(200).json({
      success: true,
      data: {
        applications: applications,
      },
    });
  } catch (error) {
    console.error('Error fetching student applications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student applications.',
    });
  }
};

/**
 * Controller: View a single application by ID
 * Route: GET /api/applications/:applicationId
 * Access: Public
 */
const getApplicationById = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    // 1. Validate applicationId
    const parsedAppId = parseInt(applicationId, 10);
    if (isNaN(parsedAppId) || parsedAppId <= 0 || String(parsedAppId) !== applicationId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID.',
      });
    }

    // 2. Query application with joined student, user, job, and company information
    // NOTE: Password and password_hash are NEVER selected
    const query = `
      SELECT 
        a.id,
        a.student_id,
        s.user_id,
        s.name AS student_name,
        s.branch AS student_branch,
        s.cgpa AS student_cgpa,
        u.email AS student_email,
        a.job_id,
        j.job_title,
        j.package,
        j.job_location,
        c.id AS company_id,
        c.company_name,
        a.status,
        a.application_date
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.id = ?
    `;

    const [rows] = await pool.query(query, [parsedAppId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.',
      });
    }

    const app = rows[0];

    return res.status(200).json({
      success: true,
      data: {
        application: {
          id: app.id,
          student_id: app.student_id,
          user_id: app.user_id,
          student_name: app.student_name,
          student_branch: app.student_branch,
          student_cgpa: parseFloat(app.student_cgpa),
          student_email: app.student_email,
          job_id: app.job_id,
          job_title: app.job_title,
          package: parseFloat(app.package),
          job_location: app.job_location,
          company_id: app.company_id,
          company_name: app.company_name,
          status: app.status,
          application_date: app.application_date,
        },
      },
    });
  } catch (error) {
    console.error(`Error fetching application ${req.params.applicationId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve application details.',
    });
  }
};

module.exports = {
  applyForJob,
  getStudentApplications,
  getApplicationById,
};

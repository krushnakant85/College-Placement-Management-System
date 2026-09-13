const pool = require('../config/database');
const { evaluateWithJava, evaluateFallback } = require('../services/javaEligibilityService');

/**
 * Evaluates a job's eligibility criteria against a student's profile.
 * Executes the separate standalone Java Eligibility Engine via child process,
 * with automatic fallback to high-performance JavaScript evaluator.
 * Reusable across both eligibility inspection and application submission.
 */
const computeEligibility = async (job, student, studentSkills = []) => {
  return await evaluateWithJava(job, student, studentSkills);
};

/**
 * Controller: Check Student Job Eligibility
 * Route: GET /api/jobs/:jobId/eligibility/:userId
 * Access: Public
 */
const checkJobEligibility = async (req, res, next) => {
  try {
    const { jobId, userId } = req.params;

    // ==========================================
    // 1. INPUT VALIDATION
    // ==========================================

    // Validate jobId: must be a positive integer
    const parsedJobId = parseInt(jobId, 10);
    if (isNaN(parsedJobId) || parsedJobId <= 0 || String(parsedJobId) !== jobId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID.',
      });
    }

    // Validate userId: must be a positive integer
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId) || parsedUserId <= 0 || String(parsedUserId) !== userId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      });
    }

    // ==========================================
    // 2. RETRIEVE JOB DETAILS & CRITERIA
    // ==========================================
    const jobQuery = `
      SELECT 
        j.id,
        j.company_id,
        c.company_name,
        j.job_title,
        j.minimum_cgpa,
        j.eligible_branch,
        j.graduation_year,
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

    // Fetch required skills for this job
    const [jobSkillRows] = await pool.query(
      `SELECT sk.skill_name FROM skills sk JOIN job_skills js ON sk.id = js.skill_id WHERE js.job_id = ? ORDER BY sk.skill_name ASC`,
      [parsedJobId]
    );
    job.requiredSkills = jobSkillRows.map((s) => s.skill_name);

    // ==========================================
    // 3. RETRIEVE STUDENT PROFILE
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

    // ==========================================
    // 4. RETRIEVE STUDENT SKILLS
    // ==========================================
    const skillsQuery = `
      SELECT sk.id, sk.skill_name
      FROM skills sk
      JOIN student_skills ss ON sk.id = ss.skill_id
      WHERE ss.student_id = ?
      ORDER BY sk.id ASC
    `;

    const [skillsRows] = await pool.query(skillsQuery, [student.id]);
    const studentSkillNames = skillsRows.map((s) => s.skill_name);

    // ==========================================
    // 5. EVALUATE ELIGIBILITY CRITERIA (JAVA ENGINE)
    // ==========================================
    const eligibilityResult = await computeEligibility(job, student, studentSkillNames);
    const isEligible = eligibilityResult.isEligible ?? eligibilityResult.eligible;

    return res.status(200).json({
      success: true,
      data: {
        eligible: isEligible,
        job_id: parsedJobId,
        user_id: parsedUserId,
        student_name: student.name,
        job_title: job.job_title,
        company_name: job.company_name,
        graduation_year: job.graduation_year,
        student_graduation_year: student.graduation_year,
        required_skills: job.requiredSkills,
        reasons: eligibilityResult.reasons || [],
        missing_requirements: eligibilityResult.missingRequirements || [],
        student_skills: studentSkillNames,
        evaluated_by: eligibilityResult.engine || 'Java SE Eligibility Engine',
      },
    });
  } catch (error) {
    console.error('Error checking job eligibility:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check job eligibility.',
    });
  }
};

module.exports = {
  checkJobEligibility,
  computeEligibility,
  computeEligibilitySync: evaluateFallback,
};

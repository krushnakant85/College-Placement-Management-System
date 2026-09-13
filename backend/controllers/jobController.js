const pool = require('../config/database');

/**
 * Controller: Get All Jobs (with Company details joined)
 * Route: GET /api/jobs, GET /api/admin/jobs
 * Access: Public / Admin
 */
const getAllJobs = async (req, res, next) => {
  try {
    // Perform an INNER JOIN with companies to include recruiting company details
    const query = `
      SELECT 
        j.id,
        j.company_id,
        c.company_name,
        j.job_title,
        j.job_description,
        j.minimum_cgpa,
        j.eligible_branch,
        j.maximum_backlogs,
        j.package,
        j.job_location,
        j.application_deadline,
        j.created_at
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      ORDER BY j.id ASC
    `;

    const [jobs] = await pool.query(query);

    // Format numbers where helpful (e.g. minimum_cgpa and package as floats/numbers)
    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      company_id: job.company_id,
      company_name: job.company_name,
      job_title: job.job_title,
      job_description: job.job_description,
      minimum_cgpa: parseFloat(job.minimum_cgpa),
      eligible_branch: job.eligible_branch,
      maximum_backlogs: job.maximum_backlogs,
      package: parseFloat(job.package),
      job_location: job.job_location,
      application_deadline: job.application_deadline,
      created_at: job.created_at,
    }));

    return res.status(200).json({
      success: true,
      data: {
        jobs: formattedJobs,
      },
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve jobs.',
    });
  }
};

/**
 * Controller: Get Single Job by ID (with Company details joined)
 * Route: GET /api/jobs/:jobId, GET /api/admin/jobs/:jobId
 * Access: Public / Admin
 */
const getJobById = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Validate that jobId is a strictly positive integer
    const parsedJobId = parseInt(jobId, 10);
    if (isNaN(parsedJobId) || parsedJobId <= 0 || String(parsedJobId) !== jobId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID.',
      });
    }

    // Parameterized query using placeholder ? with JOIN to companies
    const query = `
      SELECT 
        j.id,
        j.company_id,
        c.company_name,
        c.website AS company_website,
        c.location AS company_headquarters,
        j.job_title,
        j.job_description,
        j.minimum_cgpa,
        j.eligible_branch,
        j.maximum_backlogs,
        j.package,
        j.job_location,
        j.application_deadline,
        j.created_at
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = ?
    `;

    const [rows] = await pool.query(query, [parsedJobId]);

    // If no job found with this ID
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.',
      });
    }

    const job = rows[0];

    return res.status(200).json({
      success: true,
      data: {
        job: {
          id: job.id,
          company_id: job.company_id,
          company_name: job.company_name,
          company_website: job.company_website,
          company_headquarters: job.company_headquarters,
          job_title: job.job_title,
          job_description: job.job_description,
          minimum_cgpa: parseFloat(job.minimum_cgpa),
          eligible_branch: job.eligible_branch,
          maximum_backlogs: job.maximum_backlogs,
          package: parseFloat(job.package),
          job_location: job.job_location,
          application_deadline: job.application_deadline,
          created_at: job.created_at,
        },
      },
    });
  } catch (error) {
    console.error(`Error fetching job ID ${req.params.jobId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve job details.',
    });
  }
};

/**
 * Controller: Create Job
 * Route: POST /api/admin/jobs
 * Access: Admin
 */
const createJob = async (req, res, next) => {
  try {
    const {
      company_id,
      job_title,
      title,
      job_description,
      description,
      minimum_cgpa,
      cgpa,
      eligible_branch,
      branch,
      eligible_branches,
      maximum_backlogs,
      backlogs,
      package: salaryPackage,
      salary,
      job_location,
      location,
      application_deadline,
      deadline,
    } = req.body;

    // 1. Normalize values
    const finalJobTitle = (job_title || title || '').trim();
    const finalDescription = (job_description || description || '').trim();
    const finalEligibleBranch = (eligible_branch || branch || eligible_branches || '').trim();
    const finalJobLocation = (job_location || location || '').trim();
    const finalDeadline = (application_deadline || deadline || '').trim();

    // 2. Validate company_id
    if (company_id === undefined || company_id === null || company_id === '') {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: company_id is required.',
      });
    }

    const parsedCompanyId = parseInt(company_id, 10);
    if (isNaN(parsedCompanyId) || parsedCompanyId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: company_id must be a positive integer.',
      });
    }

    // 3. Validate required strings
    if (!finalJobTitle) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Job title is required.',
      });
    }

    if (!finalDescription) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Job description is required.',
      });
    }

    if (!finalEligibleBranch) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Eligible branch is required.',
      });
    }

    if (!finalJobLocation) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Job location is required.',
      });
    }

    // 4. Validate application deadline
    if (!finalDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Application deadline is required.',
      });
    }

    const deadlineTimestamp = Date.parse(finalDeadline);
    if (isNaN(deadlineTimestamp)) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Invalid application deadline date format.',
      });
    }

    // 5. Validate package / salary
    const candidateSalary = salaryPackage !== undefined ? salaryPackage : salary;
    if (candidateSalary === undefined || candidateSalary === null || candidateSalary === '') {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Package/salary is required.',
      });
    }

    const parsedPackage = parseFloat(candidateSalary);
    if (isNaN(parsedPackage) || parsedPackage <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Package must be a positive number.',
      });
    }

    // 6. Validate minimum CGPA (defaults to 0.00 if omitted)
    const candidateCgpa = minimum_cgpa !== undefined ? minimum_cgpa : (cgpa !== undefined ? cgpa : 0.00);
    const parsedMinCgpa = parseFloat(candidateCgpa);
    if (isNaN(parsedMinCgpa) || parsedMinCgpa < 0.00 || parsedMinCgpa > 10.00) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Minimum CGPA must be a valid number between 0.00 and 10.00.',
      });
    }

    // 7. Validate maximum backlogs (defaults to 0 if omitted)
    const candidateBacklogs = maximum_backlogs !== undefined ? maximum_backlogs : (backlogs !== undefined ? backlogs : 0);
    const parsedMaxBacklogs = parseInt(candidateBacklogs, 10);
    if (isNaN(parsedMaxBacklogs) || parsedMaxBacklogs < 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Maximum backlogs must be a non-negative integer (>= 0).',
      });
    }

    // 8. Verify that referenced Company exists
    const [companies] = await pool.query('SELECT id, company_name FROM companies WHERE id = ?', [parsedCompanyId]);
    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    // 9. Insert Job record using parameterized SQL
    const insertQuery = `
      INSERT INTO jobs (
        company_id,
        job_title,
        job_description,
        minimum_cgpa,
        eligible_branch,
        maximum_backlogs,
        package,
        job_location,
        application_deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [insertResult] = await pool.query(insertQuery, [
      parsedCompanyId,
      finalJobTitle,
      finalDescription,
      parsedMinCgpa,
      finalEligibleBranch,
      parsedMaxBacklogs,
      parsedPackage,
      finalJobLocation,
      finalDeadline,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: {
        job: {
          id: insertResult.insertId,
          company_id: parsedCompanyId,
          company_name: companies[0].company_name,
          job_title: finalJobTitle,
          job_description: finalDescription,
          minimum_cgpa: parsedMinCgpa,
          eligible_branch: finalEligibleBranch,
          maximum_backlogs: parsedMaxBacklogs,
          package: parsedPackage,
          job_location: finalJobLocation,
          application_deadline: finalDeadline,
        },
      },
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create job posting.',
    });
  }
};

/**
 * Controller: Update Job
 * Route: PUT /api/admin/jobs/:jobId
 * Access: Admin
 */
const updateJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Validate jobId parameter
    const parsedJobId = parseInt(jobId, 10);
    if (isNaN(parsedJobId) || parsedJobId <= 0 || String(parsedJobId) !== jobId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID.',
      });
    }

    // Check if job exists
    const [existingJobRows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [parsedJobId]);
    if (existingJobRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.',
      });
    }

    const currentJob = existingJobRows[0];
    const {
      company_id,
      job_title,
      title,
      job_description,
      description,
      minimum_cgpa,
      cgpa,
      eligible_branch,
      branch,
      eligible_branches,
      maximum_backlogs,
      backlogs,
      package: salaryPackage,
      salary,
      job_location,
      location,
      application_deadline,
      deadline,
    } = req.body;

    // Ensure update payload is not completely empty
    const providedKeys = Object.keys(req.body);
    if (providedKeys.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: At least one field must be provided to update.',
      });
    }

    // Validate and update company_id if provided
    let finalCompanyId = currentJob.company_id;
    if (company_id !== undefined) {
      const parsedNewCompanyId = parseInt(company_id, 10);
      if (isNaN(parsedNewCompanyId) || parsedNewCompanyId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: company_id must be a positive integer.',
        });
      }
      const [companyCheck] = await pool.query('SELECT id FROM companies WHERE id = ?', [parsedNewCompanyId]);
      if (companyCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Company not found.',
        });
      }
      finalCompanyId = parsedNewCompanyId;
    }

    // Validate strings
    let finalJobTitle = currentJob.job_title;
    if (job_title !== undefined || title !== undefined) {
      const val = (job_title !== undefined ? job_title : title);
      if (typeof val !== 'string' || val.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: Job title cannot be empty.',
        });
      }
      finalJobTitle = val.trim();
    }

    let finalDescription = currentJob.job_description;
    if (job_description !== undefined || description !== undefined) {
      const val = (job_description !== undefined ? job_description : description);
      if (typeof val !== 'string' || val.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: Job description cannot be empty.',
        });
      }
      finalDescription = val.trim();
    }

    let finalEligibleBranch = currentJob.eligible_branch;
    if (eligible_branch !== undefined || branch !== undefined || eligible_branches !== undefined) {
      const val = (eligible_branch !== undefined ? eligible_branch : (branch !== undefined ? branch : eligible_branches));
      if (typeof val !== 'string' || val.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: Eligible branch cannot be empty.',
        });
      }
      finalEligibleBranch = val.trim();
    }

    let finalJobLocation = currentJob.job_location;
    if (job_location !== undefined || location !== undefined) {
      const val = (job_location !== undefined ? job_location : location);
      if (typeof val !== 'string' || val.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: Job location cannot be empty.',
        });
      }
      finalJobLocation = val.trim();
    }

    // Validate deadline
    let finalDeadline = currentJob.application_deadline;
    if (application_deadline !== undefined || deadline !== undefined) {
      const val = (application_deadline !== undefined ? application_deadline : deadline);
      if (typeof val !== 'string' || isNaN(Date.parse(val.trim()))) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: Invalid application deadline date.',
        });
      }
      finalDeadline = val.trim();
    }

    // Validate numerics
    let finalMinCgpa = parseFloat(currentJob.minimum_cgpa);
    if (minimum_cgpa !== undefined || cgpa !== undefined) {
      const val = (minimum_cgpa !== undefined ? minimum_cgpa : cgpa);
      const parsed = parseFloat(val);
      if (isNaN(parsed) || parsed < 0.00 || parsed > 10.00) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: Minimum CGPA must be a valid number between 0.00 and 10.00.',
        });
      }
      finalMinCgpa = parsed;
    }

    let finalMaxBacklogs = currentJob.maximum_backlogs;
    if (maximum_backlogs !== undefined || backlogs !== undefined) {
      const val = (maximum_backlogs !== undefined ? maximum_backlogs : backlogs);
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: Maximum backlogs must be an integer >= 0.',
        });
      }
      finalMaxBacklogs = parsed;
    }

    let finalPackage = parseFloat(currentJob.package);
    if (salaryPackage !== undefined || salary !== undefined) {
      const val = (salaryPackage !== undefined ? salaryPackage : salary);
      const parsed = parseFloat(val);
      if (isNaN(parsed) || parsed <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: Package must be a positive number.',
        });
      }
      finalPackage = parsed;
    }

    // Execute parameterized update
    const updateQuery = `
      UPDATE jobs 
      SET 
        company_id = ?,
        job_title = ?,
        job_description = ?,
        minimum_cgpa = ?,
        eligible_branch = ?,
        maximum_backlogs = ?,
        package = ?,
        job_location = ?,
        application_deadline = ?
      WHERE id = ?
    `;

    await pool.query(updateQuery, [
      finalCompanyId,
      finalJobTitle,
      finalDescription,
      finalMinCgpa,
      finalEligibleBranch,
      finalMaxBacklogs,
      finalPackage,
      finalJobLocation,
      finalDeadline,
      parsedJobId,
    ]);

    // Fetch updated job joined with company details
    const [updatedRows] = await pool.query(
      `
      SELECT 
        j.id,
        j.company_id,
        c.company_name,
        j.job_title,
        j.job_description,
        j.minimum_cgpa,
        j.eligible_branch,
        j.maximum_backlogs,
        j.package,
        j.job_location,
        j.application_deadline,
        j.created_at
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = ?
    `,
      [parsedJobId]
    );

    const updatedJob = updatedRows[0];

    return res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: {
        job: {
          id: updatedJob.id,
          company_id: updatedJob.company_id,
          company_name: updatedJob.company_name,
          job_title: updatedJob.job_title,
          job_description: updatedJob.job_description,
          minimum_cgpa: parseFloat(updatedJob.minimum_cgpa),
          eligible_branch: updatedJob.eligible_branch,
          maximum_backlogs: updatedJob.maximum_backlogs,
          package: parseFloat(updatedJob.package),
          job_location: updatedJob.job_location,
          application_deadline: updatedJob.application_deadline,
          created_at: updatedJob.created_at,
        },
      },
    });
  } catch (error) {
    console.error(`Error updating job ${req.params.jobId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update job.',
    });
  }
};

/**
 * Controller: Delete Job
 * Route: DELETE /api/admin/jobs/:jobId
 * Access: Admin
 */
const deleteJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Validate jobId format
    const parsedJobId = parseInt(jobId, 10);
    if (isNaN(parsedJobId) || parsedJobId <= 0 || String(parsedJobId) !== jobId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID.',
      });
    }

    // Check if job exists
    const [existing] = await pool.query('SELECT id FROM jobs WHERE id = ?', [parsedJobId]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.',
      });
    }

    // Application Safety: Check if student applications depend on this job
    const [appRows] = await pool.query(
      'SELECT COUNT(*) AS app_count FROM applications WHERE job_id = ?',
      [parsedJobId]
    );

    const appCount = appRows[0].app_count;
    if (appCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Job cannot be deleted because student applications exist.',
      });
    }

    // Safely delete job using parameterized SQL
    await pool.query('DELETE FROM jobs WHERE id = ?', [parsedJobId]);

    return res.status(200).json({
      success: true,
      message: 'Job deleted successfully.',
    });
  } catch (error) {
    console.error(`Error deleting job ${req.params.jobId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete job.',
    });
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
};


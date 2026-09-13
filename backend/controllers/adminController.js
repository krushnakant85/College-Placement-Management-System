const bcrypt = require('bcrypt');
const pool = require('../config/database');

/**
 * Controller: Admin Login
 * Route: POST /api/admin/login
 * Access: Public (Admin authentication)
 */
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate Input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Find User by Email
    const [users] = await pool.query(
      'SELECT id, email, password, role, created_at FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Authentication Error: Invalid email or password.',
      });
    }

    const user = users[0];

    // 3. Verify that the User's Role is 'admin'
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // 4. Compare Password using bcrypt (with backward-compatible support for initial seed data)
    let isPasswordValid = false;

    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Supports initial plain-text seed data and securely auto-upgrades to bcrypt
      isPasswordValid = (password === user.password);
      if (isPasswordValid) {
        const saltRounds = 10;
        const newHash = await bcrypt.hash(password, saltRounds);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Authentication Error: Invalid email or password.',
      });
    }

    // 5. Retrieve Admin Profile from admins table
    const [admins] = await pool.query(
      'SELECT id, user_id, name, phone, department FROM admins WHERE user_id = ?',
      [user.id]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin profile record not found.',
      });
    }

    const admin = admins[0];

    // 6. Return Successful Response (NEVER exposing password or hash)
    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: {
          id: admin.id,
          user_id: user.id,
          name: admin.name,
          email: user.email,
          phone: admin.phone,
          department: admin.department,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Admin Login Server Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error: Unable to complete admin login.',
    });
  }
};

/**
 * Controller: View All Student Job Applications
 * Route: GET /api/admin/applications
 * Access: Admin
 */
const getAllApplications = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.student_id,
        s.user_id,
        s.student_id AS student_roll_number,
        s.name AS student_name,
        u.email AS student_email,
        s.branch AS student_branch,
        s.cgpa AS student_cgpa,
        a.job_id,
        j.job_title,
        c.id AS company_id,
        c.company_name,
        a.status,
        a.application_date
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      ORDER BY a.application_date DESC, a.id DESC
    `;

    const [rows] = await pool.query(query);

    const formattedApplications = rows.map((app) => ({
      id: app.id,
      student_id: app.student_id,
      user_id: app.user_id,
      student_name: app.student_name,
      student_email: app.student_email,
      student_branch: app.student_branch,
      student_cgpa: parseFloat(app.student_cgpa),
      job_id: app.job_id,
      job_title: app.job_title,
      company_id: app.company_id,
      company_name: app.company_name,
      status: app.status,
      application_date: app.application_date,
    }));

    return res.status(200).json({
      success: true,
      data: {
        applications: formattedApplications,
      },
    });
  } catch (error) {
    console.error('Error fetching all applications for admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications.',
    });
  }
};

/**
 * Controller: View Single Application Details
 * Route: GET /api/admin/applications/:applicationId
 * Access: Admin
 */
const getApplicationById = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    // Validate applicationId
    const parsedAppId = parseInt(applicationId, 10);
    if (isNaN(parsedAppId) || parsedAppId <= 0 || String(parsedAppId) !== applicationId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID.',
      });
    }

    const query = `
      SELECT 
        a.id,
        a.student_id,
        s.user_id,
        s.student_id AS student_roll_number,
        s.name AS student_name,
        s.phone AS student_phone,
        u.email AS student_email,
        s.branch AS student_branch,
        s.cgpa AS student_cgpa,
        s.backlogs AS student_backlogs,
        s.graduation_year AS student_graduation_year,
        s.resume_path,
        a.job_id,
        j.job_title,
        j.package,
        j.job_location,
        c.id AS company_id,
        c.company_name,
        c.location AS company_location,
        c.website AS company_website,
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
          student_phone: app.student_phone,
          student_email: app.student_email,
          student_branch: app.student_branch,
          student_cgpa: parseFloat(app.student_cgpa),
          student_backlogs: app.student_backlogs,
          student_graduation_year: app.student_graduation_year,
          resume_path: app.resume_path,
          job_id: app.job_id,
          job_title: app.job_title,
          package: parseFloat(app.package),
          job_location: app.job_location,
          company_id: app.company_id,
          company_name: app.company_name,
          company_location: app.company_location,
          company_website: app.company_website,
          status: app.status,
          application_date: app.application_date,
        },
      },
    });
  } catch (error) {
    console.error(`Error fetching application ID ${req.params.applicationId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve application details.',
    });
  }
};

/**
 * Controller: Update Application Status
 * Route: PUT /api/admin/applications/:applicationId/status
 * Access: Admin
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    // 1. Validate applicationId
    const parsedAppId = parseInt(applicationId, 10);
    if (isNaN(parsedAppId) || parsedAppId <= 0 || String(parsedAppId) !== applicationId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID.',
      });
    }

    // 2. Validate status presence
    if (!status || typeof status !== 'string' || status.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Application status is required.',
      });
    }

    // 3. Validate status value against existing database ENUM
    // Allowed values in schema: 'Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'
    const validStatuses = {
      applied: 'Applied',
      shortlisted: 'Shortlisted',
      interview: 'Interview',
      selected: 'Selected',
      rejected: 'Rejected',
    };

    const normalizedKey = status.trim().toLowerCase();
    if (!validStatuses[normalizedKey]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application status. Allowed values: Applied, Shortlisted, Interview, Selected, Rejected.',
      });
    }

    const targetStatus = validStatuses[normalizedKey];

    // 4. Check whether application exists
    const [existing] = await pool.query(
      'SELECT id FROM applications WHERE id = ?',
      [parsedAppId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.',
      });
    }

    // 5. Update Status using Parameterized SQL
    const updateQuery = 'UPDATE applications SET status = ? WHERE id = ?';
    await pool.query(updateQuery, [targetStatus, parsedAppId]);

    // 6. Fetch updated application with context details
    const fetchQuery = `
      SELECT 
        a.id,
        a.student_id,
        s.user_id,
        s.name AS student_name,
        a.job_id,
        j.job_title,
        c.company_name,
        a.status,
        a.application_date
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.id = ?
    `;

    const [updatedRows] = await pool.query(fetchQuery, [parsedAppId]);
    const updatedApp = updatedRows[0];

    return res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        application: updatedApp,
      },
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update application status.',
    });
  }
};

module.exports = {
  loginAdmin,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
};

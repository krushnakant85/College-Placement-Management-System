const pool = require('../config/database');

/**
 * Controller: Get Student Profile by userId
 * Route: GET /api/students/:userId
 */
const getStudentProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // 1. Validate that userId is a valid positive integer
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId) || parsedUserId <= 0 || String(parsedUserId) !== String(userId).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Invalid user ID. User ID must be a positive integer.',
      });
    }

    // 2. Query students table joined with users table
    // NEVER select password or password_hash from users
    const query = `
      SELECT 
        s.id AS student_table_id,
        s.user_id,
        s.student_id,
        s.name,
        u.email,
        s.phone,
        s.branch,
        s.cgpa,
        s.graduation_year,
        s.backlogs,
        s.resume_path,
        u.role,
        u.created_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `;

    const [rows] = await pool.query(query, [parsedUserId]);

    // 3. Handle case where student does not exist
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Student with user ID ${parsedUserId} not found.`,
      });
    }

    const student = rows[0];

    // 4. Return student profile details
    return res.status(200).json({
      success: true,
      data: {
        student: {
          user_id: student.user_id,
          student_id: student.student_id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          branch: student.branch,
          cgpa: parseFloat(student.cgpa),
          graduation_year: student.graduation_year,
          backlogs: student.backlogs,
          resume_path: student.resume_path,
          role: student.role,
          created_at: student.created_at,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error: Unable to fetch student profile.',
    });
  }
};

/**
 * Controller: Update Student Profile by userId
 * Route: PUT /api/students/:userId
 */
const updateStudentProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // 1. Validate that userId is a valid positive integer
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId) || parsedUserId <= 0 || String(parsedUserId) !== String(userId).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Invalid user ID. User ID must be a positive integer.',
      });
    }

    const {
      name,
      phone,
      branch,
      cgpa,
      graduation_year,
      backlogs,
    } = req.body;

    // ==========================================
    // 2. INPUT VALIDATION
    // ==========================================

    // Validate Name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Name is required and cannot be empty.',
      });
    }

    // Validate Phone number (minimum 10 digits)
    const phoneRegex = /^[0-9+\-\s]{10,20}$/;
    if (!phone || !phoneRegex.test(phone.toString().trim())) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Please provide a valid phone number (minimum 10 digits).',
      });
    }

    // Validate Branch
    if (!branch || typeof branch !== 'string' || branch.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Branch is required and cannot be empty.',
      });
    }

    // Validate CGPA (must be a number between 0.00 and 10.00)
    const parsedCgpa = parseFloat(cgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: CGPA must be a valid number between 0.00 and 10.00.',
      });
    }

    // Validate Graduation Year (sensible 4-digit year)
    const parsedYear = parseInt(graduation_year, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > currentYear + 10) {
      return res.status(400).json({
        success: false,
        message: `Validation Error: Graduation year must be a valid year between 2000 and ${currentYear + 10}.`,
      });
    }

    // Validate Backlogs (integer >= 0)
    const parsedBacklogs = parseInt(backlogs, 10);
    if (isNaN(parsedBacklogs) || parsedBacklogs < 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Backlogs must be a non-negative integer (0 or greater).',
      });
    }

    // ==========================================
    // 3. CHECK IF STUDENT EXISTS
    // ==========================================
    const [existing] = await pool.query(
      'SELECT id, student_id FROM students WHERE user_id = ?',
      [parsedUserId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Student with user ID ${parsedUserId} not found.`,
      });
    }

    // ==========================================
    // 4. UPDATE STUDENT RECORD IN MYSQL
    // ==========================================
    // Note: user_id, student_id, email, and password are NOT modified here
    const updateQuery = `
      UPDATE students
      SET 
        name = ?,
        phone = ?,
        branch = ?,
        cgpa = ?,
        graduation_year = ?,
        backlogs = ?
      WHERE user_id = ?
    `;

    await pool.query(updateQuery, [
      name.trim(),
      phone.toString().trim(),
      branch.trim().toUpperCase(),
      parsedCgpa,
      parsedYear,
      parsedBacklogs,
      parsedUserId,
    ]);

    // ==========================================
    // 5. FETCH & RETURN UPDATED PROFILE
    // ==========================================
    const fetchQuery = `
      SELECT 
        s.user_id,
        s.student_id,
        s.name,
        u.email,
        s.phone,
        s.branch,
        s.cgpa,
        s.graduation_year,
        s.backlogs,
        s.resume_path,
        u.role
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `;

    const [updatedRows] = await pool.query(fetchQuery, [parsedUserId]);
    const updatedStudent = updatedRows[0];

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully',
      data: {
        student: {
          user_id: updatedStudent.user_id,
          student_id: updatedStudent.student_id,
          name: updatedStudent.name,
          email: updatedStudent.email,
          phone: updatedStudent.phone,
          branch: updatedStudent.branch,
          cgpa: parseFloat(updatedStudent.cgpa),
          graduation_year: updatedStudent.graduation_year,
          backlogs: updatedStudent.backlogs,
          resume_path: updatedStudent.resume_path,
          role: updatedStudent.role,
        },
      },
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error: Unable to update student profile.',
    });
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
};

const pool = require('../config/database');

/**
 * Controller: Get All Students (with optional search and filter support)
 * Route: GET /api/admin/students
 * Access: Admin
 */
const getAllStudents = async (req, res, next) => {
  try {
    const {
      search,
      branch,
      graduation_year,
      min_cgpa,
      max_backlogs,
    } = req.query;

    const conditions = [];
    const queryParams = [];

    // Search by student name, roll/student ID, or email
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      conditions.push('(s.name LIKE ? OR s.student_id LIKE ? OR u.email LIKE ?)');
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Filter by academic branch
    if (branch && typeof branch === 'string' && branch.trim() !== '') {
      conditions.push('s.branch = ?');
      queryParams.push(branch.trim().toUpperCase());
    }

    // Filter by graduation year
    if (graduation_year !== undefined && graduation_year !== '') {
      const parsedYear = parseInt(graduation_year, 10);
      if (isNaN(parsedYear) || parsedYear < 1900) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: graduation_year must be a valid 4-digit year.',
        });
      }
      conditions.push('s.graduation_year = ?');
      queryParams.push(parsedYear);
    }

    // Filter by minimum CGPA
    if (min_cgpa !== undefined && min_cgpa !== '') {
      const parsedCgpa = parseFloat(min_cgpa);
      if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: min_cgpa must be a number between 0.00 and 10.00.',
        });
      }
      conditions.push('s.cgpa >= ?');
      queryParams.push(parsedCgpa);
    }

    // Filter by maximum backlogs
    if (max_backlogs !== undefined && max_backlogs !== '') {
      const parsedBacklogs = parseInt(max_backlogs, 10);
      if (isNaN(parsedBacklogs) || parsedBacklogs < 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: max_backlogs must be a non-negative integer.',
        });
      }
      conditions.push('s.backlogs <= ?');
      queryParams.push(parsedBacklogs);
    }

    // Explicit SELECT statement: NEVER SELECT * OR SENSITIVE PASSWORDS
    let query = `
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
        u.created_at
      FROM students s
      JOIN users u ON s.user_id = u.id
    `;

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.id ASC';

    const [rows] = await pool.query(query, queryParams);

    const formattedStudents = rows.map((student) => ({
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
      created_at: student.created_at,
    }));

    return res.status(200).json({
      success: true,
      data: {
        students: formattedStudents,
      },
    });
  } catch (error) {
    console.error('Error fetching admin students list:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve students list.',
    });
  }
};

/**
 * Controller: Get Single Student Profile (including Skills and Applications)
 * Route: GET /api/admin/students/:userId
 * Access: Admin
 */
const getStudentById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Validate that userId is a strictly positive integer
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId) || parsedUserId <= 0 || String(parsedUserId) !== userId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID. User ID must be a positive integer.',
      });
    }

    // 1. Fetch Student & User Details (Explicit SELECT, No Passwords)
    const studentQuery = `
      SELECT 
        s.id AS student_pk,
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

    const [studentRows] = await pool.query(studentQuery, [parsedUserId]);

    if (studentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    const studentRecord = studentRows[0];
    const internalStudentId = studentRecord.student_pk;

    // 2. Fetch Student Skills via student_skills junction table
    const skillsQuery = `
      SELECT sk.id, sk.skill_name
      FROM skills sk
      JOIN student_skills ss ON sk.id = ss.skill_id
      WHERE ss.student_id = ?
      ORDER BY sk.id ASC
    `;

    const [skills] = await pool.query(skillsQuery, [internalStudentId]);

    // 3. Fetch Student Applications (Joined with Jobs and Companies)
    const applicationsQuery = `
      SELECT 
        a.id AS application_id,
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

    const [applications] = await pool.query(applicationsQuery, [internalStudentId]);

    return res.status(200).json({
      success: true,
      data: {
        student: {
          user_id: studentRecord.user_id,
          student_id: studentRecord.student_id,
          name: studentRecord.name,
          email: studentRecord.email,
          phone: studentRecord.phone,
          branch: studentRecord.branch,
          cgpa: parseFloat(studentRecord.cgpa),
          graduation_year: studentRecord.graduation_year,
          backlogs: studentRecord.backlogs,
          resume_path: studentRecord.resume_path,
          role: studentRecord.role,
          created_at: studentRecord.created_at,
        },
        skills: skills,
        applications: applications,
      },
    });
  } catch (error) {
    console.error(`Error fetching student userId ${req.params.userId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student profile.',
    });
  }
};

/**
 * Controller: Update Student Profile by Administrator
 * Route: PUT /api/admin/students/:userId
 * Access: Admin
 */
const updateStudent = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Validate that userId is a strictly positive integer
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId) || parsedUserId <= 0 || String(parsedUserId) !== userId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID. User ID must be a positive integer.',
      });
    }

    // Check if student exists
    const [existingRows] = await pool.query(
      `SELECT s.*, u.email, u.role, u.created_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = ?`,
      [parsedUserId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    const currentStudent = existingRows[0];
    const {
      name,
      phone,
      branch,
      cgpa,
      graduation_year,
      backlogs,
    } = req.body;

    // Check that at least one field is provided
    if (
      name === undefined &&
      phone === undefined &&
      branch === undefined &&
      cgpa === undefined &&
      graduation_year === undefined &&
      backlogs === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: At least one student field must be provided to update.',
      });
    }

    // Validate Name
    let finalName = currentStudent.name;
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: Name is required and cannot be empty.',
        });
      }
      finalName = name.trim();
    }

    // Validate Phone number (minimum 10 digits)
    let finalPhone = currentStudent.phone;
    if (phone !== undefined) {
      const phoneRegex = /^[0-9+\-\s]{10,20}$/;
      if (!phone || !phoneRegex.test(phone.toString().trim())) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: Please provide a valid phone number (minimum 10 digits).',
        });
      }
      finalPhone = phone.toString().trim();
    }

    // Validate Branch
    let finalBranch = currentStudent.branch;
    if (branch !== undefined) {
      if (typeof branch !== 'string' || branch.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: Branch is required and cannot be empty.',
        });
      }
      finalBranch = branch.trim().toUpperCase();
    }

    // Validate CGPA (must be a valid number between 0.00 and 10.00)
    let finalCgpa = parseFloat(currentStudent.cgpa);
    if (cgpa !== undefined) {
      const parsedCgpa = parseFloat(cgpa);
      if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: CGPA must be a valid number between 0.00 and 10.00.',
        });
      }
      finalCgpa = parsedCgpa;
    }

    // Validate Graduation Year
    let finalYear = currentStudent.graduation_year;
    if (graduation_year !== undefined) {
      const parsedYear = parseInt(graduation_year, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > currentYear + 10) {
        return res.status(400).json({
          success: false,
          message: `Validation Error: Graduation year must be a valid year between 2000 and ${currentYear + 10}.`,
        });
      }
      finalYear = parsedYear;
    }

    // Validate Backlogs (non-negative integer)
    let finalBacklogs = currentStudent.backlogs;
    if (backlogs !== undefined) {
      const parsedBacklogs = parseInt(backlogs, 10);
      if (isNaN(parsedBacklogs) || parsedBacklogs < 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: Backlogs must be a non-negative integer (0 or greater).',
        });
      }
      finalBacklogs = parsedBacklogs;
    }

    // Execute Parameterized SQL UPDATE
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
      finalName,
      finalPhone,
      finalBranch,
      finalCgpa,
      finalYear,
      finalBacklogs,
      parsedUserId,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully',
      data: {
        student: {
          user_id: currentStudent.user_id,
          student_id: currentStudent.student_id,
          name: finalName,
          email: currentStudent.email,
          phone: finalPhone,
          branch: finalBranch,
          cgpa: finalCgpa,
          graduation_year: finalYear,
          backlogs: finalBacklogs,
          resume_path: currentStudent.resume_path,
          role: currentStudent.role,
        },
      },
    });
  } catch (error) {
    console.error(`Error updating student userId ${req.params.userId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update student profile.',
    });
  }
};

/**
 * Controller: Delete Student Safely
 * Route: DELETE /api/admin/students/:userId
 * Access: Admin
 */
const deleteStudent = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Validate that userId is a strictly positive integer
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId) || parsedUserId <= 0 || String(parsedUserId) !== userId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID. User ID must be a positive integer.',
      });
    }

    // 1. Check if student exists
    const [studentRows] = await pool.query(
      'SELECT id, user_id FROM students WHERE user_id = ?',
      [parsedUserId]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    const studentId = studentRows[0].id;

    // 2. Application Safety Check: Prevent deletion if student has application history
    const [appRows] = await pool.query(
      'SELECT COUNT(*) AS app_count FROM applications WHERE student_id = ?',
      [studentId]
    );

    const appCount = appRows[0].app_count;
    if (appCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Student cannot be deleted because application history exists.',
      });
    }

    // 3. Safely delete student skills and student profile, then user account
    await pool.query('DELETE FROM student_skills WHERE student_id = ?', [studentId]);
    await pool.query('DELETE FROM students WHERE id = ?', [studentId]);
    await pool.query('DELETE FROM users WHERE id = ?', [parsedUserId]);

    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully.',
    });
  } catch (error) {
    console.error(`Error deleting student userId ${req.params.userId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete student.',
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};

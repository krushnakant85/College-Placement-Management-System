const bcrypt = require('bcrypt');
const pool = require('../config/database');

const saltRounds = 10;

/**
 * Controller: Register a new student
 * Route: POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      branch,
      cgpa,
      graduation_year,
      backlogs,
      student_id,
    } = req.body;

    // ==========================================
    // 1. INPUT VALIDATION
    // ==========================================

    // Validate Name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Name is required and cannot be empty.',
      });
    }

    // Validate Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Please provide a valid email address.',
      });
    }

    // Validate Password length (minimum 6 characters)
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Password must be at least 6 characters long.',
      });
    }

    // Validate Phone number (must have at least 10 digits)
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
        message: 'Validation Error: Branch is required (e.g., CSBS, CSE, IT, ECE).',
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

    // Validate Backlogs (integer >= 0, default 0 if not specified)
    const parsedBacklogs = backlogs !== undefined ? parseInt(backlogs, 10) : 0;
    if (isNaN(parsedBacklogs) || parsedBacklogs < 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Backlogs must be a non-negative integer (0 or greater).',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ==========================================
    // 2. CHECK FOR EXISTING EMAIL
    // ==========================================
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Registration Error: An account with this email address already exists.',
      });
    }

    // ==========================================
    // 3. GENERATE STUDENT ID (IF NOT PROVIDED)
    // ==========================================
    // If student_id is passed in the request body, use it. Otherwise, auto-generate a unique roll ID.
    const finalStudentId = student_id && student_id.trim().length > 0
      ? student_id.trim().toUpperCase()
      : `${branch.trim().toUpperCase()}${parsedYear}${Math.floor(1000 + Math.random() * 9000)}`;

    // ==========================================
    // 4. HASH THE PASSWORD
    // ==========================================
    // Salt rounds determine computation complexity (10 is industry standard)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ==========================================
    // 5. DATABASE TRANSACTION
    // ==========================================
    // Use a transaction so both users and students records are created atomically.
    // If either fails, all changes are rolled back automatically.
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Step A: Insert into users table
      const [userResult] = await connection.query(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [normalizedEmail, hashedPassword, 'student']
      );

      const userId = userResult.insertId;

      // Step B: Insert into students table linking with user_id
      const [studentRecord] = await connection.query(
        `INSERT INTO students 
         (user_id, student_id, name, phone, branch, cgpa, graduation_year, backlogs) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          finalStudentId,
          name.trim(),
          phone.toString().trim(),
          branch.trim().toUpperCase(),
          parsedCgpa,
          parsedYear,
          parsedBacklogs,
        ]
      );

      // Commit transaction
      await connection.commit();

      // Return clean response without exposing password
      return res.status(201).json({
        success: true,
        message: 'Student registered successfully',
        data: {
          student: {
            id: studentRecord.insertId,
            user_id: userId,
            student_id: finalStudentId,
            name: name.trim(),
            email: normalizedEmail,
            phone: phone.toString().trim(),
            branch: branch.trim().toUpperCase(),
            cgpa: parsedCgpa,
            graduation_year: parsedYear,
            backlogs: parsedBacklogs,
          },
        },
      });
    } catch (transactionError) {
      // Rollback any database modifications on error
      await connection.rollback();

      // Handle unique constraint collisions (e.g. duplicate student_id)
      if (transactionError.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Registration Error: Duplicate entry detected for student ID or email.',
        });
      }

      throw transactionError;
    } finally {
      // Always release the borrowed connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error('Registration Server Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error: Unable to complete registration.',
    });
  }
};

/**
 * Controller: Student Login
 * Route: POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ==========================================
    // 1. INPUT VALIDATION
    // ==========================================
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ==========================================
    // 2. FIND USER BY EMAIL
    // ==========================================
    const [users] = await pool.query(
      'SELECT id, email, password, role, created_at FROM users WHERE email = ?',
      [normalizedEmail]
    );

    // Return generic message if user doesn't exist (prevents user enumeration attacks)
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Authentication Error: Invalid email or password.',
      });
    }

    const user = users[0];

    // ==========================================
    // 3. COMPARE HASHED PASSWORD WITH BCRYPT
    // ==========================================
    let isPasswordValid = false;
    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = (password === user.password);
      if (isPasswordValid) {
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

    // ==========================================
    // 4. RETRIEVE STUDENT PROFILE DETAILS
    // ==========================================
    let studentProfile = null;

    if (user.role === 'student') {
      const [students] = await pool.query(
        `SELECT id, student_id, name, phone, branch, cgpa, graduation_year, backlogs, resume_path 
         FROM students 
         WHERE user_id = ?`,
        [user.id]
      );

      studentProfile = students.length > 0 ? students[0] : null;
    }

    // ==========================================
    // 5. RETURN SUCCESS RESPONSE (NO PASSWORD)
    // ==========================================
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
        student: studentProfile,
      },
    });
  } catch (error) {
    console.error('Login Server Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error: Unable to complete login.',
    });
  }
};

module.exports = {
  register,
  login,
};

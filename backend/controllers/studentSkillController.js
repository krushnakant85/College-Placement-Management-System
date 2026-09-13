const pool = require('../config/database');

/**
 * Controller: Get all skills for a student
 * Route: GET /api/students/:userId/skills
 */
const getStudentSkills = async (req, res, next) => {
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

    // 2. Verify student exists using userId
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

    // 3. Query skills belonging to this student via student_skills join table
    const query = `
      SELECT sk.id, sk.skill_name
      FROM skills sk
      JOIN student_skills ss ON sk.id = ss.skill_id
      WHERE ss.student_id = ?
      ORDER BY sk.id ASC
    `;

    const [skills] = await pool.query(query, [internalStudentId]);

    // 4. Return the list of skills (empty array if no skills yet)
    return res.status(200).json({
      success: true,
      data: {
        skills: skills,
      },
    });
  } catch (error) {
    console.error('Error fetching student skills:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error: Unable to fetch student skills.',
    });
  }
};

/**
 * Controller: Add a skill to a student
 * Route: POST /api/students/:userId/skills
 */
const addStudentSkill = async (req, res, next) => {
  let connection;
  try {
    const { userId } = req.params;
    const { skill_id } = req.body;

    // 1. Validate userId
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId) || parsedUserId <= 0 || String(parsedUserId) !== String(userId).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Invalid user ID. User ID must be a positive integer.',
      });
    }

    // 2. Validate skill_id in request body
    const parsedSkillId = parseInt(skill_id, 10);
    if (skill_id === undefined || isNaN(parsedSkillId) || parsedSkillId <= 0 || String(parsedSkillId) !== String(skill_id).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: skill_id is required and must be a positive integer.',
      });
    }

    // 3. Obtain connection from pool for database transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 4. Check if student exists
    const [studentRows] = await connection.query(
      'SELECT id FROM students WHERE user_id = ?',
      [parsedUserId]
    );

    if (studentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    const internalStudentId = studentRows[0].id;

    // 5. Check if skill exists in the master skills table
    const [skillRows] = await connection.query(
      'SELECT id, skill_name FROM skills WHERE id = ?',
      [parsedSkillId]
    );

    if (skillRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Skill not found.',
      });
    }

    const targetSkill = skillRows[0];

    // 6. Check if student already has this skill (duplicate prevention)
    const [existingLink] = await connection.query(
      'SELECT 1 FROM student_skills WHERE student_id = ? AND skill_id = ?',
      [internalStudentId, parsedSkillId]
    );

    if (existingLink.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Student already has this skill.',
      });
    }

    // 7. Insert the relationship into student_skills
    await connection.query(
      'INSERT INTO student_skills (student_id, skill_id) VALUES (?, ?)',
      [internalStudentId, parsedSkillId]
    );

    // Commit transaction
    await connection.commit();

    // 8. Return newly added skill with HTTP 201 Created
    return res.status(201).json({
      success: true,
      message: 'Skill added successfully',
      data: {
        skill: {
          id: targetSkill.id,
          skill_name: targetSkill.skill_name,
        },
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error adding student skill:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error: Unable to add student skill.',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Controller: Delete a skill from a student
 * Route: DELETE /api/students/:userId/skills/:skillId
 */
const deleteStudentSkill = async (req, res, next) => {
  try {
    const { userId, skillId } = req.params;

    // 1. Validate userId
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId) || parsedUserId <= 0 || String(parsedUserId) !== String(userId).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Invalid user ID. User ID must be a positive integer.',
      });
    }

    // 2. Validate skillId
    const parsedSkillId = parseInt(skillId, 10);
    if (isNaN(parsedSkillId) || parsedSkillId <= 0 || String(parsedSkillId) !== String(skillId).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Invalid skill ID. Skill ID must be a positive integer.',
      });
    }

    // 3. Check that the student exists
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

    // 4. Check whether the student actually has this skill
    const [existingLink] = await pool.query(
      'SELECT 1 FROM student_skills WHERE student_id = ? AND skill_id = ?',
      [internalStudentId, parsedSkillId]
    );

    if (existingLink.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student does not have this skill.',
      });
    }

    // 5. Delete the relationship from student_skills
    await pool.query(
      'DELETE FROM student_skills WHERE student_id = ? AND skill_id = ?',
      [internalStudentId, parsedSkillId]
    );

    // 6. Return successful response
    return res.status(200).json({
      success: true,
      message: 'Skill removed successfully',
    });
  } catch (error) {
    console.error('Error deleting student skill:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error: Unable to delete student skill.',
    });
  }
};

module.exports = {
  getStudentSkills,
  addStudentSkill,
  deleteStudentSkill,
};

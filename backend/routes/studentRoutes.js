const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const studentSkillRoutes = require('./studentSkillRoutes');

/**
 * @route   GET /api/students/:userId
 * @desc    Fetch a student's profile by their user ID
 * @access  Public (Will be protected with auth tokens in future steps)
 */
// GET /api/students/:userId and /api/students/profile/:userId
router.get('/:userId', studentController.getStudentProfile);
router.get('/profile/:userId', studentController.getStudentProfile);

// PUT /api/students/:userId and /api/students/profile/:userId
router.put('/:userId', studentController.updateStudentProfile);
router.put('/profile/:userId', studentController.updateStudentProfile);

// Student Skills routes: /api/students/:userId/skills
router.use('/:userId/skills', studentSkillRoutes);
router.use('/profile/:userId/skills', studentSkillRoutes);

module.exports = router;

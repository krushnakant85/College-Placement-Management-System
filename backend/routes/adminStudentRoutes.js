const express = require('express');
const router = express.Router();
const adminStudentController = require('../controllers/adminStudentController');

/**
 * @route   GET /api/admin/students
 * @desc    View all registered students (supports ?search, ?branch, ?graduation_year, ?min_cgpa, ?max_backlogs)
 * @access  Admin
 */
router.get('/', adminStudentController.getAllStudents);

/**
 * @route   GET /api/admin/students/:userId
 * @desc    View single student's complete profile with skills and applications
 * @access  Admin
 */
router.get('/:userId', adminStudentController.getStudentById);

/**
 * @route   PUT /api/admin/students/:userId
 * @desc    Update student profile details
 * @access  Admin
 */
router.put('/:userId', adminStudentController.updateStudent);

/**
 * @route   DELETE /api/admin/students/:userId
 * @desc    Safely delete a student (blocked if application history exists)
 * @access  Admin
 */
router.delete('/:userId', adminStudentController.deleteStudent);

module.exports = router;

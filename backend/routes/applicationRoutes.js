const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');

/**
 * @route   POST /api/applications
 * @desc    Submit a new job application (with eligibility check & duplicate protection)
 * @access  Public
 */
router.post('/', applicationController.applyForJob);

/**
 * @route   GET /api/applications/student/:userId
 * @desc    Get all job applications submitted by a specific student
 * @access  Public
 */
router.get('/student/:userId', applicationController.getStudentApplications);

/**
 * @route   GET /api/applications/:applicationId
 * @desc    Get complete details of a specific job application
 * @access  Public
 */
router.get('/:applicationId', applicationController.getApplicationById);

module.exports = router;

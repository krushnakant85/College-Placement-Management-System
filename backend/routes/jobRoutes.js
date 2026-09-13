const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const eligibilityController = require('../controllers/eligibilityController');

/**
 * @route   GET /api/jobs
 * @desc    Get list of all job postings (joined with company details)
 * @access  Public
 */
router.get('/', jobController.getAllJobs);
router.get('/skills', jobController.getAllSkills);

/**
 * @route   GET /api/jobs/:jobId
 * @desc    Get detailed information for a specific job posting
 * @access  Public
 */
router.get('/:jobId', jobController.getJobById);

/**
 * @route   GET /api/jobs/:jobId/eligibility/:userId
 * @desc    Check whether a student is eligible for a specific job
 * @access  Public
 */
router.get('/:jobId/eligibility/:userId', eligibilityController.checkJobEligibility);

/**
 * @route   POST /api/jobs
 * @desc    Create a new job posting
 * @access  Admin
 */
router.post('/', jobController.createJob);

/**
 * @route   PUT /api/jobs/:jobId
 * @desc    Update a job posting
 * @access  Admin
 */
router.put('/:jobId', jobController.updateJob);

/**
 * @route   DELETE /api/jobs/:jobId
 * @desc    Delete a job posting (if no applications exist)
 * @access  Admin
 */
router.delete('/:jobId', jobController.deleteJob);

module.exports = router;


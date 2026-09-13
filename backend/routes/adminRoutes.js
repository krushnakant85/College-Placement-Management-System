const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const companyController = require('../controllers/companyController');
const jobController = require('../controllers/jobController');

/**
 * @route   POST /api/admin/login
 * @desc    Authenticate administrator and return admin profile
 * @access  Public
 */
router.post('/login', adminController.loginAdmin);

/**
 * @route   GET /api/admin/applications
 * @desc    View all student job applications
 * @access  Admin
 */
router.get('/applications', adminController.getAllApplications);

/**
 * @route   GET /api/admin/applications/:applicationId
 * @desc    View detailed information of a specific application
 * @access  Admin
 */
router.get('/applications/:applicationId', adminController.getApplicationById);

/**
 * @route   PUT /api/admin/applications/:applicationId/status
 * @desc    Update recruitment status of an application
 * @access  Admin
 */
router.put('/applications/:applicationId/status', adminController.updateApplicationStatus);

/**
 * ============================================================================
 * COMPANY MANAGEMENT ROUTES (ADMIN)
 * ============================================================================
 */

/**
 * @route   POST /api/admin/companies
 * @desc    Create a new recruiting company
 * @access  Admin
 */
router.post('/companies', companyController.createCompany);

/**
 * @route   GET /api/admin/companies
 * @desc    View all companies
 * @access  Admin
 */
router.get('/companies', companyController.getAllCompanies);

/**
 * @route   GET /api/admin/companies/:companyId
 * @desc    View single company details
 * @access  Admin
 */
router.get('/companies/:companyId', companyController.getCompanyById);

/**
 * @route   PUT /api/admin/companies/:companyId
 * @desc    Update company details
 * @access  Admin
 */
router.put('/companies/:companyId', companyController.updateCompany);

/**
 * @route   DELETE /api/admin/companies/:companyId
 * @desc    Delete company (if no dependent jobs exist)
 * @access  Admin
 */
router.delete('/companies/:companyId', companyController.deleteCompany);

/**
 * ============================================================================
 * JOB MANAGEMENT ROUTES (ADMIN)
 * ============================================================================
 */

/**
 * @route   POST /api/admin/jobs
 * @desc    Create a new job posting
 * @access  Admin
 */
router.post('/jobs', jobController.createJob);

/**
 * @route   GET /api/admin/jobs
 * @desc    View all job postings
 * @access  Admin
 */
router.get('/jobs', jobController.getAllJobs);

/**
 * @route   GET /api/admin/jobs/:jobId
 * @desc    View single job posting details
 * @access  Admin
 */
router.get('/jobs/:jobId', jobController.getJobById);

/**
 * @route   PUT /api/admin/jobs/:jobId
 * @desc    Update job posting details
 * @access  Admin
 */
router.put('/jobs/:jobId', jobController.updateJob);

/**
 * @route   DELETE /api/admin/jobs/:jobId
 * @desc    Delete job posting (if no dependent applications exist)
 * @access  Admin
 */
router.delete('/jobs/:jobId', jobController.deleteJob);

/**
 * ============================================================================
 * STUDENT MANAGEMENT ROUTES (ADMIN)
 * ============================================================================
 */
const adminStudentRoutes = require('./adminStudentRoutes');
router.use('/students', adminStudentRoutes);
router.use('/student', adminStudentRoutes);

module.exports = router;




const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

/**
 * @route   GET /api/companies
 * @desc    Get list of all recruiting companies
 * @access  Public
 */
router.get('/', companyController.getAllCompanies);

/**
 * @route   GET /api/companies/:companyId
 * @desc    Get detailed information about a single company
 * @access  Public
 */
router.get('/:companyId', companyController.getCompanyById);

/**
 * @route   POST /api/companies
 * @desc    Create a new company
 * @access  Admin
 */
router.post('/', companyController.createCompany);

/**
 * @route   PUT /api/companies/:companyId
 * @desc    Update company details
 * @access  Admin
 */
router.put('/:companyId', companyController.updateCompany);

/**
 * @route   DELETE /api/companies/:companyId
 * @desc    Delete a company (if no dependent jobs exist)
 * @access  Admin
 */
router.delete('/:companyId', companyController.deleteCompany);

module.exports = router;


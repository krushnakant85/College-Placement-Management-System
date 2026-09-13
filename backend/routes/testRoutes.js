const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @route   GET /api/test
 * @desc    Basic API health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'College Placement API is running',
  });
});

/**
 * @route   GET /api/test/database
 * @desc    Database connectivity check endpoint
 * @access  Public
 */
router.get('/database', async (req, res, next) => {
  try {
    // Run a lightweight test query to confirm connection
    const [rows] = await pool.query('SELECT 1 AS connection_test');

    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      data: rows,
    });
  } catch (error) {
    // Log detailed error on the server side for debugging
    console.error('Database connection error:', error.message);

    // Return a safe error message to client without leaking sensitive credentials
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MySQL is running and check your .env credentials.',
    });
  }
});

module.exports = router;

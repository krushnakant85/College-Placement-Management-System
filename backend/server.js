const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const testRoutes = require('./routes/testRoutes');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const companyRoutes = require('./routes/companyRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Parse incoming requests with JSON payloads
app.use(express.json());

// API Routes
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/application', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Root Health/Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to College Placement Management System API',
  });
});

// 404 Not Found Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: 'Internal Server Error',
  });
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Test URL: http://localhost:${PORT}/api/test`);
  console.log(`Database Test URL: http://localhost:${PORT}/api/test/database`);
});

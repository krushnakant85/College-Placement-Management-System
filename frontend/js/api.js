/**
 * College Placement Management System — Centralized API Client
 * Pure Vanilla JavaScript Fetch Wrapper
 */

// Configurable API base URL: supports window.API_BASE_URL, window.__API_BASE_URL__, or window.APP_CONFIG.API_BASE_URL with fallback to local development
const API_BASE_URL = (typeof window !== 'undefined' && (
  window.API_BASE_URL ||
  (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ||
  window.__API_BASE_URL__
)) || 'http://localhost:5000/api';

/**
 * Low-level HTTP request helper
 * @param {string} endpoint - API endpoint path (e.g. '/auth/login')
 * @param {object} options - Standard fetch options (method, body, headers, etc.)
 * @returns {Promise<object>} JSON parsed response data
 */
async function apiRequest(endpoint, options = {}) {
  // Normalize endpoint URL
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const defaultHeaders = {
    'Accept': 'application/json',
  };

  // Add Content-Type header if request contains a body
  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, mergedOptions);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { success: response.ok, message: text };
    }

    if (!response.ok) {
      const error = new Error(
        data.message || `HTTP error! Status: ${response.status}`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // Check if network failed or server is down
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error(
        'Unable to connect to the backend server. Please verify the API is running at ' + API_BASE_URL
      );
      networkError.status = 0;
      throw networkError;
    }
    throw error;
  }
}

/**
 * Authentication Endpoints
 */
const authAPI = {
  /**
   * Register a new student account
   * POST /api/auth/register
   */
  register(studentData) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  /**
   * Login student
   * POST /api/auth/login
   */
  login(credentials) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
};

/**
 * Student Profile & Skills Endpoints
 */
const studentAPI = {
  /**
   * Get student profile by user ID
   * GET /api/students/:userId
   */
  getProfile(userId) {
    return apiRequest(`/students/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Update student profile
   * PUT /api/students/:userId
   */
  updateProfile(userId, profileData) {
    return apiRequest(`/students/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  /**
   * Get skills of a student
   * GET /api/students/:userId/skills
   */
  getSkills(userId) {
    return apiRequest(`/students/${userId}/skills`, {
      method: 'GET',
    });
  },

  /**
   * Add a skill to student
   * POST /api/students/:userId/skills
   */
  addSkill(userId, skillId) {
    return apiRequest(`/students/${userId}/skills`, {
      method: 'POST',
      body: JSON.stringify({ skill_id: skillId }),
    });
  },

  /**
   * Remove a skill from student
   * DELETE /api/students/:userId/skills/:skillId
   */
  deleteSkill(userId, skillId) {
    return apiRequest(`/students/${userId}/skills/${skillId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Job Listings & Eligibility Endpoints
 */
const jobAPI = {
  /**
   * Get all active campus job postings
   * GET /api/jobs
   */
  getAllJobs() {
    return apiRequest('/jobs', {
      method: 'GET',
    });
  },

  /**
   * Get job details by ID
   * GET /api/jobs/:jobId
   */
  getJobById(jobId) {
    return apiRequest(`/jobs/${jobId}`, {
      method: 'GET',
    });
  },

  /**
   * Check student eligibility for a specific job
   * GET /api/jobs/:jobId/eligibility/:userId
   */
  checkEligibility(jobId, userId) {
    return apiRequest(`/jobs/${jobId}/eligibility/${userId}`, {
      method: 'GET',
    });
  },
};

/**
 * Application Management Endpoints
 */
const applicationAPI = {
  /**
   * Submit job application
   * POST /api/applications
   */
  applyForJob(applicationData) {
    return apiRequest('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },

  /**
   * Get all applications submitted by a student
   * GET /api/applications/student/:userId
   */
  getStudentApplications(userId) {
    return apiRequest(`/applications/student/${userId}`, {
      method: 'GET',
    });
  },
};

/**
 * Administrator Management Endpoints
 */
const adminAPI = {
  /**
   * Authenticate administrator
   * POST /api/admin/login
   */
  login(credentials) {
    return apiRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * Get all student job applications
   * GET /api/admin/applications
   */
  getApplications() {
    return apiRequest('/admin/applications', {
      method: 'GET',
    });
  },

  /**
   * Get single application details
   * GET /api/admin/applications/:applicationId
   */
  getApplicationById(applicationId) {
    return apiRequest(`/admin/applications/${applicationId}`, {
      method: 'GET',
    });
  },

  /**
   * Update application status
   * PUT /api/admin/applications/:applicationId/status
   */
  updateApplicationStatus(applicationId, status) {
    return apiRequest(`/admin/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Get all companies
   * GET /api/admin/companies
   */
  getCompanies() {
    return apiRequest('/admin/companies', {
      method: 'GET',
    });
  },

  /**
   * Get single company details
   * GET /api/admin/companies/:companyId
   */
  getCompanyById(companyId) {
    return apiRequest(`/admin/companies/${companyId}`, {
      method: 'GET',
    });
  },

  /**
   * Create a new company
   * POST /api/admin/companies
   */
  createCompany(companyData) {
    return apiRequest('/admin/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  },

  /**
   * Update company details
   * PUT /api/admin/companies/:companyId
   */
  updateCompany(companyId, companyData) {
    return apiRequest(`/admin/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  },

  /**
   * Delete company
   * DELETE /api/admin/companies/:companyId
   */
  deleteCompany(companyId) {
    return apiRequest(`/admin/companies/${companyId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get all jobs
   * GET /api/admin/jobs
   */
  getJobs() {
    return apiRequest('/admin/jobs', {
      method: 'GET',
    });
  },

  /**
   * Get single job details
   * GET /api/admin/jobs/:jobId
   */
  getJobById(jobId) {
    return apiRequest(`/admin/jobs/${jobId}`, {
      method: 'GET',
    });
  },

  /**
   * Create a new job posting
   * POST /api/admin/jobs
   */
  createJob(jobData) {
    return apiRequest('/admin/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  /**
   * Update job posting
   * PUT /api/admin/jobs/:jobId
   */
  updateJob(jobId, jobData) {
    return apiRequest(`/admin/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  },

  /**
   * Delete job posting
   * DELETE /api/admin/jobs/:jobId
   */
  deleteJob(jobId) {
    return apiRequest(`/admin/jobs/${jobId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get registered students with optional search/filters
   * GET /api/admin/students
   * @param {object} params - { search, branch, graduation_year, min_cgpa, max_backlogs }
   */
  getStudents(params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    const qs = query.toString();
    return apiRequest(`/admin/students${qs ? '?' + qs : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Get student details with skills and applications
   * GET /api/admin/students/:userId
   */
  getStudentById(userId) {
    return apiRequest(`/admin/students/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Update student details
   * PUT /api/admin/students/:userId
   */
  updateStudent(userId, studentData) {
    return apiRequest(`/admin/students/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },

  /**
   * Delete student
   * DELETE /api/admin/students/:userId
   */
  deleteStudent(userId) {
    return apiRequest(`/admin/students/${userId}`, {
      method: 'DELETE',
    });
  },
};

// Expose API module to global scope
window.api = {
  API_BASE_URL,
  apiRequest,
  authAPI,
  studentAPI,
  jobAPI,
  applicationAPI,
  adminAPI,
};


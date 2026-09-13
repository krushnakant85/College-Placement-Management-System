
// ============================================================================
// Dark / Light Theme Management
// ============================================================================
const THEME_STORAGE_KEY = 'placementTheme';

/**
 * Retrieve saved theme preference from localStorage (defaults to 'light')
 * @returns {'light'|'dark'}
 */
function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  } catch (err) {
    return 'light';
  }
}

/**
 * Apply theme to document element and update all toggle buttons
 * @param {'light'|'dark'} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
  toggleBtns.forEach((btn) => {
    if (theme === 'dark') {
      btn.innerHTML = '☀ Light';
      btn.setAttribute('aria-label', 'Switch to light mode');
      btn.setAttribute('title', 'Switch to Light Mode');
    } else {
      btn.innerHTML = '🌙 Dark';
      btn.setAttribute('aria-label', 'Switch to dark mode');
      btn.setAttribute('title', 'Switch to Dark Mode');
    }
  });
}

/**
 * Toggle between Light and Dark mode, persisting in localStorage
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || getSavedTheme();
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch (err) {
    console.warn('Unable to access localStorage for theme preference:', err);
  }
  applyTheme(nextTheme);
}

// Immediately apply saved theme on script execution
applyTheme(getSavedTheme());

/**
 * College Placement Management System — Common Frontend Utilities
 * Session Management, UI Alerts, Helpers & Page Lifecycle
 */

const SESSION_KEYS = {
  USER: 'cpms_user',
  STUDENT: 'cpms_student',
  ADMIN: 'cpms_admin',
};

// ============================================================================
// Session & Auth Utilities
// ============================================================================

/**
 * Retrieve current logged in user object from session storage
 * @returns {object|null}
 */
function getStoredUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Error reading stored user:', err);
    return null;
  }
}

/**
 * Retrieve current student profile object from session storage
 * @returns {object|null}
 */
function getStoredStudent() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS.STUDENT);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Error reading stored student:', err);
    return null;
  }
}

/**
 * Save user and student profile in session storage (no passwords saved)
 * @param {object} user - User metadata (id, email, role)
 * @param {object} student - Student metadata (id, student_id, name, branch, cgpa, etc.)
 */
function setSession(user, student) {
  if (user) {
    sessionStorage.setItem(SESSION_KEYS.USER, JSON.stringify(user));
  }
  if (student) {
    sessionStorage.setItem(SESSION_KEYS.STUDENT, JSON.stringify(student));
  }
}

/**
 * Clear current active session
 */
function clearSession() {
  sessionStorage.removeItem(SESSION_KEYS.USER);
  sessionStorage.removeItem(SESSION_KEYS.STUDENT);
}

/**
 * Check whether a user is currently authenticated as a student
 * @returns {boolean}
 */
function isLoggedIn() {
  const user = getStoredUser();
  return !!(user && user.id && user.role === 'student');
}

/**
 * Guard page: Redirect to login page if user is not authenticated
 * @param {string} loginUrl - URL of login page
 */
function requireAuth(loginUrl = 'student-login.html') {
  if (!isLoggedIn()) {
    window.location.href = loginUrl;
  }
}

/**
 * Guard page: Redirect to dashboard if user is already authenticated
 * @param {string} dashboardUrl - URL of student dashboard
 */
function requireGuest(dashboardUrl = 'student-dashboard.html') {
  if (isLoggedIn()) {
    window.location.href = dashboardUrl;
  }
}

/**
 * Global logout handler
 */
function handleLogout() {
  clearSession();
  const isInPages = window.location.pathname.includes('/pages/') || window.location.pathname.includes('\\pages\\');
  window.location.href = isInPages ? 'student-login.html' : 'pages/student-login.html';
}

// ============================================================================
// Administrator Session & Auth Utilities
// ============================================================================

/**
 * Retrieve current logged in admin object from session storage
 * @returns {object|null}
 */
function getStoredAdmin() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS.ADMIN);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Error reading stored admin:', err);
    return null;
  }
}

/**
 * Save admin profile in session storage (no passwords saved)
 * @param {object} admin - Admin metadata (id, user_id, name, email, phone, department, role)
 */
function setAdminSession(admin) {
  if (admin) {
    sessionStorage.setItem(SESSION_KEYS.ADMIN, JSON.stringify(admin));
  }
}

/**
 * Clear admin session
 */
function clearAdminSession() {
  sessionStorage.removeItem(SESSION_KEYS.ADMIN);
}

/**
 * Check whether a user is currently authenticated as an admin
 * @returns {boolean}
 */
function isAdminLoggedIn() {
  const admin = getStoredAdmin();
  return !!(admin && admin.user_id && admin.role === 'admin');
}

/**
 * Guard page: Redirect to admin login page if user is not authenticated as an admin
 * @param {string} loginUrl - URL of admin login page
 */
function requireAdminAuth(loginUrl = 'admin-login.html') {
  if (!isAdminLoggedIn()) {
    window.location.href = loginUrl;
  }
}

/**
 * Guard page: Redirect to admin dashboard if already authenticated as an admin
 * @param {string} dashboardUrl - URL of admin dashboard
 */
function requireAdminGuest(dashboardUrl = 'admin-dashboard.html') {
  if (isAdminLoggedIn()) {
    window.location.href = dashboardUrl;
  }
}

/**
 * Global admin logout handler
 */
function handleAdminLogout() {
  clearAdminSession();
  const isInPages = window.location.pathname.includes('/pages/') || window.location.pathname.includes('\\pages\\');
  window.location.href = isInPages ? 'admin-login.html' : 'pages/admin-login.html';
}

// ============================================================================
// UI Alert Helpers
// ============================================================================

/**
 * Render a styled notification alert inside a container
 * @param {string} containerId - Element ID where alert will be placed
 * @param {string} message - Text message to show
 * @param {'success'|'danger'|'warning'|'info'} type - Alert style type
 */
function showAlert(containerId, message, type = 'info') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const iconMap = {
    success: '✓',
    danger: '⚠',
    warning: '!',
    info: 'ℹ',
  };

  const icon = iconMap[type] || 'ℹ';
  container.innerHTML = `
    <div class="alert alert-${type}" role="alert">
      <span class="alert-icon">${icon}</span>
      <div>${escapeHtml(message)}</div>
    </div>
  `;
}

/**
 * Clear alert container
 * @param {string} containerId
 */
function clearAlert(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
}

// ============================================================================
// Button State & Loading Helper
// ============================================================================

/**
 * Toggle button loading state (disables button and displays spinner)
 * @param {HTMLButtonElement} button - The button element
 * @param {boolean} isLoading - Loading state
 * @param {string} originalText - Default button label
 * @param {string} loadingText - Label to show when loading
 */
function setLoading(button, isLoading, originalText = '', loadingText = 'Processing...') {
  if (!button) return;

  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = originalText || button.innerHTML;
    button.innerHTML = `<span class="spinner"></span> ${loadingText}`;
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || originalText || 'Submit';
  }
}

// ============================================================================
// Value Formatting Utilities
// ============================================================================

/**
 * Format package value to display string (e.g. ₹ 8.5 LPA)
 * @param {number|string} val
 * @returns {string}
 */
function formatPackage(val) {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  const num = parseFloat(val);
  return `₹ ${num.toFixed(2)} LPA`;
}

/**
 * Format standard ISO date to human-readable string
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * HTML Escaping helper to prevent XSS injection in dynamic text
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str || '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================================
// Mobile Navigation Toggle
// ============================================================================

/**
 * Toggle responsive mobile navigation menu
 */
function toggleMobileNav() {
  const navLinks = document.querySelector('.nav-links');
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  if (navLinks) {
    const isOpen = navLinks.classList.toggle('mobile-open');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }
}

// ============================================================================
// Automatic Navbar & Session Detection on DOM Ready
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme button state on DOM ready
  applyTheme(getSavedTheme());

  // Bind mobile nav toggle button if present
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', toggleMobileNav);
  }

  // Close mobile nav when clicking any nav link
  const allNavLinks = document.querySelectorAll('.nav-links a');
  allNavLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const navLinks = document.querySelector('.nav-links');
      if (navLinks && navLinks.classList.contains('mobile-open')) {
        navLinks.classList.remove('mobile-open');
        if (mobileToggle) {
          mobileToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // Check if navbar has user placeholder
  const userPlaceholder = document.getElementById('navbar-user-placeholder');
  if (userPlaceholder) {
    const student = getStoredStudent();
    if (student && isLoggedIn()) {
      userPlaceholder.innerHTML = `
        <span class="user-badge">${escapeHtml(student.name || 'Student')}</span>
        <button onclick="handleLogout()" class="btn btn-sm btn-outline-primary" style="margin-left: 0.5rem;">Logout</button>
      `;
    }
  }

  // Check if navbar has admin name badge placeholder
  const adminNameBadge = document.getElementById('admin-name-badge');
  if (adminNameBadge) {
    const admin = getStoredAdmin();
    if (admin && admin.name) {
      adminNameBadge.textContent = admin.name;
    }
  }

  // Highlight active link based on current page URL
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && currentPath.endsWith(href)) {
      link.classList.add('active');
    }
  });
});


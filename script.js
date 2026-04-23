/* ========================================
   Municipal Complaint System - JavaScript
   ======================================== */

// ========================================
// Utility Functions
// ========================================

/**
 * Generate a unique ID for complaints
 */
function generateId() {
  return (
    "CMPLT-" +
    Date.now() +
    "-" +
    Math.random().toString(36).substr(2, 9).toUpperCase()
  );
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get data from localStorage
 */
function getFromStorage(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Save data to localStorage
 */
function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Show message in form
 */
function showMessage(elementId, message, type) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.className = `form-message ${type}`;
    setTimeout(() => {
      element.textContent = "";
      element.className = "form-message";
    }, 3000);
  }
}

// ========================================
// Authentication Functions
// ========================================

/**
 * Handle login form submission
 */
function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  // Hardcoded admin credentials
  if (email === "admin@gmail.com" && password === "12345678") {
    const adminUser = {
      id: "ADMIN-001",
      name: "Admin",
      email: "admin@gmail.com",
      password: "12345678",
      role: "admin",
      createdAt: Date.now(),
    };
    saveToStorage("currentUser", adminUser);
    window.location.href = "admin.html";
    return;
  }

  // Get users from storage
  const users = getFromStorage("users") || [];

  // Find matching user (only for 'user' role)
  const user = users.find(
    (u) => u.email === email && u.password === password && u.role === "user",
  );

  if (user) {
    // Save current user session
    saveToStorage("currentUser", user);
    window.location.href = "user.html";
  } else {
    showMessage("loginMessage", "Invalid credentials!", "error");
  }
}

/**
 * Handle registration form submission
 */
function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById(
    "registerConfirmPassword",
  ).value;

  // Validate passwords match
  if (password !== confirmPassword) {
    showMessage("registerMessage", "Passwords do not match!", "error");
    return;
  }

  // Get existing users
  const users = getFromStorage("users") || [];

  // Check if email already exists
  if (users.some((u) => u.email === email)) {
    showMessage("registerMessage", "Email already registered!", "error");
    return;
  }

  // Create new user
  const newUser = {
    id: generateId(),
    name: name,
    email: email,
    password: password,
    role: "user", // Default role for registration
    createdAt: Date.now(),
  };

  // Save user
  users.push(newUser);
  saveToStorage("users", users);

  // Show success message
  showMessage(
    "registerMessage",
    "Registration successful! Please login.",
    "success",
  );

  // Reset form
  document.getElementById("registerForm").reset();

  // Switch to login tab after delay
  setTimeout(() => {
    document.getElementById("loginBtn").click();
  }, 1500);
}

/**
 * Toggle between login and register forms
 */
function toggleAuthForm(formToShow) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  if (formToShow === "login") {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    loginBtn.classList.add("active");
    registerBtn.classList.remove("active");
  } else {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    loginBtn.classList.remove("active");
    registerBtn.classList.add("active");
  }
}

/**
 * Check authentication and redirect if not logged in
 */
function checkAuth(requiredRole) {
  const currentUser = getFromStorage("currentUser");

  if (!currentUser) {
    window.location.href = "index.html";
    return null;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    // Redirect to appropriate dashboard
    if (currentUser.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "user.html";
    }
    return null;
  }

  return currentUser;
}

/**
 * Handle logout
 */
function handleLogout() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

// ========================================
// User Dashboard Functions
// ========================================

/**
 * Initialize user dashboard
 */
function initUserDashboard() {
  const user = checkAuth("user");
  if (!user) return;

  // Display user name and avatar
  document.getElementById("userNameDisplay").textContent = user.name;
  document.getElementById("userAvatar").textContent = user.name
    .charAt(0)
    .toUpperCase();

  // Setup sidebar navigation
  setupSidebarNavigation();

  // Load user complaints
  loadUserComplaints();

  // Update dashboard stats
  updateDashboardStats();

  // Setup search
  setupUserSearch();

  // Setup complaint form
  document
    .getElementById("complaintForm")
    .addEventListener("submit", handleComplaintSubmit);

  const quickSubmitButton = document.getElementById("btnGoToSubmit");
  if (quickSubmitButton) {
    quickSubmitButton.addEventListener("click", () => {
      const submitTab = document.querySelector(
        ".sidebar-btn[data-section='submit']",
      );
      if (submitTab) submitTab.click();
    });
  }

  // Setup logout
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
}

/**
 * Setup sidebar navigation for user dashboard
 */
function setupSidebarNavigation() {
  const sidebarBtns = document.querySelectorAll(".sidebar-btn");

  sidebarBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.section;

      // Update active button
      sidebarBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Show corresponding section
      document
        .querySelectorAll(".content-section")
        .forEach((s) => s.classList.remove("active"));
      document.getElementById(`${section}Section`).classList.add("active");
    });
  });
}

/**
 * Handle complaint form submission
 */
function handleComplaintSubmit(event) {
  event.preventDefault();

  const user = getFromStorage("currentUser");
  if (!user) return;

  const name = document.getElementById("complaintName").value.trim();
  const email = document.getElementById("complaintEmail").value.trim();
  const title = document.getElementById("complaintTitle").value.trim();
  const category = document.getElementById("complaintCategory").value;
  const description = document
    .getElementById("complaintDescription")
    .value.trim();

  // Get existing complaints
  const complaints = getFromStorage("complaints") || [];

  // Create new complaint
  const newComplaint = {
    id: generateId(),
    userId: user.id,
    userName: name,
    userEmail: email,
    title: title,
    category: category,
    description: description,
    status: "Pending",
    response: "",
    createdAt: Date.now(),
  };

  // Save complaint
  complaints.push(newComplaint);
  saveToStorage("complaints", complaints);

  // Show success message
  showMessage(
    "complaintMessage",
    "Complaint submitted successfully!",
    "success",
  );

  // Reset form
  document.getElementById("complaintForm").reset();

  // Reload complaints list
  loadUserComplaints();
  updateDashboardStats();
}

/**
 * Update the dashboard summary cards for the current user
 */
function updateDashboardStats() {
  const user = getFromStorage("currentUser");
  if (!user) return;

  const complaints = getFromStorage("complaints") || [];
  const userComplaints = complaints.filter((c) => c.userId === user.id);
  const pending = userComplaints.filter((c) => c.status === "Pending").length;
  const inProgress = userComplaints.filter(
    (c) => c.status === "In Progress",
  ).length;
  const resolved = userComplaints.filter((c) => c.status === "Resolved").length;

  const totalEl = document.getElementById("totalComplaintsCount");
  const pendingEl = document.getElementById("pendingComplaintsCount");
  const inProgressEl = document.getElementById("inProgressComplaintsCount");
  const resolvedEl = document.getElementById("resolvedComplaintsCount");
  const greetingEl = document.getElementById("dashboardGreeting");

  if (totalEl) totalEl.textContent = userComplaints.length;
  if (pendingEl) pendingEl.textContent = pending;
  if (inProgressEl) inProgressEl.textContent = inProgress;
  if (resolvedEl) resolvedEl.textContent = resolved;
  if (greetingEl) greetingEl.textContent = `Welcome back, ${user.name}!`;
}

/**
 * Load and display user's complaints
 */
function loadUserComplaints(searchTerm = "") {
  const user = getFromStorage("currentUser");
  if (!user) return;

  const complaints = getFromStorage("complaints") || [];
  const userComplaints = complaints.filter((c) => c.userId === user.id);

  // Filter by search term if provided
  const filteredComplaints = searchTerm
    ? userComplaints.filter(
        (c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : userComplaints;

  const container = document.getElementById("complaintsList");

  if (filteredComplaints.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <h3>No Complaints Found</h3>
                <p>${searchTerm ? "Try a different search term" : "Submit your first complaint using the form"}</p>
            </div>
        `;
    return;
  }

  // Sort by newest first
  filteredComplaints.sort((a, b) => b.createdAt - a.createdAt);

  // Generate HTML for each complaint
  container.innerHTML = filteredComplaints
    .map((complaint) => createComplaintCard(complaint, false))
    .join("");
}

/**
 * Create complaint card HTML
 */
function createComplaintCard(complaint, isAdmin = false) {
  const statusClass = getStatusClass(complaint.status);

  let responseHtml = "";
  if (complaint.response) {
    responseHtml = `
            <div class="complaint-response">
                <h4>� Admin Response</h4>
                <p>${complaint.response}</p>
            </div>
        `;
  }

  let actionsHtml = "";
  if (isAdmin) {
    actionsHtml = `
            <div class="complaint-actions">
                <button class="action-btn primary" onclick="openResponseModal('${complaint.id}')">
                    ✏️ Respond
                </button>
            </div>
        `;
  }

  return `
        <div class="complaint-card">
            <div class="complaint-card-header">
                <span class="complaint-id">${complaint.id}</span>
                <span class="complaint-status ${statusClass}">${complaint.status}</span>
            </div>
            <h3 class="complaint-title">${complaint.title}</h3>
            <div class="complaint-meta">
                <span>👤 ${complaint.userName}</span>
                <span>📧 ${complaint.userEmail}</span>
                <span>📂 ${complaint.category}</span>
            </div>
            <p class="complaint-description">${complaint.description}</p>
            ${responseHtml}
            ${actionsHtml}
            <div class="complaint-timestamp">
                📅 Submitted: ${formatDate(complaint.createdAt)}
            </div>
        </div>
    `;
}

/**
 * Get status CSS class
 */
function getStatusClass(status) {
  switch (status) {
    case "Pending":
      return "status-pending";
    case "In Progress":
      return "status-in-progress";
    case "Resolved":
      return "status-resolved";
    default:
      return "status-pending";
  }
}

/**
 * Setup user search functionality
 */
function setupUserSearch() {
  const searchInput = document.getElementById("userSearchInput");
  let searchTimeout;

  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadUserComplaints(e.target.value.trim());
    }, 300);
  });
}

// ========================================
// Admin Dashboard Functions
// ========================================

/**
 * Initialize admin dashboard
 */
function initAdminDashboard() {
  const user = checkAuth("admin");
  if (!user) return;

  // Display admin name and avatar
  document.getElementById("adminNameDisplay").textContent = user.name;
  document.getElementById("adminAvatar").textContent = "A";

  // Load all complaints
  loadAdminComplaints();

  // Setup filters
  setupFilters();

  // Setup search
  setupAdminSearch();

  // Setup modal
  setupModal();

  // Setup logout
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
}

/**
 * Load and display all complaints for admin
 */
function loadAdminComplaints(filters = {}) {
  const complaints = getFromStorage("complaints") || [];

  // Apply filters
  let filteredComplaints = complaints;

  if (filters.status) {
    filteredComplaints = filteredComplaints.filter(
      (c) => c.status === filters.status,
    );
  }

  if (filters.category) {
    filteredComplaints = filteredComplaints.filter(
      (c) => c.category === filters.category,
    );
  }

  if (filters.search) {
    const search = filters.search.toLowerCase();
    filteredComplaints = filteredComplaints.filter(
      (c) =>
        c.title.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search) ||
        c.userName.toLowerCase().includes(search) ||
        c.id.toLowerCase().includes(search),
    );
  }

  const container = document.getElementById("adminComplaintsList");

  if (filteredComplaints.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <h3>No Complaints Found</h3>
                <p>${Object.keys(filters).length > 0 ? "Try adjusting your filters" : "No complaints have been submitted yet"}</p>
            </div>
        `;
    return;
  }

  // Sort by newest first
  filteredComplaints.sort((a, b) => b.createdAt - a.createdAt);

  // Generate HTML for each complaint
  container.innerHTML = filteredComplaints
    .map((complaint) => createComplaintCard(complaint, true))
    .join("");
}

/**
 * Setup filter functionality
 */
function setupFilters() {
  const statusFilter = document.getElementById("statusFilter");
  const categoryFilter = document.getElementById("categoryFilter");

  const applyFilters = () => {
    loadAdminComplaints({
      status: statusFilter.value,
      category: categoryFilter.value,
      search: document.getElementById("adminSearchInput").value.trim(),
    });
  };

  statusFilter.addEventListener("change", applyFilters);
  categoryFilter.addEventListener("change", applyFilters);
}

/**
 * Setup admin search functionality
 */
function setupAdminSearch() {
  const searchInput = document.getElementById("adminSearchInput");
  let searchTimeout;

  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadAdminComplaints({
        status: document.getElementById("statusFilter").value,
        category: document.getElementById("categoryFilter").value,
        search: e.target.value.trim(),
      });
    }, 300);
  });
}

/**
 * Setup response modal
 */
function setupModal() {
  const modal = document.getElementById("responseModal");
  const closeBtn = document.getElementById("closeModal");
  const submitBtn = document.getElementById("submitResponse");

  // Close modal
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Close on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  // Submit response
  submitBtn.addEventListener("click", submitResponse);
}

/**
 * Open response modal for a complaint
 */
function openResponseModal(complaintId) {
  const complaints = getFromStorage("complaints") || [];
  const complaint = complaints.find((c) => c.id === complaintId);

  if (!complaint) return;

  // Store current complaint ID
  window.currentComplaintId = complaintId;

  // Populate modal
  document.getElementById("modalComplaintId").textContent = complaint.id;
  document.getElementById("modalComplaintTitle").textContent = complaint.title;
  document.getElementById("modalComplaintUser").textContent =
    complaint.userName;
  document.getElementById("modalComplaintCategory").textContent =
    complaint.category;
  document.getElementById("statusSelect").value = complaint.status;
  document.getElementById("adminResponse").value = complaint.response || "";

  // Show modal
  document.getElementById("responseModal").classList.remove("hidden");
}

/**
 * Submit response to a complaint
 */
function submitResponse() {
  const complaintId = window.currentComplaintId;
  if (!complaintId) return;

  const newStatus = document.getElementById("statusSelect").value;
  const response = document.getElementById("adminResponse").value.trim();

  // Get complaints
  const complaints = getFromStorage("complaints") || [];

  // Find and update complaint
  const index = complaints.findIndex((c) => c.id === complaintId);
  if (index !== -1) {
    complaints[index].status = newStatus;
    complaints[index].response = response;

    // Save updated complaints
    saveToStorage("complaints", complaints);

    // Close modal
    document.getElementById("responseModal").classList.add("hidden");

    // Reload complaints list
    loadAdminComplaints();
  }
}

// ========================================
// Initialize Based on Current Page
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("index.html") || path.endsWith("/")) {
    // Auth page
    document
      .getElementById("loginForm")
      .addEventListener("submit", handleLogin);
    document
      .getElementById("registerForm")
      .addEventListener("submit", handleRegister);
    document
      .getElementById("loginBtn")
      .addEventListener("click", () => toggleAuthForm("login"));
    document
      .getElementById("registerBtn")
      .addEventListener("click", () => toggleAuthForm("register"));
  } else if (path.includes("user.html")) {
    // User dashboard
    initUserDashboard();
  } else if (path.includes("admin.html")) {
    // Admin dashboard
    initAdminDashboard();
  }
});

// Make functions available globally for inline onclick handlers
window.openResponseModal = openResponseModal;



function generateId() {
  return (
    "CMPLT-" +
    Date.now() +
    "-" +
    Math.random().toString(36).substr(2, 9).toUpperCase()
  );
}

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

function getFromStorage(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

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



function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  
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

  const users = getFromStorage("users") || [];
  const user = users.find(
    (u) => u.email === email && u.password === password && u.role === "user",
  );

  if (user) {
    saveToStorage("currentUser", user);
    window.location.href = "user.html";
  } else {
    showMessage("loginMessage", "Invalid credentials!", "error");
  }
}

function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById(
    "registerConfirmPassword",
  ).value;

  if (password !== confirmPassword) {
    showMessage("registerMessage", "Passwords do not match!", "error");
    return;
  }

  const users = getFromStorage("users") || [];

  if (users.some((u) => u.email === email)) {
    showMessage("registerMessage", "Email already registered!", "error");
    return;
  }

  const newUser = {
    id: generateId(),
    name: name,
    email: email,
    password: password,
    role: "user",
    createdAt: Date.now(),
  };

  users.push(newUser);
  saveToStorage("users", users);

  showMessage(
    "registerMessage",
    "Registration successful! Please login.",
    "success",
  );

  document.getElementById("registerForm").reset();

  setTimeout(() => {
    document.getElementById("loginBtn").click();
  }, 1500);
}

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

function checkAuth(requiredRole) {
  const currentUser = getFromStorage("currentUser");

  if (!currentUser) {
    window.location.href = "index.html";
    return null;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    if (currentUser.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "user.html";
    }
    return null;
  }

  return currentUser;
}

function handleLogout() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}



function initUserDashboard() {
  const user = checkAuth("user");
  if (!user) return;

  document.getElementById("userNameDisplay").textContent = user.name;
  document.getElementById("userAvatar").textContent = user.name
    .charAt(0)
    .toUpperCase();

  setupSidebarNavigation();
  loadUserComplaints();
  updateDashboardStats();
  setupUserSearch();

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

  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
}

function setupSidebarNavigation() {
  const sidebarBtns = document.querySelectorAll(".sidebar-btn");

  sidebarBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.section;

      sidebarBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document
        .querySelectorAll(".content-section")
        .forEach((s) => s.classList.remove("active"));
      document.getElementById(`${section}Section`).classList.add("active");
    });
  });
}

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

  const complaints = getFromStorage("complaints") || [];

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

  complaints.push(newComplaint);
  saveToStorage("complaints", complaints);

  showMessage(
    "complaintMessage",
    "Complaint submitted successfully!",
    "success",
  );

  document.getElementById("complaintForm").reset();
  loadUserComplaints();
  updateDashboardStats();
}

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

function loadUserComplaints(searchTerm = "") {
  const user = getFromStorage("currentUser");
  if (!user) return;

  const complaints = getFromStorage("complaints") || [];
  const userComplaints = complaints.filter((c) => c.userId === user.id);

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

  filteredComplaints.sort((a, b) => b.createdAt - a.createdAt);

  container.innerHTML = filteredComplaints
    .map((complaint) => createComplaintCard(complaint, false))
    .join("");
}

function createComplaintCard(complaint, isAdmin = false) {
  const statusClass = getStatusClass(complaint.status);

  let responseHtml = "";
  if (complaint.response) {
    responseHtml = `
            <div class="complaint-response">
                <h4>&#x1F4AC; Admin Response</h4>
                <p>${complaint.response}</p>
            </div>
        `;
  }

  let actionsHtml = "";
  if (isAdmin) {
    actionsHtml = `
            <div class="complaint-actions">
                <button class="action-btn primary" onclick="openResponseModal('${complaint.id}')">
                    &#x270F; Respond
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
                <span>&#x1F464; ${complaint.userName}</span>
                <span>&#x1F4E7; ${complaint.userEmail}</span>
                <span>&#x1F4C2; ${complaint.category}</span>
            </div>
            <p class="complaint-description">${complaint.description}</p>
            ${responseHtml}
            ${actionsHtml}
            <div class="complaint-timestamp">
                &#x1F4C5; Submitted: ${formatDate(complaint.createdAt)}
            </div>
        </div>
    `;
}

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



function initAdminDashboard() {
  const user = checkAuth("admin");
  if (!user) return;

  document.getElementById("adminNameDisplay").textContent = user.name;
  document.getElementById("adminAvatar").textContent = "A";

  loadAdminComplaints();
  setupFilters();
  setupAdminSearch();
  setupModal();

  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
}

function loadAdminComplaints(filters = {}) {
  const complaints = getFromStorage("complaints") || [];

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

  filteredComplaints.sort((a, b) => b.createdAt - a.createdAt);

  container.innerHTML = filteredComplaints
    .map((complaint) => createComplaintCard(complaint, true))
    .join("");
}

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

function setupModal() {
  const modal = document.getElementById("responseModal");
  const closeBtn = document.getElementById("closeModal");
  const submitBtn = document.getElementById("submitResponse");

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  submitBtn.addEventListener("click", submitResponse);
}

function openResponseModal(complaintId) {
  const complaints = getFromStorage("complaints") || [];
  const complaint = complaints.find((c) => c.id === complaintId);

  if (!complaint) return;

  window.currentComplaintId = complaintId;

  document.getElementById("modalComplaintId").textContent = complaint.id;
  document.getElementById("modalComplaintTitle").textContent = complaint.title;
  document.getElementById("modalComplaintUser").textContent = complaint.userName;
  document.getElementById("modalComplaintCategory").textContent = complaint.category;
  document.getElementById("statusSelect").value = complaint.status;
  document.getElementById("adminResponse").value = complaint.response || "";

  document.getElementById("responseModal").classList.remove("hidden");
}

function submitResponse() {
  const complaintId = window.currentComplaintId;
  if (!complaintId) return;

  const newStatus = document.getElementById("statusSelect").value;
  const response = document.getElementById("adminResponse").value.trim();

  const complaints = getFromStorage("complaints") || [];
  const index = complaints.findIndex((c) => c.id === complaintId);

  if (index !== -1) {
    complaints[index].status = newStatus;
    complaints[index].response = response;

    saveToStorage("complaints", complaints);
    document.getElementById("responseModal").classList.add("hidden");
    loadAdminComplaints();
  }
}



document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("index.html") || path.endsWith("/")) {
    document.getElementById("loginForm").addEventListener("submit", handleLogin);
    document.getElementById("registerForm").addEventListener("submit", handleRegister);
    document.getElementById("loginBtn").addEventListener("click", () => toggleAuthForm("login"));
    document.getElementById("registerBtn").addEventListener("click", () => toggleAuthForm("register"));
  } else if (path.includes("user.html")) {
    initUserDashboard();
  } else if (path.includes("admin.html")) {
    initAdminDashboard();
  }
});

window.openResponseModal = openResponseModal;
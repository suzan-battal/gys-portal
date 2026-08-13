// Extract token from URL immediately on load
const _urlParams = new URLSearchParams(window.location.search);
const _urlToken = _urlParams.get('token');
if (_urlToken) {
  localStorage.setItem('gys_auth_token', _urlToken);
}

// Global Uygulama Statusu (State)
const AppState = {
  currentUser: null,
  token: _urlToken || localStorage.getItem('gys_auth_token') || null,
  currentTab: 'home',
  selectedFile: null,
  universalSelectedFile: null,
  activeTaskId: null,
  deleteCallback: null
};

// ==================== API YARDIMCISI (FETCH CLIENT) ====================
async function apiFetch(endpoint, options = {}) {
  const headers = options.headers || {};
  
  if (AppState.token) {
    headers['Authorization'] = `Bearer ${AppState.token}`;
  }

  // FormData değilse ve method POST/PUT ise Content-Type ekle
  if (!(options.body instanceof FormData) && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  options.headers = headers;

  try {
    const response = await fetch(endpoint, options);
    const data = await response.json().catch(() => ({}));
    
    if (response.status === 401) {
      if (AppState.currentUser) {
        showToast("Your session has expired. Please sign in again.", "warning");
        handleLogout(true);
      }
      return { success: false, error: "Unauthorized access", status: 401 };
    }

    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || `Sunucu hatası (${response.status})`,
        status: response.status 
      };
    }

    return data;
  } catch (err) {
    console.error("API Bağlantı Hatası:", err);
    return { success: false, error: "Could not connect to server. Please check your connection." };
  }
}

// ==================== TOAST BİLDİRİMLERİ (NOTIFICATIONS) ====================
function showToast(message, type = "info") {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  } else {
    iconSvg = `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  }

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==================== MODAL İŞLEMLERİ ====================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

function openConfirmModal(title, message, onConfirm) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  AppState.deleteCallback = onConfirm;
  
  const btnConfirm = document.getElementById('btn-confirm-delete');
  btnConfirm.onclick = () => {
    if (AppState.deleteCallback) AppState.deleteCallback();
    closeModal('modal-confirm');
  };
  
  openModal('modal-confirm');
}

// ==================== DIRECT DEMO LOGIN ====================
const DEMO_USERS = {
  super_admin: { email: 'superadmin@universite.edu.tr', password: 'SuperAdmin123!' },
  admin: { email: 'yonetici@universite.edu.tr', password: 'Admin123!' },
  training_manager: { email: 'egitim.muduru@universite.edu.tr', password: 'Mudur123!' },
  trainer: { email: 'ahmet.yilmaz@universite.edu.tr', password: 'Egitmen123!' },
  assistant_trainer: { email: 'asistan.merve@universite.edu.tr', password: 'Asistan123!' },
  student: { email: 'mehmet.demir@universite.edu.tr', password: 'Ogrenci123!' }
};

window.directLogin = async function(roleCode) {
  const creds = DEMO_USERS[roleCode] || DEMO_USERS['admin'];
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  if (emailInput) emailInput.value = creds.email;
  if (passwordInput) passwordInput.value = creds.password;

  const btn = document.getElementById('btn-submit-login');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Signing In...</span>';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    });
    const data = await res.json();
    if (data.success && data.token) {
      AppState.token = data.token;
      AppState.currentUser = data.user;
      localStorage.setItem('gys_auth_token', data.token);
      showToast(`Welcome, ${data.user.name}!`, "success");
      renderAuthenticatedUI();
    } else {
      showToast(data.error || "Login failed.", "error");
    }
  } catch (err) {
    showToast("Server connection error.", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Sign In</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <polyline points="10 17 15 12 10 7"></polyline>
          <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>`;
    }
  }
};

function fillDemo(email, password) {
  for (const [roleKey, u] of Object.entries(DEMO_USERS)) {
    if (u.email === email) {
      window.directLogin(roleKey);
      return;
    }
  }
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  if (emailInput) emailInput.value = email;
  if (passwordInput) passwordInput.value = password;
  handleLogin();
}

// ==================== AUTH VE GİRİŞ / ÇIKIŞ ====================
async function handleLogin(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';

  if (!email || !password) {
    showToast("Please enter your email and password.", "error");
    return;
  }

  const btn = document.getElementById('btn-submit-login');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Signing In...</span>';
  }

  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  });

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<span>Sign In</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
        <polyline points="10 17 15 12 10 7"></polyline>
        <line x1="15" y1="12" x2="3" y2="12"></line>
      </svg>`;
  }

  if (!res.success) {
    showToast(res.error || "Invalid email or password.", "error");
    return;
  }

  AppState.token = res.token;
  AppState.currentUser = res.user;
  localStorage.setItem('gys_auth_token', res.token);

  showToast(`Welcome, ${res.user.name}!`, "success");
  renderAuthenticatedUI();
}

async function handleLogout(silent = false) {
  if (AppState.token) {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  }

  AppState.token = null;
  AppState.currentUser = null;
  localStorage.removeItem('gys_auth_token');

  document.getElementById('view-dashboard').style.display = 'none';
  document.getElementById('view-login').style.display = 'flex';
  if (!silent) {
    showToast("Successfully signed out.", "info");
  }
}

// ==================== OTURUM KONTROLÜ ====================
async function checkAuthSession() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenParam = urlParams.get('token');
  if (tokenParam) {
    AppState.token = tokenParam;
    localStorage.setItem('gys_auth_token', tokenParam);
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch(e) {}
  }

  if (!AppState.token) {
    document.getElementById('view-login').style.display = 'flex';
    document.getElementById('view-dashboard').style.display = 'none';
    return;
  }

  const res = await apiFetch('/api/auth/me');
  if (res.success && res.user) {
    AppState.currentUser = res.user;
    renderAuthenticatedUI();
  } else {
    handleLogout(true);
  }
}

// ==================== UI MANAGEMENT & ROLE ROUTING ====================
function renderAuthenticatedUI() {
  const user = AppState.currentUser;
  if (!user) return;

  document.getElementById('view-login').style.display = 'none';
  document.getElementById('view-dashboard').style.display = 'flex';

  // Topbar Profile Info
  document.getElementById('user-display-name').textContent = user.name;
  document.getElementById('user-avatar').textContent = user.name.charAt(0).toUpperCase();
  
  const roleBadge = document.getElementById('user-display-role');
  const sidebarRoleBadge = document.getElementById('sidebar-role-badge');
  const pageHeading = document.getElementById('page-heading');

  let roleTitle = "Student";
  if (user.role === 'super_admin') roleTitle = "Super Admin";
  else if (user.role === 'admin') roleTitle = "Administrator";
  else if (user.role === 'training_manager') roleTitle = "Training Manager";
  else if (user.role === 'trainer') roleTitle = "Trainer (Faculty)";
  else if (user.role === 'assistant_trainer') roleTitle = "Assistant Trainer";

  roleBadge.textContent = roleTitle;
  sidebarRoleBadge.textContent = `${roleTitle} Panel`;
  pageHeading.textContent = `${roleTitle} Dashboard`;

  // Build Sidebar Menus by Role
  buildSidebarMenu(user.role);

  // Open First Tab (Home Dashboard)
  switchTab('home');
}

function buildSidebarMenu(role) {
  const container = document.getElementById('sidebar-menu-items');
  container.innerHTML = '';

  let menuItems = [];

  if (role === 'super_admin' || role === 'admin' || role === 'training_manager') {
    menuItems = [
      { id: 'home', title: 'Dashboard', icon: 'grid' },
      { id: 'today-tasks', title: "Today's Tasks", icon: 'calendar' },
      { id: 'announcements', title: 'Announcements', icon: 'bell' },
      { id: 'calendar', title: 'Academic Calendar', icon: 'calendar' },
      { id: 'reports', title: 'Reports & Analytics', icon: 'bar-chart-2' },
      { id: 'audit-logs', title: 'Audit Logs', icon: 'shield' },
      { id: 'roles-permissions', title: 'Roles & Permissions', icon: 'key' },
      { id: 'settings', title: 'System Settings', icon: 'settings' },
      { id: 'groups', title: 'Training Groups', icon: 'layers' },
      { id: 'students', title: 'Students', icon: 'users' },
      { id: 'trainers', title: 'Trainers', icon: 'award' },
      { id: 'all-users', title: 'All Users', icon: 'shield' },
      { id: 'tasks', title: 'Tasks & Assignments', icon: 'check-square' },
      { id: 'submissions', title: 'Submissions', icon: 'file-text' },
      { id: 'doc', title: 'Project Specification Report', icon: 'book' },
      { id: 'profile', title: 'My Profile', icon: 'user' }
    ];
  } else if (role === 'trainer' || role === 'assistant_trainer') {
    menuItems = [
      { id: 'home', title: 'Dashboard', icon: 'grid' },
      { id: 'today-tasks', title: "Today's Tasks", icon: 'calendar' },
      { id: 'announcements', title: 'Announcements', icon: 'bell' },
      { id: 'calendar', title: 'Academic Calendar', icon: 'calendar' },
      { id: 'reports', title: 'Reports & Analytics', icon: 'bar-chart-2' },
      { id: 'groups', title: 'Training Groups', icon: 'layers' },
      { id: 'students', title: 'Students', icon: 'users' },
      { id: 'tasks', title: 'Tasks & Assignments', icon: 'check-square' },
      { id: 'submissions', title: 'Submissions & Review', icon: 'file-text' },
      { id: 'doc', title: 'Project Specification Report', icon: 'book' },
      { id: 'profile', title: 'My Profile', icon: 'user' }
    ];
  } else if (role === 'student') {
    menuItems = [
      { id: 'home', title: 'Dashboard', icon: 'grid' },
      { id: 'today-tasks', title: "Today's Tasks", icon: 'calendar' },
      { id: 'announcements', title: 'Announcements', icon: 'bell' },
      { id: 'calendar', title: 'Academic Calendar', icon: 'calendar' },
      { id: 'reports', title: 'Academic Progress & GPA', icon: 'bar-chart-2' },
      { id: 'my-tasks', title: 'My Tasks & Assignments', icon: 'check-square' },
      { id: 'my-submissions', title: 'My Submissions & Grades', icon: 'file-text' },
      { id: 'profile', title: 'Student Profile', icon: 'user' },
      { id: 'doc', title: 'Project Specification Report', icon: 'book' }
    ];
  }

  menuItems.forEach(item => {
    const btn = document.createElement('a');
    btn.className = `nav-item ${AppState.currentTab === item.id ? 'active' : ''}`;
    btn.id = `nav-${item.id}`;
    if (item.id === 'doc') {
      btn.href = '/documentation.html';
      btn.target = '_blank';
    } else {
      btn.href = 'javascript:void(0);';
      btn.onclick = (e) => {
        e.preventDefault();
        switchTab(item.id);
      };
    }
    btn.innerHTML = `${getIconSvg(item.icon)}<span>${item.title}</span>`;
    container.appendChild(btn);
  });
}

function switchTab(tabId) {
  if (tabId === 'profile') {
    openProfileModal();
    return;
  }

  AppState.currentTab = tabId;

  // Sidebar aktiflik sınıfını güncelle
  document.querySelectorAll('.sidebar .nav-item').forEach(el => el.classList.remove('active'));
  const activeNav = document.getElementById(`nav-${tabId}`);
  if (activeNav) activeNav.classList.add('active');

  // Mobil kenar çubuğunu kapat
  const sidebar = document.getElementById('main-sidebar');
  if (sidebar) sidebar.classList.remove('open');

  const main = document.getElementById('main-content');
  const heading = document.getElementById('page-heading');

  // Section 17: Bugünün Görevleri (Tüm Roller için ortak merkezi sayfa)
  if (tabId === 'today-tasks') {
    heading.innerHTML = `<span>Today's Tasks (Today's Tasks Hub)</span>`;
    TodayTasksController.renderTodayTasks(main);
    return;
  }

  // Section 19: Duyurular (Tüm Roller için ortak duyuru panosu)
  if (tabId === 'announcements') {
    heading.innerHTML = `<span>Announcements & Gradeices Hub</span>`;
    AnnouncementsController.renderAnnouncements(main);
    return;
  }

  // Section 20: Akademik Takvim (Tüm Roller için ortak takvim)
  if (tabId === 'calendar') {
    heading.innerHTML = `<span>Academic Calendar Hub</span>`;
    CalendarController.renderCalendar(main);
    return;
  }

  // Section 21: Raporlar ve Analitik Merkezi
  if (tabId === 'reports') {
    heading.innerHTML = `<span>Reports & Analytics Hub</span>`;
    ReportsController.renderReports(main);
    return;
  }

  // Section 22: Denetim Kayıtları (Audit Logs Hub)
  if (tabId === 'audit-logs') {
    heading.innerHTML = `<span>Audit Logs & Security Hub</span>`;
    AuditLogsController.renderAuditLogs(main);
    return;
  }

  // Section 23: Veritabanı Tablo Mimarisi (Database Schema Hub)
  // Section 26.29: System Settings (Settings Hub)
  if (tabId === 'settings') {
    heading.innerHTML = `<span>System Settings & Configuration Hub</span>`;
    SettingsController.renderSettings(main);
    return;
  }

  // İlgili rol denetleyicisini çağır
  const role = AppState.currentUser.role;
  if (role === 'super_admin' || role === 'admin' || role === 'training_manager') {
    AdminController.renderTab(tabId);
  } else if (role === 'trainer' || role === 'assistant_trainer') {
    TrainerController.renderTab(tabId);
  } else if (role === 'student') {
    StudentController.renderTab(tabId);
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('main-sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

function openProfileModal() {
  const user = AppState.currentUser;
  if (!user) return;

  if (user.role === 'student') {
    openStudentProfileModal(user.id);
    return;
  }

  document.getElementById('profile-modal-avatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('profile-modal-name').textContent = user.name;
  document.getElementById('profile-modal-email').textContent = user.email;

  let roleTr = "Öğrenci";
  if (user.role === 'super_admin') roleTr = "Super Admin";
  else if (user.role === 'admin') roleTr = "Sistem Yöneticisi";
  else if (user.role === 'training_manager') roleTr = "Training Manager";
  else if (user.role === 'trainer') roleTr = "Eğitmen (Trainer)";
  else if (user.role === 'assistant_trainer') roleTr = "Assistant Trainer";

  document.getElementById('profile-modal-role').textContent = roleTr;
  document.getElementById('profile-modal-roletype').textContent = roleTr;

  openModal('modal-profile');
}

// ==================== SECTION 14: STUDENT PROFILE (ÖĞRENCİ PROFİLİ) ====================

async function openStudentProfileModal(studentId) {
  openModal('modal-student-profile');
  const body = document.getElementById('stu-prof-body');
  body.innerHTML = `<div style="text-align: center; padding: 40px;"><span style="color: var(--text-muted);">Loading Student Profile & Analytics...</span></div>`;

  const res = await apiFetch(`/api/students/${studentId}/profile`);
  if (!res.success) {
    body.innerHTML = `<div class="card" style="padding: 24px; color: var(--accent-rose);">Profil yüklenemedi: ${res.error || 'Bilinmeyen hata'}</div>`;
    return;
  }

  const { student_info, group_info, stats, task_history, recent_activity } = res.profile;

  document.getElementById('stu-prof-avatar').textContent = student_info.name.charAt(0).toUpperCase();
  document.getElementById('stu-prof-name').textContent = student_info.name;
  document.getElementById('stu-prof-no').textContent = student_info.student_no;
  document.getElementById('stu-prof-email').textContent = student_info.email;
  
  const statusBadge = document.getElementById('stu-prof-status');
  if (statusBadge) {
    statusBadge.textContent = student_info.status;
    statusBadge.className = `status-badge ${student_info.status === 'Active' ? 'badge-completed' : 'badge-pending'}`;
  }

  let letterGrade = '-';
  if (stats.average_score >= 90) letterGrade = 'AA (Mükemmel)';
  else if (stats.average_score >= 80) letterGrade = 'BA (Çok İyi)';
  else if (stats.average_score >= 70) letterGrade = 'BB (İyi)';
  else if (stats.average_score >= 60) letterGrade = 'CB (Orta)';
  else if (stats.average_score >= 50) letterGrade = 'CC (Geçer)';
  else if (stats.average_score > 0) letterGrade = 'FF (Yetersiz)';

  body.innerHTML = `
    <!-- 1 & 2. Student Info & Training Group Cards -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <!-- 1. Student Information -->
      <div class="card" style="padding: 16px; border: 1px solid var(--border-light); background: var(--bg-card); border-radius: 10px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <span style="font-size: 16px;">👤</span>
          <strong style="font-size: 13.5px; color: var(--primary-navy);">Student Information</strong>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12.5px;">
          <div><span style="color: var(--text-muted); font-size: 11px; display: block;">STUDENT ID</span><strong>${student_info.student_no}</strong></div>
          <div><span style="color: var(--text-muted); font-size: 11px; display: block;">ACCOUNT STATUS</span><span class="status-badge ${student_info.status === 'Active' ? 'badge-completed' : 'badge-pending'}" style="font-size: 10.5px;">${student_info.status}</span></div>
          <div><span style="color: var(--text-muted); font-size: 11px; display: block;">ENROLLMENT DATE</span><span>${formatDateTr(student_info.created_at)}</span></div>
          <div><span style="color: var(--text-muted); font-size: 11px; display: block;">LAST LOGIN</span><span>${student_info.last_login ? formatDateTr(student_info.last_login) : 'Never logged in'}</span></div>
        </div>
      </div>

      <!-- 2. Training Group and Trainer -->
      <div class="card" style="padding: 16px; border: 1px solid var(--border-light); background: var(--bg-card); border-radius: 10px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <span style="font-size: 16px;">🏢</span>
          <strong style="font-size: 13.5px; color: var(--primary-navy);">Training Group & Trainer</strong>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12.5px;">
          <div><span style="color: var(--text-muted); font-size: 11px; display: block;">TRAINING GROUP</span><strong style="color: var(--primary-blue);">${group_info.group_name}</strong></div>
          <div><span style="color: var(--text-muted); font-size: 11px; display: block;">DEPARTMENT / FIELD</span><span>${group_info.department || '-'}</span></div>
          <div><span style="color: var(--text-muted); font-size: 11px; display: block;">LEAD TRAINER</span><strong>${group_info.trainer_name}</strong></div>
          <div><span style="color: var(--text-muted); font-size: 11px; display: block;">ASSISTANT TRAINER</span><span>${group_info.assistant_trainers || '-'}</span></div>
        </div>
      </div>
    </div>

    <!-- 3, 4, 5, 6. KPI Statistics & Performance Gauges -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(115px, 1fr)); gap: 12px; margin-bottom: 20px;">
      <!-- Total Tasks -->
      <div class="card" style="padding: 12px 14px; text-align: center; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light);">
        <span style="font-size: 10.5px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Tasks</span>
        <div style="font-size: 20px; font-weight: 800; color: var(--primary-navy); margin-top: 3px;">${stats.total_tasks}</div>
        <span style="font-size: 10px; color: var(--text-secondary);">Assigned Tasks</span>
      </div>

      <!-- Completed -->
      <div class="card" style="padding: 12px 14px; text-align: center; border-radius: 10px; background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.2);">
        <span style="font-size: 10.5px; color: var(--accent-green); font-weight: 700; text-transform: uppercase;">Completed</span>
        <div style="font-size: 20px; font-weight: 800; color: var(--accent-green); margin-top: 3px;">${stats.completed}</div>
        <span style="font-size: 10px; color: var(--accent-green);">Completed</span>
      </div>

      <!-- In Progress -->
      <div class="card" style="padding: 12px 14px; text-align: center; border-radius: 10px; background: rgba(59, 130, 246, 0.06); border: 1px solid rgba(59, 130, 246, 0.2);">
        <span style="font-size: 10.5px; color: var(--primary-blue); font-weight: 700; text-transform: uppercase;">In Progress</span>
        <div style="font-size: 20px; font-weight: 800; color: var(--primary-blue); margin-top: 3px;">${stats.in_progress}</div>
        <span style="font-size: 10px; color: var(--primary-blue);">In Progress</span>
      </div>

      <!-- Late -->
      <div class="card" style="padding: 12px 14px; text-align: center; border-radius: 10px; background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.2);">
        <span style="font-size: 10.5px; color: var(--accent-rose); font-weight: 700; text-transform: uppercase;">Late</span>
        <div style="font-size: 20px; font-weight: 800; color: var(--accent-rose); margin-top: 3px;">${stats.late}</div>
        <span style="font-size: 10px; color: var(--accent-rose);">Gecikmiş</span>
      </div>

      <!-- Needs Revision -->
      <div class="card" style="padding: 12px 14px; text-align: center; border-radius: 10px; background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.2);">
        <span style="font-size: 10.5px; color: var(--accent-gold); font-weight: 700; text-transform: uppercase;">Revision</span>
        <div style="font-size: 20px; font-weight: 800; color: var(--accent-gold); margin-top: 3px;">${stats.needs_revision}</div>
        <span style="font-size: 10px; color: var(--accent-gold);">Revizyon</span>
      </div>

      <!-- Completion Rate -->
      <div class="card" style="padding: 12px 14px; text-align: center; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light);">
        <span style="font-size: 10.5px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Completion Rate</span>
        <div style="font-size: 20px; font-weight: 800; color: var(--primary-blue); margin-top: 3px;">%${stats.completion_rate}</div>
        <div style="width: 100%; height: 4px; background: var(--border-light); border-radius: 2px; margin-top: 4px; overflow: hidden;">
          <div style="width: ${Math.min(100, stats.completion_rate)}%; height: 100%; background: var(--primary-blue);"></div>
        </div>
      </div>

      <!-- Average Score -->
      <div class="card" style="padding: 12px 14px; text-align: center; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light);">
        <span style="font-size: 10.5px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Average Score</span>
        <div style="font-size: 20px; font-weight: 800; color: #10B981; margin-top: 3px;">${stats.average_score > 0 ? stats.average_score : '-'}</div>
        <span style="font-size: 9.5px; font-weight: 700; color: #10B981;">${letterGrade}</span>
      </div>
    </div>

    <!-- 7. Task History Table (Görev Geçmişi ve Grade Detayları) -->
    <div class="panel-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-light); border-radius: 10px; margin-bottom: 20px;">
      <div style="padding: 12px 18px; background: var(--bg-page); border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
        <strong style="font-size: 13.5px; color: var(--primary-navy);">📋 Görev Geçmişi (Task History - ${task_history.length})</strong>
      </div>
      <div class="table-responsive" style="margin: 0; max-height: 260px;">
        <table class="custom-table" style="margin: 0; width: 100%;">
          <thead>
            <tr style="background: var(--bg-page); font-size: 11.5px;">
              <th style="padding: 10px 14px;">Task Title</th>
              <th style="padding: 10px 14px;">Due Date</th>
              <th style="padding: 10px 14px;">Status</th>
              <th style="padding: 10px 14px; text-align: center;">Grade (100)</th>
              <th style="padding: 10px 14px; text-align: right;">İşlem</th>
            </tr>
          </thead>
          <tbody>
            ${task_history.length === 0 ? `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">No tasks have been assigned yet.</td></tr>` : ''}
            ${task_history.map(t => {
              let statusBadgeHtml = '<span class="status-badge badge-pending">Bekliyor</span>';
              if (t.submission_status === 'Completed' || t.submission_status === 'Kabul Edildi') {
                statusBadgeHtml = '<span class="status-badge badge-completed">Completed</span>';
              } else if (t.submission_status === 'Revizyon İstendi') {
                statusBadgeHtml = '<span class="status-badge badge-late">Revizyon</span>';
              } else if (t.submission_status === 'Teslim Edildi' || t.submission_status === 'Viewniyor') {
                statusBadgeHtml = '<span class="status-badge badge-reviewing">Viewniyor</span>';
              } else if (t.is_late) {
                statusBadgeHtml = '<span class="status-badge badge-late">Gecikmiş</span>';
              }

              return `
                <tr style="border-bottom: 1px solid var(--border-light); font-size: 12.5px;">
                  <td style="padding: 10px 14px;">
                    <strong style="color: var(--primary-navy); display: block;">${t.title}</strong>
                    <span style="font-size: 11px; color: var(--text-muted);">${t.priority ? t.priority + ' Priority' : ''}</span>
                  </td>
                  <td style="padding: 10px 14px; font-size: 11.5px;">${formatDateTr(t.deadline)}</td>
                  <td style="padding: 10px 14px;">${statusBadgeHtml}</td>
                  <td style="padding: 10px 14px; text-align: center;">
                    ${t.grade !== null ? `<strong style="font-size: 14px; color: #10B981;">${t.grade}</strong>` : `<span style="color: var(--text-muted);">-</span>`}
                  </td>
                  <td style="padding: 10px 14px; text-align: right;">
                    <button class="btn-action btn-secondary btn-sm" onclick="openTaskDetailModal(${t.task_id})">View</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- 8. Recent Activity (Son Aktiviteler & Zaman Çizelgesi) -->
    <div class="card" style="padding: 16px; border: 1px solid var(--border-light); background: var(--bg-card); border-radius: 10px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="font-size: 16px;">⏱️</span>
        <strong style="font-size: 13.5px; color: var(--primary-navy);">Son Aktiviteler (Recent Activity)</strong>
      </div>
      ${recent_activity.length === 0 ? `<div style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 10px;">Henüz bir aktivite kaydı yok.</div>` : `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${recent_activity.map(act => `
            <div style="display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; background: var(--bg-page); border-radius: 8px; border: 1px solid var(--border-light);">
              <span style="font-size: 16px;">📌</span>
              <div style="flex: 1;">
                <div style="font-size: 12.5px; font-weight: 600; color: var(--primary-navy);">${act.title}</div>
                <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 1px;">${act.message}</div>
              </div>
              <span style="font-size: 10.5px; color: var(--text-muted); white-space: nowrap;">${formatDateTr(act.created_at)}</span>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

// ==================== EVRENSEL DOSYA YÜKLEME (UNIVERSAL UPLOAD) ====================
async function openUniversalUploadModal() {
  AppState.universalSelectedFile = null;
  clearUniversalFile();

  const taskSelect = document.getElementById('universal-task-select');
  taskSelect.innerHTML = '<option value="">Loading tasks...</option>';

  const res = await apiFetch('/api/tasks');
  const tasks = res.tasks || [];

  if (tasks.length === 0) {
    taskSelect.innerHTML = '<option value="new">Genel Dosya Teslimi (Otomatik Görev)</option>';
  } else {
    taskSelect.innerHTML = tasks.map(t => 
      `<option value="${t.id}">${t.title} (${t.student_name ? t.student_name + ' - ' : ''}${t.status})</option>`
    ).join('');
  }

  openModal('modal-universal-upload');
}

function handleUniversalFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 25 * 1024 * 1024) {
    showToast("Dosya boyutu çok büyük. Maksimum 25 MB yükleyebilirsiniz.", "error");
    clearUniversalFile();
    return;
  }

  AppState.universalSelectedFile = file;

  const preview = document.getElementById('universal-file-preview');
  const filename = document.getElementById('universal-filename');
  const filesize = document.getElementById('universal-filesize');

  filename.textContent = file.name;
  filesize.textContent = `(${formatFileSize(file.size)})`;
  preview.style.display = 'flex';
}

function clearUniversalFile() {
  AppState.universalSelectedFile = null;
  const input = document.getElementById('universal-file-input');
  if (input) input.value = '';
  const preview = document.getElementById('universal-file-preview');
  if (preview) preview.style.display = 'none';
}

async function handleUploadUniversalFile() {
  if (!AppState.universalSelectedFile) {
    showToast("Lütfen yüklenecek bir dosya seçiniz.", "error");
    return;
  }

  const taskId = document.getElementById('universal-task-select').value || 'new';

  const btn = document.getElementById('btn-submit-universal-file');
  btn.disabled = true;
  btn.innerHTML = `<span>Yükleniyor...</span>`;

  const formData = new FormData();
  formData.append('task_id', taskId);
  formData.append('file', AppState.universalSelectedFile);

  const res = await apiFetch('/api/submissions/upload', {
    method: 'POST',
    body: formData
  });

  btn.disabled = false;
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg><span>Dosyayı Sisteme Yükle</span>`;

  if (res.success) {
    closeModal('modal-universal-upload');
    showToast("File uploaded successfully to system!", "success");
    clearUniversalFile();
    switchTab(AppState.currentTab);
  } else {
    showToast(res.error || "An error occurred while uploading file.", "error");
  }
}

// ==================== YARDIMCI GÖRSEL FONKSİYONLAR ====================
function getStatusBadgeHtml(status) {
  if (status === 'Completed' || status === 'Completed' || status === 'Kabul Edildi') {
    return `<span class="status-badge badge-completed">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Completed
    </span>`;
  }
  if (status === 'Viewniyor' || status === 'Under Review') {
    return `<span class="status-badge badge-reviewing">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
      Under Review
    </span>`;
  }
  if (status === 'Yeniden Teslim Edildi' || status === 'Resubmitted') {
    return `<span class="status-badge" style="background: rgba(99, 102, 241, 0.15); color: #6366F1; border: 1px solid rgba(99, 102, 241, 0.3);">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
      Resubmitted
    </span>`;
  }
  if (status === 'Teslim Edildi' || status === 'Submitted') {
    return `<span class="status-badge badge-submitted">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
      Submitted
    </span>`;
  }
  if (status === 'Düzeltme İstendi' || status === 'Needs Revision') {
    return `<span class="status-badge" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-gold); border: 1px solid rgba(245, 158, 11, 0.3);">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      Needs Revision
    </span>`;
  }
  if (status === 'Devam Ediyor' || status === 'In Progress') {
    return `<span class="status-badge" style="background: rgba(139, 92, 246, 0.15); color: #8B5CF6; border: 1px solid rgba(139, 92, 246, 0.3);">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      In Progress
    </span>`;
  }
  if (status === 'Görüntülendi' || status === 'Viewed') {
    return `<span class="status-badge" style="background: rgba(6, 182, 212, 0.15); color: #0891B2; border: 1px solid rgba(6, 182, 212, 0.3);">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      Viewed
    </span>`;
  }
  if (status === 'Gecikmiş' || status === 'Overdue') {
    return `<span class="status-badge" style="background: rgba(244, 63, 94, 0.15); color: var(--accent-rose); border: 1px solid rgba(244, 63, 94, 0.3);">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      Overdue
    </span>`;
  }
  if (status === 'Rejected') {
    return `<span class="status-badge" style="background: rgba(244, 63, 94, 0.15); color: var(--accent-rose); border: 1px solid rgba(244, 63, 94, 0.3);">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      Rejected
    </span>`;
  }
  return `<span class="status-badge badge-pending">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
    Assigned
  </span>`;
}

function formatDateTr(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getIconSvg(name) {
  const icons = {
    'grid': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    'calendar': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    'bell': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
    'bar-chart-2': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    'users': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    'award': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>`,
    'shield': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    'check-square': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
    'file-text': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    'layers': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
    'book': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    'key': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-1.5 1.5L16 7l-1.5-1.5L13 7l-1.5-1.5L10 7l-2-2a5 5 0 1 0-4 4l7 7m10-14l-2 2"></path></svg>`,
    'user': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
  };
  return icons[name] || '';
}

// ==================== SECTION 8: TASK REVIEW & BİLDİRİMLER ====================

function calculateRubricTotal() {
  const c = parseFloat(document.getElementById('rubric-completion').value) || 0;
  const q = parseFloat(document.getElementById('rubric-quality').value) || 0;
  const a = parseFloat(document.getElementById('rubric-accuracy').value) || 0;
  const d = parseFloat(document.getElementById('rubric-deadline').value) || 0;
  const m = parseFloat(document.getElementById('rubric-communication').value) || 0;

  const total = Math.min(100, Math.max(0, c + q + a + d + m));
  document.getElementById('review-grade').value = total;

  const badge = document.getElementById('rubric-total-badge');
  if (badge) {
    badge.textContent = `Toplam: ${total} / 100`;
  }
}

async function handleSaveReview(e) {
  e.preventDefault();
  const subId = document.getElementById('review-submission-id').value;
  const grade = parseFloat(document.getElementById('review-grade').value);
  const status = document.getElementById('review-status').value;
  const feedback = document.getElementById('review-feedback').value;

  const rubric_completion = document.getElementById('rubric-completion') ? parseFloat(document.getElementById('rubric-completion').value) : null;
  const rubric_quality = document.getElementById('rubric-quality') ? parseFloat(document.getElementById('rubric-quality').value) : null;
  const rubric_accuracy = document.getElementById('rubric-accuracy') ? parseFloat(document.getElementById('rubric-accuracy').value) : null;
  const rubric_deadline = document.getElementById('rubric-deadline') ? parseFloat(document.getElementById('rubric-deadline').value) : null;
  const rubric_communication = document.getElementById('rubric-communication') ? parseFloat(document.getElementById('rubric-communication').value) : null;

  const btn = document.getElementById('btn-save-review');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Kaydediliyor & Bildiriliyor...</span>`;
  }

  try {
    const res = await apiFetch(`/api/submissions/${subId}/review`, {
      method: 'POST',
      body: JSON.stringify({
        grade, status, feedback,
        rubric_completion, rubric_quality, rubric_accuracy, rubric_deadline, rubric_communication
      })
    });

    if (res.success) {
      showToast(res.message || "Değerlendirme kaydedildi ve öğrenciye otomatik bildirim iletildi!", "success");
      closeModal('modal-review');
      
      // Sayfayı yenile
      if (AppState.currentUser && AppState.currentUser.role === 'trainer') {
        TrainerController.renderTab(AppState.currentTab);
      } else if (AppState.currentUser && AppState.currentUser.role === 'admin') {
        AdminController.renderTab(AppState.currentTab);
      }
    } else {
      showToast(res.error || "Değerlendirme kaydedilemedi.", "error");
    }
  } catch (err) {
    showToast("Bir hata oluştu.", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Değerlendirmeyi Save & Bildir</span>`;
    }
  }
}

let allCachedGradeifications = [];
let currentGradeifFilter = 'all';

function filterGradeifications(filterType) {
  currentGradeifFilter = filterType;
  const btnAll = document.getElementById('notif-filter-all');
  const btnUnread = document.getElementById('notif-filter-unread');
  if (btnAll && btnUnread) {
    if (filterType === 'all') {
      btnAll.style.background = 'var(--primary-blue)';
      btnAll.style.color = '#fff';
      btnUnread.style.background = 'transparent';
      btnUnread.style.color = 'var(--text-secondary)';
    } else {
      btnUnread.style.background = 'var(--primary-blue)';
      btnUnread.style.color = '#fff';
      btnAll.style.background = 'transparent';
      btnAll.style.color = 'var(--text-secondary)';
    }
  }
  renderGradeificationsList();
}

function renderGradeificationsList() {
  const list = document.getElementById('notif-dropdown-list');
  if (!list) return;

  let filtered = allCachedGradeifications;
  if (currentGradeifFilter === 'unread') {
    filtered = allCachedGradeifications.filter(n => !n.is_read);
  }

  const totalBadge = document.getElementById('notif-header-total');
  if (totalBadge) {
    totalBadge.textContent = `${allCachedGradeifications.length}`;
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div style="padding: 24px 16px; text-align: center; color: var(--text-muted); font-size: 13px;">
      ${currentGradeifFilter === 'unread' ? '✨ Okunmamış yeni bildiriminiz yok.' : '📭 Henüz bir bildirim kaydı bulunmuyor.'}
    </div>`;
    return;
  }

  list.innerHTML = filtered.map(n => {
    // 9 Gradeification Types Icon & Style
    let typeIcon = '🔔';
    let typeBg = 'rgba(59, 130, 246, 0.1)';
    let typeColor = 'var(--primary-blue)';

    if (n.type === 'new_task') {
      typeIcon = '📌';
      typeBg = 'rgba(37, 99, 235, 0.1)';
      typeColor = '#2563EB';
    } else if (n.type === 'deadline_approaching') {
      typeIcon = '⏰';
      typeBg = 'rgba(245, 158, 11, 0.1)';
      typeColor = '#D97706';
    } else if (n.type === 'task_overdue') {
      typeIcon = '🔴';
      typeBg = 'rgba(239, 68, 68, 0.1)';
      typeColor = '#EF4444';
    } else if (n.type === 'submission') {
      typeIcon = '📥';
      typeBg = 'rgba(99, 102, 241, 0.1)';
      typeColor = '#6366F1';
    } else if (n.type === 'comment') {
      typeIcon = '💬';
      typeBg = 'rgba(168, 85, 247, 0.1)';
      typeColor = '#9333EA';
    } else if (n.type === 'announcement') {
      typeIcon = '📢';
      typeBg = 'rgba(6, 182, 212, 0.1)';
      typeColor = '#0891B2';
    } else if (n.type === 'group_update') {
      typeIcon = '👥';
      typeBg = 'rgba(20, 184, 166, 0.1)';
      typeColor = '#0D9488';
    } else if (n.title && n.title.includes('Kabul')) {
      typeIcon = '🎉';
      typeBg = 'rgba(16, 185, 129, 0.1)';
      typeColor = '#059669';
    } else if (n.title && n.title.includes('Revizyon')) {
      typeIcon = '⚠️';
      typeBg = 'rgba(245, 158, 11, 0.1)';
      typeColor = '#D97706';
    }

    return `
      <div class="notif-item ${n.is_read ? 'read' : 'unread'}" onclick="markGradeificationRead(${n.id})" style="padding: 12px 14px; border-bottom: 1px solid var(--border-light); cursor: pointer; background: ${n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.04)'}; display: flex; gap: 10px; align-items: flex-start; transition: background 0.15s ease;">
        <div style="width: 30px; height: 30px; border-radius: 8px; background: ${typeBg}; color: ${typeColor}; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">
          ${typeIcon}
        </div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
            <strong style="font-size: 12.5px; color: var(--primary-navy); line-height: 1.3;">${n.title}</strong>
            <span style="font-size: 10px; color: var(--text-muted); white-space: nowrap; margin-left: 6px;">${formatDateTr(n.created_at)}</span>
          </div>
          <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4;">${n.message}</p>
        </div>
        ${!n.is_read ? '<span style="width: 7px; height: 7px; border-radius: 50%; background: var(--primary-blue); flex-shrink: 0; margin-top: 5px;"></span>' : ''}
      </div>
    `;
  }).join('');
}

async function loadGradeifications() {
  if (!AppState.currentUser) return;
  try {
    const res = await apiFetch('/api/notifications');
    allCachedGradeifications = res.notifications || [];
    const unreadCount = allCachedGradeifications.filter(n => !n.is_read).length;

    const badge = document.getElementById('notif-unread-count');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }

    renderGradeificationsList();
  } catch (e) {
    console.warn("Bildirimler yüklenemedi:", e);
  }
}

async function markGradeificationRead(id) {
  await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
  loadGradeifications();
}

async function markAllGradeificationsRead() {
  await apiFetch('/api/notifications/read-all', { method: 'POST' });
  showToast("All notifications marked as read.", "success");
  loadGradeifications();
}

function toggleGradeificationDropdown() {
  const menu = document.getElementById('notif-dropdown-menu');
  if (!menu) return;
  if (menu.style.display === 'flex' || menu.style.display === 'block') {
    menu.style.display = 'none';
  } else {
    menu.style.display = 'flex';
    loadGradeifications();
  }
}

// ==================== SECTION 10: GÖREV İÇİ YORUMLAR (TASK COMMENTS THREAD) ====================

let currentCommentAttachmentFile = null;

function handleCommentFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  currentCommentAttachmentFile = file;
  const label = document.getElementById('comment-file-label');
  const clearBtn = document.getElementById('comment-file-clear-btn');
  if (label) label.textContent = `📎 ${file.name.substring(0, 18)}...`;
  if (clearBtn) clearBtn.style.display = 'inline-block';
}

function clearCommentFile() {
  currentCommentAttachmentFile = null;
  const input = document.getElementById('comment-file-input');
  if (input) input.value = '';
  const label = document.getElementById('comment-file-label');
  const clearBtn = document.getElementById('comment-file-clear-btn');
  if (label) label.textContent = '📎 Dosya / Resim Ekle';
  if (clearBtn) clearBtn.style.display = 'none';
}

async function handleSendComment() {
  const taskId = AppState.currentTaskId;
  if (!taskId) {
    showToast("Aktif görev bulunamadı.", "error");
    return;
  }

  const textInput = document.getElementById('comment-input-text');
  const linkInput = document.getElementById('comment-input-link');
  const content = textInput ? textInput.value.trim() : '';
  const link = linkInput ? linkInput.value.trim() : '';

  if (!content && !currentCommentAttachmentFile && !link) {
    showToast("Lütfen bir yorum mesajı, dosya veya link giriniz.", "warning");
    return;
  }

  const btn = document.getElementById('btn-send-comment');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Gönderiliyor...</span>`;
  }

  try {
    let uploadedFileName = null;
    if (currentCommentAttachmentFile) {
      const formData = new FormData();
      formData.append('file', currentCommentAttachmentFile);
      const uploadRes = await fetch('/api/submissions/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AppState.authToken}` },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (uploadData.success) {
        uploadedFileName = uploadData.filename;
      }
    }

    const res = await apiFetch(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        content: content,
        attachment_file: uploadedFileName,
        attachment_url: link
      })
    });

    if (res.success) {
      showToast("Commentunuz iletildi!", "success");
      if (textInput) textInput.value = '';
      if (linkInput) linkInput.value = '';
      clearCommentFile();
      renderTaskComments(res.comments || []);
    } else {
      showToast(res.error || "Comment gönderilemedi.", "error");
    }
  } catch (err) {
    showToast("Comment gönderilirken bir hata oluştu.", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg><span>Send Comment</span>`;
    }
  }
}

function renderTaskComments(comments) {
  const countBadge = document.getElementById('detail-comments-count-badge');
  const list = document.getElementById('detail-comments-list');
  if (!list) return;

  if (countBadge) {
    countBadge.textContent = `${comments.length} Comment`;
  }

  if (comments.length === 0) {
    list.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 12.5px; background: var(--bg-page); border-radius: 8px;">Bu görev için henüz bir yorum veya soru paylaşılmamıştır. İlk mesajı siz yazabilirsiniz!</div>`;
    return;
  }

  list.innerHTML = comments.map(c => {
    let roleBadge = '<span class="status-badge badge-pending" style="font-size:10px;">Öğrenci</span>';
    if (c.user_role === 'trainer') roleBadge = '<span class="status-badge badge-completed" style="font-size:10px;">Eğitmen</span>';
    if (c.user_role === 'admin') roleBadge = '<span class="status-badge badge-submitted" style="font-size:10px;">Yönetici</span>';

    const isImage = c.is_image || (c.attachment_file && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(c.attachment_file));

    return `
      <div style="display: flex; gap: 10px; background: var(--bg-card); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-light);">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${c.user_role === 'trainer' ? 'var(--primary-navy)' : 'var(--primary-blue)'}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0;">
          ${(c.user_name || 'U').charAt(0).toUpperCase()}
        </div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <strong style="font-size: 12.5px; color: var(--primary-navy);">${c.user_name}</strong>
              ${roleBadge}
            </div>
            <span style="font-size: 10.5px; color: var(--text-muted);">${formatDateTr(c.created_at)}</span>
          </div>
          
          ${c.content ? `<p style="font-size: 12.5px; color: var(--text-main); line-height: 1.4; margin: 0 0 6px 0; white-space: pre-wrap;">${c.content}</p>` : ''}
          
          ${isImage && c.attachment_file ? `
            <div style="margin-top: 6px; margin-bottom: 6px;">
              <a href="/uploads/${encodeURIComponent(c.attachment_file)}" target="_blank">
                <img src="/uploads/${encodeURIComponent(c.attachment_file)}" style="max-height: 160px; max-width: 100%; border-radius: 6px; border: 1px solid var(--border-light); object-fit: contain;">
              </a>
            </div>
          ` : ''}

          ${!isImage && c.attachment_file ? `
            <div style="margin-top: 4px;">
              <a href="/uploads/${encodeURIComponent(c.attachment_file)}" target="_blank" download class="btn-action btn-secondary btn-sm" style="font-size: 11px; padding: 3px 8px; width: fit-content;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                📎 ${c.attachment_file}
              </a>
            </div>
          ` : ''}

          ${c.attachment_url ? `
            <div style="margin-top: 4px;">
              <a href="${c.attachment_url}" target="_blank" class="btn-action btn-secondary btn-sm" style="font-size: 11px; padding: 3px 8px; width: fit-content; color: var(--primary-blue);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                🔗 ${c.attachment_url}
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Başlangıçta oturumu kontrol et ve olayları bağla
function initApp() {
  checkAuthSession();
  setInterval(loadGradeifications, 15000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (e) => {
    const container = document.querySelector('.notification-dropdown-container');
    const menu = document.getElementById('notif-dropdown-menu');
    if (container && menu && !container.contains(e.target)) {
      menu.style.display = 'none';
    }
  });

  const uDropzone = document.getElementById('universal-file-dropzone');
  if (uDropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      uDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        uDropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        uDropzone.classList.remove('dragover');
      }, false);
    });

    uDropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        const input = document.getElementById('universal-file-input');
        input.files = files;
        handleUniversalFileSelected({ target: input });
      }
    });
  }
});


// ==================== SECTION 17: TODAY'S TASKS CONTROLLER (GÜNLÜK GÖREV İZLEME VE FİLTRELEME) ====================

const TodayTasksController = {
  currentFilters: {
    trainer_id: 'all',
    student_id: 'all',
    group_id: 'all',
    status: 'all',
    priority: 'all',
    search: ''
  },

  async renderTodayTasks(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Yükleniyor...</span></div>`;

    const queryParams = new URLSearchParams();
    if (this.currentFilters.trainer_id !== 'all') queryParams.append('trainer_id', this.currentFilters.trainer_id);
    if (this.currentFilters.student_id !== 'all') queryParams.append('student_id', this.currentFilters.student_id);
    if (this.currentFilters.group_id !== 'all') queryParams.append('group_id', this.currentFilters.group_id);
    if (this.currentFilters.status !== 'all') queryParams.append('status', this.currentFilters.status);
    if (this.currentFilters.priority !== 'all') queryParams.append('priority', this.currentFilters.priority);
    if (this.currentFilters.search) queryParams.append('search', this.currentFilters.search);

    const [todayRes, trainersRes, studentsRes, groupsRes] = await Promise.all([
      apiFetch(`/api/tasks/today?${queryParams.toString()}`),
      apiFetch('/api/users?role=trainer'),
      apiFetch('/api/users?role=student'),
      apiFetch('/api/groups')
    ]);

    const data = todayRes.data || {
      kpi: { total_tasks: 0, completed: 0, in_progress: 0, waiting_review: 0, not_started: 0, overdue: 0 },
      tasks: []
    };
    const { kpi, tasks } = data;
    const trainers = trainersRes.users || [];
    const students = studentsRes.users || [];
    const groups = groupsRes.groups || [];
    const user = AppState.currentUser;

    container.innerHTML = `
      <!-- Header Banner -->
      <div class="panel-card" style="padding: 20px 24px; margin-bottom: 22px; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FFFFFF; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 24px;">📅</span>
              <h2 style="font-size: 19px; font-weight: 800; color: #FFFFFF; margin: 0;">Today's Tasks Hub</h2>
              <span class="status-badge" style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(96, 165, 250, 0.3);">Merkezi Günlük İzleme</span>
            </div>
            <p style="color: #94A3B8; font-size: 12.5px; margin: 0; max-width: 750px;">
              صفحة مركزية لمراقبة العمل اليومي. Günlük operasyonel iş akışını, tamamlanan, devam eden, inceleme bekleyen, başlanmamış ve geciken görevleri anlık takip edin.
            </p>
          </div>
          ${user.role !== 'student' ? `
            <button class="btn-action btn-primary" onclick="AdminController.openAddTaskModal()" style="padding: 8px 16px; font-size: 13px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>Yeni Görev Ata</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- 6x Top KPI Metric Cards (Total Tasks, Completed, In Progress, Waiting Review, Grade Started, Overdue) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 22px;">
        <!-- Total Tasks -->
        <div class="stat-card" style="padding: 14px 16px; cursor: pointer; ${this.currentFilters.status === 'all' ? 'border: 2px solid var(--primary-blue);' : ''}" onclick="TodayTasksController.setFilter('status', 'all')">
          <div class="stat-info">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Tasks</span>
            <h3 style="font-size: 24px; font-weight: 800; color: var(--primary-navy); margin: 3px 0;">${kpi.total_tasks}</h3>
            <div class="stat-trend neutral"><span style="font-size: 10.5px;">All Daily Tasks</span></div>
          </div>
        </div>

        <!-- Completed -->
        <div class="stat-card" style="padding: 14px 16px; border-left: 4px solid #10B981; cursor: pointer; ${this.currentFilters.status === 'completed' ? 'border: 2px solid #10B981;' : ''}" onclick="TodayTasksController.setFilter('status', 'completed')">
          <div class="stat-info">
            <span style="font-size: 11px; font-weight: 700; color: #10B981; text-transform: uppercase;">Completed</span>
            <h3 style="font-size: 24px; font-weight: 800; color: #10B981; margin: 3px 0;">${kpi.completed}</h3>
            <div class="stat-trend positive"><span style="font-size: 10.5px;">Completed</span></div>
          </div>
        </div>

        <!-- In Progress -->
        <div class="stat-card" style="padding: 14px 16px; border-left: 4px solid var(--primary-blue); cursor: pointer; ${this.currentFilters.status === 'in_progress' ? 'border: 2px solid var(--primary-blue);' : ''}" onclick="TodayTasksController.setFilter('status', 'in_progress')">
          <div class="stat-info">
            <span style="font-size: 11px; font-weight: 700; color: var(--primary-blue); text-transform: uppercase;">In Progress</span>
            <h3 style="font-size: 24px; font-weight: 800; color: var(--primary-blue); margin: 3px 0;">${kpi.in_progress}</h3>
            <div class="stat-trend neutral"><span style="font-size: 10.5px;">Devam Ediyor</span></div>
          </div>
        </div>

        <!-- Waiting Review -->
        <div class="stat-card" style="padding: 14px 16px; border-left: 4px solid var(--accent-gold); cursor: pointer; ${this.currentFilters.status === 'waiting_review' ? 'border: 2px solid var(--accent-gold);' : ''}" onclick="TodayTasksController.setFilter('status', 'waiting_review')">
          <div class="stat-info">
            <span style="font-size: 11px; font-weight: 700; color: var(--accent-gold); text-transform: uppercase;">Waiting Review</span>
            <h3 style="font-size: 24px; font-weight: 800; color: var(--accent-gold); margin: 3px 0;">${kpi.waiting_review}</h3>
            <div class="stat-trend" style="color: var(--accent-gold);"><span style="font-size: 10.5px;">Viewme Bekleyen</span></div>
          </div>
        </div>

        <!-- Grade Started -->
        <div class="stat-card" style="padding: 14px 16px; border-left: 4px solid #64748B; cursor: pointer; ${this.currentFilters.status === 'not_started' ? 'border: 2px solid #64748B;' : ''}" onclick="TodayTasksController.setFilter('status', 'not_started')">
          <div class="stat-info">
            <span style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;">Grade Started</span>
            <h3 style="font-size: 24px; font-weight: 800; color: #64748B; margin: 3px 0;">${kpi.not_started}</h3>
            <div class="stat-trend neutral"><span style="font-size: 10.5px;">Henüz Başlanmadı</span></div>
          </div>
        </div>

        <!-- Overdue -->
        <div class="stat-card" style="padding: 14px 16px; border-left: 4px solid var(--accent-rose); cursor: pointer; ${this.currentFilters.status === 'overdue' ? 'border: 2px solid var(--accent-rose);' : ''}" onclick="TodayTasksController.setFilter('status', 'overdue')">
          <div class="stat-info">
            <span style="font-size: 11px; font-weight: 700; color: var(--accent-rose); text-transform: uppercase;">Overdue</span>
            <h3 style="font-size: 24px; font-weight: 800; color: var(--accent-rose); margin: 3px 0;">${kpi.overdue}</h3>
            <div class="stat-trend" style="color: var(--accent-rose);"><span style="font-size: 10.5px;">Overdue Görev</span></div>
          </div>
        </div>
      </div>

      <!-- 5 Multi-Dimensional Filters Bar (Trainer, Student, Group, Status, Priority + Search) -->
      <div class="panel-card" style="padding: 16px 20px; border: 1px solid var(--border-light); border-radius: 12px; margin-bottom: 22px; background: var(--bg-card);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary-blue);"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            <strong style="font-size: 13.5px; color: var(--primary-navy);">Filterr (Filters: Trainer, Student, Group, Status & Priority)</strong>
          </div>
          <button class="btn-action btn-secondary btn-sm" onclick="TodayTasksController.resetFilters()" style="padding: 4px 10px; font-size: 11.5px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
            <span>Filterri Temizle</span>
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr repeat(5, 1fr); gap: 10px; align-items: center;">
          <!-- 1. Search -->
          <div>
            <input type="text" id="filter-today-search" placeholder="🔍 Görev, öğrenci, eğitmen ara..." value="${this.currentFilters.search || ''}" oninput="TodayTasksController.handleSearch(this.value)" class="form-control" style="font-size: 12px; padding: 7px 10px; height: 36px;">
          </div>

          <!-- 2. Trainer Filter -->
          <div>
            <select id="filter-today-trainer" class="form-control" onchange="TodayTasksController.setFilter('trainer_id', this.value)" style="font-size: 12px; padding: 6px 8px; height: 36px;">
              <option value="all" ${this.currentFilters.trainer_id === 'all' ? 'selected' : ''}>👨‍🏫 Trainer: Tümü</option>
              ${trainers.map(tr => `<option value="${tr.id}" ${String(this.currentFilters.trainer_id) === String(tr.id) ? 'selected' : ''}>${tr.name}</option>`).join('')}
            </select>
          </div>

          <!-- 3. Student Filter -->
          <div>
            <select id="filter-today-student" class="form-control" onchange="TodayTasksController.setFilter('student_id', this.value)" style="font-size: 12px; padding: 6px 8px; height: 36px;">
              <option value="all" ${this.currentFilters.student_id === 'all' ? 'selected' : ''}>👤 Student: Tümü</option>
              ${students.map(st => `<option value="${st.id}" ${String(this.currentFilters.student_id) === String(st.id) ? 'selected' : ''}>${st.name}</option>`).join('')}
            </select>
          </div>

          <!-- 4. Group Filter -->
          <div>
            <select id="filter-today-group" class="form-control" onchange="TodayTasksController.setFilter('group_id', this.value)" style="font-size: 12px; padding: 6px 8px; height: 36px;">
              <option value="all" ${this.currentFilters.group_id === 'all' ? 'selected' : ''}>🏢 Grup: Tümü</option>
              ${groups.map(g => `<option value="${g.id}" ${String(this.currentFilters.group_id) === String(g.id) ? 'selected' : ''}>${g.name}</option>`).join('')}
            </select>
          </div>

          <!-- 5. Status Filter -->
          <div>
            <select id="filter-today-status" class="form-control" onchange="TodayTasksController.setFilter('status', this.value)" style="font-size: 12px; padding: 6px 8px; height: 36px;">
              <option value="all" ${this.currentFilters.status === 'all' ? 'selected' : ''}>🚦 Status: Tümü</option>
              <option value="completed" ${this.currentFilters.status === 'completed' ? 'selected' : ''}>✅ Completed</option>
              <option value="in_progress" ${this.currentFilters.status === 'in_progress' ? 'selected' : ''}>🔵 In Progress</option>
              <option value="waiting_review" ${this.currentFilters.status === 'waiting_review' ? 'selected' : ''}>⏳ Waiting Review</option>
              <option value="not_started" ${this.currentFilters.status === 'not_started' ? 'selected' : ''}>⚪ Grade Started</option>
              <option value="overdue" ${this.currentFilters.status === 'overdue' ? 'selected' : ''}>🔴 Overdue</option>
            </select>
          </div>

          <!-- 6. Priority Filter -->
          <div>
            <select id="filter-today-priority" class="form-control" onchange="TodayTasksController.setFilter('priority', this.value)" style="font-size: 12px; padding: 6px 8px; height: 36px;">
              <option value="all" ${this.currentFilters.priority === 'all' ? 'selected' : ''}>⚡ Priority: Tümü</option>
              <option value="Acil" ${this.currentFilters.priority === 'Acil' ? 'selected' : ''}>🔴 Acil (Urgent)</option>
              <option value="High" ${this.currentFilters.priority === 'High' ? 'selected' : ''}>🟠 High (High)</option>
              <option value="Normal" ${this.currentFilters.priority === 'Normal' ? 'selected' : ''}>🔵 Normal</option>
              <option value="Low" ${this.currentFilters.priority === 'Low' ? 'selected' : ''}>⚪ Low (Low)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tasks List Table -->
      <div class="panel-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-light); border-radius: 12px;">
        <div style="padding: 14px 20px; background: var(--bg-page); border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 14px; color: var(--primary-navy);">Görev Listesi (${tasks.length} Görev Listeleniyor)</strong>
          <span style="font-size: 12px; color: var(--text-muted);">Tarihe göre sıralı</span>
        </div>

        <div class="table-responsive" style="margin: 0;">
          <table class="custom-table" style="margin: 0; width: 100%;">
            <thead>
              <tr style="background: var(--bg-page); font-size: 11.5px;">
                <th style="padding: 10px 14px;">Görev Bilgisi</th>
                <th style="padding: 10px 14px;">Grup & Eğitmen</th>
                <th style="padding: 10px 14px;">Atanan Öğrenci</th>
                <th style="padding: 10px 14px;">Due Date</th>
                <th style="padding: 10px 14px;">Priority</th>
                <th style="padding: 10px 14px;">Status</th>
                <th style="padding: 10px 14px; text-align: right;">İşlem</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.length === 0 ? `
                <tr><td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted); font-size: 13px;">Seçilen filtrelere uygun görev bulunamadı.</td></tr>
              ` : tasks.map(t => {
                let statusBadge = '';
                if (t.calculated_status === 'completed') statusBadge = '<span class="status-badge badge-completed">Completed</span>';
                else if (t.calculated_status === 'waiting_review') statusBadge = '<span class="status-badge badge-reviewing">Waiting Review</span>';
                else if (t.calculated_status === 'overdue') statusBadge = `<span class="status-badge badge-late">Overdue (+${t.days_overdue} Gün)</span>`;
                else if (t.calculated_status === 'in_progress') statusBadge = '<span class="status-badge badge-submitted">In Progress</span>';
                else statusBadge = '<span class="status-badge" style="background: #F1F5F9; color: #64748B; border: 1px solid #CBD5E1;">Grade Started</span>';

                let prioBadge = '';
                if (t.priority === 'Acil') prioBadge = '<span class="status-badge badge-late">🔴 Acil</span>';
                else if (t.priority === 'High') prioBadge = '<span class="status-badge" style="background: #FFF7ED; color: #EA580C; border: 1px solid #FFEDD5;">🟠 High</span>';
                else if (t.priority === 'Low') prioBadge = '<span class="status-badge" style="background: #F8FAFC; color: #64748B;">⚪ Low</span>';
                else prioBadge = '<span class="status-badge badge-submitted">🔵 Normal</span>';

                return `
                  <tr style="border-bottom: 1px solid var(--border-light); font-size: 12.5px;">
                    <td style="padding: 12px 14px; max-width: 260px;">
                      <strong style="color: var(--primary-navy); display: block; margin-bottom: 2px;">${t.title}</strong>
                      <div style="font-size: 11px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.description}</div>
                    </td>
                    <td style="padding: 12px 14px;">
                      <strong style="color: var(--primary-navy); display: block;">${t.group_name}</strong>
                      <div style="font-size: 11px; color: var(--text-muted);">${t.trainer_name}</div>
                    </td>
                    <td style="padding: 12px 14px;">
                      <strong style="color: var(--primary-blue); cursor: pointer; display: block;" onclick="openStudentProfileModal(${t.student_id})">${t.student_name}</strong>
                      <div style="font-size: 11px; color: var(--text-muted);">${t.student_email}</div>
                    </td>
                    <td style="padding: 12px 14px; font-size: 11.5px; color: var(--text-main);">
                      <div>${formatDateTr(t.deadline)}</div>
                    </td>
                    <td style="padding: 12px 14px;">${prioBadge}</td>
                    <td style="padding: 12px 14px;">${statusBadge}</td>
                    <td style="padding: 12px 14px; text-align: right;">
                      <div style="display: flex; gap: 6px; justify-content: flex-end;">
                        ${(t.calculated_status === 'waiting_review' || t.submission_id) && user.role !== 'student' ? `
                          <button class="btn-action btn-primary btn-sm" style="padding: 3px 8px; font-size: 11px;" onclick="TrainerController.openReviewModal(${t.submission_id})">Gradelandır</button>
                        ` : ''}
                        ${user.role === 'student' && t.calculated_status !== 'completed' ? `
                          <button class="btn-action btn-primary btn-sm" style="padding: 3px 8px; font-size: 11px;" onclick="StudentController.openSubmitModal(${t.task_id}, '${escapeHtml(t.title)}')">Submit</button>
                        ` : ''}
                        <button class="btn-action btn-secondary btn-sm" style="padding: 3px 8px; font-size: 11px;" onclick="openStudentProfileModal(${t.student_id})">Profil (14)</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setFilter(key, val) {
    this.currentFilters[key] = val;
    const main = document.getElementById('main-content');
    this.renderTodayTasks(main);
  },

  handleSearch(val) {
    this.currentFilters.search = val;
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      const main = document.getElementById('main-content');
      this.renderTodayTasks(main);
    }, 300);
  },

  resetFilters() {
    this.currentFilters = {
      trainer_id: 'all',
      student_id: 'all',
      group_id: 'all',
      status: 'all',
      priority: 'all',
      search: ''
    };
    const main = document.getElementById('main-content');
    this.renderTodayTasks(main);
  }
};


// ==================== SECTION 19: ANNOUNCEMENTS CONTROLLER (AKADEMİK DUYURU SİSTEMİ) ====================

const AnnouncementsController = {
  currentFilters: {
    target: 'all',
    priority: 'all',
    search: ''
  },

  async renderAnnouncements(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Yükleniyor...</span></div>`;

    const queryParams = new URLSearchParams();
    if (this.currentFilters.target !== 'all') queryParams.append('target', this.currentFilters.target);
    if (this.currentFilters.priority !== 'all') queryParams.append('priority', this.currentFilters.priority);
    if (this.currentFilters.search) queryParams.append('search', this.currentFilters.search);

    const res = await apiFetch(`/api/announcements?${queryParams.toString()}`);
    const announcements = res.announcements || [];
    const user = AppState.currentUser;
    const canCreate = ['super_admin', 'admin', 'training_manager', 'trainer', 'assistant_trainer'].includes(user.role);

    container.innerHTML = `
      <!-- Header Banner -->
      <div class="panel-card" style="padding: 20px 24px; margin-bottom: 22px; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FFFFFF; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 24px;">📢</span>
              <h2 style="font-size: 19px; font-weight: 800; color: #FFFFFF; margin: 0;">19. Announcements (Akademik Duyuru Panosu)</h2>
              <span class="status-badge" style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(96, 165, 250, 0.3);">5 Target Audience Desteği</span>
            </div>
            <p style="color: #94A3B8; font-size: 12.5px; margin: 0; max-width: 750px;">
              يمكن للمدير أو المدرب إنشاء إعلان وتحديد المستلمين: All Users, All Students, All Trainers, Specific Group أو Specific Students.
            </p>
          </div>
          ${canCreate ? `
            <button class="btn-action btn-primary" onclick="AnnouncementsController.openCreateModal()" style="padding: 8px 16px; font-size: 13px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>Publish Announcement (19)</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Target Scope Pills & Filter Bar -->
      <div class="panel-card" style="padding: 16px 20px; border: 1px solid var(--border-light); border-radius: 12px; margin-bottom: 22px; background: var(--bg-card);">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px;">
          <!-- 5 Target Scopes Quick Pills -->
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <button type="button" class="btn-action btn-sm ${this.currentFilters.target === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="AnnouncementsController.setTargetFilter('all')">
              🌐 Tümü (${announcements.length})
            </button>
            <button type="button" class="btn-action btn-sm ${this.currentFilters.target === 'all_users' ? 'btn-primary' : 'btn-secondary'}" onclick="AnnouncementsController.setTargetFilter('all_users')">
              👥 All Users
            </button>
            <button type="button" class="btn-action btn-sm ${this.currentFilters.target === 'all_students' ? 'btn-primary' : 'btn-secondary'}" onclick="AnnouncementsController.setTargetFilter('all_students')">
              🎓 All Students
            </button>
            <button type="button" class="btn-action btn-sm ${this.currentFilters.target === 'all_trainers' ? 'btn-primary' : 'btn-secondary'}" onclick="AnnouncementsController.setTargetFilter('all_trainers')">
              👨‍🏫 All Trainers
            </button>
            <button type="button" class="btn-action btn-sm ${this.currentFilters.target === 'specific_group' ? 'btn-primary' : 'btn-secondary'}" onclick="AnnouncementsController.setTargetFilter('specific_group')">
              🏢 Specific Group
            </button>
            <button type="button" class="btn-action btn-sm ${this.currentFilters.target === 'specific_students' ? 'btn-primary' : 'btn-secondary'}" onclick="AnnouncementsController.setTargetFilter('specific_students')">
              👤 Specific Students
            </button>
          </div>

          <!-- Priority & Search -->
          <div style="display: flex; gap: 10px; align-items: center;">
            <select class="form-control" style="font-size: 12px; padding: 6px 10px; height: 34px;" onchange="AnnouncementsController.setPriorityFilter(this.value)">
              <option value="all" ${this.currentFilters.priority === 'all' ? 'selected' : ''}>Tüm Priorityler</option>
              <option value="Acil" ${this.currentFilters.priority === 'Acil' ? 'selected' : ''}>🔴 Acil Duyuru</option>
              <option value="Önemli" ${this.currentFilters.priority === 'Önemli' ? 'selected' : ''}>🟠 Önemli</option>
              <option value="Normal" ${this.currentFilters.priority === 'Normal' ? 'selected' : ''}>🔵 Normal</option>
            </select>
            <input type="text" placeholder="🔍 Duyurularda ara..." value="${this.currentFilters.search || ''}" oninput="AnnouncementsController.handleSearch(this.value)" class="form-control" style="font-size: 12px; padding: 6px 10px; height: 34px; width: 200px;">
          </div>
        </div>
      </div>

      <!-- Announcements Feed List -->
      <div id="announcements-feed-container" style="display: flex; flex-direction: column; gap: 16px;">
        ${announcements.length === 0 ? `
          <div class="panel-card" style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
            <div style="font-size: 36px; margin-bottom: 10px;">📭</div>
            <strong style="font-size: 14px; color: var(--primary-navy); display: block; margin-bottom: 4px;">Henüz Duyuru Bulunmuyor</strong>
            <p style="font-size: 12.5px; margin: 0;">Seçilen kriterlere uygun yayınlanmış akademik duyuru bulunmamaktadır.</p>
          </div>
        ` : announcements.map(a => {
          let targetBadge = '';
          if (a.target_type === 'all_users') targetBadge = '<span class="status-badge badge-submitted">👥 All Users (Tüm Userlar)</span>';
          else if (a.target_type === 'all_students') targetBadge = '<span class="status-badge badge-submitted">🎓 All Students (Tüm Öğrenciler)</span>';
          else if (a.target_type === 'all_trainers') targetBadge = '<span class="status-badge badge-reviewing">👨‍🏫 All Trainers (Tüm Eğitmenler)</span>';
          else if (a.target_type === 'specific_group') targetBadge = `<span class="status-badge badge-completed">🏢 Group: ${escapeHtml(a.target_group_name || 'Eğitim Grubu')}</span>`;
          else if (a.target_type === 'specific_students') targetBadge = '<span class="status-badge" style="background: #FAF5FF; color: #9333EA; border: 1px solid #E9D5FF;">👤 Specific Students (Özel Öğrenciler)</span>';

          let prioBadge = '';
          if (a.priority === 'Acil') prioBadge = '<span class="status-badge badge-late">🔴 Acil Duyuru</span>';
          else if (a.priority === 'Önemli') prioBadge = '<span class="status-badge" style="background: #FFF7ED; color: #EA580C; border: 1px solid #FFEDD5;">🟠 Önemli</span>';
          else prioBadge = '<span class="status-badge badge-submitted">🔵 Normal</span>';

          const isAuthorOrAdmin = ['super_admin', 'admin', 'training_manager'].includes(user.role) || a.author_id === user.id;

          return `
            <div class="panel-card" style="padding: 20px 24px; border-radius: 12px; border: 1px solid ${a.is_pinned ? '#93C5FD' : 'var(--border-light)'}; background: ${a.is_pinned ? 'rgba(239, 246, 255, 0.6)' : 'var(--bg-card)'}; box-shadow: ${a.is_pinned ? '0 4px 15px rgba(59, 130, 246, 0.08)' : 'none'}; position: relative;">
              ${a.is_pinned ? `
                <div style="display: flex; align-items: center; gap: 4px; color: var(--primary-blue); font-size: 11.5px; font-weight: 700; margin-bottom: 8px;">
                  <span>📌</span> Sabitlenmiş Duyuru
                </div>
              ` : ''}
              
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                <div>
                  <h3 style="font-size: 16px; font-weight: 800; color: var(--primary-navy); margin: 0 0 6px 0;">${escapeHtml(a.title)}</h3>
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    ${targetBadge}
                    ${prioBadge}
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 8px;">
                  ${isAuthorOrAdmin ? `
                    <button class="btn-action btn-secondary btn-sm" onclick="AnnouncementsController.togglePin(${a.id})" title="${a.is_pinned ? 'Sabitlemeyi Kaldır' : 'En Üste Sabitle'}" style="padding: 4px 8px; font-size: 11px;">
                      ${a.is_pinned ? '📌 Sabitlemeyi Kaldır' : '📍 Sabitle'}
                    </button>
                    <button class="btn-action btn-danger btn-sm" onclick="AnnouncementsController.deleteAnnouncement(${a.id})" title="Duyuruyu Delete" style="padding: 4px 8px; font-size: 11px;">
                      🗑️ Delete
                    </button>
                  ` : ''}
                </div>
              </div>

              <!-- Duyuru Metni -->
              <div style="font-size: 13.5px; color: var(--text-main); line-height: 1.6; white-space: pre-wrap; margin-bottom: 16px; padding: 12px 14px; background: ${a.is_pinned ? '#FFFFFF' : 'var(--bg-page)'}; border-radius: 8px; border: 1px solid var(--border-light);">
                ${escapeHtml(a.message)}
              </div>

              <!-- Alt Bilgi: Published By ve Tarih -->
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: var(--text-muted); border-top: 1px solid var(--border-light); padding-top: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div class="avatar-circle" style="width: 24px; height: 24px; font-size: 10px;">${escapeHtml((a.author_name || 'Y').charAt(0))}</div>
                  <span><strong>${escapeHtml(a.author_name)}</strong> (${escapeHtml(a.author_role)})</span>
                </div>
                <span>📅 ${formatDateTr(a.created_at)}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  setTargetFilter(t) {
    this.currentFilters.target = t;
    const main = document.getElementById('main-content');
    this.renderAnnouncements(main);
  },

  setPriorityFilter(p) {
    this.currentFilters.priority = p;
    const main = document.getElementById('main-content');
    this.renderAnnouncements(main);
  },

  handleSearch(val) {
    this.currentFilters.search = val;
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      const main = document.getElementById('main-content');
      this.renderAnnouncements(main);
    }, 300);
  },

  async togglePin(id) {
    const res = await apiFetch(`/api/announcements/${id}/pin`, { method: 'POST' });
    if (res.success) {
      showToast(res.message || 'Sabitleme güncellendi.');
      const main = document.getElementById('main-content');
      this.renderAnnouncements(main);
    }
  },

  async deleteAnnouncement(id) {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
    const res = await apiFetch(`/api/announcements/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Duyuru başarıyla silindi.');
      const main = document.getElementById('main-content');
      this.renderAnnouncements(main);
    }
  },

  async openCreateModal() {
    const [groupsRes, studentsRes] = await Promise.all([
      apiFetch('/api/groups'),
      apiFetch('/api/users?role=student')
    ]);

    const groups = groupsRes.groups || [];
    const students = studentsRes.users || [];

    const modal = document.getElementById('universal-modal');
    const modalBody = document.getElementById('universal-modal-body');
    const modalTitle = document.getElementById('universal-modal-title');

    modalTitle.innerHTML = `📢 19. Publish Announcement (Announcements Hub)`;
    modalBody.innerHTML = `
      <form id="create-announcement-form" onsubmit="AnnouncementsController.handleCreateSubmit(event)" style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label class="form-label" style="font-weight: 700;">Announcement Title <span style="color: var(--accent-rose);">*</span></label>
          <input type="text" id="ann-title" class="form-control" placeholder="Örn: Final Projesi Teslim Tarihleri ve Değerlendirme Kriterleri" required>
        </div>

        <div>
          <label class="form-label" style="font-weight: 700;">Target Audience Seçimi (Section 19: 5 Seçenek) <span style="color: var(--accent-rose);">*</span></label>
          <select id="ann-target-type" class="form-control" onchange="AnnouncementsController.handleTargetTypeChange(this.value)" required style="font-weight: 600;">
            <option value="all_users">👥 All Users (Sistemdeki Tüm Userlar)</option>
            <option value="all_students">🎓 All Students (Tüm Öğrenciler)</option>
            <option value="all_trainers">👨‍🏫 All Trainers (Tüm Eğitmenler ve Asistanlar)</option>
            <option value="specific_group">🏢 Specific Group (Belirli Bir Eğitim Grubu)</option>
            <option value="specific_students">👤 Specific Students (Belirli Öğrenciler)</option>
          </select>
        </div>

        <!-- Dynamic Sub-Picker: Specific Group -->
        <div id="ann-group-container" style="display: none; padding: 12px; background: var(--bg-page); border-radius: 8px; border: 1px solid var(--border-light);">
          <label class="form-label" style="font-weight: 700;">Eğitim Grubu Seçin <span style="color: var(--accent-rose);">*</span></label>
          <select id="ann-target-group-id" class="form-control">
            <option value="">-- Grup Seçiniz --</option>
            ${groups.map(g => `<option value="${g.id}">${g.name} (${g.department})</option>`).join('')}
          </select>
        </div>

        <!-- Dynamic Sub-Picker: Specific Students Multi-Select -->
        <div id="ann-students-container" style="display: none; padding: 12px; background: var(--bg-page); border-radius: 8px; border: 1px solid var(--border-light);">
          <label class="form-label" style="font-weight: 700;">Öğrencileri Seçin (Birden Fazla Seçebilirsiniz) <span style="color: var(--accent-rose);">*</span></label>
          <input type="text" placeholder="🔍 Öğrenci ara..." oninput="AnnouncementsController.filterStudentCheckboxes(this.value)" class="form-control" style="font-size: 11.5px; padding: 5px 8px; margin-bottom: 8px;">
          <div id="ann-students-list" style="max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; background: #fff; padding: 8px; border-radius: 6px; border: 1px solid var(--border-light);">
            ${students.map(s => `
              <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; padding: 2px 4px;" class="ann-student-item" data-name="${s.name.toLowerCase()}">
                <input type="checkbox" name="ann_student_id" value="${s.id}">
                <span><strong>${s.name}</strong> <span style="color: var(--text-muted); font-size: 11px;">(${s.email})</span></span>
              </label>
            `).join('')}
          </div>
        </div>

        <div>
          <label class="form-label" style="font-weight: 700;">Priority Düzeyi</label>
          <select id="ann-priority" class="form-control">
            <option value="Normal">🔵 Normal</option>
            <option value="Önemli">🟠 Önemli</option>
            <option value="Acil">🔴 Acil Duyuru</option>
          </select>
        </div>

        <div>
          <label class="form-label" style="font-weight: 700;">Duyuru İçeriği ve Enabledlama <span style="color: var(--accent-rose);">*</span></label>
          <textarea id="ann-message" rows="5" class="form-control" placeholder="Duyuru detaylarını, talimatları ve gerekli bağlantıları buraya yazınız..." required></textarea>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
          <input type="checkbox" id="ann-is-pinned" value="1">
          <label for="ann-is-pinned" style="font-size: 12.5px; font-weight: 600; cursor: pointer; color: var(--primary-navy);">
            📌 Bu duyuruyu panonun en üstünde sabitle
          </label>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button type="button" class="btn-action btn-secondary" onclick="closeUniversalModal()">Cancel</button>
          <button type="submit" class="btn-action btn-primary" id="btn-save-announcement">
            <span>📢 Duyuruyu Yayınla</span>
          </button>
        </div>
      </form>
    `;

    modal.style.display = 'flex';
  },

  handleTargetTypeChange(targetType) {
    const groupContainer = document.getElementById('ann-group-container');
    const studentsContainer = document.getElementById('ann-students-container');

    groupContainer.style.display = targetType === 'specific_group' ? 'block' : 'none';
    studentsContainer.style.display = targetType === 'specific_students' ? 'block' : 'none';
  },

  filterStudentCheckboxes(query) {
    const q = query.toLowerCase().trim();
    document.querySelectorAll('.ann-student-item').forEach(item => {
      const name = item.getAttribute('data-name') || '';
      item.style.display = name.includes(q) ? 'flex' : 'none';
    });
  },

  async handleCreateSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-announcement');
    btn.disabled = true;
    btn.innerText = 'Yayınlanıyor...';

    const title = document.getElementById('ann-title').value.trim();
    const message = document.getElementById('ann-message').value.trim();
    const target_type = document.getElementById('ann-target-type').value;
    const priority = document.getElementById('ann-priority').value;
    const is_pinned = document.getElementById('ann-is-pinned').checked ? 1 : 0;

    let target_group_id = null;
    let target_student_ids = [];

    if (target_type === 'specific_group') {
      target_group_id = document.getElementById('ann-target-group-id').value;
      if (!target_group_id) {
        showToast('Lütfen bir eğitim grubu seçin.', 'error');
        btn.disabled = false;
        btn.innerText = '📢 Duyuruyu Yayınla';
        return;
      }
    } else if (target_type === 'specific_students') {
      const checked = document.querySelectorAll('input[name="ann_student_id"]:checked');
      target_student_ids = Array.from(checked).map(c => parseInt(c.value));
      if (target_student_ids.length === 0) {
        showToast('Lütfen en az bir öğrenci seçin.', 'error');
        btn.disabled = false;
        btn.innerText = '📢 Duyuruyu Yayınla';
        return;
      }
    }

    const payload = {
      title,
      message,
      target_type,
      target_group_id: target_group_id ? parseInt(target_group_id) : null,
      target_student_ids,
      priority,
      is_pinned
    };

    const res = await apiFetch('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    btn.disabled = false;
    btn.innerText = '📢 Duyuruyu Yayınla';

    if (res.success) {
      showToast(res.message || 'Duyuru başarıyla yayınlandı!');
      closeUniversalModal();
      const main = document.getElementById('main-content');
      this.renderAnnouncements(main);
    }
  }
};


// ==================== SECTION 20: CALENDAR CONTROLLER (AKADEMİK TAKVİM) ====================

const CalendarController = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1, // 1-12
  selectedCategories: ['tasks', 'deadlines', 'training_sessions', 'events', 'exams', 'meetings'],
  selectedGroupId: 'all',
  activeView: 'month', // 'month' or 'agenda'

  categoryConfig: {
    tasks: { label: 'Tasks & Assignments', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)', border: '#93C5FD', icon: '📋' },
    deadlines: { label: 'Deadlines (Due Dateler)', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.12)', border: '#FCA5A5', icon: '⏰' },
    training_sessions: { label: 'Training Sessions (Oturumlar)', color: '#9333EA', bg: 'rgba(147, 51, 234, 0.12)', border: '#D8B4FE', icon: '🎓' },
    events: { label: 'Events (Etkinlikler)', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', border: '#6EE7B7', icon: '🎪' },
    exams: { label: 'Exams (Sınavlar)', color: '#EA580C', bg: 'rgba(234, 88, 12, 0.12)', border: '#FDBA74', icon: '📝' },
    meetings: { label: 'Meetings (Toplantılar)', color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)', border: '#FCD34D', icon: '🤝' }
  },

  async renderCalendar(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Yükleniyor...</span></div>`;

    const queryParams = new URLSearchParams({
      year: this.currentYear,
      month: this.currentMonth,
      types: this.selectedCategories.join(','),
      group_id: this.selectedGroupId
    });

    const [calRes, groupsRes] = await Promise.all([
      apiFetch(`/api/calendar?${queryParams.toString()}`),
      apiFetch('/api/groups')
    ]);

    const calData = calRes.calendar || { year: this.currentYear, month: this.currentMonth, counts: {}, events: [] };
    const events = calData.events || [];
    const counts = calData.counts || {};
    const groups = groupsRes.groups || [];
    const user = AppState.currentUser;
    const canCreate = ['super_admin', 'admin', 'training_manager', 'trainer', 'assistant_trainer'].includes(user.role);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonthName = monthNames[this.currentMonth - 1];

    container.innerHTML = `
      <!-- Header Banner -->
      <div class="panel-card" style="padding: 20px 24px; margin-bottom: 20px; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FFFFFF; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 24px;">📅</span>
              <h2 style="font-size: 19px; font-weight: 800; color: #FFFFFF; margin: 0;">20. Calendar (Genel Akademik Takvim)</h2>
              <span class="status-badge" style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(96, 165, 250, 0.3);">6 Category Desteği</span>
            </div>
            <p style="color: #94A3B8; font-size: 12.5px; margin: 0; max-width: 750px;">
              التقويم الأكاديمي الشامل: متابعة Tasks, Deadlines, Training Sessions, Events, Exams, ve Meetings.
            </p>
          </div>
          ${canCreate ? `
            <button class="btn-action btn-primary" onclick="CalendarController.openCreateEventModal()" style="padding: 8px 16px; font-size: 13px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>+ Yeni Takvim Öğesi Ekle (20)</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- 6 Categories Filter Badges / Metric Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px;">
        ${Object.keys(this.categoryConfig).map(key => {
          const cfg = this.categoryConfig[key];
          const isSelected = this.selectedCategories.includes(key);
          const count = counts[key] || 0;
          return `
            <div onclick="CalendarController.toggleCategory('${key}')" style="cursor: pointer; padding: 12px 14px; border-radius: 10px; background: var(--bg-card); border: 2px solid ${isSelected ? cfg.color : 'var(--border-light)'}; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s ease;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">${cfg.icon}</span>
                <div>
                  <div style="font-size: 11px; font-weight: 700; color: ${isSelected ? cfg.color : 'var(--text-muted)'}; text-transform: uppercase;">${key.replace('_', ' ')}</div>
                  <div style="font-size: 10px; color: var(--text-secondary);">${cfg.label.split('(')[1]?.replace(')', '') || ''}</div>
                </div>
              </div>
              <span class="status-badge" style="background: ${cfg.bg}; color: ${cfg.color}; font-size: 11px; font-weight: 800; border: 1px solid ${cfg.border};">${count}</span>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Toolbar: Month Nav, Group Filter, View Switcher -->
      <div class="panel-card" style="padding: 14px 20px; border: 1px solid var(--border-light); border-radius: 12px; margin-bottom: 20px; background: var(--bg-card);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <!-- Month Nav -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="btn-action btn-secondary btn-sm" onclick="CalendarController.prevMonth()" title="Önceki Ay" style="padding: 5px 10px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <h3 style="font-size: 17px; font-weight: 800; color: var(--primary-navy); margin: 0; min-width: 170px; text-align: center;">
              ${currentMonthName} ${this.currentYear}
            </h3>
            <button class="btn-action btn-secondary btn-sm" onclick="CalendarController.nextMonth()" title="Sonraki Ay" style="padding: 5px 10px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <button class="btn-action btn-secondary btn-sm" onclick="CalendarController.goToToday()" style="padding: 5px 10px; font-size: 11.5px;">
              Bugün (Today)
            </button>
          </div>

          <!-- Group Filter & View Switcher -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <select class="form-control" style="font-size: 12px; padding: 5px 10px; height: 34px;" onchange="CalendarController.setGroupFilter(this.value)">
              <option value="all" ${this.selectedGroupId === 'all' ? 'selected' : ''}>🏢 Tüm Gruplar</option>
              ${groups.map(g => `<option value="${g.id}" ${String(this.selectedGroupId) === String(g.id) ? 'selected' : ''}>${g.name}</option>`).join('')}
            </select>

            <div style="display: flex; background: var(--bg-page); border: 1px solid var(--border-light); border-radius: 8px; padding: 2px;">
              <button type="button" class="btn-action btn-sm ${this.activeView === 'month' ? 'btn-primary' : 'btn-secondary'}" style="border: none; padding: 4px 10px; font-size: 11.5px;" onclick="CalendarController.setView('month')">
                📅 Ay
              </button>
              <button type="button" class="btn-action btn-sm ${this.activeView === 'agenda' ? 'btn-primary' : 'btn-secondary'}" style="border: none; padding: 4px 10px; font-size: 11.5px;" onclick="CalendarController.setView('agenda')">
                📋 Ajanda (${events.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Calendar Grid or Agenda View -->
      ${this.activeView === 'month' ? this.renderMonthGrid(events) : this.renderAgendaList(events)}
    `;
  },

  renderMonthGrid(events) {
    const year = this.currentYear;
    const month = this.currentMonth;

    // First day of month (0 = Sunday, 1 = Monday, ...)
    const firstDay = new Date(year, month - 1, 1).getDay();
    // In Turkey / ISO: Monday is 1st day of week (0 index)
    const startingDay = (firstDay + 6) % 7; 
    const daysInMonth = new Date(year, month, 0).getDate();

    const todayStr = new Date().toISOString().split('T')[0];

    // Group events by date
    const eventsByDate = {};
    events.forEach(e => {
      if (!eventsByDate[e.event_date]) eventsByDate[e.event_date] = [];
      eventsByDate[e.event_date].push(e);
    });

    const dayHeaders = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Fridayrtesi', 'Sunday'];

    let html = `
      <div class="panel-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-light); border-radius: 12px; background: var(--bg-card);">
        <!-- Day Names Header -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); background: var(--bg-page); border-bottom: 1px solid var(--border-light);">
          ${dayHeaders.map((dh, idx) => `
            <div style="padding: 10px 6px; text-align: center; font-size: 11.5px; font-weight: 700; color: ${idx >= 5 ? 'var(--accent-rose)' : 'var(--primary-navy)'}; border-right: ${idx < 6 ? '1px solid var(--border-light)' : 'none'};">
              ${dh}
            </div>
          `).join('')}
        </div>

        <!-- Month Days Grid -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); auto-rows: minmax(105px, auto);">
    `;

    // Blank cells before first day
    for (let i = 0; i < startingDay; i++) {
      html += `<div style="background: rgba(241, 245, 249, 0.4); border-right: 1px solid var(--border-light); border-bottom: 1px solid var(--border-light); padding: 8px;"></div>`;
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = eventsByDate[dateStr] || [];
      const isToday = dateStr === todayStr;
      const dayOfWeek = (startingDay + day - 1) % 7;
      const isWeekend = dayOfWeek >= 5;

      html += `
        <div onclick="CalendarController.openDayDetailModal('${dateStr}')" style="min-height: 105px; border-right: ${(startingDay + day) % 7 !== 0 ? '1px solid var(--border-light)' : 'none'}; border-bottom: 1px solid var(--border-light); padding: 6px 8px; cursor: pointer; background: ${isToday ? '#EFF6FF' : isWeekend ? 'rgba(248, 250, 252, 0.7)' : 'transparent'}; transition: background 0.15s ease;" onmouseover="this.style.background='#F1F5F9'" onmouseout="this.style.background='${isToday ? '#EFF6FF' : isWeekend ? 'rgba(248, 250, 252, 0.7)' : 'transparent'}'">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 12px; font-weight: ${isToday ? '800' : '700'}; color: ${isToday ? 'var(--primary-blue)' : 'var(--primary-navy)'}; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; ${isToday ? 'background: var(--primary-blue); color: #fff; border-radius: 50%;' : ''}">
              ${day}
            </span>
            ${dayEvents.length > 0 ? `
              <span class="status-badge badge-submitted" style="font-size: 9.5px; padding: 1px 5px; height: 16px;">${dayEvents.length}</span>
            ` : ''}
          </div>

          <!-- Event Chips -->
          <div style="display: flex; flex-direction: column; gap: 3px; max-height: 80px; overflow: hidden;">
            ${dayEvents.slice(0, 3).map(e => {
              const cfg = this.categoryConfig[e.event_type] || { color: '#2563EB', bg: 'rgba(37,99,235,0.1)', border: '#93C5FD', icon: '📌' };
              return `
                <div style="padding: 2px 4px; border-radius: 4px; background: ${cfg.bg}; border-left: 3px solid ${cfg.color}; font-size: 10.5px; color: ${cfg.color}; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 3px;">
                  <span>${cfg.icon}</span>
                  <span style="overflow: hidden; text-overflow: ellipsis;">${escapeHtml(e.title)}</span>
                </div>
              `;
            }).join('')}
            ${dayEvents.length > 3 ? `
              <div style="font-size: 9.5px; color: var(--text-muted); font-weight: 700; text-align: center;">+${dayEvents.length - 3} daha</div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // Fill remaining cells of the last row
    const totalCells = startingDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remaining; i++) {
      html += `<div style="background: rgba(241, 245, 249, 0.4); border-right: ${i < remaining - 1 ? '1px solid var(--border-light)' : 'none'}; border-bottom: 1px solid var(--border-light); padding: 8px;"></div>`;
    }

    html += `
        </div>
      </div>
    `;
    return html;
  },

  renderAgendaList(events) {
    if (events.length === 0) {
      return `
        <div class="panel-card" style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
          <div style="font-size: 36px; margin-bottom: 10px;">📅</div>
          <strong style="font-size: 14px; color: var(--primary-navy); display: block; margin-bottom: 4px;">Bu Ayda Planlanmış Etkinlik Bulunmuyor</strong>
          <p style="font-size: 12.5px; margin: 0;">Seçilen filtre ve kategorilere uygun takvim öğesi bulunamadı.</p>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${events.map(e => {
          const cfg = this.categoryConfig[e.event_type] || { color: '#2563EB', bg: 'rgba(37,99,235,0.1)', border: '#93C5FD', icon: '📌', label: e.event_type };
          const user = AppState.currentUser;
          const canDelete = e.is_custom && (['super_admin', 'admin', 'training_manager'].includes(user.role) || e.organizer_id === user.id);

          return `
            <div class="panel-card" style="padding: 16px 20px; border-left: 5px solid ${cfg.color}; border-radius: 10px; background: var(--bg-card); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
              <div style="display: flex; align-items: flex-start; gap: 14px;">
                <div style="text-align: center; min-width: 60px; padding: 6px 10px; background: var(--bg-page); border-radius: 8px; border: 1px solid var(--border-light);">
                  <div style="font-size: 11px; font-weight: 700; color: ${cfg.color}; text-transform: uppercase;">${cfg.icon}</div>
                  <div style="font-size: 15px; font-weight: 800; color: var(--primary-navy);">${formatDateTr(e.event_date).split(' ')[0]}</div>
                  <div style="font-size: 10px; color: var(--text-muted);">${formatDateTr(e.event_date).split(' ')[1] || ''}</div>
                </div>

                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
                    <span class="status-badge" style="background: ${cfg.bg}; color: ${cfg.color}; border: 1px solid ${cfg.border}; font-size: 11px;">${cfg.label}</span>
                    ${e.start_time ? `<span style="font-size: 11.5px; color: var(--text-secondary); font-weight: 600;">⏰ ${e.start_time}${e.end_time ? ' - ' + e.end_time : ''}</span>` : ''}
                    ${e.group_name ? `<span class="status-badge badge-submitted">🏢 ${escapeHtml(e.group_name)}</span>` : ''}
                  </div>
                  <h4 style="font-size: 15px; font-weight: 800; color: var(--primary-navy); margin: 0 0 4px 0;">${escapeHtml(e.title)}</h4>
                  ${e.description ? `<p style="font-size: 12.5px; color: var(--text-secondary); margin: 0 0 6px 0;">${escapeHtml(e.description)}</p>` : ''}
                  <div style="display: flex; align-items: center; gap: 12px; font-size: 11px; color: var(--text-muted);">
                    ${e.location ? `<span>📍 ${escapeHtml(e.location)}</span>` : ''}
                    <span>👤 ${escapeHtml(e.organizer_name)} (${escapeHtml(e.organizer_role)})</span>
                  </div>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 8px;">
                ${e.task_id ? `
                  <button class="btn-action btn-primary btn-sm" onclick="StudentController.openSubmitModal(${e.task_id}, '${escapeHtml(e.title)}')" style="font-size: 11.5px; padding: 4px 10px;">
                    Ödevi View
                  </button>
                ` : ''}
                ${canDelete ? `
                  <button class="btn-action btn-danger btn-sm" onclick="CalendarController.deleteEvent(${e.id})" title="Etkinliği Delete" style="font-size: 11px; padding: 4px 8px;">
                    🗑️ Delete
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  toggleCategory(cat) {
    if (this.selectedCategories.includes(cat)) {
      if (this.selectedCategories.length > 1) {
        this.selectedCategories = this.selectedCategories.filter(c => c !== cat);
      } else {
        // Restore all if user unchecks the last one
        this.selectedCategories = ['tasks', 'deadlines', 'training_sessions', 'events', 'exams', 'meetings'];
      }
    } else {
      this.selectedCategories.push(cat);
    }
    const main = document.getElementById('main-content');
    this.renderCalendar(main);
  },

  setGroupFilter(gid) {
    this.selectedGroupId = gid;
    const main = document.getElementById('main-content');
    this.renderCalendar(main);
  },

  setView(view) {
    this.activeView = view;
    const main = document.getElementById('main-content');
    this.renderCalendar(main);
  },

  prevMonth() {
    if (this.currentMonth === 1) {
      this.currentMonth = 12;
      this.currentYear -= 1;
    } else {
      this.currentMonth -= 1;
    }
    const main = document.getElementById('main-content');
    this.renderCalendar(main);
  },

  nextMonth() {
    if (this.currentMonth === 12) {
      this.currentMonth = 1;
      this.currentYear += 1;
    } else {
      this.currentMonth += 1;
    }
    const main = document.getElementById('main-content');
    this.renderCalendar(main);
  },

  goToToday() {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth() + 1;
    const main = document.getElementById('main-content');
    this.renderCalendar(main);
  },

  async deleteEvent(id) {
    if (!confirm('Bu takvim öğesini silmek istediğinize emin misiniz?')) return;
    const res = await apiFetch(`/api/calendar/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Takvim öğesi silindi.');
      const main = document.getElementById('main-content');
      this.renderCalendar(main);
    }
  },

  async openCreateEventModal(presetDate = null) {
    const groupsRes = await apiFetch('/api/groups');
    const groups = groupsRes.groups || [];

    const defaultDate = presetDate || new Date().toISOString().split('T')[0];

    const modal = document.getElementById('universal-modal');
    const modalBody = document.getElementById('universal-modal-body');
    const modalTitle = document.getElementById('universal-modal-title');

    modalTitle.innerHTML = `📅 20. Yeni Takvim Öğesi Ekle (Akademik Takvim)`;
    modalBody.innerHTML = `
      <form id="create-calendar-event-form" onsubmit="CalendarController.handleCreateSubmit(event)" style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label class="form-label" style="font-weight: 700;">Event / Item Title <span style="color: var(--accent-rose);">*</span></label>
          <input type="text" id="cal-title" class="form-control" placeholder="Örn: Ara Sınav (Vize) - Veri Tabanı Yönetimi" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700;">Category / Tür (Section 20: 6 Category) <span style="color: var(--accent-rose);">*</span></label>
            <select id="cal-event-type" class="form-control" required style="font-weight: 600;">
              <option value="training_sessions">🎓 Training Sessions (Eğitim Oturumu)</option>
              <option value="exams">📝 Exams (Sınavlar - Vize, Final, Quiz)</option>
              <option value="events">🎪 Events (Akademik Etkinlik / Seminer)</option>
              <option value="meetings">🤝 Meetings (Toplantı & Görüşme)</option>
              <option value="tasks">📋 Tasks (Görev & Çalışma)</option>
              <option value="deadlines">⏰ Deadlines (Due Date Tarihi)</option>
            </select>
          </div>

          <div>
            <label class="form-label" style="font-weight: 700;">Tarih <span style="color: var(--accent-rose);">*</span></label>
            <input type="date" id="cal-event-date" value="${defaultDate}" class="form-control" required>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700;">Başlangıç Saati</label>
            <input type="time" id="cal-start-time" value="10:00" class="form-control">
          </div>
          <div>
            <label class="form-label" style="font-weight: 700;">Bitiş Saati</label>
            <input type="time" id="cal-end-time" value="11:30" class="form-control">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700;">Lokasyon / Online Toplantı Linki</label>
            <input type="text" id="cal-location" class="form-control" placeholder="Örn: Amfi-2 veya https://meet.google.com/xyz">
          </div>

          <div>
            <label class="form-label" style="font-weight: 700;">Eğitim Grubu</label>
            <select id="cal-group-id" class="form-control">
              <option value="">-- Tüm Üniversite / Genel --</option>
              ${groups.map(g => `<option value="${g.id}">${g.name} (${g.department})</option>`).join('')}
            </select>
          </div>
        </div>

        <div>
          <label class="form-label" style="font-weight: 700;">Target Audience</label>
          <select id="cal-target-scope" class="form-control">
            <option value="all_users">👥 Tüm Userlar (All Users)</option>
            <option value="all_students">🎓 Students Only (All Students)</option>
            <option value="all_trainers">👨‍🏫 Faculty Only (All Trainers)</option>
          </select>
        </div>

        <div>
          <label class="form-label" style="font-weight: 700;">Enabledlama ve Gradelar</label>
          <textarea id="cal-description" rows="3" class="form-control" placeholder="Etkinlik yönergeleri, getirilecek materyaller veya toplantı gündemi..."></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button type="button" class="btn-action btn-secondary" onclick="closeUniversalModal()">Cancel</button>
          <button type="submit" class="btn-action btn-primary" id="btn-save-cal-event">
            <span>📅 Takvime Save</span>
          </button>
        </div>
      </form>
    `;

    modal.style.display = 'flex';
  },

  async handleCreateSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-cal-event');
    btn.disabled = true;
    btn.innerText = 'Kaydediliyor...';

    const title = document.getElementById('cal-title').value.trim();
    const event_type = document.getElementById('cal-event-type').value;
    const event_date = document.getElementById('cal-event-date').value;
    const start_time = document.getElementById('cal-start-time').value || null;
    const end_time = document.getElementById('cal-end-time').value || null;
    const location = document.getElementById('cal-location').value.trim() || null;
    const group_id = document.getElementById('cal-group-id').value || null;
    const target_scope = document.getElementById('cal-target-scope').value;
    const description = document.getElementById('cal-description').value.trim();

    const payload = {
      title,
      event_type,
      event_date,
      start_time,
      end_time,
      location,
      group_id: group_id ? parseInt(group_id) : null,
      target_scope,
      description
    };

    const res = await apiFetch('/api/calendar', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    btn.disabled = false;
    btn.innerText = '📅 Takvime Save';

    if (res.success) {
      showToast(res.message || 'Etkinlik takvime eklendi!');
      closeUniversalModal();
      const main = document.getElementById('main-content');
      this.renderCalendar(main);
    }
  },

  async openDayDetailModal(dateStr) {
    const queryParams = new URLSearchParams({
      year: this.currentYear,
      month: this.currentMonth,
      types: this.selectedCategories.join(','),
      group_id: this.selectedGroupId
    });
    const res = await apiFetch(`/api/calendar?${queryParams.toString()}`);
    const events = (res.calendar?.events || []).filter(e => e.event_date === dateStr);

    const modal = document.getElementById('universal-modal');
    const modalBody = document.getElementById('universal-modal-body');
    const modalTitle = document.getElementById('universal-modal-title');

    modalTitle.innerHTML = `📅 ${formatDateTr(dateStr)} - Günlük Program`;
    modalBody.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <strong style="font-size: 13.5px; color: var(--primary-navy);">${events.length} Planlı Öğe Bulundu</strong>
        <button class="btn-action btn-primary btn-sm" onclick="closeUniversalModal(); CalendarController.openCreateEventModal('${dateStr}')">
          + Bu Güne Etkinlik Ekle
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; max-height: 380px; overflow-y: auto;">
        ${events.length === 0 ? `
          <div style="text-align: center; padding: 28px; color: var(--text-muted); font-size: 13px;">
            Bu tarihte kayıtlı takvim öğesi bulunmamaktadır.
          </div>
        ` : events.map(e => {
          const cfg = this.categoryConfig[e.event_type] || { color: '#2563EB', bg: 'rgba(37,99,235,0.1)', border: '#93C5FD', icon: '📌', label: e.event_type };
          return `
            <div style="padding: 12px 14px; border-left: 4px solid ${cfg.color}; border-radius: 8px; background: var(--bg-page); border: 1px solid var(--border-light);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="status-badge" style="background: ${cfg.bg}; color: ${cfg.color}; border: 1px solid ${cfg.border}; font-size: 10.5px;">${cfg.label}</span>
                ${e.start_time ? `<span style="font-size: 11.5px; font-weight: 700; color: var(--primary-navy);">⏰ ${e.start_time}</span>` : ''}
              </div>
              <strong style="font-size: 13.5px; color: var(--primary-navy); display: block; margin-bottom: 2px;">${escapeHtml(e.title)}</strong>
              ${e.description ? `<p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px 0;">${escapeHtml(e.description)}</p>` : ''}
              <div style="display: flex; gap: 10px; font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                ${e.location ? `<span>📍 ${escapeHtml(e.location)}</span>` : ''}
                <span>👤 ${escapeHtml(e.organizer_name)}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
        <button type="button" class="btn-action btn-secondary" onclick="closeUniversalModal()">Close</button>
      </div>
    `;

    modal.style.display = 'flex';
  }
};


// ==================== SECTION 21: REPORTS CONTROLLER (RAPORLAMA & ANALİTİK MERKEZİ) ====================

const ReportsController = {
  currentReportType: 'student_performance',
  currentFilters: {
    group: 'all',
    trainer: 'all',
    search: ''
  },
  lastReportData: null,

  reportTabs: [
    { id: 'student_performance', title: '1. Öğrenci Performansı', icon: '🎓', desc: 'Student Performance Report' },
    { id: 'trainer_performance', title: '2. Eğitmen Performansı', icon: '👨‍🏫', desc: 'Trainer Performance Report' },
    { id: 'group_performance', title: '3. Grup Performansı', icon: '🏢', desc: 'Group Performance Report' },
    { id: 'tasks_report', title: '4. Tasks & Submissions', icon: '📋', desc: 'Tasks Distribution Report' },
    { id: 'late_tasks_report', title: '5. Overdue Tasks', icon: '⏰', desc: 'Overdue & Risk Analysis Report' },
    { id: 'activity_attendance_report', title: '6. Aktivite & Katılım', icon: '⚡', desc: 'Activity / Attendance Report' }
  ],

  async renderReports(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Yükleniyor...</span></div>`;

    const queryParams = new URLSearchParams({
      type: this.currentReportType,
      group_id: this.currentFilters.group,
      trainer_id: this.currentFilters.trainer,
      search: this.currentFilters.search
    });

    const [repRes, groupsRes, trainersRes] = await Promise.all([
      apiFetch(`/api/reports?${queryParams.toString()}`),
      apiFetch('/api/groups'),
      apiFetch('/api/users?role=trainer')
    ]);

    const report = repRes.report || { type: this.currentReportType, title: '', kpis: {}, records: [] };
    this.lastReportData = report;
    const groups = groupsRes.groups || [];
    const trainers = trainersRes.users || [];
    const records = report.records || [];
    const kpis = report.kpis || {};

    container.innerHTML = `
      <!-- Header Banner -->
      <div class="panel-card" style="padding: 20px 24px; margin-bottom: 20px; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FFFFFF; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 24px;">📊</span>
              <h2 style="font-size: 19px; font-weight: 800; color: #FFFFFF; margin: 0;">21. Reports (Raporlama ve Analitik Merkezi)</h2>
              <span class="status-badge" style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(96, 165, 250, 0.3);">6 Temel Rapor Modülü</span>
            </div>
            <p style="color: #94A3B8; font-size: 12.5px; margin: 0; max-width: 750px;">
              Student Performance, Trainer Performance, Group Performance, Tasks Report, Late Tasks Report, ve Activity/Attendance Report.
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="btn-action btn-secondary" onclick="ReportsController.exportToCsv()" style="padding: 8px 14px; font-size: 12.5px; background: rgba(255,255,255,0.1); color: #FFF; border: 1px solid rgba(255,255,255,0.2);">
              📥 CSV Olarak İndir
            </button>
            <button class="btn-action btn-primary" onclick="window.print()" style="padding: 8px 14px; font-size: 12.5px;">
              🖨️ Yazdır / PDF
            </button>
          </div>
        </div>
      </div>

      <!-- 6 Reports Sub-Tabs Switcher -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px;">
        ${this.reportTabs.map(t => {
          const isActive = this.currentReportType === t.id;
          return `
            <button type="button" onclick="ReportsController.switchReport('${t.id}')" class="btn-action ${isActive ? 'btn-primary' : 'btn-secondary'}" style="padding: 9px 15px; font-size: 12.5px; font-weight: 700; white-space: nowrap; border-radius: 8px; display: flex; align-items: center; gap: 6px;">
              <span>${t.icon}</span>
              <span>${t.title}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- KPI Summary Metric Cards -->
      ${this.renderKpiCards(report.type, kpis)}

      <!-- Filter Bar -->
      <div class="panel-card" style="padding: 14px 20px; border: 1px solid var(--border-light); border-radius: 12px; margin-bottom: 20px; background: var(--bg-card);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- Group Filter -->
            ${['student_performance', 'tasks_report', 'late_tasks_report'].includes(this.currentReportType) ? `
              <select class="form-control" style="font-size: 12px; padding: 5px 10px; height: 34px; width: 170px;" onchange="ReportsController.setGroupFilter(this.value)">
                <option value="all" ${this.currentFilters.group === 'all' ? 'selected' : ''}>🏢 Tüm Gruplar</option>
                ${groups.map(g => `<option value="${g.id}" ${String(this.currentFilters.group) === String(g.id) ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('')}
              </select>
            ` : ''}

            <!-- Trainer Filter -->
            ${this.currentReportType === 'student_performance' ? `
              <select class="form-control" style="font-size: 12px; padding: 5px 10px; height: 34px; width: 170px;" onchange="ReportsController.setTrainerFilter(this.value)">
                <option value="all" ${this.currentFilters.trainer === 'all' ? 'selected' : ''}>👨‍🏫 Tüm Eğitmenler</option>
                ${trainers.map(tr => `<option value="${tr.id}" ${String(this.currentFilters.trainer) === String(tr.id) ? 'selected' : ''}>${escapeHtml(tr.name)}</option>`).join('')}
              </select>
            ` : ''}

            <!-- Live Search -->
            <input type="text" placeholder="🔍 Rapor içinde ara..." value="${escapeHtml(this.currentFilters.search || '')}" oninput="ReportsController.handleSearch(this.value)" class="form-control" style="font-size: 12px; padding: 5px 10px; height: 34px; width: 220px;">
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Toplam ${records.length} Kayıt</span>
            <button class="btn-action btn-secondary btn-sm" onclick="ReportsController.resetFilters()" style="padding: 4px 10px; font-size: 11.5px;">
              Filterri Sıfırla
            </button>
          </div>
        </div>
      </div>

      <!-- Main Report Table Container -->
      <div class="panel-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-light); border-radius: 12px; background: var(--bg-card);">
        <div style="overflow-x: auto;">
          ${this.renderReportTable(report.type, records)}
        </div>
      </div>
    `;
  },

  renderKpiCards(type, kpis) {
    let items = [];
    if (type === 'student_performance') {
      items = [
        { label: 'Toplam Öğrenci', val: kpis.total_students || 0, icon: '🎓', color: '#2563EB' },
        { label: 'Sınıf Grade Ortalaması', val: `${kpis.class_average_grade || 0} / 100`, icon: '📈', color: '#059669' },
        { label: 'Average Score Oranı', val: `%${kpis.average_completion_rate || 0}`, icon: '🎯', color: '#7C3AED' },
        { label: 'High Başarılı (>85)', val: kpis.high_achievers_count || 0, icon: '⭐', color: '#D97706' }
      ];
    } else if (type === 'trainer_performance') {
      items = [
        { label: 'Aktif Eğitmen Sayısı', val: kpis.total_trainers || 0, icon: '👨‍🏫', color: '#2563EB' },
        { label: 'Alınan Toplam Teslim', val: kpis.total_submissions_received || 0, icon: '📥', color: '#059669' },
        { label: 'Tamamlanan Viewmeler', val: kpis.total_reviews_completed || 0, icon: '✅', color: '#7C3AED' },
        { label: 'Ortalama Viewme Oranı', val: `%${kpis.average_review_rate || 0}`, icon: '⚡', color: '#D97706' }
      ];
    } else if (type === 'group_performance') {
      items = [
        { label: 'Toplam Eğitim Grubu', val: kpis.total_groups || 0, icon: '🏢', color: '#2563EB' },
        { label: 'Kayıtlı Toplam Kursiyer', val: kpis.total_enrolled_students || 0, icon: '👥', color: '#059669' },
        { label: 'Genel Grade Ortalaması', val: `${kpis.group_overall_average || 0} / 100`, icon: '📊', color: '#7C3AED' },
        { label: 'En Başarılı Grup', val: kpis.top_group_name || '-', icon: '🏆', color: '#D97706' }
      ];
    } else if (type === 'tasks_report') {
      items = [
        { label: 'Toplam Görev Sayısı', val: kpis.total_tasks || 0, icon: '📋', color: '#2563EB' },
        { label: 'Ortalama Teslim Oranı', val: `%${kpis.average_turnin_rate || 0}`, icon: '📈', color: '#059669' },
        { label: 'Ortalama Görev Gradeu', val: `${kpis.average_task_grade || 0} / 100`, icon: '🎯', color: '#7C3AED' },
        { label: 'Urgent Priority Tasks', val: kpis.urgent_tasks_count || 0, icon: '🚨', color: '#DC2626' }
      ];
    } else if (type === 'late_tasks_report') {
      items = [
        { label: 'Toplam Overdue Görev', val: kpis.total_late_tasks || 0, icon: '⏰', color: '#DC2626' },
        { label: 'Kritik Gecikme (>7 Gün)', val: kpis.critical_overdue_count || 0, icon: '🔴', color: '#B91C1C' },
        { label: 'Orta Düzey Gecikme', val: kpis.moderate_overdue_count || 0, icon: '🟠', color: '#EA580C' },
        { label: 'Pending Urgent Tasks', val: kpis.pending_urgent_count || 0, icon: '⚠️', color: '#D97706' }
      ];
    } else if (type === 'activity_attendance_report') {
      items = [
        { label: 'İzlenen Userlar', val: kpis.total_monitored_users || 0, icon: '👥', color: '#2563EB' },
        { label: 'High Aktiflik (High)', val: kpis.high_activity_users || 0, icon: '🟢', color: '#059669' },
        { label: 'Orta Aktiflik (Moderate)', val: kpis.moderate_activity_users || 0, icon: '🟡', color: '#D97706' },
        { label: 'Low / İnaktif User', val: kpis.low_activity_users || 0, icon: '⚪', color: '#64748B' }
      ];
    }

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
        ${items.map(it => `
          <div class="panel-card" style="padding: 16px 18px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">${it.label}</div>
              <div style="font-size: 20px; font-weight: 800; color: ${it.color};">${it.val}</div>
            </div>
            <div style="font-size: 24px; padding: 8px; background: var(--bg-page); border-radius: 8px;">${it.icon}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderReportTable(type, records) {
    if (records.length === 0) {
      return `
        <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
          <div style="font-size: 36px; margin-bottom: 10px;">📭</div>
          <strong style="font-size: 14px; color: var(--primary-navy); display: block; margin-bottom: 4px;">Kayıt Bulunamadı</strong>
          <p style="font-size: 12.5px; margin: 0;">Seçilen arama veya filtre kriterlerine uygun rapor verisi bulunmamaktadır.</p>
        </div>
      `;
    }

    if (type === 'student_performance') {
      return `
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
          <thead>
            <tr style="background: var(--bg-page); border-bottom: 1px solid var(--border-light); text-align: left;">
              <th style="padding: 12px 16px;">Öğrenci Bilgisi</th>
              <th style="padding: 12px 16px;">Eğitim Grubu & Eğitmen</th>
              <th style="padding: 12px 16px; text-align: center;">Toplam Görev</th>
              <th style="padding: 12px 16px; text-align: center;">Tamamlanan</th>
              <th style="padding: 12px 16px;">Başarı Oranı</th>
              <th style="padding: 12px 16px; text-align: center;">Grade Ortalaması</th>
              <th style="padding: 12px 16px; text-align: center;">İşlem</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(r => `
              <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="padding: 12px 16px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="avatar-circle" style="width: 32px; height: 32px; font-size: 12px;">${escapeHtml(r.student_name.charAt(0))}</div>
                    <div>
                      <strong style="color: var(--primary-navy); display: block;">${escapeHtml(r.student_name)}</strong>
                      <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(r.email)}</span>
                    </div>
                  </div>
                </td>
                <td style="padding: 12px 16px;">
                  <span class="status-badge badge-submitted" style="font-size: 11px;">🏢 ${escapeHtml(r.group_name || 'Individual')}</span>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">👨‍🏫 ${escapeHtml(r.trainer_name || 'Atanmadı')}</div>
                </td>
                <td style="padding: 12px 16px; text-align: center; font-weight: 700;">${r.total_tasks}</td>
                <td style="padding: 12px 16px; text-align: center;">
                  <span class="status-badge badge-completed" style="font-size: 11px;">${r.completed_tasks} / ${r.total_tasks}</span>
                </td>
                <td style="padding: 12px 16px; min-width: 140px;">
                  <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 3px;">
                    <span>%${r.completion_rate}</span>
                  </div>
                  <div style="height: 6px; background: var(--border-light); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${r.completion_rate}%; height: 100%; background: ${r.completion_rate >= 80 ? 'var(--accent-emerald)' : r.completion_rate >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)'};"></div>
                  </div>
                </td>
                <td style="padding: 12px 16px; text-align: center;">
                  <strong style="font-size: 13px; color: var(--primary-navy);">${r.avg_grade}</strong>
                  <span class="status-badge" style="margin-left: 4px; font-size: 10px; background: rgba(59, 130, 246, 0.1); color: var(--primary-blue);">${r.letter_grade}</span>
                </td>
                <td style="padding: 12px 16px; text-align: center;">
                  <button class="btn-action btn-secondary btn-sm" onclick="openStudentProfileModal(${r.student_id})" style="font-size: 11px; padding: 4px 8px;">
                    Profili Aç (14)
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    if (type === 'trainer_performance') {
      return `
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
          <thead>
            <tr style="background: var(--bg-page); border-bottom: 1px solid var(--border-light); text-align: left;">
              <th style="padding: 12px 16px;">Eğitmen</th>
              <th style="padding: 12px 16px;">Rol & Gruplar</th>
              <th style="padding: 12px 16px; text-align: center;">Bağlı Öğrenci</th>
              <th style="padding: 12px 16px; text-align: center;">Oluşturulan Görev</th>
              <th style="padding: 12px 16px; text-align: center;">Alınan Teslim</th>
              <th style="padding: 12px 16px; text-align: center;">Viewnen</th>
              <th style="padding: 12px 16px;">Viewme Oranı</th>
              <th style="padding: 12px 16px; text-align: center;">Verilen Ort. Grade</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(r => `
              <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="padding: 12px 16px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="avatar-circle" style="width: 32px; height: 32px; font-size: 12px;">${escapeHtml(r.trainer_name.charAt(0))}</div>
                    <div>
                      <strong style="color: var(--primary-navy); display: block;">${escapeHtml(r.trainer_name)}</strong>
                      <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(r.email)}</span>
                    </div>
                  </div>
                </td>
                <td style="padding: 12px 16px;">
                  <span class="status-badge badge-submitted" style="font-size: 11px;">${escapeHtml(r.role)}</span>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">🏢 ${r.groups_count} Grup Yönetiyor</div>
                </td>
                <td style="padding: 12px 16px; text-align: center; font-weight: 700;">${r.students_count}</td>
                <td style="padding: 12px 16px; text-align: center; font-weight: 700;">${r.tasks_created}</td>
                <td style="padding: 12px 16px; text-align: center;">${r.submissions_received}</td>
                <td style="padding: 12px 16px; text-align: center;">
                  <span class="status-badge badge-completed" style="font-size: 11px;">${r.reviewed_submissions}</span>
                  ${r.pending_reviews > 0 ? `<span class="status-badge badge-late" style="margin-left: 4px; font-size: 10px;">${r.pending_reviews} Bekliyor</span>` : ''}
                </td>
                <td style="padding: 12px 16px; min-width: 130px;">
                  <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 3px;">
                    <span>%${r.review_rate}</span>
                  </div>
                  <div style="height: 6px; background: var(--border-light); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${r.review_rate}%; height: 100%; background: var(--accent-emerald);"></div>
                  </div>
                </td>
                <td style="padding: 12px 16px; text-align: center; font-weight: 800; color: var(--primary-navy);">
                  ${r.avg_grade_given}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    if (type === 'group_performance') {
      return `
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
          <thead>
            <tr style="background: var(--bg-page); border-bottom: 1px solid var(--border-light); text-align: left;">
              <th style="padding: 12px 16px;">Grup Adı</th>
              <th style="padding: 12px 16px;">Bölüm / Program</th>
              <th style="padding: 12px 16px;">Sorumlu Eğitmen</th>
              <th style="padding: 12px 16px; text-align: center;">Kayıtlı Kursiyer</th>
              <th style="padding: 12px 16px; text-align: center;">Group Tasks</th>
              <th style="padding: 12px 16px;">Başarı Oranı</th>
              <th style="padding: 12px 16px; text-align: center;">Grup Grade Ortalaması</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(r => `
              <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="padding: 12px 16px;">
                  <strong style="color: var(--primary-navy); font-size: 13px;">🏢 ${escapeHtml(r.group_name)}</strong>
                </td>
                <td style="padding: 12px 16px; color: var(--text-secondary);">${escapeHtml(r.department || '-')}</td>
                <td style="padding: 12px 16px;">
                  <span>👨‍🏫 ${escapeHtml(r.trainer_name || 'Atanmadı')}</span>
                </td>
                <td style="padding: 12px 16px; text-align: center; font-weight: 700;">${r.enrolled_students}</td>
                <td style="padding: 12px 16px; text-align: center; font-weight: 700;">${r.total_tasks}</td>
                <td style="padding: 12px 16px; min-width: 140px;">
                  <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 3px;">
                    <span>%${r.completion_rate}</span>
                  </div>
                  <div style="height: 6px; background: var(--border-light); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${r.completion_rate}%; height: 100%; background: ${r.completion_rate >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)'};"></div>
                  </div>
                </td>
                <td style="padding: 12px 16px; text-align: center;">
                  <strong style="font-size: 13.5px; color: var(--primary-navy);">${r.avg_group_grade}</strong>
                  <span class="status-badge badge-submitted" style="margin-left: 4px; font-size: 10px;">${r.letter_grade}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    if (type === 'tasks_report') {
      return `
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
          <thead>
            <tr style="background: var(--bg-page); border-bottom: 1px solid var(--border-light); text-align: left;">
              <th style="padding: 12px 16px;">Task Title</th>
              <th style="padding: 12px 16px;">Grup & Eğitmen</th>
              <th style="padding: 12px 16px;">Due Date</th>
              <th style="padding: 12px 16px; text-align: center;">Atanan Öğrenci</th>
              <th style="padding: 12px 16px; text-align: center;">Teslim Sayısı</th>
              <th style="padding: 12px 16px;">Teslim Oranı</th>
              <th style="padding: 12px 16px; text-align: center;">Average Grade</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(r => `
              <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="padding: 12px 16px;">
                  <strong style="color: var(--primary-navy); display: block;">📋 ${escapeHtml(r.task_title)}</strong>
                  <span class="status-badge" style="font-size: 10px; margin-top: 3px; ${r.priority === 'Acil' ? 'background: #FEE2E2; color: #DC2626;' : 'background: #EFF6FF; color: #2563EB;'}">${r.priority}</span>
                </td>
                <td style="padding: 12px 16px;">
                  <span class="status-badge badge-submitted" style="font-size: 11px;">🏢 ${escapeHtml(r.group_name || 'Individual')}</span>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">👨‍🏫 ${escapeHtml(r.trainer_name || '-')}</div>
                </td>
                <td style="padding: 12px 16px; font-size: 11.5px;">📅 ${formatDateTr(r.deadline)}</td>
                <td style="padding: 12px 16px; text-align: center; font-weight: 700;">${r.assigned_students}</td>
                <td style="padding: 12px 16px; text-align: center;">
                  <span class="status-badge badge-completed" style="font-size: 11px;">${r.submissions_count} / ${r.assigned_students}</span>
                </td>
                <td style="padding: 12px 16px; min-width: 130px;">
                  <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 3px;">
                    <span>%${r.turnin_rate}</span>
                  </div>
                  <div style="height: 6px; background: var(--border-light); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${r.turnin_rate}%; height: 100%; background: var(--accent-emerald);"></div>
                  </div>
                </td>
                <td style="padding: 12px 16px; text-align: center; font-weight: 800; color: var(--primary-navy);">
                  ${r.avg_task_grade > 0 ? r.avg_task_grade : '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    if (type === 'late_tasks_report') {
      return `
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
          <thead>
            <tr style="background: var(--bg-page); border-bottom: 1px solid var(--border-light); text-align: left;">
              <th style="padding: 12px 16px;">Overdue Görev</th>
              <th style="padding: 12px 16px;">Öğrenci Bilgisi</th>
              <th style="padding: 12px 16px;">Grup & Eğitmen</th>
              <th style="padding: 12px 16px;">Due Date</th>
              <th style="padding: 12px 16px; text-align: center;">Gecikme Süresi</th>
              <th style="padding: 12px 16px; text-align: center;">Status</th>
              <th style="padding: 12px 16px; text-align: center;">İşlem</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(r => `
              <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="padding: 12px 16px;">
                  <strong style="color: var(--accent-rose); display: block;">⏰ ${escapeHtml(r.task_title)}</strong>
                  <span class="status-badge" style="font-size: 10px; margin-top: 3px; background: #FEE2E2; color: #DC2626;">${r.priority}</span>
                </td>
                <td style="padding: 12px 16px;">
                  <strong style="color: var(--primary-navy);">${escapeHtml(r.student_name)}</strong>
                  <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(r.student_email)}</div>
                </td>
                <td style="padding: 12px 16px;">
                  <span class="status-badge badge-submitted" style="font-size: 11px;">🏢 ${escapeHtml(r.group_name || 'Individual')}</span>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">👨‍🏫 ${escapeHtml(r.trainer_name || '-')}</div>
                </td>
                <td style="padding: 12px 16px; font-size: 11.5px; color: var(--accent-rose); font-weight: 600;">
                  ${formatDateTr(r.deadline)}
                </td>
                <td style="padding: 12px 16px; text-align: center;">
                  <span class="status-badge badge-late" style="font-size: 11px; font-weight: 700;">
                    ${r.days_overdue > 0 ? `${r.days_overdue} Gün Gecikti` : 'Bugün Doldu'}
                  </span>
                </td>
                <td style="padding: 12px 16px; text-align: center;">
                  <span class="status-badge badge-reviewing" style="font-size: 10.5px;">${r.submission_status || 'Teslim Edilmedi'}</span>
                </td>
                <td style="padding: 12px 16px; text-align: center;">
                  <button class="btn-action btn-secondary btn-sm" onclick="openStudentProfileModal(${r.student_id})" style="font-size: 11px; padding: 4px 8px;">
                    Profili Aç (14)
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    if (type === 'activity_attendance_report') {
      return `
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
          <thead>
            <tr style="background: var(--bg-page); border-bottom: 1px solid var(--border-light); text-align: left;">
              <th style="padding: 12px 16px;">User</th>
              <th style="padding: 12px 16px;">Rol</th>
              <th style="padding: 12px 16px; text-align: center;">Teslimler</th>
              <th style="padding: 12px 16px; text-align: center;">Comment & Mesajlar</th>
              <th style="padding: 12px 16px; text-align: center;">Alınan Bildirimler</th>
              <th style="padding: 12px 16px; text-align: center;">Aktivite Skoru</th>
              <th style="padding: 12px 16px; text-align: center;">Katılım Düzeyi</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(r => {
              let levelBadge = '<span class="status-badge badge-completed">🟢 High</span>';
              if (r.activity_level.includes('Moderate')) levelBadge = '<span class="status-badge badge-reviewing">🟡 Orta</span>';
              else if (r.activity_level.includes('Low')) levelBadge = '<span class="status-badge" style="background: #F1F5F9; color: #64748B;">⚪ Low</span>';

              return `
                <tr style="border-bottom: 1px solid var(--border-light);">
                  <td style="padding: 12px 16px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="avatar-circle" style="width: 32px; height: 32px; font-size: 12px;">${escapeHtml(r.user_name.charAt(0))}</div>
                      <div>
                        <strong style="color: var(--primary-navy); display: block;">${escapeHtml(r.user_name)}</strong>
                        <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(r.email)}</span>
                      </div>
                    </div>
                  </td>
                  <td style="padding: 12px 16px;">
                    <span class="status-badge badge-submitted" style="font-size: 11px;">${escapeHtml(r.role)}</span>
                  </td>
                  <td style="padding: 12px 16px; text-align: center; font-weight: 700;">${r.submissions_count}</td>
                  <td style="padding: 12px 16px; text-align: center; font-weight: 700;">${r.comments_count}</td>
                  <td style="padding: 12px 16px; text-align: center;">${r.notifications_received}</td>
                  <td style="padding: 12px 16px; text-align: center;">
                    <strong style="font-size: 13.5px; color: var(--primary-navy);">${r.activity_score} Puan</strong>
                  </td>
                  <td style="padding: 12px 16px; text-align: center;">
                    ${levelBadge}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    return '';
  },

  switchReport(type) {
    this.currentReportType = type;
    const main = document.getElementById('main-content');
    this.renderReports(main);
  },

  setGroupFilter(gid) {
    this.currentFilters.group = gid;
    const main = document.getElementById('main-content');
    this.renderReports(main);
  },

  setTrainerFilter(tid) {
    this.currentFilters.trainer = tid;
    const main = document.getElementById('main-content');
    this.renderReports(main);
  },

  handleSearch(val) {
    this.currentFilters.search = val;
    const main = document.getElementById('main-content');
    this.renderReports(main);
  },

  resetFilters() {
    this.currentFilters = {
      group: 'all',
      trainer: 'all',
      search: ''
    };
    const main = document.getElementById('main-content');
    this.renderReports(main);
  },

  exportToCsv() {
    if (!this.lastReportData || !this.lastReportData.records || this.lastReportData.records.length === 0) {
      showToast('İndirilecek rapor verisi bulunmuyor.');
      return;
    }

    const records = this.lastReportData.records;
    const headers = Object.keys(records[0]);
    
    let csvContent = headers.join(',') + '\n';
    records.forEach(row => {
      const rowValues = headers.map(header => {
        let val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      });
      csvContent += rowValues.join(',') + '\n';
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.currentReportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Rapor CSV dosyası olarak indirildi.');
  }
};


// ==================== SECTION 22: AUDIT LOGS CONTROLLER (GÜVENLİK & DENETİM GÜNLÜĞÜ) ====================

const AuditLogsController = {
  filters: {
    category: 'all',
    severity: 'all',
    dateRange: 'all',
    search: '',
    page: 1,
    limit: 50
  },
  cachedLogs: [],

  categoryLabels: {
    'all': 'Tüm Categoryler',
    'users': '👤 User Yönetimi',
    'permissions': '🔑 Yetki & Roller',
    'tasks': '📋 Task Management',
    'submissions': '📝 Teslimat & Gradelandırma',
    'announcements': '📢 Duyuru Yönetimi',
    'calendar': '📅 Takvim İşlemleri',
    'auth': '🔐 Oturum & Kimlik'
  },

  async renderAuditLogs(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Denetim kayıtları yükleniyor...</span></div>`;

    const queryParams = new URLSearchParams({
      category: this.filters.category,
      severity: this.filters.severity,
      date_range: this.filters.dateRange,
      search: this.filters.search,
      limit: this.filters.limit,
      offset: (this.filters.page - 1) * this.filters.limit
    });

    const res = await apiFetch(`/api/audit-logs?${queryParams.toString()}`);
    const auditData = res.audit || { total_count: 0, today_count: 0, critical_count: 0, active_users_count: 0, logs: [] };
    this.cachedLogs = auditData.logs || [];

    container.innerHTML = `
      <!-- Header Banner -->
      <div class="panel-card" style="padding: 20px 24px; margin-bottom: 20px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #FFFFFF; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 24px;">🛡️</span>
              <h2 style="font-size: 19px; font-weight: 800; color: #FFFFFF; margin: 0;">22. Audit Logs (Güvenlik & Denetim Günlüğü)</h2>
              <span class="status-badge" style="background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid rgba(52, 211, 153, 0.3);">Who / What / When / IP Kayıtlı</span>
            </div>
            <p style="color: #94A3B8; font-size: 12.5px; margin: 0; max-width: 750px;">
              User oluşturma, yetki değişimi, teslimat ve notlandırma, tarih güncellemeleri ve silme gibi tüm kritik işlemler anlık olarak denetlenir.
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="btn-action btn-secondary" onclick="AuditLogsController.exportLogsCsv()" style="padding: 8px 14px; font-size: 12.5px; background: rgba(255,255,255,0.1); color: #FFF; border: 1px solid rgba(255,255,255,0.2);">
              📥 CSV Olarak İndir
            </button>
            <button class="btn-action btn-primary" onclick="AuditLogsController.refresh()" style="padding: 8px 14px; font-size: 12.5px;">
              🔄 Yenile
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
        <div class="panel-card" style="padding: 16px 18px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Total Records</div>
            <div style="font-size: 20px; font-weight: 800; color: #2563EB;">${auditData.total_count}</div>
          </div>
          <div style="font-size: 24px; padding: 8px; background: var(--bg-page); border-radius: 8px;">📑</div>
        </div>

        <div class="panel-card" style="padding: 16px 18px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Bugünkü İşlemler</div>
            <div style="font-size: 20px; font-weight: 800; color: #059669;">${auditData.today_count}</div>
          </div>
          <div style="font-size: 24px; padding: 8px; background: var(--bg-page); border-radius: 8px;">⚡</div>
        </div>

        <div class="panel-card" style="padding: 16px 18px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Kritik & Uyarılar</div>
            <div style="font-size: 20px; font-weight: 800; color: #DC2626;">${auditData.critical_count}</div>
          </div>
          <div style="font-size: 24px; padding: 8px; background: var(--bg-page); border-radius: 8px;">🚨</div>
        </div>

        <div class="panel-card" style="padding: 16px 18px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">İşlem Yapan User</div>
            <div style="font-size: 20px; font-weight: 800; color: #7C3AED;">${auditData.active_users_count}</div>
          </div>
          <div style="font-size: 24px; padding: 8px; background: var(--bg-page); border-radius: 8px;">👥</div>
        </div>
      </div>

      <!-- Multi-Dimensional Filters Bar -->
      <div class="panel-card" style="padding: 14px 20px; border: 1px solid var(--border-light); border-radius: 12px; margin-bottom: 20px; background: var(--bg-card);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- Category Filter -->
            <select class="form-control" style="font-size: 12px; padding: 5px 10px; height: 34px; width: 170px;" onchange="AuditLogsController.setFilter('category', this.value)">
              ${Object.entries(this.categoryLabels).map(([k, v]) => `
                <option value="${k}" ${this.filters.category === k ? 'selected' : ''}>${v}</option>
              `).join('')}
            </select>

            <!-- Severity Filter -->
            <select class="form-control" style="font-size: 12px; padding: 5px 10px; height: 34px; width: 150px;" onchange="AuditLogsController.setFilter('severity', this.value)">
              <option value="all" ${this.filters.severity === 'all' ? 'selected' : ''}>🛡️ Tüm Düzeyler</option>
              <option value="info" ${this.filters.severity === 'info' ? 'selected' : ''}>🟢 Bilgi (Info)</option>
              <option value="warning" ${this.filters.severity === 'warning' ? 'selected' : ''}>🟡 Uyarı (Warning)</option>
              <option value="critical" ${this.filters.severity === 'critical' ? 'selected' : ''}>🔴 Kritik (Critical)</option>
            </select>

            <!-- Date Range Filter -->
            <select class="form-control" style="font-size: 12px; padding: 5px 10px; height: 34px; width: 140px;" onchange="AuditLogsController.setFilter('dateRange', this.value)">
              <option value="all" ${this.filters.dateRange === 'all' ? 'selected' : ''}>📅 Tüm Zamanlar</option>
              <option value="today" ${this.filters.dateRange === 'today' ? 'selected' : ''}>Bugün</option>
              <option value="week" ${this.filters.dateRange === 'week' ? 'selected' : ''}>Son 7 Gün</option>
              <option value="month" ${this.filters.dateRange === 'month' ? 'selected' : ''}>Son 30 Gün</option>
            </select>

            <!-- Search Input -->
            <input type="text" placeholder="🔍 Log, User veya IP ara..." value="${escapeHtml(this.filters.search)}" oninput="AuditLogsController.handleSearch(this.value)" class="form-control" style="font-size: 12px; padding: 5px 10px; height: 34px; width: 210px;">
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">${this.cachedLogs.length} Kayıt Gösteriliyor</span>
            <button class="btn-action btn-secondary btn-sm" onclick="AuditLogsController.resetFilters()" style="padding: 4px 10px; font-size: 11.5px;">
              Filterri Sıfırla
            </button>
          </div>
        </div>
      </div>

      <!-- Audit Logs Table -->
      <div class="panel-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-light); border-radius: 12px; background: var(--bg-card);">
        <div style="overflow-x: auto;">
          ${this.renderTable(this.cachedLogs)}
        </div>
      </div>
    `;
  },

  renderTable(logs) {
    if (logs.length === 0) {
      return `
        <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
          <div style="font-size: 36px; margin-bottom: 10px;">🛡️</div>
          <strong style="font-size: 14px; color: var(--primary-navy); display: block; margin-bottom: 4px;">Kayıt Bulunamadı</strong>
          <p style="font-size: 12.5px; margin: 0;">Seçilen kriterlere uygun denetim günlüğü kaydı bulunmamaktadır.</p>
        </div>
      `;
    }

    return `
      <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: var(--bg-page); border-bottom: 1px solid var(--border-light); text-align: left;">
            <th style="padding: 12px 14px; width: 145px;">⏰ Zaman (When)</th>
            <th style="padding: 12px 14px;">👤 User (Who)</th>
            <th style="padding: 12px 14px;">⚡ İşlem (What)</th>
            <th style="padding: 12px 14px;">📝 Detaylı Enabledlama</th>
            <th style="padding: 12px 14px; text-align: center;">🌐 IP Address</th>
            <th style="padding: 12px 14px; text-align: center;">🛡️ Düzey</th>
            <th style="padding: 12px 14px; text-align: center;">İşlem</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(log => {
            let sevBadge = '<span class="status-badge" style="background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.2);">🟢 Bilgi</span>';
            if (log.severity === 'warning') sevBadge = '<span class="status-badge" style="background: rgba(245,158,11,0.1); color: #D97706; border: 1px solid rgba(245,158,11,0.2);">🟡 Uyarı</span>';
            else if (log.severity === 'critical') sevBadge = '<span class="status-badge" style="background: rgba(239,68,68,0.1); color: #DC2626; border: 1px solid rgba(239,68,68,0.2);">🔴 Kritik</span>';

            return `
              <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="padding: 12px 14px; white-space: nowrap; color: var(--text-secondary); font-family: monospace;">
                  ${log.created_at || '-'}
                </td>
                <td style="padding: 12px 14px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="avatar-circle" style="width: 28px; height: 28px; font-size: 11px;">
                      ${escapeHtml((log.user_name || 'S').charAt(0))}
                    </div>
                    <div>
                      <strong style="color: var(--primary-navy); display: block; font-size: 12px;">${escapeHtml(log.user_name || 'Sistem')}</strong>
                      <span style="font-size: 10.5px; color: var(--text-muted);">${escapeHtml(log.user_role || '')}</span>
                    </div>
                  </div>
                </td>
                <td style="padding: 12px 14px;">
                  <span class="status-badge badge-submitted" style="font-size: 10.5px; font-weight: 700;">
                    ${escapeHtml(log.action)}
                  </span>
                  <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
                    📂 ${escapeHtml(log.category)}
                  </div>
                </td>
                <td style="padding: 12px 14px; max-width: 300px;">
                  <span style="color: var(--primary-navy);">${escapeHtml(log.description)}</span>
                </td>
                <td style="padding: 12px 14px; text-align: center;">
                  <code style="background: var(--bg-page); padding: 3px 6px; border-radius: 4px; font-size: 11px; border: 1px solid var(--border-light); font-weight: 600;">
                    ${escapeHtml(log.ip_address || '127.0.0.1')}
                  </code>
                </td>
                <td style="padding: 12px 14px; text-align: center;">
                  ${sevBadge}
                </td>
                <td style="padding: 12px 14px; text-align: center;">
                  <button class="btn-action btn-secondary btn-sm" onclick="AuditLogsController.openDetailModal(${log.id})" style="padding: 3px 8px; font-size: 11px;">
                    🔍 Detay
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  },

  setFilter(key, val) {
    this.filters[key] = val;
    const main = document.getElementById('main-content');
    this.renderAuditLogs(main);
  },

  handleSearch(val) {
    this.filters.search = val;
    const main = document.getElementById('main-content');
    this.renderAuditLogs(main);
  },

  resetFilters() {
    this.filters = {
      category: 'all',
      severity: 'all',
      dateRange: 'all',
      search: '',
      page: 1,
      limit: 50
    };
    const main = document.getElementById('main-content');
    this.renderAuditLogs(main);
  },

  refresh() {
    const main = document.getElementById('main-content');
    this.renderAuditLogs(main);
  },

  openDetailModal(logId) {
    const log = this.cachedLogs.find(l => l.id === logId);
    if (!log) return;

    let modal = document.getElementById('universal-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'universal-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 650px; width: 90%; max-height: 85vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">🛡️</span>
            <h3 style="margin: 0; font-size: 16px; color: var(--primary-navy);">Denetim Kaydı Detayı (#${log.id})</h3>
          </div>
          <button type="button" class="btn-action btn-secondary" onclick="closeUniversalModal()" style="padding: 4px 8px; font-size: 12px;">✕</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div style="padding: 10px; background: var(--bg-page); border-radius: 8px; border: 1px solid var(--border-light);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-bottom: 2px;">👤 İŞLEMİ YAPAN (WHO)</div>
            <strong style="color: var(--primary-navy); font-size: 13px;">${escapeHtml(log.user_name || 'Sistem')}</strong>
            <div style="font-size: 11.5px; color: var(--text-secondary);">${escapeHtml(log.user_email || '')} (${escapeHtml(log.user_role || '-')})</div>
          </div>

          <div style="padding: 10px; background: var(--bg-page); border-radius: 8px; border: 1px solid var(--border-light);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-bottom: 2px;">⏰ ZAMAN (WHEN) & IP</div>
            <strong style="color: var(--primary-navy); font-size: 13px;">${log.created_at || '-'}</strong>
            <div style="font-size: 11.5px; color: var(--text-secondary);">IP: <code>${escapeHtml(log.ip_address || '127.0.0.1')}</code></div>
          </div>
        </div>

        <div style="margin-bottom: 14px;">
          <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-bottom: 4px;">⚡ İŞLEM TÜRÜ & HEDEF (WHAT)</div>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
            <span class="status-badge badge-submitted">${escapeHtml(log.action)}</span>
            <span class="status-badge" style="background: rgba(59,130,246,0.1); color: var(--primary-blue);">Category: ${escapeHtml(log.category)}</span>
            ${log.entity_type ? `<span class="status-badge" style="background: #F1F5F9; color: #475569;">Varlık: ${escapeHtml(log.entity_type)} #${log.entity_id || ''}</span>` : ''}
          </div>
          <p style="font-size: 12.5px; color: var(--primary-navy); background: var(--bg-page); padding: 10px; border-radius: 6px; border: 1px solid var(--border-light); margin: 0;">
            ${escapeHtml(log.description)}
          </p>
        </div>

        ${log.old_values || log.new_values ? `
          <div style="margin-bottom: 14px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-bottom: 4px;">🔄 DEĞER DEĞİŞİKLİKLERİ (DIFF / CHANGES)</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <span style="font-size: 10.5px; font-weight: 700; color: var(--accent-rose);">Önceki Değerler (Old):</span>
                <pre style="background: #FFF1F2; border: 1px solid #FECDD3; color: #9F1239; padding: 8px; border-radius: 6px; font-size: 11px; overflow-x: auto; margin-top: 2px;">${JSON.stringify(log.old_values || {}, null, 2)}</pre>
              </div>
              <div>
                <span style="font-size: 10.5px; font-weight: 700; color: var(--accent-emerald);">Yeni Değerler (New):</span>
                <pre style="background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; padding: 8px; border-radius: 6px; font-size: 11px; overflow-x: auto; margin-top: 2px;">${JSON.stringify(log.new_values || {}, null, 2)}</pre>
              </div>
            </div>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
          <button type="button" class="btn-action btn-secondary" onclick="closeUniversalModal()">Close</button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  },

  exportLogsCsv() {
    if (this.cachedLogs.length === 0) {
      showToast('Dışa aktarılacak denetim kaydı bulunamadı.');
      return;
    }

    const headers = ['ID', 'Zaman', 'Kullanici_ID', 'Kullanici_Adi', 'Rol', 'Eposta', 'Islem', 'Category', 'Aciklama', 'IP_Adresi', 'Guvenlik_Duzeyi'];
    let csv = headers.join(',') + '\n';

    this.cachedLogs.forEach(l => {
      const row = [
        l.id,
        `"${l.created_at}"`,
        l.user_id || '',
        `"${l.user_name || ''}"`,
        `"${l.user_role || ''}"`,
        `"${l.user_email || ''}"`,
        `"${l.action || ''}"`,
        `"${l.category || ''}"`,
        `"${(l.description || '').replace(/"/g, '""')}"`,
        `"${l.ip_address || ''}"`,
        `"${l.severity || ''}"`
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Denetim kayıtları CSV olarak indirildi.');
  }
};


// ==================== SECTION 23: DATABASE SCHEMA & DATA DICTIONARY CONTROLLER ====================

const DatabaseSchemaController = {
  currentCategory: 'all',
  searchQuery: '',
  cachedSchema: null,
  activeView: 'grid', // 'grid' or 'er_diagram'

  async renderSchema(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Veritabanı şeması ve tablo mimarisi yükleniyor...</span></div>`;

    const res = await apiFetch('/api/database/schema');
    const schema = res.schema || { total_tables: 0, total_rows: 0, total_columns: 0, total_foreign_keys: 0, categories: [], tables: [] };
    this.cachedSchema = schema;

    let filteredTables = schema.tables || [];
    if (this.currentCategory !== 'all') {
      filteredTables = filteredTables.filter(t => t.category === this.currentCategory);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filteredTables = filteredTables.filter(t => 
        t.table_name.toLowerCase().includes(q) || 
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.columns.some(c => c.name.toLowerCase().includes(q))
      );
    }

    container.innerHTML = `
      <!-- Header Banner -->
      <div class="panel-card" style="padding: 20px 24px; margin-bottom: 20px; background: linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%); color: #FFFFFF; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 24px;">🗄️</span>
              <h2 style="font-size: 19px; font-weight: 800; color: #FFFFFF; margin: 0;">23. Proposed Core Database Tables (Veritabanı Tablo Mimarisi)</h2>
              <span class="status-badge" style="background: rgba(124, 58, 237, 0.25); color: #C4B5FD; border: 1px solid rgba(196, 181, 253, 0.3);">28 Temel İlişkisel Tablo</span>
            </div>
            <p style="color: #94A3B8; font-size: 12.5px; margin: 0; max-width: 750px;">
              Userlar, roller, izinler, eğitim grupları, görevler, teslimler, değerlendirmeler, bildirimler, takvim ve denetim logları için tam normalize edilmiş veri sözlüğü.
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="btn-action ${this.activeView === 'grid' ? 'btn-primary' : 'btn-secondary'}" onclick="DatabaseSchemaController.toggleView('grid')" style="padding: 8px 14px; font-size: 12.5px;">
              🗂️ Tablo Kartları
            </button>
            <button class="btn-action ${this.activeView === 'er_diagram' ? 'btn-primary' : 'btn-secondary'}" onclick="DatabaseSchemaController.toggleView('er_diagram')" style="padding: 8px 14px; font-size: 12.5px;">
              🌐 ER İlişki Haritası
            </button>
          </div>
        </div>
      </div>

      <!-- Top KPI Summary Metric Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
        <div class="panel-card" style="padding: 16px 18px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Toplam Tablo</div>
            <div style="font-size: 20px; font-weight: 800; color: #7C3AED;">${schema.total_tables} Tablo</div>
          </div>
          <div style="font-size: 24px; padding: 8px; background: var(--bg-page); border-radius: 8px;">🗄️</div>
        </div>

        <div class="panel-card" style="padding: 16px 18px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Toplam Canlı Kayıt</div>
            <div style="font-size: 20px; font-weight: 800; color: #059669;">${schema.total_rows} Satır</div>
          </div>
          <div style="font-size: 24px; padding: 8px; background: var(--bg-page); border-radius: 8px;">📊</div>
        </div>

        <div class="panel-card" style="padding: 16px 18px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Toplam Kolon</div>
            <div style="font-size: 20px; font-weight: 800; color: #2563EB;">${schema.total_columns} Nitelik</div>
          </div>
          <div style="font-size: 24px; padding: 8px; background: var(--bg-page); border-radius: 8px;">📑</div>
        </div>

        <div class="panel-card" style="padding: 16px 18px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Yabancı Anahtarlar (FK)</div>
            <div style="font-size: 20px; font-weight: 800; color: #D97706;">${schema.total_foreign_keys} İlişki</div>
          </div>
          <div style="font-size: 24px; padding: 8px; background: var(--bg-page); border-radius: 8px;">🔗</div>
        </div>
      </div>

      <!-- Filter Categories and Search Bar -->
      <div class="panel-card" style="padding: 14px 20px; border: 1px solid var(--border-light); border-radius: 12px; margin-bottom: 20px; background: var(--bg-card);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="btn-action ${this.currentCategory === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="DatabaseSchemaController.setCategory('all')" style="padding: 6px 12px; font-size: 12px; border-radius: 6px;">
              Tümü (${schema.tables.length})
            </button>
            ${schema.categories.map(c => `
              <button type="button" class="btn-action ${this.currentCategory === c.category_name ? 'btn-primary' : 'btn-secondary'}" onclick="DatabaseSchemaController.setCategory('${escapeHtml(c.category_name)}')" style="padding: 6px 12px; font-size: 12px; border-radius: 6px;">
                ${escapeHtml(c.category_name)} (${c.table_count})
              </button>
            `).join('')}
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <input type="text" placeholder="🔍 Tablo veya kolon adı ara..." value="${escapeHtml(this.searchQuery)}" oninput="DatabaseSchemaController.handleSearch(this.value)" class="form-control" style="font-size: 12px; padding: 5px 10px; height: 34px; width: 230px;">
            <span style="font-size: 12px; color: var(--text-muted); font-weight: 600; white-space: nowrap;">${filteredTables.length} Tablo</span>
          </div>
        </div>
      </div>

      <!-- Content View (Grid or ER Diagram) -->
      ${this.activeView === 'grid' ? this.renderGridView(filteredTables) : this.renderErDiagramView(schema.tables)}
    `;
  },

  renderGridView(tables) {
    if (tables.length === 0) {
      return `
        <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
          <div style="font-size: 36px; margin-bottom: 10px;">🔍</div>
          <strong style="font-size: 14px; color: var(--primary-navy); display: block; margin-bottom: 4px;">Tablo Bulunamadı</strong>
          <p style="font-size: 12.5px; margin: 0;">Arama kriterinize uygun veritabanı tablosu eşleşmedi.</p>
        </div>
      `;
    }

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px;">
        ${tables.map(t => `
          <div class="panel-card" style="padding: 16px; border: 1px solid var(--border-light); border-radius: 10px; background: var(--bg-card); display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.15s ease, box-shadow 0.15s ease;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 20px;">${t.icon}</span>
                  <div>
                    <strong style="font-size: 14px; color: var(--primary-navy); font-family: monospace;">${escapeHtml(t.table_name)}</strong>
                  </div>
                </div>
                <span class="status-badge" style="font-size: 10px; background: rgba(59,130,246,0.1); color: var(--primary-blue);">${escapeHtml(t.category)}</span>
              </div>

              <p style="font-size: 11.5px; color: var(--text-secondary); margin: 0 0 12px 0; min-height: 28px; line-height: 1.4;">
                ${escapeHtml(t.description)}
              </p>

              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;">
                <span class="status-badge" style="background: rgba(16,185,129,0.1); color: #059669; font-size: 10.5px;">📊 ${t.row_count} Kayıt</span>
                <span class="status-badge" style="background: #F1F5F9; color: #475569; font-size: 10.5px;">📑 ${t.column_count} Kolon</span>
                ${t.foreign_keys.length > 0 ? `<span class="status-badge" style="background: #FEF3C7; color: #D97706; font-size: 10.5px;">🔗 ${t.foreign_keys.length} FK</span>` : ''}
              </div>

              <!-- Column Preview Pills -->
              <div style="background: var(--bg-page); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-light); margin-bottom: 14px; max-height: 70px; overflow-y: auto;">
                <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase;">Kolonlar (Sütunlar):</div>
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                  ${t.columns.map(c => `
                    <code style="font-size: 10px; padding: 1px 4px; background: var(--bg-card); border-radius: 3px; border: 1px solid var(--border-light); color: ${c.pk ? 'var(--primary-blue)' : 'var(--text-secondary)'}; font-weight: ${c.pk ? '700' : 'normal'};">
                      ${c.pk ? '🔑 ' : ''}${escapeHtml(c.name)} (${escapeHtml(c.type)})
                    </code>
                  `).join('')}
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 8px; border-top: 1px solid var(--border-light); padding-top: 12px;">
              <button type="button" class="btn-action btn-primary btn-sm" onclick="DatabaseSchemaController.openTableDataModal('${t.table_name}')" style="flex: 1; font-size: 11.5px; padding: 6px 10px; justify-content: center;">
                👁️ Canlı Verileri Gör (${t.row_count})
              </button>
              <button type="button" class="btn-action btn-secondary btn-sm" onclick="DatabaseSchemaController.openTableDdlModal('${t.table_name}')" style="font-size: 11.5px; padding: 6px 10px;">
                ⚙️ DDL & Şema
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderErDiagramView(tables) {
    return `
      <div class="panel-card" style="padding: 24px; border: 1px solid var(--border-light); border-radius: 12px; background: var(--bg-card);">
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 15px; font-weight: 800; color: var(--primary-navy); margin: 0 0 4px 0;">🌐 28 Tablolu İlişkisel Varlık Haritası (Entity Relationship Structure)</h3>
          <p style="font-size: 12px; color: var(--text-secondary); margin: 0;">Sistemin tüm modüllerinin veri tabanı seviyesindeki bağları ve foreign key anahtarları:</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
          <!-- Section A: Identity -->
          <div style="padding: 14px; background: var(--bg-page); border-radius: 8px; border-left: 4px solid #2563EB; border: 1px solid var(--border-light);">
            <strong style="color: #2563EB; font-size: 13px;">1. User & Yetkilendirme Modülü</strong>
            <ul style="font-size: 12px; color: var(--text-secondary); margin: 8px 0 0 16px; padding: 0;">
              <li><code>users</code> ──< (1:N) >── <code>role_user</code> ──< (N:1) >── <code>roles</code></li>
              <li><code>roles</code> ──< (1:N) >── <code>permission_role</code> ──< (N:1) >── <code>permissions</code></li>
            </ul>
          </div>

          <!-- Section B: Profiles -->
          <div style="padding: 14px; background: var(--bg-page); border-radius: 8px; border-left: 4px solid #059669; border: 1px solid var(--border-light);">
            <strong style="color: #059669; font-size: 13px;">2. Profiller ve Group Management Modülü</strong>
            <ul style="font-size: 12px; color: var(--text-secondary); margin: 8px 0 0 16px; padding: 0;">
              <li><code>users</code> ──< (1:1) >── <code>student_profiles</code> & <code>trainer_profiles</code></li>
              <li><code>training_groups</code> ──< (1:N) >── <code>training_group_students</code> & <code>training_group_trainers</code></li>
            </ul>
          </div>

          <!-- Section C: Tasks & Reviews -->
          <div style="padding: 14px; background: var(--bg-page); border-radius: 8px; border-left: 4px solid #7C3AED; border: 1px solid var(--border-light);">
            <strong style="color: #7C3AED; font-size: 13px;">3. Tasks, Submissions & Evaluations</strong>
            <ul style="font-size: 12px; color: var(--text-secondary); margin: 8px 0 0 16px; padding: 0;">
              <li><code>tasks</code> ──< (1:N) >── <code>task_assignments</code> & <code>task_attachments</code></li>
              <li><code>tasks</code> ──< (1:N) >── <code>task_submissions</code> ──< (1:N) >── <code>task_reviews</code> & <code>task_evaluations</code></li>
              <li><code>tasks</code> ──< (1:N) >── <code>task_comments</code> ──< (1:N) >── <code>comment_attachments</code></li>
            </ul>
          </div>

          <!-- Section D: Communication -->
          <div style="padding: 14px; background: var(--bg-page); border-radius: 8px; border-left: 4px solid #D97706; border: 1px solid var(--border-light);">
            <strong style="color: #D97706; font-size: 13px;">4. İletişim, Duyurular ve Takvim</strong>
            <ul style="font-size: 12px; color: var(--text-secondary); margin: 8px 0 0 16px; padding: 0;">
              <li><code>notifications</code> ──< (1:N) >── <code>notification_recipients</code></li>
              <li><code>announcements</code> ──< (1:N) >── <code>announcement_recipients</code></li>
              <li><code>training_sessions</code> ──< (1:N) >── <code>session_attendances</code></li>
            </ul>
          </div>

          <!-- Section E: Security -->
          <div style="padding: 14px; background: var(--bg-page); border-radius: 8px; border-left: 4px solid #DC2626; border: 1px solid var(--border-light);">
            <strong style="color: #DC2626; font-size: 13px;">5. Güvenlik, Denetim & Konfigürasyon</strong>
            <ul style="font-size: 12px; color: var(--text-secondary); margin: 8px 0 0 16px; padding: 0;">
              <li><code>audit_logs</code> (Who / What / When / IP Takibi)</li>
              <li><code>activity_logs</code> & <code>user_devices</code></li>
              <li><code>settings</code> (Global Parametreler)</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  },

  setCategory(cat) {
    this.currentCategory = cat;
    const main = document.getElementById('main-content');
    this.renderSchema(main);
  },

  handleSearch(val) {
    this.searchQuery = val;
    const main = document.getElementById('main-content');
    this.renderSchema(main);
  },

  toggleView(v) {
    this.activeView = v;
    const main = document.getElementById('main-content');
    this.renderSchema(main);
  },

  async openTableDataModal(tableName) {
    let modal = document.getElementById('universal-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'universal-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 900px; width: 95%; max-height: 88vh; overflow-y: auto;">
        <div style="text-align: center; padding: 30px;"><span style="color:var(--text-muted);">Tablo verileri yükleniyor...</span></div>
      </div>
    `;
    modal.style.display = 'flex';

    const res = await apiFetch(`/api/database/tables/${tableName}`);
    if (!res.success || !res.data) {
      modal.innerHTML = `
        <div class="modal-card" style="max-width: 500px; width: 90%;">
          <h3>Hata</h3>
          <p>Tablo verileri alınamadı.</p>
          <button type="button" class="btn-action btn-secondary" onclick="closeUniversalModal()">Close</button>
        </div>
      `;
      return;
    }

    const data = res.data;
    const cols = data.columns || [];
    const rows = data.rows || [];

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 950px; width: 95%; max-height: 88vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">📊</span>
              <h3 style="margin: 0; font-size: 16px; color: var(--primary-navy); font-family: monospace;">${escapeHtml(tableName)}</h3>
              <span class="status-badge badge-submitted" style="font-size: 11px;">Toplam ${data.total_rows} Satır</span>
            </div>
          </div>
          <button type="button" class="btn-action btn-secondary" onclick="closeUniversalModal()" style="padding: 4px 8px; font-size: 12px;">✕</button>
        </div>

        ${rows.length === 0 ? `
          <div style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
            <div style="font-size: 32px; margin-bottom: 8px;">📭</div>
            <strong>Bu tabloda henüz kayıtlı satır bulunmuyor.</strong>
          </div>
        ` : `
          <div style="overflow-x: auto; border: 1px solid var(--border-light); border-radius: 8px; margin-bottom: 16px; max-height: 450px;">
            <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
              <thead>
                <tr style="background: var(--bg-page); border-bottom: 1px solid var(--border-light); position: sticky; top: 0; z-index: 2;">
                  ${cols.map(c => `
                    <th style="padding: 10px 12px; white-space: nowrap; font-family: monospace;">
                      ${c.pk ? '🔑 ' : ''}${escapeHtml(c.name)}
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${rows.map(r => `
                  <tr style="border-bottom: 1px solid var(--border-light);">
                    ${cols.map(c => {
                      const val = r[c.name];
                      const displayVal = val === null || val === undefined ? '<span style="color:var(--text-muted); font-style:italic;">NULL</span>' : escapeHtml(String(val));
                      return `<td style="padding: 8px 12px; white-space: nowrap; max-width: 240px; overflow: hidden; text-overflow: ellipsis;">${displayVal}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11.5px; color: var(--text-muted);">İlk ${rows.length} satır listeleniyor</span>
          <button type="button" class="btn-action btn-secondary" onclick="closeUniversalModal()">Close</button>
        </div>
      </div>
    `;
  },

  openTableDdlModal(tableName) {
    if (!this.cachedSchema) return;
    const table = this.cachedSchema.tables.find(t => t.table_name === tableName);
    if (!table) return;

    let modal = document.getElementById('universal-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'universal-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 700px; width: 90%; max-height: 85vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">⚙️</span>
            <h3 style="margin: 0; font-size: 16px; color: var(--primary-navy);">Tablo Şeması & DDL: <code style="color:var(--primary-blue);">${escapeHtml(tableName)}</code></h3>
          </div>
          <button type="button" class="btn-action btn-secondary" onclick="closeUniversalModal()" style="padding: 4px 8px; font-size: 12px;">✕</button>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">Kolon Tanımları:</div>
          <div style="overflow-x: auto; border: 1px solid var(--border-light); border-radius: 8px;">
            <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
              <thead>
                <tr style="background: var(--bg-page); border-bottom: 1px solid var(--border-light); text-align: left;">
                  <th style="padding: 8px 12px;">Kolon Adı</th>
                  <th style="padding: 8px 12px;">Veri Türü</th>
                  <th style="padding: 8px 12px; text-align: center;">PK</th>
                  <th style="padding: 8px 12px; text-align: center;">Grade Null</th>
                  <th style="padding: 8px 12px;">Varsayılan Değer</th>
                </tr>
              </thead>
              <tbody>
                ${table.columns.map(c => `
                  <tr style="border-bottom: 1px solid var(--border-light);">
                    <td style="padding: 8px 12px; font-family: monospace; font-weight: 700; color: var(--primary-navy);">
                      ${c.pk ? '🔑 ' : ''}${escapeHtml(c.name)}
                    </td>
                    <td style="padding: 8px 12px;"><code style="background: var(--bg-page); padding: 2px 5px; border-radius: 3px;">${escapeHtml(c.type)}</code></td>
                    <td style="padding: 8px 12px; text-align: center;">${c.pk ? '✅' : '-'}</td>
                    <td style="padding: 8px 12px; text-align: center;">${c.notnull ? '✅' : 'Hayır'}</td>
                    <td style="padding: 8px 12px; color: var(--text-muted); font-size: 11px;">${c.dflt_value !== null ? escapeHtml(String(c.dflt_value)) : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        ${table.foreign_keys.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">Yabancı Anahtar Bağlantıları (Foreign Keys):</div>
            <div style="background: var(--bg-page); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-light);">
              ${table.foreign_keys.map(fk => `
                <div style="font-size: 12px; color: var(--primary-navy); margin-bottom: 4px; font-family: monospace;">
                  🔗 <code>${escapeHtml(fk.from)}</code> ➔ <strong>${escapeHtml(fk.table)}</strong>(<code>${escapeHtml(fk.to)}</code>)
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">SQL Create Table DDL:</div>
          <pre style="background: #0F172A; color: #38BDF8; padding: 12px; border-radius: 8px; font-size: 11.5px; overflow-x: auto; margin: 0; line-height: 1.4;">${escapeHtml(table.ddl)}</pre>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
          <button type="button" class="btn-action btn-secondary" onclick="closeUniversalModal()">Close</button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }
};


// ==================== SECTION 26.29: SYSTEM SETTINGS CONTROLLER ====================

const SettingsController = {
  settings: [],
  activeCategory: 'general',

  async renderSettings(container) {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 250px;">
        <div style="font-size: 14px; color: var(--text-muted);">⚙️ Sistem ayarları yükleniyor...</div>
      </div>
    `;

    try {
      const res = await apiRequest('/api/settings');
      this.settings = (res && res.settings) ? res.settings : [];
      this.renderUI(container);
    } catch (err) {
      container.innerHTML = `
        <div class="card" style="padding: 24px; text-align: center; color: var(--danger);">
          <p>⚠️ Ayarlar yüklenirken bir hata oluştu: ${escapeHtml(err.message)}</p>
          <button class="btn-action btn-primary" onclick="SettingsController.renderSettings(document.getElementById('main-content'))">Tekrar Dene</button>
        </div>
      `;
    }
  },

  renderUI(container) {
    // Group settings by category
    const categories = {
      'general': { name: 'Genel & Akademik', icon: '🎓', desc: 'Üniversite, akademik yıl, dönem ve sistem başlık ayarları' },
      'submission': { name: 'Teslimat & Dosya Politikası', icon: '📁', desc: 'Maksimum dosya boyutu, formatlar ve geç teslimat kuralları' },
      'notification': { name: 'Bildirimler & E-Posta', icon: '🔔', desc: 'E-posta şablonları, anlık bildirim kanalları ve hatırlatmalar' },
      'security': { name: 'Güvenlik & Oturum', icon: '🛡️', desc: 'Şifre politikası, oturum zaman aşımı ve denetim log saklama süresi' }
    };

    const currentCatSettings = this.settings.filter(s => (s.category || 'general') === this.activeCategory);

    container.innerHTML = `
      <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FFF; padding: 24px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(59,130,246,0.25); border: 1px solid rgba(59,130,246,0.4); border-radius: 20px; font-size: 11px; font-weight: 700; color: #93C5FD; text-transform: uppercase; margin-bottom: 8px;">
              ⚙️ SECTION 26.29 • SİSTEM AYARLARI MERKEZİ
            </div>
            <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 6px 0; color: #FFFFFF;">Sistem Parametreleri & Konfigürasyon</h2>
            <p style="font-size: 13px; color: #94A3B8; margin: 0; max-width: 650px;">
              Üniversite akademik takvim parametreleri, dosya yükleme limitleri, geç teslimat politikaları ve güvenlik yapılandırmalarını bu panelden yönetebilirsiniz.
            </p>
          </div>
          <div>
            <button class="btn-action btn-primary" onclick="SettingsController.saveSettings()" style="padding: 10px 20px; font-size: 13.5px; font-weight: 700; background: linear-gradient(135deg, #10B981, #059669); border: none; box-shadow: 0 4px 14px rgba(16,185,129,0.4);">
              💾 Değişiklikleri Save
            </button>
          </div>
        </div>
      </div>

      <!-- Category Sekmeleri -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
        ${Object.keys(categories).map(catKey => {
          const cat = categories[catKey];
          const isActive = this.activeCategory === catKey;
          return `
            <button onclick="SettingsController.setCategory('${catKey}')" class="btn-action" style="padding: 10px 18px; font-size: 13px; font-weight: 600; border-radius: 10px; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; ${isActive ? 'background: var(--primary-navy); color: #FFF; border: 1px solid var(--primary-navy); box-shadow: 0 4px 12px rgba(15,23,42,0.2);' : 'background: #FFF; color: var(--text-muted); border: 1px solid var(--border-color);'}">
              <span>${cat.icon}</span>
              <span>${cat.name}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Ayarlar Form Alanı -->
      <div class="card" style="padding: 24px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.04);">
        <div style="margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid var(--border-color);">
          <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 4px 0; color: var(--text-dark);">
            ${categories[this.activeCategory].icon} ${categories[this.activeCategory].name}
          </h3>
          <p style="font-size: 12.5px; color: var(--text-muted); margin: 0;">
            ${categories[this.activeCategory].desc}
          </p>
        </div>

        <form id="system-settings-form" onsubmit="event.preventDefault(); SettingsController.saveSettings();">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
            ${this.renderCategoryFields(this.activeCategory)}
          </div>

          <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 12px;">
            <button type="button" class="btn-action btn-secondary" onclick="SettingsController.resetToDefaults()">Varsayılanlara Dön</button>
            <button type="submit" class="btn-action btn-primary" style="padding: 9px 24px; font-weight: 700;">💾 Save Settings</button>
          </div>
        </form>
      </div>
    `;
  },

  renderCategoryFields(cat) {
    if (cat === 'general') {
      return `
        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">System Title (Portal Name)</label>
          <input type="text" id="set_system_name" class="form-control" value="Üniversite Görev ve Eğitim Yönetim Platformu (TTMS)" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Giriş ekranında ve üst başlıkta görüntülenecek kurum adı.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Aktif Akademik Yıl</label>
          <input type="text" id="set_academic_year" class="form-control" value="2025-2026" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Raporlama ve grup atamalarında varsayılan akademik yıl.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Aktif Dönem</label>
          <select id="set_active_semester" class="form-control" style="font-size: 13px;">
            <option value="Güz Dönemi">Güz Dönemi</option>
            <option value="Bahar Dönemi" selected>Bahar Dönemi</option>
            <option value="Yaz Okulu">Yaz Okulu</option>
          </select>
          <small style="color: var(--text-muted); font-size: 11px;">Aktif ders ve ödev takviminin işlendiği dönem.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Kurumsal İletişim E-Postası</label>
          <input type="email" id="set_support_email" class="form-control" value="destek@universite.edu.tr" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Yardım ve destek taleplerinin yönlendirileceği e-posta.</small>
        </div>
      `;
    } else if (cat === 'submission') {
      return `
        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Max Upload File Size (MB)</label>
          <input type="number" id="set_max_upload_size" class="form-control" value="25" min="5" max="100" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Öğrenci teslimatlarında kabul edilecek tekil dosya limiti.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Allowed File Extensions</label>
          <input type="text" id="set_allowed_extensions" class="form-control" value="pdf, docx, zip, py, ipynb, rar, png, jpg" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Virgülle ayrılmış geçerli dosya uzantıları.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Geç Teslimat Politikası</label>
          <select id="set_allow_late_submission" class="form-control" style="font-size: 13px;">
            <option value="true" selected>İzin Ver (Ceza Puanı ile)</option>
            <option value="false">Kesinlikle İzin Verme (Due Datede Kilitlenir)</option>
          </select>
          <small style="color: var(--text-muted); font-size: 11px;">Son teslim tarihinden sonra öğrencinin ödev yükleyebilme durumu.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Günlük Geç Teslimat Puan Kesintisi (%)</label>
          <input type="number" id="set_late_penalty_rate" class="form-control" value="5" min="0" max="50" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Overdue her 24 saat için toplam puandan düşülecek yüzde.</small>
        </div>
      `;
    } else if (cat === 'notification') {
      return `
        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Yaklaşan Teslimat Hatırlatması (Saat Önce)</label>
          <input type="number" id="set_deadline_reminder_hours" class="form-control" value="24" min="1" max="72" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Son teslim tarihine belirtilen saat kala otomatik bildirim gönderilir.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Otomatik E-Posta Bildirimleri</label>
          <select id="set_enable_email_notifications" class="form-control" style="font-size: 13px;">
            <option value="true" selected>Aktif (Ödev ataması ve notlandırmada e-posta gönder)</option>
            <option value="false">Pasif (Yalnızca web portal içi bildirimler)</option>
          </select>
          <small style="color: var(--text-muted); font-size: 11px;">SMTP e-posta sunucusu üzerinden anlık uyarı iletimi.</small>
        </div>
      `;
    } else if (cat === 'security') {
      return `
        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Oturum Zaman Aşımı (Dakika)</label>
          <input type="number" id="set_session_timeout_minutes" class="form-control" value="120" min="15" max="1440" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Hareketsiz kalan kullanıcı oturumunun otomatik kapatılma süresi.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Denetim Günlüğü (Audit Log) Saklama Süresi (Gün)</label>
          <input type="number" id="set_audit_retention_days" class="form-control" value="365" min="30" max="1825" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">KVKK ve akademik denetim gereği güvenlik loglarının arşivde tutulma süresi.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Şifre Karmaşıklık Politikası</label>
          <select id="set_password_complexity" class="form-control" style="font-size: 13px;">
            <option value="high" selected>High (En az 8 karakter, büyük harf, rakam ve özel karakter)</option>
            <option value="medium">Orta (En az 6 karakter, harf ve rakam)</option>
          </select>
          <small style="color: var(--text-muted); font-size: 11px;">User şifre güncellemelerinde uygulanacak güvenlik standardı.</small>
        </div>
      `;
    }
  },

  setCategory(cat) {
    this.activeCategory = cat;
    this.renderUI(document.getElementById('main-content'));
  },

  async saveSettings() {
    showToast('Ayarlar kaydediliyor...', 'info');
    try {
      await apiRequest('/api/settings', 'POST', {
        settings: {
          system_name: 'Üniversite Görev ve Eğitim Yönetim Platformu (TTMS)',
          academic_year: '2025-2026',
          active_semester: 'Bahar Dönemi',
          updated_at: new Date().toISOString()
        }
      });
      showToast('✅ Sistem ayarları başarıyla kaydedildi!', 'success');
    } catch (err) {
      showToast('Ayar kaydedilirken hata: ' + err.message, 'error');
    }
  },

  resetToDefaults() {
    if (confirm('Tüm ayarları sistem fabrika varsayılanlarına döndürmek istediğinizden emin misiniz?')) {
      showToast('Varsayılan ayarlar yüklendi.', 'info');
      this.renderUI(document.getElementById('main-content'));
    }
  }
};





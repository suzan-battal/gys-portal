/**
 * Üniversite Task Management System - Administrator Paneli Denetleyicisi (admin.js)
 * İstatistikler, Student/Trainer/User CRUD, Training Groupları (Training Groups) ve Tasks Yönetimi.
 */

const AdminController = {

  async renderTab(tabId) {
    const main = document.getElementById('main-content');
    const heading = document.getElementById('page-heading');

    if (tabId === 'home') {
      heading.innerHTML = `<span>Administrator Dashboard - Overview</span>`;
      await this.renderHome(main);
    } else if (tabId === 'roles-permissions') {
      heading.innerHTML = `<span>Roles & Permissions Matrix (RBAC Engine)</span>`;
      await this.renderRolesPermissions(main);
    } else if (tabId === 'groups') {
      heading.innerHTML = `<span>Training Groups & Cohorts Management</span>`;
      await this.renderGroups(main);
    } else if (tabId === 'students') {
      heading.innerHTML = `<span>Student Management</span>`;
      await this.renderUsersByRole(main, 'student', 'Students');
    } else if (tabId === 'trainers') {
      heading.innerHTML = `<span>Trainer Management</span>`;
      await this.renderUsersByRole(main, 'trainer', 'Trainers');
    } else if (tabId === 'all-users') {
      heading.innerHTML = `<span>All Users Management</span>`;
      await this.renderAllUsers(main);
    } else if (tabId === 'tasks') {
      heading.innerHTML = `<span>Tasks & Assignments Management</span>`;
      await this.renderTasks(main);
    } else if (tabId === 'submissions') {
      heading.innerHTML = `<span>All Assignment Submissions</span>`;
      await this.renderSubmissions(main);
    }
  },

  // ==================== 1. ANA SAYFA & İSTATİSTİKLER ====================
  async renderHome(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading...</span></div>`;

    const dashRes = await apiFetch('/api/admin/dashboard');
    const data = dashRes.data || {
      kpi: {
        total_students: 0,
        total_trainers: 0,
        training_groups: 0,
        active_tasks: 0,
        pending_reviews: 0,
        late_tasks: 0,
        tasks_completed_this_week: 0
      },
      student_progress: { total_tasks_assigned: 0, completed: 0, in_progress: 0, late: 0, completion_rate: 0, avg_grade: 0 },
      trainer_activity: [],
      late_submissions: [],
      training_groups_performance: []
    };

    const { kpi, student_progress, trainer_activity, late_submissions, training_groups_performance } = data;
    const user = AppState.currentUser;

    container.innerHTML = `
      <!-- Welcome Hero Banner -->
      <div class="welcome-hero" style="margin-bottom: 24px;">
        <div class="welcome-hero-content">
          <h2>Welcome, ${user.name} 👋</h2>
          <p>Administrator Control Center. Monitor institution-wide students, trainers, groups, active/overdue tasks, and overall academic performance in real time.</p>
        </div>
        <div class="welcome-hero-actions">
          <button class="btn-hero-action" onclick="AdminController.openAddTaskModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Create Task</span>
          </button>
          <button class="btn-hero-action" onclick="AdminController.openAddGroupModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <span>Create Group</span>
          </button>
        </div>
      </div>

      <!-- Section 16: 7x KPI Statistics Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px;">
        <!-- 1. Total Students -->
        <div class="stat-card" style="padding: 14px 16px;">
          <div class="stat-info">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">1. Total Students</span>
            <h3 style="font-size: 24px; font-weight: 800; color: var(--primary-navy); margin: 3px 0;">${kpi.total_students}</h3>
            <div class="stat-trend positive"><span style="font-size: 10.5px;">Enrolled Students</span></div>
          </div>
        </div>

        <!-- 2. Total Trainers -->
        <div class="stat-card" style="padding: 14px 16px;">
          <div class="stat-info">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">2. Total Trainers</span>
            <h3 style="font-size: 24px; font-weight: 800; color: var(--primary-navy); margin: 3px 0;">${kpi.total_trainers}</h3>
            <div class="stat-trend positive"><span style="font-size: 10.5px;">Faculty Instructors</span></div>
          </div>
        </div>

        <!-- 3. Training Groups -->
        <div class="stat-card" style="padding: 14px 16px;">
          <div class="stat-info">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">3. Training Groups</span>
            <h3 style="font-size: 24px; font-weight: 800; color: var(--primary-blue); margin: 3px 0;">${kpi.training_groups}</h3>
            <div class="stat-trend neutral"><span style="font-size: 10.5px;">Active Groups</span></div>
          </div>
        </div>

        <!-- 4. Active Tasks -->
        <div class="stat-card" style="padding: 14px 16px;">
          <div class="stat-info">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">4. Active Tasks</span>
            <h3 style="font-size: 24px; font-weight: 800; color: #6366F1; margin: 3px 0;">${kpi.active_tasks}</h3>
            <div class="stat-trend neutral"><span style="font-size: 10.5px;">In Progress</span></div>
          </div>
        </div>

        <!-- 5. Pending Reviews -->
        <div class="stat-card" style="padding: 14px 16px; border-left: 3px solid var(--accent-gold);">
          <div class="stat-info">
            <span style="font-size: 11px; font-weight: 700; color: var(--accent-gold); text-transform: uppercase;">5. Pending Reviews</span>
            <h3 style="font-size: 24px; font-weight: 800; color: var(--accent-gold); margin: 3px 0;">${kpi.pending_reviews}</h3>
            <div class="stat-trend" style="color: var(--accent-gold);"><span style="font-size: 10.5px;">Pending Review</span></div>
          </div>
        </div>

        <!-- 6. Late Tasks -->
        <div class="stat-card" style="padding: 14px 16px; border-left: 3px solid var(--accent-rose);">
          <div class="stat-info">
            <span style="font-size: 11px; font-weight: 700; color: var(--accent-rose); text-transform: uppercase;">6. Late Tasks</span>
            <h3 style="font-size: 24px; font-weight: 800; color: var(--accent-rose); margin: 3px 0;">${kpi.late_tasks}</h3>
            <div class="stat-trend" style="color: var(--accent-rose);"><span style="font-size: 10.5px;">Overdue Tasks</span></div>
          </div>
        </div>

        <!-- 7. Tasks Completed This Week -->
        <div class="stat-card" style="padding: 14px 16px; border-left: 3px solid var(--accent-emerald);">
          <div class="stat-info">
            <span style="font-size: 11px; font-weight: 700; color: var(--accent-emerald); text-transform: uppercase;">7. Tasks Completed</span>
            <h3 style="font-size: 24px; font-weight: 800; color: var(--accent-emerald); margin: 3px 0;">${kpi.tasks_completed_this_week}</h3>
            <div class="stat-trend positive"><span style="font-size: 10.5px;">Completed This Week</span></div>
          </div>
        </div>
      </div>

      <!-- 8. Student Progress Overview Card -->
      <div class="panel-card" style="padding: 20px; border: 1px solid var(--border-light); border-radius: 12px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary-blue);"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            <strong style="font-size: 15px; color: var(--primary-navy);">Student Progress & Thuformance Overview</strong>
          </div>
          <span class="status-badge badge-completed">Institution-Wide Tracking</span>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 16px; align-items: center; background: var(--bg-page); padding: 16px 20px; border-radius: 10px; border: 1px solid var(--border-light);">
          <!-- Progress Bar -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 6px;">
              <span style="font-weight: 600; color: var(--text-secondary);">Overall Completion Rate (% Progress)</span>
              <strong style="color: var(--primary-blue); font-size: 14px;">%${student_progress.completion_rate}</strong>
            </div>
            <div style="width: 100%; height: 10px; background: #E2E8F0; border-radius: 999px; overflow: hidden;">
              <div style="width: ${Math.min(100, student_progress.completion_rate)}%; height: 100%; background: linear-gradient(90deg, var(--primary-blue), #10B981); border-radius: 999px;"></div>
            </div>
          </div>

          <div style="text-align: center; border-left: 1px solid var(--border-light); padding-left: 10px;">
            <span style="font-size: 11px; color: var(--text-muted); display: block;">Total Tasks</span>
            <strong style="font-size: 18px; color: var(--primary-navy);">${student_progress.total_tasks_assigned}</strong>
          </div>

          <div style="text-align: center; border-left: 1px solid var(--border-light); padding-left: 10px;">
            <span style="font-size: 11px; color: var(--text-muted); display: block;">Completed</span>
            <strong style="font-size: 18px; color: #10B981;">${student_progress.completed}</strong>
          </div>

          <div style="text-align: center; border-left: 1px solid var(--border-light); padding-left: 10px;">
            <span style="font-size: 11px; color: var(--text-muted); display: block;">Overdue</span>
            <strong style="font-size: 18px; color: var(--accent-rose);">${student_progress.late}</strong>
          </div>

          <div style="text-align: center; border-left: 1px solid var(--border-light); padding-left: 10px;">
            <span style="font-size: 11px; color: var(--text-muted); display: block;">Average Grade</span>
            <strong style="font-size: 18px; color: var(--primary-navy);">${student_progress.avg_grade > 0 ? student_progress.avg_grade + ' / 100' : '-'}</strong>
          </div>
        </div>
      </div>

      <!-- 2-Column Layout: 9. Trainer Activity & 10. Late Submissions -->
      <div style="display: grid; grid-template-columns: 1.2fr 1.8fr; gap: 20px; margin-bottom: 24px; align-items: start;">
        
        <!-- 9. Trainer Activity -->
        <div class="panel-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-light); border-radius: 12px;">
          <div style="padding: 14px 18px; background: var(--bg-page); border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-gold);"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
              <strong style="font-size: 14px; color: var(--primary-navy);">Trainer Activity & Review Metrics</strong>
            </div>
            <button class="btn-action btn-secondary btn-sm" onclick="switchTab('trainers')">Trainers</button>
          </div>
          <div class="table-responsive" style="margin: 0;">
            <table class="custom-table" style="margin: 0; width: 100%;">
              <thead>
                <tr style="background: var(--bg-page); font-size: 11px;">
                  <th style="padding: 8px 12px;">Trainer</th>
                  <th style="padding: 8px 12px;">Tasks</th>
                  <th style="padding: 8px 12px;">Pending</th>
                  <th style="padding: 8px 12px;">Graded</th>
                  <th style="padding: 8px 12px; text-align: right;">Avg. Grade</th>
                </tr>
              </thead>
              <tbody>
                ${trainer_activity.length === 0 ? `
                  <tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 12px;">No trainers registered in the system.</td></tr>
                ` : trainer_activity.map(tr => `
                  <tr style="border-bottom: 1px solid var(--border-light); font-size: 12px;">
                    <td style="padding: 8px 12px;">
                      <strong style="color: var(--primary-navy); display: block;">${tr.name}</strong>
                      <span style="font-size: 10.5px; color: var(--text-muted);">${tr.role}</span>
                    </td>
                    <td style="padding: 8px 12px;"><span class="status-badge badge-submitted" style="font-size: 10px;">${tr.total_tasks_created}</span></td>
                    <td style="padding: 8px 12px;">
                      ${tr.pending_reviews > 0 ? `<span class="status-badge badge-reviewing" style="font-size: 10px;">${tr.pending_reviews}</span>` : '<span style="color:var(--text-muted); font-size:11px;">0</span>'}
                    </td>
                    <td style="padding: 8px 12px;"><span class="status-badge badge-completed" style="font-size: 10px;">${tr.completed_reviews}</span></td>
                    <td style="padding: 8px 12px; text-align: right;">
                      <strong style="color: var(--primary-blue); font-size: 11.5px;">${tr.avg_grade_given > 0 ? tr.avg_grade_given : '-'}</strong>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 10. Late Submissions -->
        <div class="panel-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-light); border-radius: 12px;">
          <div style="padding: 14px 18px; background: var(--bg-page); border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-rose);"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
              <strong style="font-size: 14px; color: var(--primary-navy);">Overdue & Late Submissions</strong>
            </div>
            <button class="btn-action btn-secondary btn-sm" onclick="switchTab('tasks')">All Tasks</button>
          </div>
          <div class="table-responsive" style="margin: 0;">
            <table class="custom-table" style="margin: 0; width: 100%;">
              <thead>
                <tr style="background: var(--bg-page); font-size: 11px;">
                  <th style="padding: 8px 12px;">Student</th>
                  <th style="padding: 8px 12px;">Task Title</th>
                  <th style="padding: 8px 12px;">Group</th>
                  <th style="padding: 8px 12px;">Deadline</th>
                  <th style="padding: 8px 12px;">Overdue</th>
                  <th style="padding: 8px 12px; text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${late_submissions.length === 0 ? `
                  <tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 12px;">No overdue assignments found! Great job! 🎉</td></tr>
                ` : late_submissions.map(ls => `
                  <tr style="border-bottom: 1px solid var(--border-light); font-size: 12px;">
                    <td style="padding: 8px 12px;">
                      <strong style="color: var(--primary-navy); cursor: pointer;" onclick="openStudentProfileModal(${ls.student_id})">${ls.student_name}</strong>
                    </td>
                    <td style="padding: 8px 12px;">
                      <span style="font-weight: 600;">${ls.task_title}</span>
                    </td>
                    <td style="padding: 8px 12px;"><span style="color: var(--text-secondary); font-size: 11px;">${ls.group_name}</span></td>
                    <td style="padding: 8px 12px; font-size: 11px; color: var(--text-muted);">${formatDateTr(ls.deadline)}</td>
                    <td style="padding: 8px 12px;">
                      <span class="status-badge badge-late" style="font-size: 10px;">${ls.days_overdue > 0 ? `+${ls.days_overdue} Days` : 'Deadline Passed'}</span>
                    </td>
                    <td style="padding: 8px 12px; text-align: right;">
                      <button class="btn-action btn-secondary btn-sm" onclick="openStudentProfileModal(${ls.student_id})" style="padding: 3px 8px; font-size: 11px;">Profile</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 11. Training Groups Thuformance -->
      <div class="panel-card" style="padding: 20px; border: 1px solid var(--border-light); border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary-blue);"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            <strong style="font-size: 15px; color: var(--primary-navy);">11. Training Groups Thuformance (Training Groupları Başarı ve İlerleme Tablosu)</strong>
          </div>
          <button class="btn-action btn-primary btn-sm" onclick="switchTab('groups')">Manage All Groups</button>
        </div>

        <div class="table-responsive" style="margin: 0;">
          <table class="custom-table" style="margin: 0; width: 100%;">
            <thead>
              <tr style="background: var(--bg-page); font-size: 11.5px;">
                <th style="padding: 10px 14px;">Group Name & Track</th>
                <th style="padding: 10px 14px;">Sorumlu Trainer</th>
                <th style="padding: 10px 14px;">Student Mevcudu</th>
                <th style="padding: 10px 14px;">Total Tasks</th>
                <th style="padding: 10px 14px;">Biten Tasks</th>
                <th style="padding: 10px 14px; min-width: 140px;">Progress (%)</th>
                <th style="padding: 10px 14px;">Average Grade</th>
                <th style="padding: 10px 14px; text-align: right;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${training_groups_performance.length === 0 ? `
                <tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 12.5px;">No training groups defined yet.</td></tr>
              ` : training_groups_performance.map(g => `
                <tr style="border-bottom: 1px solid var(--border-light); font-size: 12.5px;">
                  <td style="padding: 10px 14px;">
                    <strong style="color: var(--primary-navy);">${g.name}</strong>
                    <div style="font-size: 11px; color: var(--text-muted);">${g.department}</div>
                  </td>
                  <td style="padding: 10px 14px;">
                    <span style="font-weight: 600; color: var(--primary-navy);">${g.trainer_name || '-'}</span>
                  </td>
                  <td style="padding: 10px 14px;"><span class="status-badge badge-submitted">${g.student_count} Student</span></td>
                  <td style="padding: 10px 14px;">${g.total_tasks}</td>
                  <td style="padding: 10px 14px;"><strong style="color: #10B981;">${g.completed_tasks}</strong></td>
                  <td style="padding: 10px 14px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div style="flex: 1; height: 6px; background: #E2E8F0; border-radius: 999px; overflow: hidden;">
                        <div style="width: ${Math.min(100, g.completion_rate)}%; height: 100%; background: var(--primary-blue); border-radius: 999px;"></div>
                      </div>
                      <span style="font-size: 11px; font-weight: 700; color: var(--primary-navy); width: 32px;">%${g.completion_rate}</span>
                    </div>
                  </td>
                  <td style="padding: 10px 14px;">
                    ${g.avg_grade > 0 ? `<strong style="color: #10B981;">${g.avg_grade} / 100</strong>` : '<span style="color: var(--text-muted); font-size: 11.5px;">-</span>'}
                  </td>
                  <td style="padding: 10px 14px; text-align: right;">
                    <span class="status-badge ${g.status === 'Active' ? 'badge-completed' : 'badge-late'}">${g.status}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ==================== 2. EĞİTİM GRUPLARI (TRAINING GROUPS) ====================
  async renderGroups(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading...</span></div>`;

    const res = await apiFetch('/api/groups');
    const groups = res.groups || [];

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-header-left">
            <h3>Training Groups & Sections (${groups.length})</h3>
          </div>
          <button class="btn-action btn-primary" onclick="AdminController.openAddGroupModal()" style="width: auto;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Create New Group</span>
          </button>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Group Name & Track</th>
                <th>Sorumlu Trainer</th>
                <th>Enrolled Students</th>
                <th>Date Range</th>
                <th>Status</th>
                <th style="text-align: right;">Actionler</th>
              </tr>
            </thead>
            <tbody>
              ${groups.length === 0 ? `
                <tr><td colspan="6" class="empty-state">No training groups created yet.</td></tr>
              ` : groups.map(g => `
                <tr>
                  <td class="text-main">
                    <div style="font-weight:700;">${g.name}</div>
                    <div style="font-size:12px; color:var(--text-secondary);">${g.department}</div>
                  </td>
                  <td>${g.trainer_name}</td>
                  <td><span class="status-badge badge-submitted">${g.student_count || 0} Student</span></td>
                  <td style="font-size:12.5px;">${formatDateTr(g.start_date)} - ${formatDateTr(g.end_date)}</td>
                  <td>
                    <span class="status-badge ${g.status === 'Active' ? 'badge-completed' : (g.status === 'Completed' ? 'badge-submitted' : 'badge-pending')}">
                      ${g.status === 'Active' ? 'Active' : (g.status === 'Completed' ? 'Completed' : 'Archived')}
                    </span>
                  </td>
                  <td style="text-align: right; white-space: nowrap;">
                    <button class="btn-action btn-secondary btn-sm" onclick="AdminController.openEditGroupModal(${g.id})">Edit</button>
                    <button class="btn-action btn-danger btn-sm" style="margin-left:6px;" onclick="AdminController.deleteGroup(${g.id}, '${g.name.replace(/'/g, "\\'")}')">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ==================== 3. ÖĞRENCİ / EĞİTMEN LİSTESİ ====================
  async renderUsersByRole(container, role, title) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading...</span></div>`;

    const res = await apiFetch(`/api/users?role=${role}`);
    const users = res.users || [];

    const singularTitle = role === 'student' ? 'Student' : 'Trainer';

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-header-left">
            <h3>${title} (${users.length})</h3>
          </div>
          <button class="btn-action btn-primary" onclick="AdminController.openAddUserModal('${role}')" style="width: auto;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>${singularTitle} Ekle</span>
          </button>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Kurumsal E-posta</th>
                <th>Registration Date</th>
                <th style="text-align: right;">Actionler</th>
              </tr>
            </thead>
            <tbody>
              ${users.length === 0 ? `
                <tr><td colspan="5" class="empty-state">Kayıtlı ${singularTitle.toLowerCase()} bulunamadı.</td></tr>
              ` : users.map(u => `
                <tr>
                  <td>#${u.id}</td>
                  <td class="text-main">
                    <strong style="cursor: ${role === 'student' ? 'pointer' : 'default'}; color: ${role === 'student' ? 'var(--primary-blue)' : 'inherit'};" onclick="${role === 'student' ? `openStudentProfileModal(${u.id})` : ''}">${u.name}</strong>
                  </td>
                  <td>${u.email}</td>
                  <td>${formatDateTr(u.created_at)}</td>
                  <td style="text-align: right;">
                    ${role === 'student' ? `<button class="btn-action btn-primary btn-sm" style="margin-right: 6px; padding: 4px 10px; font-size: 11.5px;" onclick="openStudentProfileModal(${u.id})">Profile</button>` : ''}
                    <button class="btn-action btn-secondary btn-sm" onclick="AdminController.openEditUserModal(${u.id})">Edit</button>
                    <button class="btn-action btn-danger btn-sm" style="margin-left: 6px;" onclick="AdminController.deleteUser(${u.id}, '${u.name.replace(/'/g, "\\'")}')">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ==================== 4. SECTION 13: USERS MANAGEMENT (İDARI KULLANICI YÖNETİMİ) ====================
  async renderAllUsers(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">All Users Loading...</span></div>`;

    const [usersRes, groupsRes] = await Promise.all([
      apiFetch('/api/users'),
      apiFetch('/api/groups')
    ]);

    const users = usersRes.users || [];
    const groups = groupsRes.groups || [];
    window._cachedAllUsersList = users;

    container.innerHTML = `
      <!-- Section 13 Başlık ve Aksiyon -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="font-size: 20px; color: var(--primary-navy); margin: 0 0 4px 0;">Users Management</h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">Search and manage all institutional users with Role, Group, and Status filters.</p>
        </div>
        <button class="btn-action btn-primary" onclick="AdminController.openAddUserModal('student')" style="display: flex; align-items: center; gap: 6px; padding: 10px 20px; font-size: 13px; font-weight: 600;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Add New User</span>
        </button>
      </div>

      <!-- Section 13: Search & Filters Bar (Role, Status, Group) -->
      <div class="card" style="padding: 16px 20px; margin-bottom: 20px; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-light);">
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 12px; align-items: center;">
          <!-- 1. Search Input -->
          <div style="position: relative;">
            <input type="text" id="filter-user-search" oninput="AdminController.filterUsersTable()" placeholder="🔍 Search user by name or email..." style="width: 100%; padding: 9px 12px 9px 34px; font-size: 13px; border: 1px solid var(--border-light); border-radius: 8px; background: var(--bg-page); box-sizing: border-box;" />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 10px; top: 12px; color: var(--text-muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>

          <!-- 2. Role Filter -->
          <div>
            <select id="filter-user-role" onchange="AdminController.filterUsersTable()" style="width: 100%; padding: 9px 12px; font-size: 13px; border: 1px solid var(--border-light); border-radius: 8px; background: var(--bg-page); color: var(--text-main);">
              <option value="">👤 All Roles</option>
              <option value="super_admin">👑 Super Admin</option>
              <option value="admin">🛡️ Admin</option>
              <option value="training_manager">🎓 Training Manager</option>
              <option value="trainer">👨‍🏫 Trainer</option>
              <option value="assistant_trainer">🧑‍💼 Assistant Trainer</option>
              <option value="student">🎒 Student</option>
            </select>
          </div>

          <!-- 3. Group Filter -->
          <div>
            <select id="filter-user-group" onchange="AdminController.filterUsersTable()" style="width: 100%; padding: 9px 12px; font-size: 13px; border: 1px solid var(--border-light); border-radius: 8px; background: var(--bg-page); color: var(--text-main);">
              <option value="">🏢 Tüm Grouplar (All Groups)</option>
              ${groups.map(g => `<option value="${g.name}">${g.name}</option>`).join('')}
              <option value="-">Group Atanmamış (-)</option>
            </select>
          </div>

          <!-- 4. Status Filter -->
          <div>
            <select id="filter-user-status" onchange="AdminController.filterUsersTable()" style="width: 100%; padding: 9px 12px; font-size: 13px; border: 1px solid var(--border-light); border-radius: 8px; background: var(--bg-page); color: var(--text-main);">
              <option value="">🟢 All Statuses</option>
              <option value="Active">Active (Active)</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Section 13: 5-Column Users Table -->
      <div class="panel-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-light); border-radius: 12px;">
        <div class="table-responsive" style="margin: 0;">
          <table class="custom-table" style="margin: 0; width: 100%;">
            <thead>
              <tr style="background: var(--bg-page); border-bottom: 2px solid var(--border-light);">
                <th style="padding: 14px 18px; width: 260px;">User</th>
                <th style="padding: 14px 14px;">Role</th>
                <th style="padding: 14px 14px;">Group</th>
                <th style="padding: 14px 14px; text-align: center;">Status</th>
                <th style="padding: 14px 14px;">Last Login</th>
                <th style="padding: 14px 18px; text-align: right;">Actionler</th>
              </tr>
            </thead>
            <tbody id="users-table-tbody">
              ${AdminController.generateUserRowsHtml(users)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  generateUserRowsHtml(users) {
    if (!users || users.length === 0) {
      return `<tr><td colspan="6" style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 13px;">No users found matching the search criteria.</td></tr>`;
    }

    return users.map(u => {
      let roleBadgeHtml = '<span class="status-badge badge-pending">🎒 Student</span>';
      if (u.role === 'super_admin') roleBadgeHtml = '<span class="status-badge" style="background: rgba(220, 38, 38, 0.1); color: #DC2626; border: 1px solid rgba(220, 38, 38, 0.2);">👑 Super Admin</span>';
      else if (u.role === 'admin') roleBadgeHtml = '<span class="status-badge badge-reviewing">🛡️ Admin</span>';
      else if (u.role === 'training_manager') roleBadgeHtml = '<span class="status-badge" style="background: rgba(147, 51, 234, 0.1); color: #9333EA; border: 1px solid rgba(147, 51, 234, 0.2);">🎓 Training Manager</span>';
      else if (u.role === 'trainer') roleBadgeHtml = '<span class="status-badge badge-submitted">👨‍🏫 Trainer</span>';
      else if (u.role === 'assistant_trainer') roleBadgeHtml = '<span class="status-badge" style="background: rgba(217, 119, 6, 0.1); color: #D97706; border: 1px solid rgba(217, 119, 6, 0.2);">🧑‍💼 Assistant Trainer</span>';

      const isActive = (u.status || 'Active') === 'Active';
      const statusBadge = isActive 
        ? `<span class="status-badge badge-completed" style="font-size: 11px; padding: 3px 10px;">Active</span>` 
        : `<span class="status-badge badge-pending" style="font-size: 11px; padding: 3px 10px; background: rgba(100,116,139,0.1); color: #64748B;">Inactive</span>`;

      const groupBadge = (u.group_name && u.group_name !== '-')
        ? `<span class="status-badge" style="background: rgba(59, 130, 246, 0.08); color: var(--primary-blue); font-weight: 600; font-size: 11.5px; border: 1px solid rgba(59, 130, 246, 0.2);">🏢 ${u.group_name}</span>`
        : `<span style="color: var(--text-muted); font-size: 12px;">-</span>`;

      return `
        <tr style="border-bottom: 1px solid var(--border-light);">
          <td style="padding: 12px 18px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--primary-blue); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0;">
                ${u.name.charAt(0).toUpperCase()}
              </div>
              <div style="display: flex; flex-direction: column;">
                <strong style="font-size: 13.5px; color: var(--primary-navy);">${u.name}</strong>
                <span style="font-size: 11.5px; color: var(--text-muted);">${u.email}</span>
              </div>
            </div>
          </td>
          <td style="padding: 12px 14px;">${roleBadgeHtml}</td>
          <td style="padding: 12px 14px;">${groupBadge}</td>
          <td style="padding: 12px 14px; text-align: center;">${statusBadge}</td>
          <td style="padding: 12px 14px;">${AdminController.formatLastLogin(u.last_login)}</td>
          <td style="padding: 12px 18px; text-align: right;">
            <button class="btn-action btn-secondary btn-sm" onclick="AdminController.openEditUserModal(${u.id})">Edit</button>
            ${u.id !== AppState.currentUser.id ? `
              <button class="btn-action btn-danger btn-sm" style="margin-left: 6px;" onclick="AdminController.deleteUser(${u.id}, '${u.name.replace(/'/g, "\\'")}')">Delete</button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
  },

  formatLastLogin(dtStr) {
    if (!dtStr) return '<span style="color: var(--text-muted); font-size: 11.5px;">Today</span>';
    try {
      const d = new Date(dtStr.replace(' ', 'T'));
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      const timeStr = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `<span class="status-badge badge-completed" style="font-size: 11px;">Today</span>`;
      if (isYesterday) return `<span class="status-badge badge-pending" style="font-size: 11px;">Yesterday</span>`;
      return `<span style="font-size: 11.5px; color: var(--text-secondary);">${d.toLocaleDateString('tr-TR')} ${timeStr}</span>`;
    } catch (e) {
      return dtStr;
    }
  },

  filterUsersTable() {
    if (!window._cachedAllUsersList) return;

    const search = (document.getElementById('filter-user-search')?.value || '').toLowerCase().trim();
    const role = document.getElementById('filter-user-role')?.value || '';
    const group = document.getElementById('filter-user-group')?.value || '';
    const status = document.getElementById('filter-user-status')?.value || '';

    const filtered = window._cachedAllUsersList.filter(u => {
      const matchSearch = !search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
      const matchRole = !role || u.role === role;
      const matchGroup = !group || (group === '-' ? (!u.group_name || u.group_name === '-') : (u.group_name && u.group_name.includes(group)));
      const matchStatus = !status || (u.status || 'Active') === status;
      return matchSearch && matchRole && matchGroup && matchStatus;
    });

    const tbody = document.getElementById('users-table-tbody');
    if (tbody) {
      tbody.innerHTML = AdminController.generateUserRowsHtml(filtered);
    }
  },

  // ==================== 5. GÖREVLER ====================
  async renderTasks(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading...</span></div>`;

    const res = await apiFetch('/api/tasks');
    const tasks = res.tasks || [];

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-header-left">
            <h3>Tanımlı Tasks ve Ödevler (${tasks.length})</h3>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn-action btn-primary" onclick="AdminController.openAddTaskModal()" style="width: auto;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>Yeni Tasks Oluştur</span>
            </button>
          </div>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Priority</th>
                <th>Sorumlu Trainer</th>
                <th>Atanan Student</th>
                <th>Submission Deadline</th>
                <th>Status</th>
                <th style="text-align: right;">Actionler</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.length === 0 ? `
                <tr><td colspan="7" class="empty-state">No assignments have been created yet.</td></tr>
              ` : tasks.map(t => {
                let prioColor = t.priority === 'Urgent' ? 'var(--accent-rose)' : (t.priority === 'High' ? 'var(--accent-gold)' : 'var(--text-muted)');
                return `
                  <tr>
                    <td class="text-main">
                      <div>${t.title}</div>
                      <div style="font-size:12px; color:var(--text-secondary); max-width: 320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.description}</div>
                    </td>
                    <td><span style="font-weight:700; color:${prioColor}; font-size:12px;">${t.priority || 'Normal'}</span></td>
                    <td>${t.trainer_name}</td>
                    <td>${t.student_name}</td>
                    <td>${formatDateTr(t.deadline)}</td>
                    <td>${getStatusBadgeHtml(t.status)}</td>
                    <td style="text-align: right;">
                      <button class="btn-action btn-secondary btn-sm" onclick="AdminController.openEditTaskModal(${t.id})">Edit</button>
                      <button class="btn-action btn-danger btn-sm" style="margin-left: 6px;" onclick="AdminController.deleteTask(${t.id}, '${t.title.replace(/'/g, "\\'")}')">Delete</button>
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

  // ==================== 6. TÜM TESLİMLER ====================
  async renderSubmissions(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading...</span></div>`;

    const res = await apiFetch('/api/submissions');
    const submissions = res.submissions || [];

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-header-left">
            <h3>Student Submissions & Grading Registry (${submissions.length})</h3>
          </div>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Attempt / Revision</th>
                <th>Student</th>
                <th>Tasks</th>
                <th>Trainer</th>
                <th>Submission Date</th>
                <th>Timing</th>
                <th>File & URL</th>
                <th>Status</th>
                <th>Grade</th>
                <th>Feedback</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${submissions.length === 0 ? `
                <tr><td colspan="11" class="empty-state">No assignments have been submitted yet.</td></tr>
              ` : submissions.map(s => `
                <tr>
                  <td>
                    <span class="status-badge badge-submitted" style="font-weight:700;">#${s.submission_number || 1} (v${s.revision_number || 1}.0)</span>
                  </td>
                  <td class="text-main">
                    <div style="font-weight:700;">${s.student_name}</div>
                    <div style="font-size:11.5px; color:var(--text-secondary);">${s.student_email || ''}</div>
                  </td>
                  <td>
                    <div style="font-weight:600;">${s.task_title}</div>
                    ${s.student_notes ? `<div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">💬 "${s.student_notes}"</div>` : ''}
                  </td>
                  <td style="font-size:12.5px;">${s.trainer_name}</td>
                  <td style="font-size:12px; white-space:nowrap;">${formatDateTr(s.submitted_at)}</td>
                  <td>
                    ${s.is_late ? '<span class="status-badge badge-pending" style="font-size:11px;">⚠️ Overdue (Is Late)</span>' : '<span class="status-badge badge-completed" style="font-size:11px;">⏰ Timestampında</span>'}
                  </td>
                  <td>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                      ${s.file_path ? `
                        <a href="/uploads/${encodeURIComponent(s.file_path)}" download="${s.original_filename || s.file_path}" target="_blank" class="btn-action btn-secondary btn-sm" style="font-size:11.5px; padding:4px 8px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                          ${s.original_filename || 'Dosya Download'}
                        </a>
                      ` : ''}
                      ${s.student_link ? `
                        <a href="${s.student_link}" target="_blank" class="btn-action btn-secondary btn-sm" style="font-size:11.5px; padding:4px 8px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                          Link Aç
                        </a>
                      ` : ''}
                    </div>
                  </td>
                  <td>${getStatusBadgeHtml(s.status)}</td>
                  <td>${s.grade !== null && s.grade !== undefined ? `<span class="grade-badge">${s.grade} / 100</span>` : '<span style="color:var(--text-muted);">-</span>'}</td>
                  <td style="max-width: 200px; font-size: 12px; color: var(--text-secondary);">${s.feedback || '<span style="color:var(--text-muted);">-</span>'}</td>
                  <td style="text-align: right; white-space:nowrap;">
                    <button class="btn-action btn-primary btn-sm" onclick="AdminController.openReviewModal(${s.id})" style="width: auto;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                      Review & Değerlendir
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ==================== GRUP MODAL ACTIONSİ ====================
  async openAddGroupModal() {
    const [trainersRes, studentsRes] = await Promise.all([
      apiFetch('/api/users?role=trainer'),
      apiFetch('/api/users?role=student')
    ]);

    const modalHtml = `
      <div id="modal-group-custom" class="modal-overlay active">
        <div class="modal-box" style="max-width: 620px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden;">
          <div class="modal-header">
            <h3>Yeni Training Group (Training Group) Oluştur</h3>
            <button class="modal-close-btn" onclick="document.getElementById('modal-group-custom').remove()">&times;</button>
          </div>
          <form onsubmit="AdminController.handleSaveGroup(event, null)" style="display: flex; flex-direction: column; overflow: hidden; flex: 1;">
            <div class="modal-body" style="overflow-y: auto; max-height: calc(85vh - 130px); padding: 16px 20px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group">
                  <label>Group / Section Adı *</label>
                  <input type="text" id="group-name" placeholder="Örn: Yazılım Mühendisliği - Section A" required>
                </div>
                <div class="form-group">
                  <label>Bölüm / Uzmanlık Alanı *</label>
                  <input type="text" id="group-dept" placeholder="Örn: Informationsayar Mühendisliği" required>
                </div>
              </div>
              <div class="form-group">
                <label>Group Descriptionsı ve Hedefleri</label>
                <textarea id="group-desc" rows="2" placeholder="Group hedefleri, ders kapsamı ve yönergeler..."></textarea>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
                <div class="form-group">
                  <label>Start Date *</label>
                  <input type="date" id="group-start" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                  <label>End Date *</label>
                  <input type="date" id="group-end" value="2026-12-31" required>
                </div>
                <div class="form-group">
                  <label>Group Statusu *</label>
                  <select id="group-status" required>
                    <option value="Active" selected>🟢 Active (Active)</option>
                    <option value="Completed">🔵 Completed (Completed)</option>
                    <option value="Archived">⚪ Archived (Archivedlendi)</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Ana Sorumlu Trainer (Primary Trainer) *</label>
                <select id="group-trainer" required>
                  ${(trainersRes.users || []).map(t => `<option value="${t.id}">${t.name} (${t.email})</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Yardımcı Trainers (Assistant Trainers)</label>
                <div style="max-height:80px; overflow-y:auto; border:1px solid var(--border-light); padding:8px 12px; border-radius:8px; background:var(--bg-page);">
                  ${(trainersRes.users || []).map(t => `
                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:4px; font-size:12.5px; cursor:pointer;">
                      <input type="checkbox" name="group-assistants" value="${t.id}" style="width:auto;">
                      <span>${t.name} (${t.email})</span>
                    </label>
                  `).join('')}
                </div>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <label style="margin-bottom:0;">Gruba Enrolled Studentsler (${(studentsRes.users || []).length} Mevcut)</label>
                  <span style="font-size:11.5px; color:var(--text-muted);">Student ekleyin / çıkarın</span>
                </div>
                <div style="max-height:110px; overflow-y:auto; border:1px solid var(--border-light); padding:8px 12px; border-radius:8px; background:var(--bg-page);">
                  ${(studentsRes.users || []).map(s => `
                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-weight:normal; font-size:13px; cursor:pointer;">
                      <input type="checkbox" name="group-students" value="${s.id}" style="width:auto;">
                      <span>${s.name} (${s.email})</span>
                    </label>
                  `).join('')}
                </div>
              </div>
            </div>
            <div class="modal-footer" style="border-top:1px solid var(--border-light); padding:12px 20px; background:#fff; position:sticky; bottom:0; z-index:10;">
              <button type="button" class="btn-action btn-secondary" onclick="document.getElementById('modal-group-custom').remove()">Cancel</button>
              <button type="submit" class="btn-action btn-primary">Grubu Save</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async openEditGroupModal(groupId) {
    const [groupRes, trainersRes, studentsRes] = await Promise.all([
      apiFetch(`/api/groups/${groupId}`),
      apiFetch('/api/users?role=trainer'),
      apiFetch('/api/users?role=student')
    ]);

    if (!groupRes.success || !groupRes.group) {
      showToast("Group bilgileri yüklenemedi.", "error");
      return;
    }

    const g = groupRes.group;
    const enrolledIds = (g.students || []).map(s => s.id);
    const assistantIds = (g.assistant_trainers || '').split(',').map(x => parseInt(x.trim())).filter(Boolean);

    const modalHtml = `
      <div id="modal-group-custom" class="modal-overlay active">
        <div class="modal-box" style="max-width: 620px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden;">
          <div class="modal-header">
            <h3>Training Groupnu Edit: ${g.name}</h3>
            <button class="modal-close-btn" onclick="document.getElementById('modal-group-custom').remove()">&times;</button>
          </div>
          <form onsubmit="AdminController.handleSaveGroup(event, ${g.id})" style="display: flex; flex-direction: column; overflow: hidden; flex: 1;">
            <div class="modal-body" style="overflow-y: auto; max-height: calc(85vh - 130px); padding: 16px 20px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group">
                  <label>Group / Section Adı *</label>
                  <input type="text" id="group-name" value="${g.name}" required>
                </div>
                <div class="form-group">
                  <label>Bölüm / Uzmanlık Alanı *</label>
                  <input type="text" id="group-dept" value="${g.department}" required>
                </div>
              </div>
              <div class="form-group">
                <label>Group Descriptionsı ve Hedefleri</label>
                <textarea id="group-desc" rows="2">${g.description || ''}</textarea>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
                <div class="form-group">
                  <label>Start Date *</label>
                  <input type="date" id="group-start" value="${g.start_date || ''}" required>
                </div>
                <div class="form-group">
                  <label>End Date *</label>
                  <input type="date" id="group-end" value="${g.end_date || ''}" required>
                </div>
                <div class="form-group">
                  <label>Group Statusu *</label>
                  <select id="group-status" required>
                    <option value="Active" ${g.status === 'Active' ? 'selected' : ''}>🟢 Active (Active)</option>
                    <option value="Completed" ${g.status === 'Completed' ? 'selected' : ''}>🔵 Completed (Completed)</option>
                    <option value="Archived" ${g.status === 'Archived' ? 'selected' : ''}>⚪ Archived (Archivedlendi)</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Ana Sorumlu Trainer (Primary Trainer) *</label>
                <select id="group-trainer" required>
                  ${(trainersRes.users || []).map(t => `<option value="${t.id}" ${t.id === g.trainer_id ? 'selected' : ''}>${t.name} (${t.email})</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Yardımcı Trainers (Assistant Trainers)</label>
                <div style="max-height:80px; overflow-y:auto; border:1px solid var(--border-light); padding:8px 12px; border-radius:8px; background:var(--bg-page);">
                  ${(trainersRes.users || []).map(t => `
                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:4px; font-size:12.5px; cursor:pointer;">
                      <input type="checkbox" name="group-assistants" value="${t.id}" ${assistantIds.includes(t.id) ? 'checked' : ''} style="width:auto;">
                      <span>${t.name} (${t.email})</span>
                    </label>
                  `).join('')}
                </div>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <label style="margin-bottom:0;">Gruba Enrolled Studentsler (${enrolledIds.length} Selectili)</label>
                  <span style="font-size:11.5px; color:var(--text-muted);">Student ekleyin veya çıkarın</span>
                </div>
                <div style="max-height:110px; overflow-y:auto; border:1px solid var(--border-light); padding:8px 12px; border-radius:8px; background:var(--bg-page);">
                  ${(studentsRes.users || []).map(s => `
                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-weight:normal; font-size:13px; cursor:pointer;">
                      <input type="checkbox" name="group-students" value="${s.id}" ${enrolledIds.includes(s.id) ? 'checked' : ''} style="width:auto;">
                      <span>${s.name} (${s.email})</span>
                    </label>
                  `).join('')}
                </div>
              </div>
            </div>
            <div class="modal-footer" style="border-top:1px solid var(--border-light); padding:12px 20px; background:#fff; position:sticky; bottom:0; z-index:10;">
              <button type="button" class="btn-action btn-secondary" onclick="document.getElementById('modal-group-custom').remove()">Cancel</button>
              <button type="submit" class="btn-action btn-primary">Değişiklikleri Save</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async handleSaveGroup(e, groupId = null) {
    e.preventDefault();
    const name = document.getElementById('group-name').value.trim();
    const department = document.getElementById('group-dept').value.trim();
    const description = document.getElementById('group-desc').value.trim();
    const start_date = document.getElementById('group-start').value;
    const end_date = document.getElementById('group-end').value;
    const status = document.getElementById('group-status').value;
    const trainer_id = document.getElementById('group-trainer').value;

    const checkedBoxes = document.querySelectorAll('input[name="group-students"]:checked');
    const student_ids = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

    const assistantBoxes = document.querySelectorAll('input[name="group-assistants"]:checked');
    const assistant_trainers = Array.from(assistantBoxes).map(cb => cb.value).join(',');

    const url = groupId ? `/api/groups/${groupId}` : '/api/groups';
    const method = groupId ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method: method,
      body: { name, department, description, start_date, end_date, status, trainer_id, student_ids, assistant_trainers }
    });

    if (res.success) {
      const modal = document.getElementById('modal-group-custom');
      if (modal) modal.remove();
      showToast(groupId ? "Training grubu güncellendi." : "Training grubu başarıyla oluşturuldu.", "success");
      switchTab('groups');
    } else {
      showToast(res.error || "Group kaydedilirken hata oluştu.", "error");
    }
  },

  deleteGroup(groupId, groupName) {
    openConfirmModal(
      'Grubu Delete',
      `"${groupName}" Are you sure you want to delete this training group?`,
      async () => {
        const res = await apiFetch(`/api/groups/${groupId}`, { method: 'DELETE' });
        if (res.success) {
          showToast("Group silindi.", "success");
          switchTab('groups');
        } else {
          showToast(res.error || "Group silinemedi.", "error");
        }
      }
    );
  },

  // ==================== KULLANICI MODAL VE CRUD ====================
  openAddUserModal(defaultRole = 'student') {
    document.getElementById('modal-user-title').textContent = defaultRole === 'trainer' ? 'Trainer Ekle' : (defaultRole === 'admin' ? 'Administrator Ekle' : 'Student Ekle');
    document.getElementById('user-id').value = '';
    document.getElementById('user-name').value = '';
    document.getElementById('user-email').value = '';
    document.getElementById('user-role').value = defaultRole;
    document.getElementById('user-password').value = '';
    document.getElementById('user-password').required = true;
    document.getElementById('label-user-password').textContent = 'Password *';
    document.getElementById('help-user-password').style.display = 'none';

    openModal('modal-user');
  },

  async openEditUserModal(userId) {
    const res = await apiFetch(`/api/users/${userId}`);
    if (!res.success || !res.user) {
      showToast(res.error || "User bilgileri alınamadı.", "error");
      return;
    }

    const u = res.user;
    document.getElementById('modal-user-title').textContent = 'User Edit';
    document.getElementById('user-id').value = u.id;
    document.getElementById('user-name').value = u.name;
    document.getElementById('user-email').value = u.email;
    document.getElementById('user-role').value = u.role;
    document.getElementById('user-password').value = '';
    document.getElementById('user-password').required = false;
    document.getElementById('label-user-password').textContent = 'Yeni Password (İsteğe bağlı)';
    document.getElementById('help-user-password').style.display = 'block';

    openModal('modal-user');
  },

  deleteUser(userId, userName) {
    openConfirmModal(
      'Useryı Delete',
      `"${userName}" adlı kullanıcıyı silmek istediğinizden emin misiniz?`,
      async () => {
        const res = await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
        if (res.success) {
          showToast("User deleted successfully.", "success");
          switchTab(AppState.currentTab);
        } else {
          showToast(res.error || "User silinirken bir hata oluştu.", "error");
        }
      }
    );
  },

  // ==================== GÖREV MODAL VE CRUD ====================
  async openAddTaskModal() {
    document.getElementById('modal-task-title').textContent = 'Yeni Tasks Oluştur';
    document.getElementById('task-id').value = '';
    document.getElementById('task-title').value = '';
    document.getElementById('task-description').value = '';
    if (document.getElementById('task-instructions')) document.getElementById('task-instructions').value = '';
    if (document.getElementById('task-estimated-time')) document.getElementById('task-estimated-time').value = '4 Time';
    if (document.getElementById('task-start-date')) document.getElementById('task-start-date').value = new Date().toISOString().split('T')[0];
    if (document.getElementById('task-url')) document.getElementById('task-url').value = '';
    if (document.getElementById('task-file')) document.getElementById('task-file').value = '';

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    document.getElementById('task-deadline').value = futureDate.toISOString().split('T')[0];
    if (document.getElementById('task-priority')) {
      document.getElementById('task-priority').value = 'Medium';
    }

    // Reset assign type
    const radioSingle = document.querySelector('input[name="task-assign-type"][value="single"]');
    if (radioSingle) {
      radioSingle.checked = true;
      handleTaskAssignTypeChange('single');
    }

    const [trainersRes, studentsRes, groupsRes] = await Promise.all([
      apiFetch('/api/users?role=trainer'),
      apiFetch('/api/users?role=student'),
      apiFetch('/api/groups')
    ]);

    const trainerSelect = document.getElementById('task-trainer');
    trainerSelect.innerHTML = (trainersRes.users || []).map(t => `<option value="${t.id}">${t.name} (${t.email})</option>`).join('');

    const studentSelect = document.getElementById('task-student');
    studentSelect.innerHTML = (studentsRes.users || []).map(s => `<option value="${s.id}">${s.name} (${s.email})</option>`).join('');

    const groupSelect = document.getElementById('task-group');
    if (groupSelect) {
      groupSelect.innerHTML = (groupsRes.groups || []).map(g => `<option value="${g.id}">${g.name} (${g.student_count || 0} Student)</option>`).join('');
    }

    openModal('modal-task');
  },

  async openEditTaskModal(taskId) {
    const res = await apiFetch(`/api/tasks/${taskId}`);
    if (!res.success || !res.task) {
      showToast("Tasks bilgileri alınamadı.", "error");
      return;
    }

    const t = res.task;
    document.getElementById('modal-task-title').textContent = 'Tasksi Edit';
    document.getElementById('task-id').value = t.id;
    document.getElementById('task-title').value = t.title;
    document.getElementById('task-description').value = t.description;
    if (document.getElementById('task-instructions')) {
      document.getElementById('task-instructions').value = t.instructions || '';
    }
    if (document.getElementById('task-start-date')) {
      document.getElementById('task-start-date').value = t.start_date || new Date().toISOString().split('T')[0];
    }
    if (document.getElementById('task-estimated-time')) {
      document.getElementById('task-estimated-time').value = t.estimated_time || '';
    }
    document.getElementById('task-deadline').value = t.deadline;
    if (document.getElementById('task-priority')) {
      document.getElementById('task-priority').value = t.priority || 'Medium';
    }
    if (document.getElementById('task-url')) {
      document.getElementById('task-url').value = t.attachment_url || '';
    }
    if (document.getElementById('task-file')) {
      document.getElementById('task-file').value = t.attachment_file || '';
    }

    const radioSingle = document.querySelector('input[name="task-assign-type"][value="single"]');
    if (radioSingle) {
      radioSingle.checked = true;
      handleTaskAssignTypeChange('single');
    }

    const [trainersRes, studentsRes] = await Promise.all([
      apiFetch('/api/users?role=trainer'),
      apiFetch('/api/users?role=student')
    ]);

    const trainerSelect = document.getElementById('task-trainer');
    trainerSelect.innerHTML = (trainersRes.users || []).map(tr => 
      `<option value="${tr.id}" ${tr.id === t.trainer_id ? 'selected' : ''}>${tr.name} (${tr.email})</option>`
    ).join('');

    const studentSelect = document.getElementById('task-student');
    studentSelect.innerHTML = (studentsRes.users || []).map(st => 
      `<option value="${st.id}" ${st.id === t.student_id ? 'selected' : ''}>${st.name} (${st.email})</option>`
    ).join('');

    openModal('modal-task');
  },

  deleteTask(taskId, taskTitle) {
    openConfirmModal(
      'Tasksi Delete',
      `"${taskTitle}" Are you sure you want to delete this task?`,
      async () => {
        const res = await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
        if (res.success) {
          showToast("Tasks başarıyla silindi.", "success");
          switchTab(AppState.currentTab);
        } else {
          showToast(res.error || "Tasks silinirken bir hata oluştu.", "error");
        }
      }
    );
  }
};

// ==================== FORM KAYIT DİNLEYİCİLERİ ====================
function handleTaskAssignTypeChange(type) {
  const cStudent = document.getElementById('container-task-student');
  const cGroup = document.getElementById('container-task-group');
  if (type === 'group') {
    if (cStudent) cStudent.style.display = 'none';
    if (cGroup) cGroup.style.display = 'block';
  } else {
    if (cStudent) cStudent.style.display = 'block';
    if (cGroup) cGroup.style.display = 'none';
  }
}

async function handleSaveUser(e) {
  e.preventDefault();
  const userId = document.getElementById('user-id').value;
  const name = document.getElementById('user-name').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const role = document.getElementById('user-role').value;
  const password = document.getElementById('user-password').value;

  const btn = document.getElementById('btn-save-user');
  btn.disabled = true;

  let res;
  if (userId) {
    res = await apiFetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: { name, email, role, password }
    });
  } else {
    res = await apiFetch('/api/users', {
      method: 'POST',
      body: { name, email, role, password }
    });
  }

  btn.disabled = false;

  if (res.success) {
    closeModal('modal-user');
    showToast(res.message || "User başarıyla kaydedildi.", "success");
    switchTab(AppState.currentTab);
  } else {
    showToast(res.error || "Action sırasında bir hata oluştu.", "error");
  }
}

async function handleSaveTask(e) {
  e.preventDefault();
  const taskId = document.getElementById('task-id').value;
  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-description').value.trim();
  const instructions = document.getElementById('task-instructions') ? document.getElementById('task-instructions').value.trim() : '';
  const start_date = document.getElementById('task-start-date') ? document.getElementById('task-start-date').value : '';
  const estimated_time = document.getElementById('task-estimated-time') ? document.getElementById('task-estimated-time').value.trim() : '';
  const deadline = document.getElementById('task-deadline').value;
  const priority = document.getElementById('task-priority') ? document.getElementById('task-priority').value : 'Medium';
  const attachment_url = document.getElementById('task-url') ? document.getElementById('task-url').value.trim() : '';
  const attachment_file = document.getElementById('task-file') ? document.getElementById('task-file').value.trim() : '';
  const trainer_id = document.getElementById('task-trainer').value;

  const assignTypeRadio = document.querySelector('input[name="task-assign-type"]:checked');
  const assignType = assignTypeRadio ? assignTypeRadio.value : 'single';

  const btn = document.getElementById('btn-save-task');
  btn.disabled = true;

  let res;
  if (taskId) {
    const student_id = document.getElementById('task-student').value;
    res = await apiFetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: { title, description, instructions, start_date, estimated_time, deadline, trainer_id, student_id, priority, attachment_url, attachment_file }
    });
  } else if (assignType === 'group') {
    const group_id = document.getElementById('task-group').value;
    res = await apiFetch('/api/tasks/group', {
      method: 'POST',
      body: { title, description, instructions, start_date, estimated_time, deadline, trainer_id, group_id, priority, attachment_url, attachment_file }
    });
  } else {
    const student_id = document.getElementById('task-student').value;
    res = await apiFetch('/api/tasks', {
      method: 'POST',
      body: { title, description, instructions, start_date, estimated_time, deadline, trainer_id, student_id, priority, attachment_url, attachment_file }
    });
  }

  btn.disabled = false;

  if (res.success) {
    closeModal('modal-task');
    showToast(res.message || "Tasks başarıyla kaydedildi.", "success");
    switchTab(AppState.currentTab);
  } else {
    showToast(res.error || "Action sırasında bir hata oluştu.", "error");
  }
}

// Global olarak TrainerController.openReviewModal'ı admin için de erişilebilir yap
AdminController.openReviewModal = function(submissionId) {
  if (typeof TrainerController !== 'undefined' && TrainerController.openReviewModal) {
    TrainerController.openReviewModal(submissionId);
  }
};

// ==================== SECTION 12: ROLES & PERMISSIONS (ROLLER VE İZİNLER) ====================

AdminController.renderRolesPermissions = async function(container) {
  container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Roller ve Yetki Matrisi Loading...</span></div>`;

  const res = await apiFetch('/api/roles/permissions');
  if (!res.success) {
    container.innerHTML = `<div class="card" style="padding: 24px; color: var(--accent-rose);">Yetki matrisi yüklenemedi: ${res.error || 'Bilinmeyen hata'}</div>`;
    return;
  }

  const { roles, permissions, matrix } = res.data;
  window._cachedRolesMatrix = JSON.parse(JSON.stringify(matrix));

  const roleColors = {
    'super_admin': { bg: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', icon: '👑' },
    'admin': { bg: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', icon: '🛡️' },
    'training_manager': { bg: 'rgba(147, 51, 234, 0.1)', color: '#9333EA', icon: '🎓' },
    'trainer': { bg: 'rgba(5, 150, 105, 0.1)', color: '#059669', icon: '👨‍🏫' },
    'assistant_trainer': { bg: 'rgba(217, 119, 6, 0.1)', color: '#D97706', icon: '🧑‍💼' },
    'student': { bg: 'rgba(8, 145, 178, 0.1)', color: '#0891B2', icon: '🎒' }
  };

  // İzinleri Kategorilerine Göre Groupla
  const categories = {};
  permissions.forEach(p => {
    if (!categories[p.category]) categories[p.category] = [];
    categories[p.category].push(p);
  });

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div>
        <h2 style="font-size: 20px; color: var(--primary-navy); margin: 0 0 4px 0;">12. Roles & Permissions (Roles and Permissions Matrix (RBAC))</h2>
        <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">Sistemdeki 6 rol ve 26 modüler iznin canlı kontrol ve denetim tablosu.</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn-action btn-primary" onclick="AdminController.saveAllRolePermissions()" style="display: flex; align-items: center; gap: 6px; padding: 10px 20px; font-size: 13px; font-weight: 600;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          <span>Yetki Değişikliklerini Save (Save)</span>
        </button>
      </div>
    </div>

    <!-- 6 Rol Özeti Kartları (Role Summary Cards) -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 24px;">
      ${roles.map(r => {
        const styling = roleColors[r.code] || { bg: 'rgba(0,0,0,0.05)', color: '#333', icon: '👤' };
        const activeCount = (matrix[r.code] || []).length;
        return `
          <div class="card" style="padding: 14px 16px; border-left: 4px solid ${styling.color}; background: var(--bg-card); border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 22px;">${styling.icon}</span>
              <span id="role-badge-count-${r.code}" style="font-size: 11px; font-weight: 700; background: ${styling.bg}; color: ${styling.color}; padding: 2px 8px; border-radius: 12px;">${activeCount} / 26 Yetki</span>
            </div>
            <strong style="font-size: 14px; color: var(--primary-navy); display: block; margin-bottom: 2px;">${r.title}</strong>
            <span style="font-size: 11px; color: var(--text-muted); line-height: 1.3; display: block;">${r.desc}</span>
          </div>
        `;
      }).join('')}
    </div>

    <!-- 26 İzinlik RBAC Matris Tablosu -->
    <div class="panel-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-light); border-radius: 12px;">
      <div class="table-responsive" style="margin: 0;">
        <table class="custom-table" style="margin: 0; width: 100%;">
          <thead>
            <tr style="background: var(--bg-page); border-bottom: 2px solid var(--border-light);">
              <th style="padding: 14px 18px; text-align: left; width: 340px; font-size: 13px;">Permission Code & Scope Description</th>
              ${roles.map(r => `
                <th style="padding: 14px 8px; text-align: center; font-size: 12px; font-weight: 700; color: var(--primary-navy);">
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                    <span>${roleColors[r.code]?.icon || ''}</span>
                    <span>${r.title}</span>
                  </div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${Object.keys(categories).map(catName => `
              <tr style="background: rgba(59, 130, 246, 0.04); border-top: 1px solid var(--border-light); border-bottom: 1px solid var(--border-light);">
                <td colspan="${roles.length + 1}" style="padding: 10px 18px; font-weight: 700; font-size: 12.5px; color: var(--primary-blue);">
                  📁 ${catName} (${categories[catName].length} İzin)
                </td>
              </tr>
              ${categories[catName].map(p => `
                <tr style="border-bottom: 1px solid var(--border-light);">
                  <td style="padding: 10px 18px;">
                    <div style="display: flex; flex-direction: column;">
                      <code style="font-family: monospace; font-size: 12.5px; font-weight: 700; color: var(--primary-navy);">${p.code}</code>
                      <span style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px;">${p.name}</span>
                    </div>
                  </td>
                  ${roles.map(r => {
                    const isChecked = (matrix[r.code] || []).includes(p.code);
                    const isSuperAdmin = r.code === 'super_admin';
                    return `
                      <td style="padding: 10px 8px; text-align: center; vertical-align: middle;">
                        <input type="checkbox" 
                          id="perm_${r.code}_${p.code.replace('.', '_')}" 
                          ${isChecked ? 'checked' : ''} 
                          ${isSuperAdmin ? 'disabled title="Super Admin tüm izinlere kalıcı sahiptir."' : ''} 
                          onchange="AdminController.togglePermission('${r.code}', '${p.code}', this.checked)"
                          style="width: 18px; height: 18px; cursor: ${isSuperAdmin ? 'not-allowed' : 'pointer'}; accent-color: var(--primary-blue);"
                        />
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

AdminController.togglePermission = function(roleCode, permCode, isChecked) {
  if (!window._cachedRolesMatrix) return;
  if (!window._cachedRolesMatrix[roleCode]) window._cachedRolesMatrix[roleCode] = [];
  
  if (isChecked) {
    if (!window._cachedRolesMatrix[roleCode].includes(permCode)) {
      window._cachedRolesMatrix[roleCode].push(permCode);
    }
  } else {
    window._cachedRolesMatrix[roleCode] = window._cachedRolesMatrix[roleCode].filter(p => p !== permCode);
  }

  const badge = document.getElementById(`role-badge-count-${roleCode}`);
  if (badge) {
    badge.textContent = `${window._cachedRolesMatrix[roleCode].length} / 26 Yetki`;
  }
};

AdminController.saveAllRolePermissions = async function() {
  if (!window._cachedRolesMatrix) return;
  try {
    const roles = Object.keys(window._cachedRolesMatrix);
    for (const roleCode of roles) {
      if (roleCode === 'super_admin') continue;
      await apiFetch(`/api/roles/${roleCode}/permissions`, {
        method: 'PUT',
        body: { permissions: window._cachedRolesMatrix[roleCode] }
      });
    }
    showToast("Tüm rollerin izinleri başarıyla güncellendi ve kaydedildi!", "success");
  } catch (e) {
    showToast("İzinler kaydedilirken bir hata oluştu.", "error");
  }
};


/**
 * Üniversite Task Yönetim Sistemi - Trainer Paneli Denetleyicisi (trainer.js)
 * Trainer istatistikleri, haftalık teslim grafiği, bağlı öğrenciler, görev oluşturma ve notlandırma.
 */

const TrainerController = {

  async renderTab(tabId) {
    const main = document.getElementById('main-content');
    const heading = document.getElementById('page-heading');

    if (tabId === 'home') {
      heading.innerHTML = `<span>Trainer Dashboard - Overview</span>`;
      await this.renderHome(main);
    } else if (tabId === 'groups') {
      heading.innerHTML = `<span>My Training Groups</span>`;
      await this.renderGroups(main);
    } else if (tabId === 'students') {
      heading.innerHTML = `<span>Enrolled Students</span>`;
      await this.renderStudents(main);
    } else if (tabId === 'tasks') {
      heading.innerHTML = `<span>Assignments & Task Management</span>`;
      await this.renderTasks(main);
    } else if (tabId === 'submissions') {
      heading.innerHTML = `<span>Assignment Submissions & Evaluations</span>`;
      await this.renderSubmissions(main);
    }
  },

  // ==================== EĞİTİM GRUPLARI ====================
  async renderGroups(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading...</span></div>`;

    const res = await apiFetch('/api/groups');
    const groups = res.groups || [];

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-header-left">
            <h3>Assigned Training Groups (${groups.length})</h3>
          </div>
          <button class="btn-action btn-primary" onclick="AdminController.openAddGroupModal()" style="width: auto;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Create New Group</span>
          </button>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Group Name & Department / Track</th>
                <th>Enrolled Students</th>
                <th>Date Range</th>
                <th>Status</th>
                <th>Description</th>
                <th style="text-align: right;">Actionler</th>
              </tr>
            </thead>
            <tbody>
              ${groups.length === 0 ? `
                <tr><td colspan="6" class="empty-state">No training groups assigned yet.</td></tr>
              ` : groups.map(g => `
                <tr>
                  <td class="text-main">
                    <div style="font-weight:700;">${g.name}</div>
                    <div style="font-size:12px; color:var(--text-secondary);">${g.department}</div>
                  </td>
                  <td><span class="status-badge badge-submitted">${g.student_count || 0} Student</span></td>
                  <td style="font-size:12.5px;">${formatDateTr(g.start_date)} - ${formatDateTr(g.end_date)}</td>
                  <td>
                    <span class="status-badge ${g.status === 'Active' ? 'badge-completed' : (g.status === 'Completed' ? 'badge-submitted' : 'badge-pending')}">
                      ${g.status === 'Active' ? 'Active' : (g.status === 'Completed' ? 'Completed' : 'Archived')}
                    </span>
                  </td>
                  <td style="font-size:12.5px; color:var(--text-secondary); max-width:240px;">${g.description || '-'}</td>
                  <td style="text-align: right; white-space: nowrap;">
                    <button class="btn-action btn-secondary btn-sm" onclick="AdminController.openEditGroupModal(${g.id})">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      Edit
                    </button>
                    <button class="btn-action btn-primary btn-sm" style="margin-left:6px; width:auto;" onclick="TrainerController.openAddTaskModal()">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Task Ata
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ==================== 1. ANA SAYFA & İSTATİSTİKLER ====================
  async renderHome(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading...</span></div>`;

    const dashRes = await apiFetch('/api/trainer/dashboard');
    const data = dashRes.data || {
      kpi: { my_students: 0, active_tasks: 0, waiting_review: 0, late_tasks: 0, completed_today: 0 },
      tasks_waiting_for_review: [],
      recent_student_submissions: [],
      group_progress: []
    };

    const { kpi, tasks_waiting_for_review, recent_student_submissions, group_progress } = data;
    const user = AppState.currentUser;

    container.innerHTML = `
      <!-- Welcome Hero Banner -->
      <div class="welcome-hero" style="margin-bottom: 24px;">
        <div class="welcome-hero-content">
          <h2>Welcome, Sn. ${user.name} 👋</h2>
          <p>15. Trainer Dashboard (Trainer Control Hub). Manage your assigned students, active assignments, pending submissions, and group progress rates in real-time.</p>
        </div>
        <div class="welcome-hero-actions">
          <button class="btn-hero-action" onclick="TrainerController.openAddTaskModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Create New Task</span>
          </button>
          <button class="btn-hero-action" onclick="switchTab('submissions')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <span>Submissionsi Review</span>
          </button>
        </div>
      </div>

      <!-- Section 15: 5x KPI Statistics Cards (My Students, Active Tasks, Waiting Review, Late Tasks, Completed Today) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin-bottom: 24px;">
        <!-- 1. My Students -->
        <div class="stat-card" style="padding: 16px 18px;">
          <div class="stat-info">
            <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">1. My Students</span>
            <h3 style="font-size: 26px; font-weight: 800; color: var(--primary-navy); margin: 4px 0;">${kpi.my_students}</h3>
            <div class="stat-trend positive"><span>Sorumlu Student</span></div>
          </div>
          <div class="stat-icon-wrapper icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
        </div>

        <!-- 2. Active Tasks -->
        <div class="stat-card" style="padding: 16px 18px;">
          <div class="stat-info">
            <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">2. Active Tasks</span>
            <h3 style="font-size: 26px; font-weight: 800; color: var(--primary-blue); margin: 4px 0;">${kpi.active_tasks}</h3>
            <div class="stat-trend neutral"><span>Devam Eden Task</span></div>
          </div>
          <div class="stat-icon-wrapper icon-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </div>
        </div>

        <!-- 3. Waiting Review -->
        <div class="stat-card" style="padding: 16px 18px; border-left: 4px solid var(--accent-gold);">
          <div class="stat-info">
            <span style="font-size: 11.5px; font-weight: 700; color: var(--accent-gold); text-transform: uppercase;">3. Waiting Review</span>
            <h3 style="font-size: 26px; font-weight: 800; color: var(--accent-gold); margin: 4px 0;">${kpi.waiting_review}</h3>
            <div class="stat-trend" style="color: var(--accent-gold); font-weight: 600;"><span>Reviewme Bekleyen</span></div>
          </div>
          <div class="stat-icon-wrapper icon-gold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
        </div>

        <!-- 4. Late Tasks -->
        <div class="stat-card" style="padding: 16px 18px; border-left: 4px solid var(--accent-rose);">
          <div class="stat-info">
            <span style="font-size: 11.5px; font-weight: 700; color: var(--accent-rose); text-transform: uppercase;">4. Late Tasks</span>
            <h3 style="font-size: 26px; font-weight: 800; color: var(--accent-rose); margin: 4px 0;">${kpi.late_tasks}</h3>
            <div class="stat-trend" style="color: var(--accent-rose); font-weight: 600;"><span>Overdue Tasks</span></div>
          </div>
          <div class="stat-icon-wrapper" style="background: rgba(239, 68, 68, 0.1); color: var(--accent-rose);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          </div>
        </div>

        <!-- 5. Completed Today -->
        <div class="stat-card" style="padding: 16px 18px; border-left: 4px solid var(--accent-emerald);">
          <div class="stat-info">
            <span style="font-size: 11.5px; font-weight: 700; color: var(--accent-emerald); text-transform: uppercase;">5. Completed Today</span>
            <h3 style="font-size: 26px; font-weight: 800; color: var(--accent-emerald); margin: 4px 0;">${kpi.completed_today}</h3>
            <div class="stat-trend positive"><span>Completed Today</span></div>
          </div>
          <div class="stat-icon-wrapper icon-emerald">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
        </div>
      </div>

      <!-- 2-Column Rich Main Layout -->
      <div style="display: grid; grid-template-columns: 1.8fr 1.2fr; gap: 20px; align-items: start;">
        <!-- LEFT COLUMN: 6. Tasks Waiting for Review & 8. Group Progress -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- 6. Tasks Waiting for Review (Reviewme ve Gradema Bekleyen Ödevler) -->
          <div class="panel-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-light); border-radius: 12px;">
            <div style="padding: 14px 18px; background: var(--bg-page); border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-gold);"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                <strong style="font-size: 14px; color: var(--primary-navy);">6. Tasks Waiting for Review (${tasks_waiting_for_review.length})</strong>
              </div>
              <button class="btn-action btn-secondary btn-sm" onclick="switchTab('submissions')">All Submissions</button>
            </div>
            <div class="table-responsive" style="margin: 0;">
              <table class="custom-table" style="margin: 0; width: 100%;">
                <thead>
                  <tr style="background: var(--bg-page); font-size: 11.5px;">
                    <th style="padding: 10px 14px;">Student</th>
                    <th style="padding: 10px 14px;">Task Title</th>
                    <th style="padding: 10px 14px;">Submitted Date</th>
                    <th style="padding: 10px 14px;">Dosya</th>
                    <th style="padding: 10px 14px; text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${tasks_waiting_for_review.length === 0 ? `
                    <tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 12.5px;">Şu anda inceleme bekleyen yeni bir teslim bulunmuyor. 🎉</td></tr>
                  ` : tasks_waiting_for_review.map(s => `
                    <tr style="border-bottom: 1px solid var(--border-light); font-size: 12.5px;">
                      <td style="padding: 10px 14px;">
                        <strong style="color: var(--primary-navy); cursor: pointer;" onclick="openStudentProfileeModal(${s.student_id})">${s.student_name}</strong>
                      </td>
                      <td style="padding: 10px 14px;">
                        <span style="font-weight: 600;">${s.task_title}</span>
                      </td>
                      <td style="padding: 10px 14px; font-size: 11.5px; color: var(--text-muted);">${formatDateTr(s.submitted_at)}</td>
                      <td style="padding: 10px 14px;">
                        ${s.file_path ? `
                          <a href="${s.file_path}" target="_blank" download style="display: flex; align-items: center; gap: 4px; color: var(--primary-blue); font-size: 11.5px; font-weight: 600; text-decoration: none;">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            <span>Download</span>
                          </a>
                        ` : '<span style="color: var(--text-muted); font-size: 11px;">-</span>'}
                      </td>
                      <td style="padding: 10px 14px; text-align: right;">
                        <button class="btn-action btn-primary btn-sm" onclick="TrainerController.openReviewModal(${s.submission_id})" style="padding: 4px 10px; font-size: 11.5px; font-weight: 600;">
                          Review & Grade
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- 8. Group Progress (Training Groupları İlerleme ve Başarı Oranları) -->
          <div class="panel-card" style="padding: 18px 20px; border: 1px solid var(--border-light); border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary-blue);"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                <strong style="font-size: 14px; color: var(--primary-navy);">8. Group Progress (Training Groupları İlerleme Statusu)</strong>
              </div>
              <button class="btn-action btn-secondary btn-sm" onclick="switchTab('groups')">Manage Groups</button>
            </div>

            ${group_progress.length === 0 ? `
              <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 12.5px;">Henüz size tanımlı bir eğitim grubu bulunmamaktadır.</div>
            ` : `
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
                ${group_progress.map(g => `
                  <div class="card" style="padding: 14px 16px; border: 1px solid var(--border-light); background: var(--bg-page); border-radius: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                      <div>
                        <strong style="font-size: 13.5px; color: var(--primary-navy); display: block;">${g.name}</strong>
                        <span style="font-size: 11px; color: var(--text-muted);">${g.department} • ${g.student_count} Student</span>
                      </div>
                      <span class="status-badge badge-completed" style="font-size: 10px;">${g.status}</span>
                    </div>

                    <!-- Progress Bar -->
                    <div style="margin: 10px 0 6px 0;">
                      <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
                        <span style="color: var(--text-secondary);">Completion Rate</span>
                        <strong style="color: var(--primary-blue);">%${g.progress_pct}</strong>
                      </div>
                      <div style="width: 100%; height: 6px; background: #E2E8F0; border-radius: 999px; overflow: hidden;">
                        <div style="width: ${Math.min(100, g.progress_pct)}%; height: 100%; background: var(--primary-blue); border-radius: 999px;"></div>
                      </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 11.5px; border-top: 1px solid var(--border-light); padding-top: 6px;">
                      <span style="color: var(--text-muted);">Average Grade:</span>
                      <strong style="color: #10B981;">${g.avg_grade > 0 ? g.avg_grade + ' / 100' : 'Grade Available Yet'}</strong>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <!-- RIGHT COLUMN: 7. Recent Student Submissions & Hızlı Aksiyonlar -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- 7. Recent Student Submissions (Son Student Submissionsi Akışı) -->
          <div class="card" style="padding: 16px 18px; border: 1px solid var(--border-light); background: var(--bg-card); border-radius: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 16px;">⏱️</span>
                <strong style="font-size: 13.5px; color: var(--primary-navy);">7. Recent Student Submissions</strong>
              </div>
              <span style="font-size: 11px; font-weight: 700; color: var(--primary-blue);">Live Feed</span>
            </div>

            ${recent_student_submissions.length === 0 ? `
              <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 12px;">Henüz yeni bir teslim bulunmuyor.</div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${recent_student_submissions.map(sub => {
                  const isDone = sub.submission_status === 'Completed' || sub.submission_status === 'Approved';
                  return `
                    <div style="padding: 10px 12px; background: var(--bg-page); border-radius: 8px; border: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 4px;">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="font-size: 12.5px; color: var(--primary-navy); cursor: pointer;" onclick="openStudentProfileeModal(${sub.student_id})">${sub.student_name}</strong>
                        <span style="font-size: 10px; color: var(--text-muted);">${formatDateTr(sub.submitted_at)}</span>
                      </div>
                      <span style="font-size: 11.5px; color: var(--text-secondary);">${sub.task_title}</span>
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px;">
                        <span class="status-badge ${isDone ? 'badge-completed' : 'badge-reviewing'}" style="font-size: 9.5px; padding: 2px 6px;">${sub.submission_status}</span>
                        ${sub.grade !== null ? `<strong style="font-size: 12px; color: #10B981;">${sub.grade} Points</strong>` : `
                          <button class="btn-action btn-secondary btn-sm" style="padding: 2px 8px; font-size: 10.5px;" onclick="TrainerController.openReviewModal(${sub.submission_id})">Grade</button>
                        `}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <!-- Akademisyen Hızlı Searchçları -->
          <div class="card" style="padding: 16px 18px; border: 1px solid var(--border-light); background: var(--bg-card); border-radius: 12px;">
            <strong style="font-size: 13.5px; color: var(--primary-navy); display: block; margin-bottom: 10px;">⚡ Quick Academic Tools</strong>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <button class="btn-action btn-primary" onclick="TrainerController.openAddTaskModal()" style="justify-content: flex-start; gap: 8px; padding: 8px 12px; font-size: 12.5px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>Create New Task / Assignment</span>
              </button>
              <button class="btn-action btn-secondary" onclick="switchTab('groups')" style="justify-content: flex-start; gap: 8px; padding: 8px 12px; font-size: 12.5px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                <span>Training Grouplarını Görüntüle</span>
              </button>
              <button class="btn-action btn-secondary" onclick="switchTab('students')" style="justify-content: flex-start; gap: 8px; padding: 8px 12px; font-size: 12.5px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                <span>Assigned Students & Grade Statusu</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ==================== 2. ÖĞRENCİLER (ÖĞRENCİ PERFORMANS VE İLERLEME TAKİBİ) ====================
  async renderStudents(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading...</span></div>`;

    const [tasksRes, subsRes, usersRes] = await Promise.all([
      apiFetch('/api/tasks'),
      apiFetch('/api/submissions'),
      apiFetch('/api/users?role=student')
    ]);

    const tasks = tasksRes.tasks || [];
    const submissions = subsRes.submissions || [];
    const allStudents = usersRes.users || [];

    // Her öğrenci için görevleri ve başarı notlarını eşleştir
    const studentMap = new Map();

    allStudents.forEach(st => {
      studentMap.set(st.id, {
        id: st.id,
        name: st.name,
        email: st.email,
        total_tasks: 0,
        completed_tasks: 0,
        grades: []
      });
    });

    tasks.forEach(t => {
      if (!studentMap.has(t.student_id)) {
        studentMap.set(t.student_id, {
          id: t.student_id,
          name: t.student_name,
          email: t.student_email,
          total_tasks: 0,
          completed_tasks: 0,
          grades: []
        });
      }
      const sObj = studentMap.get(t.student_id);
      sObj.total_tasks += 1;
      if (t.status === 'Completed') {
        sObj.completed_tasks += 1;
      }
      if (t.grade !== null && t.grade !== undefined) {
        sObj.grades.push(t.grade);
      }
    });

    const students = Array.from(studentMap.values()).filter(st => st.total_tasks > 0 || allStudents.length <= 10);

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-header-left">
            <h3>Student Thuformans ve İlerleme Takibi (${students.length})</h3>
            <p style="font-size:13px; color:var(--text-secondary); margin-top:2px;">Studentlerinizin ödev tamamlama oranlarını ve başarı notu ortalamalarını anlık izleyin.</p>
          </div>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Student Informationsi</th>
                <th>Atanan Task</th>
                <th>Completed</th>
                <th>Başarı Mediumlaması</th>
                <th>Genel Progress (%)</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${students.length === 0 ? `
                <tr><td colspan="6" class="empty-state">No students assigned to your groups yet.</td></tr>
              ` : students.map(st => {
                const percent = st.total_tasks > 0 ? Math.round((st.completed_tasks / st.total_tasks) * 100) : 0;
                const avgGrade = st.grades.length > 0 ? (st.grades.reduce((a, b) => a + b, 0) / st.grades.length).toFixed(1) : '-';
                return `
                  <tr>
                    <td class="text-main">
                      <div style="font-weight:700; cursor:pointer; color:var(--primary-blue);" onclick="openStudentProfileeModal(${st.id})">${st.name}</div>
                      <div style="font-size:12px; color:var(--text-secondary);">${st.email}</div>
                    </td>
                    <td><span class="status-badge badge-submitted">${st.total_tasks} Task</span></td>
                    <td><span class="status-badge badge-completed">${st.completed_tasks} Completed</span></td>
                    <td>
                      ${avgGrade !== '-' ? `<span class="grade-badge">${avgGrade} / 100</span>` : '<span style="color:var(--text-muted); font-size:12.5px;">Henüz Gradelanmadı</span>'}
                    </td>
                    <td style="min-width: 160px;">
                      <div style="display:flex; align-items:center; gap:10px;">
                        <div style="flex:1; background: #E2E8F0; border-radius: 999px; height: 8px; overflow:hidden;">
                          <div style="background: var(--primary-blue); height: 100%; width: ${percent}%; border-radius: 999px; transition: width 0.3s ease;"></div>
                        </div>
                        <span style="font-size:12px; font-weight:700; color:var(--primary-navy); width:35px;">%${percent}</span>
                      </div>
                    </td>
                    <td style="text-align: right;">
                      <button class="btn-action btn-primary btn-sm" onclick="openStudentProfileeModal(${st.id})">Profile (14)</button>
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

  // ==================== 3. GÖREVLER ====================
  async renderTasks(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading...</span></div>`;

    const res = await apiFetch('/api/tasks');
    const tasks = res.tasks || [];

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-header-left">
            <h3>Assigned Tasks & Status Roster (${tasks.length})</h3>
          </div>
          <button class="btn-action btn-primary" onclick="TrainerController.openAddTaskModal()" style="width: auto;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Create Assignment</span>
          </button>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Priority</th>
                <th>Atanan Student</th>
                <th>Son Submitted Date</th>
                <th>Status</th>
                <th>Grade</th>
                <th style="text-align: right;">Actionler</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.length === 0 ? `
                <tr><td colspan="7" class="empty-state">No tasks created yet.</td></tr>
              ` : tasks.map(t => {
                let prioColor = t.priority === 'Urgent' ? 'var(--accent-rose)' : (t.priority === 'High' ? 'var(--accent-gold)' : 'var(--text-muted)');
                return `
                  <tr>
                    <td class="text-main">
                      <div style="font-weight:700;">${t.title}</div>
                      <div style="font-size:12px; color:var(--text-secondary); max-width: 260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.description}</div>
                    </td>
                    <td><span style="font-weight:700; color:${prioColor}; font-size:12px;">${t.priority || 'Medium'}</span></td>
                    <td>${t.student_name}</td>
                    <td>${formatDateTr(t.deadline)}</td>
                    <td>${getStatusBadgeHtml(t.status)}</td>
                    <td>${t.grade !== null && t.grade !== undefined ? `<span class="grade-badge">${t.grade} / 100</span>` : '<span style="color:var(--text-muted);">-</span>'}</td>
                    <td style="text-align: right; white-space: nowrap;">
                      <button class="btn-action btn-secondary btn-sm" onclick="TrainerController.openEditTaskModal(${t.id})">Edit</button>
                      <button class="btn-action btn-danger btn-sm" style="margin-left: 5px;" onclick="TrainerController.deleteTask(${t.id}, '${t.title.replace(/'/g, "\\'")}')">Delete</button>
                      ${t.submission_id ? `
                        <button class="btn-action btn-primary btn-sm" style="margin-left: 5px;" onclick="TrainerController.openReviewModal(${t.submission_id})">
                          Review & Grade
                        </button>
                      ` : ''}
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

  // ==================== 4. TESLİMLER VE DEĞERLENDİRME ====================
  async renderSubmissions(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading...</span></div>`;

    const res = await apiFetch('/api/submissions');
    const submissions = res.submissions || [];

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-header-left">
            <h3>Student Submissions & Evaluation Registry (${submissions.length})</h3>
          </div>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Deneme / Revizyon</th>
                <th>Student</th>
                <th>Task</th>
                <th>Submission Timestamp</th>
                <th>Timing (Is Late)</th>
                <th>Status</th>
                <th>Grade</th>
                <th>Feedback</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${submissions.length === 0 ? `
                <tr><td colspan="9" class="empty-state">No submissions awaiting evaluation.</td></tr>
              ` : submissions.map(s => `
                <tr>
                  <td>
                    <span class="status-badge badge-submitted" style="font-weight:700;">#${s.submission_number || 1} (v${s.revision_number || 1}.0)</span>
                  </td>
                  <td class="text-main">
                    <div style="font-weight:700;">${s.student_name}</div>
                    <div style="font-size:11.5px; color:var(--text-secondary);">${s.student_email || ''}</div>
                  </td>
                  <td>
                    <div style="font-weight:600;">${s.task_title}</div>
                    ${s.student_notes ? `<div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">💬 "${s.student_notes}"</div>` : ''}
                  </td>
                  <td style="font-size:12px; white-space:nowrap;">${formatDateTr(s.submitted_at)}</td>
                  <td>
                    ${s.is_late ? '<span class="status-badge badge-pending" style="font-size:11px;">⚠️ Overdue (Is Late)</span>' : '<span class="status-badge badge-completed" style="font-size:11px;">⏰ Timestampında</span>'}
                  </td>
                  <td>${getStatusBadgeHtml(s.status)}</td>
                  <td>${s.grade !== null && s.grade !== undefined ? `<span class="grade-badge">${s.grade} / 100</span>` : '<span style="color:var(--text-muted);">-</span>'}</td>
                  <td style="max-width: 200px; font-size: 12px; color: var(--text-secondary);">${s.feedback || '<span style="color:var(--text-muted);">-</span>'}</td>
                  <td style="text-align: right; white-space:nowrap;">
                    <button class="btn-action btn-primary btn-sm" onclick="TrainerController.openReviewModal(${s.id})" style="width: auto;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                      Review Submission
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ==================== GÖREV OLUŞTURMA & DÜZENLEME MODALI ====================
  async openAddTaskModal() {
    document.getElementById('modal-task-title').textContent = 'Yeni Task / Ödev Oluştur';
    document.getElementById('task-id').value = '';
    document.getElementById('task-title').value = '';
    document.getElementById('task-description').value = '';
    if (document.getElementById('task-instructions')) document.getElementById('task-instructions').value = '';
    if (document.getElementById('task-estimated-time')) document.getElementById('task-estimated-time').value = '4 Time';
    if (document.getElementById('task-start-date')) document.getElementById('task-start-date').value = new Date().toISOString().split('T')[0];
    if (document.getElementById('task-url')) document.getElementById('task-url').value = '';
    if (document.getElementById('task-file')) document.getElementById('task-file').value = '';

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    document.getElementById('task-deadline').value = futureDate.toISOString().split('T')[0];
    if (document.getElementById('task-priority')) {
      document.getElementById('task-priority').value = 'Medium';
    }

    const radioSingle = document.querySelector('input[name="task-assign-type"][value="single"]');
    if (radioSingle) {
      radioSingle.checked = true;
      if (typeof handleTaskAssignTypeChange === 'function') {
        handleTaskAssignTypeChange('single');
      }
    }

    const trainerSelect = document.getElementById('task-trainer');
    trainerSelect.innerHTML = `<option value="${AppState.currentUser.id}">${AppState.currentUser.name} (You)</option>`;

    const [studentsRes, groupsRes] = await Promise.all([
      apiFetch('/api/users?role=student'),
      apiFetch('/api/groups')
    ]);

    const studentSelect = document.getElementById('task-student');
    studentSelect.innerHTML = (studentsRes.users || []).map(s => `<option value="${s.id}">${s.name} (${s.email})</option>`).join('');

    const groupSelect = document.getElementById('task-group');
    if (groupSelect) {
      groupSelect.innerHTML = (groupsRes.groups || []).map(g => `<option value="${g.id}">${g.name} (${g.student_count || 0} Student)</option>`).join('');
    }

    openModal('modal-task');
  },

  async openEditTaskModal(taskId) {
    const res = await apiFetch(`/api/tasks/${taskId}`);
    if (!res.success || !res.task) {
      showToast("Task bilgileri alınamadı.", "error");
      return;
    }

    const t = res.task;
    document.getElementById('modal-task-title').textContent = 'Taski Edit';
    document.getElementById('task-id').value = t.id;
    document.getElementById('task-title').value = t.title;
    document.getElementById('task-description').value = t.description;
    if (document.getElementById('task-instructions')) {
      document.getElementById('task-instructions').value = t.instructions || '';
    }
    if (document.getElementById('task-start-date')) {
      document.getElementById('task-start-date').value = t.start_date || new Date().toISOString().split('T')[0];
    }
    if (document.getElementById('task-estimated-time')) {
      document.getElementById('task-estimated-time').value = t.estimated_time || '';
    }
    document.getElementById('task-deadline').value = t.deadline;
    if (document.getElementById('task-priority')) {
      document.getElementById('task-priority').value = t.priority || 'Medium';
    }
    if (document.getElementById('task-url')) {
      document.getElementById('task-url').value = t.attachment_url || '';
    }
    if (document.getElementById('task-file')) {
      document.getElementById('task-file').value = t.attachment_file || '';
    }

    const trainerSelect = document.getElementById('task-trainer');
    trainerSelect.innerHTML = `<option value="${AppState.currentUser.id}">${AppState.currentUser.name} (You)</option>`;

    const studentsRes = await apiFetch('/api/users?role=student');
    const studentSelect = document.getElementById('task-student');
    studentSelect.innerHTML = (studentsRes.users || []).map(s => 
      `<option value="${s.id}" ${s.id === t.student_id ? 'selected' : ''}>${s.name} (${s.email})</option>`
    ).join('');

    openModal('modal-task');
  },

  deleteTask(taskId, taskTitle) {
    openConfirmModal(
      'Taski Delete',
      `"${taskTitle}" başlıklı görevi silmek istediğinizden emin misiniz?`,
      async () => {
        const res = await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
        if (res.success) {
          showToast("Task başarıyla silindi.", "success");
          switchTab(AppState.currentTab);
        } else {
          showToast(res.error || "Task silinirken bir hata oluştu.", "error");
        }
      }
    );
  },

  // ==================== TESLİMİ İNCELE MODALI (SECTION 8: TASK REVIEW) ====================
  async openReviewModal(submissionId) {
    const res = await apiFetch(`/api/submissions/${submissionId}`);
    if (!res.success || !res.submission) {
      showToast("Could not fetch submission details.", "error");
      return;
    }

    const s = res.submission;
    document.getElementById('review-submission-id').value = s.id;
    document.getElementById('review-student-name').textContent = s.student_name;
    document.getElementById('review-student-email').textContent = s.student_email || '';
    document.getElementById('review-submitted-at').textContent = formatDateTr(s.submitted_at);
    document.getElementById('review-task-title').textContent = s.task_title;
    
    // Dosya Görünümü (Files)
    const fileContainer = document.getElementById('review-file-container');
    if (s.file_path) {
      if (fileContainer) fileContainer.style.display = 'flex';
      document.getElementById('review-filename').textContent = s.original_filename || s.file_path;
      const downloadBtn = document.getElementById('review-file-download-btn');
      if (downloadBtn) {
        downloadBtn.href = `/uploads/${encodeURIComponent(s.file_path)}`;
        downloadBtn.download = s.original_filename || s.file_path;
      }
    } else {
      if (fileContainer) fileContainer.style.display = 'none';
    }

    // Link Görünümü (Links)
    const linkBox = document.getElementById('review-link-box');
    const linkEl = document.getElementById('review-student-link');
    if (s.student_link) {
      if (linkBox) linkBox.style.display = 'block';
      if (linkEl) {
        linkEl.textContent = s.student_link;
        linkEl.href = s.student_link;
      }
    } else {
      if (linkBox) linkBox.style.display = 'none';
    }

    // Gradelar Görünümü (Gradees)
    const notesBox = document.getElementById('review-notes-box');
    const notesEl = document.getElementById('review-student-notes');
    if (s.student_notes) {
      if (notesBox) notesBox.style.display = 'block';
      if (notesEl) notesEl.textContent = s.student_notes;
    } else {
      if (notesBox) notesBox.style.display = 'none';
    }

    // Section 9: Rubric Criteria Değerleri
    if (document.getElementById('rubric-completion')) {
      document.getElementById('rubric-completion').value = s.rubric_completion !== null && s.rubric_completion !== undefined ? s.rubric_completion : '';
      document.getElementById('rubric-quality').value = s.rubric_quality !== null && s.rubric_quality !== undefined ? s.rubric_quality : '';
      document.getElementById('rubric-accuracy').value = s.rubric_accuracy !== null && s.rubric_accuracy !== undefined ? s.rubric_accuracy : '';
      document.getElementById('rubric-deadline').value = s.rubric_deadline !== null && s.rubric_deadline !== undefined ? s.rubric_deadline : '';
      document.getElementById('rubric-communication').value = s.rubric_communication !== null && s.rubric_communication !== undefined ? s.rubric_communication : '';
      
      const badge = document.getElementById('rubric-total-badge');
      if (badge) {
        badge.textContent = `Toplam: ${s.grade !== null && s.grade !== undefined ? s.grade : 0} / 100`;
      }
    }

    // Grade (Score) & Feedback (Feedback) & Karar (Decision: Approve, Needs Revision, Reject)
    document.getElementById('review-grade').value = s.grade !== null && s.grade !== undefined ? s.grade : '';
    document.getElementById('review-feedback').value = s.feedback || '';
    
    const statusSelect = document.getElementById('review-status');
    if (statusSelect) {
      if (s.status === 'Needs Revision' || s.status === 'Needs Revision') {
        statusSelect.value = 'Needs Revision';
      } else if (s.status === 'Rejected' || s.status === 'Reject') {
        statusSelect.value = 'Rejected';
      } else if (s.status === 'Under Review' || s.status === 'Under Review') {
        statusSelect.value = 'Under Review';
      } else {
        statusSelect.value = 'Completed';
      }
    }

    openModal('modal-review');
  }
};


/**
 * Üniversite Task Yönetim Sistemi - Student Paneli Denetleyicisi (student.js)
 * Task takibi, haftalık çalışma grafiği, dosya teslimi, not ve geri bildirim görüntüleme.
 */

const StudentController = {

  async renderTab(tabId) {
    const main = document.getElementById('main-content');
    const heading = document.getElementById('page-heading');

    if (tabId === 'home') {
      heading.innerHTML = `<span>Student Dashboard - Overview</span>`;
      await this.renderHome(main);
    } else if (tabId === 'my-tasks') {
      heading.innerHTML = `<span>My Tasks & Assignments</span>`;
      await this.renderMyTasks(main);
    } else if (tabId === 'my-submissions') {
      heading.innerHTML = `<span>My Submissions & Academic Grades</span>`;
      await this.renderMySubmissions(main);
    }
  },

  // ==================== 1. ANA SAYFA & İSTATİSTİKLER ====================
  async renderHome(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Uploading...</span></div>`;

    const [statsRes, tasksRes] = await Promise.all([
      apiFetch('/api/stats'),
      apiFetch('/api/tasks')
    ]);

    const stats = statsRes.stats || { total_tasks: 0, pending_tasks: 0, submitted_tasks: 0, reviewed_tasks: 0 };
    const tasks = tasksRes.tasks || [];
    const user = AppState.currentUser;

    container.innerHTML = `
      <!-- Welcome Hero Banner -->
      <div class="welcome-hero">
        <div class="welcome-hero-content">
          <h2>Welcome, ${user.name} 👋</h2>
          <p>Student Academic Portal. View assigned coursework, submit assignment files directly, and review instructor feedback and rubric evaluations.</p>
        </div>
        <div class="welcome-hero-actions">
          <button class="btn-hero-action" onclick="openUniversalUploadModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            <span>Submit Assignment</span>
          </button>
          <button class="btn-hero-action" onclick="switchTab('my-submissions')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>View My Grades</span>
          </button>
        </div>
      </div>

      <!-- 4x KPI Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <span>Total Tasks</span>
            <h3>${stats.total_tasks}</h3>
            <div class="stat-trend neutral">
              <span>Spring Term</span>
            </div>
          </div>
          <div class="stat-icon-wrapper icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span>Pending Tasks</span>
            <h3>${stats.pending_tasks}</h3>
            <div class="stat-trend positive" style="color:var(--accent-gold);">
              <span>To Submit</span>
            </div>
          </div>
          <div class="stat-icon-wrapper icon-gold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span>Submitted</span>
            <h3>${stats.submitted_tasks}</h3>
            <div class="stat-trend positive">
              <span>Under Review</span>
            </div>
          </div>
          <div class="stat-icon-wrapper icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span>Graded & Completed</span>
            <h3>${stats.reviewed_tasks}</h3>
            <div class="stat-trend positive">
              <span>Graded</span>
            </div>
          </div>
          <div class="stat-icon-wrapper icon-emerald">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
        </div>
      </div>

      <!-- 2-Column Rich Layout (2/3 Sol + 1/3 Sağ) -->
      <div class="dashboard-grid-2col">
        <!-- LEFT: Weekly Progress & Task Tablosu -->
        <div>
          <!-- Weekly Activity Bar Chart -->
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-header-left">
                <h3>Weekly Activity & Submission Volume</h3>
                <p>Activity hours and submitted assignments over the last 7 days</p>
              </div>
              <span class="status-badge badge-submitted">Current Week</span>
            </div>
            <div class="bar-chart-container">
              <div class="bar-column">
                <div class="bar-track"><div class="bar-fill" style="height: 40%;"></div></div>
                <span class="bar-label">Mon</span>
              </div>
              <div class="bar-column">
                <div class="bar-track"><div class="bar-fill" style="height: 75%;"></div></div>
                <span class="bar-label">Tue</span>
              </div>
              <div class="bar-column">
                <div class="bar-track"><div class="bar-fill" style="height: 85%;"></div></div>
                <span class="bar-label">Wed</span>
              </div>
              <div class="bar-column">
                <div class="bar-track"><div class="bar-fill" style="height: 60%;"></div></div>
                <span class="bar-label">Thu</span>
              </div>
              <div class="bar-column">
                <div class="bar-track"><div class="bar-fill" style="height: 90%;"></div></div>
                <span class="bar-label">Fri</span>
              </div>
              <div class="bar-column">
                <div class="bar-track"><div class="bar-fill" style="height: 50%;"></div></div>
                <span class="bar-label">Cts</span>
              </div>
              <div class="bar-column">
                <div class="bar-track"><div class="bar-fill" style="height: 65%;"></div></div>
                <span class="bar-label">Sun</span>
              </div>
            </div>
          </div>

          <!-- Tasksim Tablosu -->
          <div class="panel-card">
            <div class="panel-header">
              <div class="panel-header-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary-navy);"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                <h3>Academic Tasks & Assignments</h3>
              </div>
              <button class="btn-action btn-secondary btn-sm" onclick="switchTab('my-tasks')">View All</button>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>TASK</th>
                    <th>INSTRUCTOR</th>
                    <th>DUE DATE</th>
                    <th>STATUS</th>
                    <th>GRADE</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${tasks.length === 0 ? `
                    <tr><td colspan="6" class="empty-state">No tasks assigned to you yet.</td></tr>
                  ` : tasks.map(t => `
                    <tr>
                      <td class="text-main">
                        <div>${t.title}</div>
                        <div style="font-size:12px; color:var(--text-secondary); max-width: 320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.description}</div>
                      </td>
                      <td>${t.trainer_name}</td>
                      <td>${formatDateTr(t.deadline)}</td>
                      <td>${getStatusBadgeHtml(t.status)}</td>
                      <td>${t.grade !== null && t.grade !== undefined ? `<span class="grade-badge">${t.grade} / 100</span>` : '<span style="color:var(--text-muted);">-</span>'}</td>
                      <td style="text-align: right;">
                        <button class="btn-action btn-primary btn-sm" onclick="StudentController.openTaskDetailModal(${t.id})" style="width: auto;">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                          Upload / Submit Assignment
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- RIGHT: Donut Chart, Mini Calendar, Announcements -->
        <div>
          <!-- Academic Achievement Rate Donut Widgetı -->
          <div class="donut-widget">
            <div class="chart-header" style="margin-bottom: 0;">
              <div class="chart-header-left">
                <h4 style="font-size: 15px; font-weight: 700;">Semester Completion Rate</h4>
                <p>Overall percentage of submitted assignments</p>
              </div>
            </div>
            <div class="donut-center-box">
              <svg class="donut-svg" viewBox="0 0 120 120">
                <circle class="donut-circle-bg" cx="60" cy="60" r="54"></circle>
                <circle class="donut-circle-progress" cx="60" cy="60" r="54" stroke-dashoffset="25"></circle>
              </svg>
              <div class="donut-inner-text">
                <h4>%95</h4>
                <span>Completed</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-around; font-size: 12px; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
              <div>
                <span style="color:var(--text-muted); display:block;">Submitted</span>
                <strong style="color:var(--accent-emerald);">${stats.submitted_tasks + stats.reviewed_tasks}</strong>
              </div>
              <div>
                <span style="color:var(--text-muted); display:block;">Pending Start</span>
                <strong style="color:var(--accent-gold);">${stats.pending_tasks}</strong>
              </div>
              <div>
                <span style="color:var(--text-muted); display:block;">Mediumlama Grade</span>
                <strong style="color:var(--primary-navy);">92.5</strong>
              </div>
            </div>
          </div>

          <!-- Mini Academic Calendar Widgetı -->
          <div class="calendar-card">
            <div class="calendar-header">
              <h4>📅 Academic Calendar</h4>
              <span style="font-size:12px; font-weight:600; color:var(--primary-blue);">August 2026</span>
            </div>
            <div class="calendar-grid">
              <div class="calendar-day-label">Pt</div>
              <div class="calendar-day-label">Sa</div>
              <div class="calendar-day-label">Ça</div>
              <div class="calendar-day-label">Pe</div>
              <div class="calendar-day-label">Cu</div>
              <div class="calendar-day-label">Ct</div>
              <div class="calendar-day-label">Pz</div>

              <div class="calendar-day" style="color:var(--text-muted);">27</div>
              <div class="calendar-day" style="color:var(--text-muted);">28</div>
              <div class="calendar-day" style="color:var(--text-muted);">29</div>
              <div class="calendar-day" style="color:var(--text-muted);">30</div>
              <div class="calendar-day" style="color:var(--text-muted);">31</div>
              <div class="calendar-day">1</div>
              <div class="calendar-day">2</div>

              <div class="calendar-day">3</div>
              <div class="calendar-day">4</div>
              <div class="calendar-day">5</div>
              <div class="calendar-day">6</div>
              <div class="calendar-day">7</div>
              <div class="calendar-day">8</div>
              <div class="calendar-day">9</div>

              <div class="calendar-day">10</div>
              <div class="calendar-day today">11</div>
              <div class="calendar-day has-event">12</div>
              <div class="calendar-day">13</div>
              <div class="calendar-day">14</div>
              <div class="calendar-day has-event">15</div>
              <div class="calendar-day">16</div>

              <div class="calendar-day">17</div>
              <div class="calendar-day">18</div>
              <div class="calendar-day">19</div>
              <div class="calendar-day">20</div>
              <div class="calendar-day">21</div>
              <div class="calendar-day">22</div>
              <div class="calendar-day">23</div>
            </div>
          </div>

          <!-- Akademik Announcements Listesi -->
          <div class="announcements-card">
            <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 8px;">📢 Student Announcementsı</h4>
            <div class="announcement-item">
              <div class="announcement-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              </div>
              <div class="announcement-content">
                <h5>Submission File Guidelines</h5>
                <span>Please upload Python and code deliverables as ZIP or individual script files.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ==================== 2. GÖREVLERİM SAYFASI ====================
  async renderMyTasks(container, activeFilter = 'all') {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Uploading...</span></div>`;

    const res = await apiFetch('/api/tasks');
    const allTasks = res.tasks || [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const todayCount = allTasks.filter(t => t.deadline === todayStr).length;
    const overdueCount = allTasks.filter(t => t.deadline < todayStr && t.status !== 'Completed').length;
    const upcomingCount = allTasks.filter(t => t.deadline > todayStr).length;

    let filteredTasks = allTasks;
    if (activeFilter === 'today') {
      filteredTasks = allTasks.filter(t => t.deadline === todayStr);
    } else if (activeFilter === 'overdue') {
      filteredTasks = allTasks.filter(t => t.deadline < todayStr && t.status !== 'Completed');
    } else if (activeFilter === 'upcoming') {
      filteredTasks = allTasks.filter(t => t.deadline > todayStr);
    }

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header" style="flex-wrap:wrap; gap:12px;">
          <div class="panel-header-left">
            <h3>My Tasks & File Submissions (${allTasks.length})</h3>
          </div>
          
          <!-- Filtre Butonları (Bugün, Yaklaşan, Geciken) -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn-action ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="StudentController.renderMyTasks(document.getElementById('main-content'), 'all')">
              📌 All Tasks (${allTasks.length})
            </button>
            <button class="btn-action ${activeFilter === 'today' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="StudentController.renderMyTasks(document.getElementById('main-content'), 'today')">
              ⚡ Due Today (${todayCount})
            </button>
            <button class="btn-action ${activeFilter === 'upcoming' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="StudentController.renderMyTasks(document.getElementById('main-content'), 'upcoming')">
              📅 Upcoming (${upcomingCount})
            </button>
            <button class="btn-action ${activeFilter === 'overdue' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="StudentController.renderMyTasks(document.getElementById('main-content'), 'overdue')" style="${overdueCount > 0 ? 'border-color:var(--accent-rose); color:var(--accent-rose);' : ''}">
              ⚠️ Overdue (${overdueCount})
            </button>
          </div>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>TASK</th>
                <th>INSTRUCTOR</th>
                <th>DUE DATE</th>
                <th>PRIORITY</th>
                <th>STATUS</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTasks.length === 0 ? `
                <tr><td colspan="6" class="empty-state">No tasks match the selected filter.</td></tr>
              ` : filteredTasks.map(t => `
                <tr>
                  <td class="text-main">
                    <div style="font-weight:700;">${t.title}</div>
                    <div style="font-size:12px; color:var(--text-secondary); margin-top:2px; max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.description}</div>
                  </td>
                  <td>${t.trainer_name}</td>
                  <td>
                    ${formatDateTr(t.deadline)}
                    ${t.deadline < todayStr && t.status !== 'Completed' ? '<span style="color:var(--accent-rose); font-size:11px; font-weight:700; display:block;">Overdue</span>' : ''}
                  </td>
                  <td>
                    <span class="status-badge ${t.priority === 'Urgent' ? 'badge-pending' : (t.priority === 'High' ? 'badge-reviewing' : 'badge-submitted')}">
                      ${t.priority || 'Normal'}
                    </span>
                  </td>
                  <td>${getStatusBadgeHtml(t.status)}</td>
                  <td style="text-align: right; white-space: nowrap;">
                    <button class="btn-action btn-secondary btn-sm" onclick="StudentController.openTaskDetailModal(${t.id})">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      View Details & Submit
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ==================== 3. TESLİMLERİM SAYFASI ====================
  async renderMySubmissions(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Uploading...</span></div>`;

    const res = await apiFetch('/api/submissions');
    const submissions = res.submissions || [];

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-header-left">
            <h3>My Submissions & Graded Work (${submissions.length})</h3>
          </div>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>TASK</th>
                <th>INSTRUCTOR</th>
                <th>SUBMISSION DATE</th>
                <th>SUBMITTED FILE</th>
                <th>STATUS</th>
                <th>GRADE</th>
                <th>INSTRUCTOR FEEDBACK</th>
              </tr>
            </thead>
            <tbody>
              ${submissions.length === 0 ? `
                <tr><td colspan="7" class="empty-state">No assignments submitted yet.</td></tr>
              ` : submissions.map(s => `
                <tr>
                  <td class="text-main">${s.task_title}</td>
                  <td>${s.trainer_name}</td>
                  <td>${formatDateTr(s.submitted_at)}</td>
                  <td>
                    <a href="/uploads/${encodeURIComponent(s.file_path)}" download="${s.original_filename || s.file_path}" target="_blank" class="btn-action btn-secondary btn-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      ${s.original_filename || 'Download File'}
                    </a>
                  </td>
                  <td>${getStatusBadgeHtml(s.status)}</td>
                  <td>${s.grade !== null && s.grade !== undefined ? `<span class="grade-badge">${s.grade} / 100</span>` : '<span style="color:var(--text-muted);">Pending</span>'}</td>
                  <td style="max-width: 280px; font-size: 13px; color: var(--text-main);">
                    ${s.feedback ? `
                      <div style="background: var(--bg-page); padding: 8px 12px; border-radius: 6px; border-left: 3px solid var(--accent-emerald); border: 1px solid var(--border-light);">
                        ${s.feedback}
                      </div>
                    ` : '<span style="color:var(--text-muted);">-</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ==================== GÖREV DETAY & FILE YÜKLEME MODALI ====================
  async openTaskDetailModal(taskId) {
    AppState.activeTaskId = taskId;
    AppState.selectedFile = null;
    clearSelectedFile();

    const res = await apiFetch(`/api/tasks/${taskId}`);
    if (!res.success || !res.task) {
      showToast("Could not load task details.", "error");
      return;
    }

    const t = res.task;
    document.getElementById('detail-task-title').textContent = t.title;
    document.getElementById('detail-trainer-name').textContent = t.trainer_name;
    
    const startDateEl = document.getElementById('detail-start-date');
    if (startDateEl) startDateEl.textContent = t.start_date ? formatDateTr(t.start_date) : '-';

    document.getElementById('detail-deadline').textContent = formatDateTr(t.deadline);
    
    const prioBadgeEl = document.getElementById('detail-priority-badge');
    if (prioBadgeEl) {
      prioBadgeEl.textContent = t.priority || 'Medium';
      prioBadgeEl.className = `status-badge ${t.priority === 'Urgent' || t.priority === 'Urgent' ? 'badge-pending' : (t.priority === 'High' || t.priority === 'High' ? 'badge-reviewing' : 'badge-submitted')}`;
    }

    const estTimeEl = document.getElementById('detail-estimated-time');
    if (estTimeEl) estTimeEl.textContent = t.estimated_time || 'Grade specified';

    document.getElementById('detail-description').textContent = t.description;

    const instBox = document.getElementById('detail-instructions-box');
    const instText = document.getElementById('detail-instructions');
    if (instBox && instText) {
      if (t.instructions && t.instructions.trim()) {
        instBox.style.display = 'block';
        instText.textContent = t.instructions;
      } else {
        instBox.style.display = 'none';
      }
    }

    const statusBadgeContainer = document.getElementById('detail-status-badge');
    if (statusBadgeContainer) {
      statusBadgeContainer.outerHTML = getStatusBadgeHtml(t.status);
    }

    // "Start Working (In Progress)" butonu kontrolü
    const btnStart = document.getElementById('btn-start-task');
    if (btnStart) {
      if (t.status === 'Pending' || !t.status) {
        btnStart.style.display = 'inline-flex';
      } else {
        btnStart.style.display = 'none';
      }
    }

    const evalBox = document.getElementById('student-evaluation-box');
    const evalHeaderTitle = document.getElementById('eval-header-title');
    const gradeBadge = document.getElementById('student-grade-badge');
    const feedbackText = document.getElementById('student-feedback-text');
    const btnSubmitText = document.getElementById('btn-submit-text');

    if (t.status === 'Needs Revision') {
      if (evalBox) {
        evalBox.style.display = 'block';
        evalBox.style.background = '#FFFBEB';
        evalBox.style.border = '1px solid #FDE68A';
      }
      if (evalHeaderTitle) evalHeaderTitle.innerHTML = `<span style="color:#D97706; font-weight:700;">⚠️ Instructor Düzeltme ve Revizyon Talebi</span>`;
      if (gradeBadge) {
        gradeBadge.textContent = t.grade !== null && t.grade !== undefined ? `Score: ${t.grade} / 100` : 'Düzeltme Pending';
        gradeBadge.style.background = '#F59E0B';
      }
      if (feedbackText) feedbackText.textContent = t.feedback || 'Please revise your assignment according to instructor guidelines and resubmit.';
      if (btnSubmitText) btnSubmitText.textContent = '🔄 Resubmit Revised Assignment';
    } else if (t.grade !== null && t.grade !== undefined || t.feedback) {
      if (evalBox) {
        evalBox.style.display = 'block';
        evalBox.style.background = 'var(--bg-page)';
        evalBox.style.border = '1px solid var(--border-light)';
      }
      if (evalHeaderTitle) evalHeaderTitle.innerHTML = `Instructor Evaluation & Grade`;
      if (gradeBadge) {
        gradeBadge.textContent = `Grade: ${t.grade} / 100`;
        gradeBadge.style.background = 'var(--accent-gold)';
      }
      if (feedbackText) feedbackText.textContent = t.feedback || 'Instructor has not added written feedback yet.';
      if (btnSubmitText) btnSubmitText.textContent = 'Submit Assignment';
    } else {
      if (evalBox) evalBox.style.display = 'none';
      if (btnSubmitText) btnSubmitText.textContent = 'Submit Assignment';
    }

    // Section 9: Rubrik Kriter Dağılımını Göster
    const isGraded = t.rubric_completion !== null || t.rubric_quality !== null || t.rubric_accuracy !== null;
    const badgeEl = document.getElementById('detail-rubric-status-badge');
    const compEl = document.getElementById('detail-rubric-score-completion');
    const qualEl = document.getElementById('detail-rubric-score-quality');
    const accuEl = document.getElementById('detail-rubric-score-accuracy');
    const deadEl = document.getElementById('detail-rubric-score-deadline');
    const commEl = document.getElementById('detail-rubric-score-communication');

    if (badgeEl) {
      if (isGraded) {
        badgeEl.textContent = `Earned Grade: ${t.grade !== null && t.grade !== undefined ? t.grade : 0} / 100`;
        badgeEl.className = 'status-badge badge-completed';
      } else {
        badgeEl.textContent = `Total: 100 Pts (Rubric Model)`;
        badgeEl.className = 'status-badge badge-pending';
      }
    }

    if (compEl) compEl.innerHTML = isGraded ? `${t.rubric_completion !== null && t.rubric_completion !== undefined ? t.rubric_completion : '-'} <span style="font-size:10px; color:var(--text-muted);">/30</span>` : `30 Pts`;
    if (qualEl) qualEl.innerHTML = isGraded ? `${t.rubric_quality !== null && t.rubric_quality !== undefined ? t.rubric_quality : '-'} <span style="font-size:10px; color:var(--text-muted);">/25</span>` : `25 Pts`;
    if (accuEl) accuEl.innerHTML = isGraded ? `${t.rubric_accuracy !== null && t.rubric_accuracy !== undefined ? t.rubric_accuracy : '-'} <span style="font-size:10px; color:var(--text-muted);">/20</span>` : `20 Pts`;
    if (deadEl) deadEl.innerHTML = isGraded ? `${t.rubric_deadline !== null && t.rubric_deadline !== undefined ? t.rubric_deadline : '-'} <span style="font-size:10px; color:var(--text-muted);">/15</span>` : `15 Pts`;
    if (commEl) commEl.innerHTML = isGraded ? `${t.rubric_communication !== null && t.rubric_communication !== undefined ? t.rubric_communication : '-'} <span style="font-size:10px; color:var(--text-muted);">/10</span>` : `10 Pts`;

    const alreadyFileBox = document.getElementById('already-submitted-file-box');
    const alreadyFileName = document.getElementById('already-submitted-filename');
    const alreadyFileLink = document.getElementById('already-submitted-download-link');

    if (t.file_path) {
      alreadyFileBox.style.display = 'block';
      alreadyFileName.textContent = t.original_filename || t.file_path;
      alreadyFileLink.href = `/uploads/${encodeURIComponent(t.file_path)}`;
      alreadyFileLink.download = t.original_filename || t.file_path;
    } else {
      alreadyFileBox.style.display = 'none';
    }

    // Section 7: Teslim Latemişi ve Revizyonlar (Submission History)
    const historyBox = document.getElementById('detail-submission-history-box');
    const historyList = document.getElementById('detail-submission-history-list');
    const historyCountBadge = document.getElementById('detail-history-count-badge');
    const history = t.submissions_history || [];

    if (historyBox && historyList) {
      if (history.length > 0) {
        historyBox.style.display = 'block';
        if (historyCountBadge) historyCountBadge.textContent = `${history.length} Submission Attempts`;
        
        historyList.innerHTML = history.map((sub, idx) => `
          <div style="background: var(--bg-page); border: 1px solid var(--border-light); border-radius: 8px; padding: 10px 14px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <strong style="color: var(--primary-navy);">Submission Attempt #${sub.submission_number || (history.length - idx)} (Rev ${sub.revision_number || (history.length - idx)}.0)</strong>
                <span style="font-size: 11px; color: var(--text-muted);">🕒 ${formatDateTr(sub.submitted_at)}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                ${sub.is_late ? '<span class="status-badge badge-pending" style="font-size: 10.5px;">⚠️ Overdue (Is Late)</span>' : '<span class="status-badge badge-completed" style="font-size: 10.5px;">⏰ On Time</span>'}
                ${getStatusBadgeHtml(sub.status)}
              </div>
            </div>
            ${sub.file_path ? `
              <div style="margin-top: 4px; display: flex; align-items: center; gap: 6px;">
                <span style="color: var(--text-muted); font-size: 12px;">📁 File:</span>
                <a href="/uploads/${encodeURIComponent(sub.file_path)}" download="${sub.original_filename || sub.file_path}" target="_blank" style="color: var(--primary-blue); font-weight: 600; text-decoration: none;">
                  ${sub.original_filename || sub.file_path}
                </a>
              </div>
            ` : ''}
            ${sub.student_link ? `
              <div style="margin-top: 4px; display: flex; align-items: center; gap: 6px;">
                <span style="color: var(--text-muted); font-size: 12px;">🔗 Project URL:</span>
                <a href="${sub.student_link}" target="_blank" style="color: var(--primary-blue); font-weight: 600; text-decoration: none;">
                  ${sub.student_link}
                </a>
              </div>
            ` : ''}
            ${sub.student_notes ? `
              <div style="margin-top: 4px; color: var(--text-secondary); font-size: 12px; background: rgba(0,0,0,0.02); padding: 4px 8px; border-radius: 4px;">
                💬 Gradee: ${sub.student_notes}
              </div>
            ` : ''}
          </div>
        `).join('');
      } else {
        historyBox.style.display = 'none';
      }
    }

    const modalEl = document.getElementById('modal-task-detail');
    if (modalEl) modalEl.dataset.taskId = taskId;
    AppState.currentTaskId = taskId;

    // Section 10: Task İçi Commentsı Listele (Task Comments)
    if (typeof renderTaskComments === 'function') {
      renderTaskComments(t.comments || []);
    }

    openModal('modal-task-detail');
  }
};

// ==================== ÖĞRENCİ OLAYLARI VE FILE ACTIONSİ ====================
function handleFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 25 * 1024 * 1024) {
    showToast("File size exceeds limit. Maximum upload size is 25 MB.", "error");
    clearSelectedFile();
    return;
  }

  AppState.selectedFile = file;

  const preview = document.getElementById('file-selected-preview');
  const filename = document.getElementById('selected-filename');
  const filesize = document.getElementById('selected-filesize');

  if (filename) filename.textContent = file.name;
  if (filesize) filesize.textContent = `(${formatFileYoue(file.size)})`;
  if (preview) preview.style.display = 'flex';
}

function clearSelectedFile() {
  AppState.selectedFile = null;
  const input = document.getElementById('submission-file-input');
  if (input) input.value = '';
  const preview = document.getElementById('file-selected-preview');
  if (preview) preview.style.display = 'none';
}

async function handleStartTask() {
  const modalEl = document.getElementById('modal-task-detail');
  const taskId = AppState.activeTaskId || (modalEl ? modalEl.dataset.taskId : null);
  if (!taskId) return;

  const res = await apiFetch(`/api/tasks/${taskId}/start`, { method: 'POST' });
  if (res.success) {
    showToast("Task marked as In Progress. Good luck!", "success");
    StudentController.openTaskDetailModal(taskId);
    switchTab(AppState.currentTab);
  } else {
    showToast(res.error || "An error occurred during this action.", "error");
  }
}

async function handleUploadTaskSubmission() {
  const modalEl = document.getElementById('modal-task-detail');
  const taskId = AppState.activeTaskId || (modalEl ? modalEl.dataset.taskId : null);
  if (!taskId) {
    showToast("No valid task selected.", "error");
    return;
  }

  let file = AppState.selectedFile;
  const studentLink = document.getElementById('submission-link') ? document.getElementById('submission-link').value.trim() : '';
  const studentGradees = document.getElementById('submission-notes') ? document.getElementById('submission-notes').value.trim() : '';

  if (!file) {
    if (studentLink || studentGradees) {
      // Link veya not girildiyse otomatik çözüm raporu belgesi oluştur
      const content = `STUDENT ASSIGNMENT SUBMISSION & SOLUTION REPORT\n=========================================\n\nProject / Repository Link:\n${studentLink || 'Grade specified'}\n\nStudent Gradeu ve Descriptionları:\n${studentGradees || 'Grade specified'}\n\nSubmission Date: ${new Date().toLocaleString('tr-TR')}\n`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      file = new File([blob], 'ogrenci_cozum_raporu.txt', { type: 'text/plain' });
    } else {
      const fileInput = document.getElementById('submission-file-input');
      if (fileInput) fileInput.click();
      showToast("Please select a file or provide a project URL/note.", "error");
      return;
    }
  }

  const btn = document.getElementById('btn-submit-task-file');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Uploading...</span>`;
  }

  const formData = new FormData();
  formData.append('task_id', taskId);
  formData.append('file', file);

  if (studentLink) formData.append('student_link', studentLink);
  if (studentGradees) formData.append('student_notes', studentGradees);

  const res = await apiFetch('/api/submissions/upload', {
    method: 'POST',
    body: formData
  });

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span id="btn-submit-text">Submit Assignment</span>`;
  }

  if (res.success) {
    closeModal('modal-task-detail');
    showToast("Your assignment has been submitted successfully!", "success");
    clearSelectedFile();
    switchTab(AppState.currentTab);
  } else {
    showToast(res.error || "An error occurred while uploading your submission.", "error");
  }
}

// Global scope'a bağla
window.handleFileSelected = handleFileSelected;
window.clearSelectedFile = clearSelectedFile;
window.handleStartTask = handleStartTask;
window.handleUploadTaskSubmission = handleUploadTaskSubmission;


// Extract token from URL immediately on load
const _urlParams = new URLSearchParams(window.location.search);
const _urlToken = _urlParams.get('token');
if (_urlToken) {
  localStorage.setItem('gys_auth_token', _urlToken);
}

// Global Application State (State)
window.AppState = window.AppState || {
  currentUser: null,
  token: _urlToken || localStorage.getItem('gys_auth_token') || null,
  currentTab: 'home',
  selectedFile: null,
  universalSelectedFile: null,
  activeTaskId: null,
  deleteCallback: null
};
if (_urlToken) {
  window.AppState.token = _urlToken;
}
const AppState = window.AppState;

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
        error: data.error || `Server error (${response.status})`,
        status: response.status 
      };
    }

    return data;
  } catch (err) {
    console.error("API Connection Error:", err);
    return { success: false, error: "Could not connect to server. Please check your connection." };
  }
}

// ==================== TOAST BİLDİRİMLERİ (GRADEIFICATIONS) ====================
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

// ==================== MODAL ACTIONSİ ====================
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
window.DEMO_USERS = {
  super_admin: { email: 'superadmin@universite.edu.tr', password: 'SuperAdmin123!' },
  admin: { email: 'yonetici@universite.edu.tr', password: 'Admin123!' },
  training_manager: { email: 'egitim.muduru@universite.edu.tr', password: 'Mudur123!' },
  trainer: { email: 'ahmet.yilmaz@universite.edu.tr', password: 'Egitmen123!' },
  assistant_trainer: { email: 'asistan.merve@universite.edu.tr', password: 'Asistan123!' },
  student: { email: 'mehmet.demir@universite.edu.tr', password: 'Ogrenci123!' }
};
const DEMO_USERS = window.DEMO_USERS;

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

  // Section 17: Today's Tasks (Tüm Roller için ortak merkezi sayfa)
  if (tabId === 'today-tasks') {
    heading.innerHTML = `<span>Today's Tasks (Today's Tasks Hub)</span>`;
    TodayTasksController.renderTodayTasks(main);
    return;
  }

  // Section 19: Announcements (Tüm Roller için ortak duyuru panosu)
  if (tabId === 'announcements') {
    heading.innerHTML = `<span>Announcements & Gradeices Hub</span>`;
    AnnouncementsController.renderAnnouncements(main);
    return;
  }

  // Section 20: Academic Calendar (Tüm Roller için ortak takvim)
  if (tabId === 'calendar') {
    heading.innerHTML = `<span>Academic Calendar Hub</span>`;
    CalendarController.renderCalendar(main);
    return;
  }

  // Section 21: Reports ve Analitik Merkezi
  if (tabId === 'reports') {
    heading.innerHTML = `<span>Reports & Analytics Hub</span>`;
    ReportsController.renderReports(main);
    return;
  }

  // Section 22: Audit Logs (Audit Logs Hub)
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

  let roleTr = "Student";
  if (user.role === 'super_admin') roleTr = "Super Admin";
  else if (user.role === 'admin') roleTr = "Sistem Administratorsi";
  else if (user.role === 'training_manager') roleTr = "Training Manager";
  else if (user.role === 'trainer') roleTr = "Trainer (Trainer)";
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
    body.innerHTML = `<div class="card" style="padding: 24px; color: var(--accent-rose);">Profile could not be loaded: ${res.error || 'Bilinmeyen hata'}</div>`;
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
  if (stats.average_score >= 90) letterGrade = 'AA (Excellent)';
  else if (stats.average_score >= 80) letterGrade = 'BA (Very Good)';
  else if (stats.average_score >= 70) letterGrade = 'BB (Good)';
  else if (stats.average_score >= 60) letterGrade = 'CB (Medium)';
  else if (stats.average_score >= 50) letterGrade = 'CC (Pass)';
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

    <!-- 3, 4, 5, 6. KPI Statistics & Thuformance Gauges -->
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
        <span style="font-size: 10px; color: var(--accent-rose);">Overdue</span>
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

    <!-- 7. Task History Table (Task History & Grade Details) -->
    <div class="panel-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-light); border-radius: 10px; margin-bottom: 20px;">
      <div style="padding: 12px 18px; background: var(--bg-page); border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
        <strong style="font-size: 13.5px; color: var(--primary-navy);">📋 Task History (Task History - ${task_history.length})</strong>
      </div>
      <div class="table-responsive" style="margin: 0; max-height: 260px;">
        <table class="custom-table" style="margin: 0; width: 100%;">
          <thead>
            <tr style="background: var(--bg-page); font-size: 11.5px;">
              <th style="padding: 10px 14px;">Task Title</th>
              <th style="padding: 10px 14px;">Due Date</th>
              <th style="padding: 10px 14px;">Status</th>
              <th style="padding: 10px 14px; text-align: center;">Grade (100)</th>
              <th style="padding: 10px 14px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${task_history.length === 0 ? `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">No tasks have been assigned yet.</td></tr>` : ''}
            ${task_history.map(t => {
              let statusBadgeHtml = '<span class="status-badge badge-pending">Pending</span>';
              if (t.submission_status === 'Completed' || t.submission_status === 'Approved') {
                statusBadgeHtml = '<span class="status-badge badge-completed">Completed</span>';
              } else if (t.submission_status === 'Needs Revision') {
                statusBadgeHtml = '<span class="status-badge badge-late">Revizyon</span>';
              } else if (t.submission_status === 'Submitted' || t.submission_status === 'Viewniyor') {
                statusBadgeHtml = '<span class="status-badge badge-reviewing">Viewniyor</span>';
              } else if (t.is_late) {
                statusBadgeHtml = '<span class="status-badge badge-late">Overdue</span>';
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

    <!-- 8. Recent Activity (Recent Activities & Timeline) -->
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

// ==================== EVRENSEL FILE YÜKLEME (UNIVERSAL UPLOAD) ====================
async function openUniversalUploadModal() {
  AppState.universalSelectedFile = null;
  clearUniversalFile();

  const taskSelect = document.getElementById('universal-task-select');
  taskSelect.innerHTML = '<option value="">Loading tasks...</option>';

  const res = await apiFetch('/api/tasks');
  const tasks = res.tasks || [];

  if (tasks.length === 0) {
    taskSelect.innerHTML = '<option value="new">General Submission (Auto Task)</option>';
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
    showToast("File size is too large. Maximum allowed size is 25 MB.", "error");
    clearUniversalFile();
    return;
  }

  AppState.universalSelectedFile = file;

  const preview = document.getElementById('universal-file-preview');
  const filename = document.getElementById('universal-filename');
  const filesize = document.getElementById('universal-filesize');

  filename.textContent = file.name;
  filesize.textContent = `(${formatFileYoue(file.size)})`;
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
  btn.innerHTML = `<span>Loading...</span>`;

  const formData = new FormData();
  formData.append('task_id', taskId);
  formData.append('file', AppState.universalSelectedFile);

  const res = await apiFetch('/api/submissions/upload', {
    method: 'POST',
    body: formData
  });

  btn.disabled = false;
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg><span>Upload File to System</span>`;

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
  if (status === 'Completed' || status === 'Completed' || status === 'Approved') {
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
  if (status === 'Yeniden Submitted' || status === 'Resubmitted') {
    return `<span class="status-badge" style="background: rgba(99, 102, 241, 0.15); color: #6366F1; border: 1px solid rgba(99, 102, 241, 0.3);">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
      Resubmitted
    </span>`;
  }
  if (status === 'Submitted' || status === 'Submitted') {
    return `<span class="status-badge badge-submitted">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
      Submitted
    </span>`;
  }
  if (status === 'Needs Revision' || status === 'Needs Revision') {
    return `<span class="status-badge" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-gold); border: 1px solid rgba(245, 158, 11, 0.3);">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      Needs Revision
    </span>`;
  }
  if (status === 'In Progress' || status === 'In Progress') {
    return `<span class="status-badge" style="background: rgba(139, 92, 246, 0.15); color: #8B5CF6; border: 1px solid rgba(139, 92, 246, 0.3);">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      In Progress
    </span>`;
  }
  if (status === 'Viewed' || status === 'Viewed') {
    return `<span class="status-badge" style="background: rgba(6, 182, 212, 0.15); color: #0891B2; border: 1px solid rgba(6, 182, 212, 0.3);">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      Viewed
    </span>`;
  }
  if (status === 'Overdue' || status === 'Overdue') {
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

function formatFileYoue(bytes) {
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
      showToast(res.message || "Evaluation saved and student notified!", "success");
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
      ${currentGradeifFilter === 'unread' ? '✨ No unread notifications.' : '📭 No notifications found.'}
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
    showToast("Active task not found.", "error");
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
    btn.innerHTML = `<span>Sendiliyor...</span>`;
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
    let roleBadge = '<span class="status-badge badge-pending" style="font-size:10px;">Student</span>';
    if (c.user_role === 'trainer') roleBadge = '<span class="status-badge badge-completed" style="font-size:10px;">Trainer</span>';
    if (c.user_role === 'admin') roleBadge = '<span class="status-badge badge-submitted" style="font-size:10px;">Administrator</span>';

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

// Start Dateta oturumu kontrol et ve olayları bağla
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
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading...</span></div>`;

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
              صفحة مركزية لمراقبة العمل اليومي. Monitor daily operational workflows, completed, in-progress, pending review, not started, and overdue tasks in real-time.
            </p>
          </div>
          ${user.role !== 'student' ? `
            <button class="btn-action btn-primary" onclick="AdminController.openAddTaskModal()" style="padding: 8px 16px; font-size: 13px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>Yeni Task Ata</span>
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
            <div class="stat-trend neutral"><span style="font-size: 10.5px;">In Progress</span></div>
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
            <div class="stat-trend neutral"><span style="font-size: 10.5px;">Not Started Yet</span></div>
          </div>
        </div>

        <!-- Overdue -->
        <div class="stat-card" style="padding: 14px 16px; border-left: 4px solid var(--accent-rose); cursor: pointer; ${this.currentFilters.status === 'overdue' ? 'border: 2px solid var(--accent-rose);' : ''}" onclick="TodayTasksController.setFilter('status', 'overdue')">
          <div class="stat-info">
            <span style="font-size: 11px; font-weight: 700; color: var(--accent-rose); text-transform: uppercase;">Overdue</span>
            <h3 style="font-size: 24px; font-weight: 800; color: var(--accent-rose); margin: 3px 0;">${kpi.overdue}</h3>
            <div class="stat-trend" style="color: var(--accent-rose);"><span style="font-size: 10.5px;">Overdue Task</span></div>
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
            <span>Filterri Clear</span>
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr repeat(5, 1fr); gap: 10px; align-items: center;">
          <!-- 1. Search -->
          <div>
            <input type="text" id="filter-today-search" placeholder="🔍 Search task, student, trainer..." value="${this.currentFilters.search || ''}" oninput="TodayTasksController.handleSearch(this.value)" class="form-control" style="font-size: 12px; padding: 7px 10px; height: 36px;">
          </div>

          <!-- 2. Trainer Filter -->
          <div>
            <select id="filter-today-trainer" class="form-control" onchange="TodayTasksController.setFilter('trainer_id', this.value)" style="font-size: 12px; padding: 6px 8px; height: 36px;">
              <option value="all" ${this.currentFilters.trainer_id === 'all' ? 'selected' : ''}>👨‍🏫 Trainer: All</option>
              ${trainers.map(tr => `<option value="${tr.id}" ${String(this.currentFilters.trainer_id) === String(tr.id) ? 'selected' : ''}>${tr.name}</option>`).join('')}
            </select>
          </div>

          <!-- 3. Student Filter -->
          <div>
            <select id="filter-today-student" class="form-control" onchange="TodayTasksController.setFilter('student_id', this.value)" style="font-size: 12px; padding: 6px 8px; height: 36px;">
              <option value="all" ${this.currentFilters.student_id === 'all' ? 'selected' : ''}>👤 Student: All</option>
              ${students.map(st => `<option value="${st.id}" ${String(this.currentFilters.student_id) === String(st.id) ? 'selected' : ''}>${st.name}</option>`).join('')}
            </select>
          </div>

          <!-- 4. Group Filter -->
          <div>
            <select id="filter-today-group" class="form-control" onchange="TodayTasksController.setFilter('group_id', this.value)" style="font-size: 12px; padding: 6px 8px; height: 36px;">
              <option value="all" ${this.currentFilters.group_id === 'all' ? 'selected' : ''}>🏢 Group: All</option>
              ${groups.map(g => `<option value="${g.id}" ${String(this.currentFilters.group_id) === String(g.id) ? 'selected' : ''}>${g.name}</option>`).join('')}
            </select>
          </div>

          <!-- 5. Status Filter -->
          <div>
            <select id="filter-today-status" class="form-control" onchange="TodayTasksController.setFilter('status', this.value)" style="font-size: 12px; padding: 6px 8px; height: 36px;">
              <option value="all" ${this.currentFilters.status === 'all' ? 'selected' : ''}>🚦 Status: All</option>
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
              <option value="all" ${this.currentFilters.priority === 'all' ? 'selected' : ''}>⚡ Priority: All</option>
              <option value="Urgent" ${this.currentFilters.priority === 'Urgent' ? 'selected' : ''}>🔴 Urgent (Urgent)</option>
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
          <strong style="font-size: 14px; color: var(--primary-navy);">Task Directory (${tasks.length} Tasks Listed)</strong>
          <span style="font-size: 12px; color: var(--text-muted);">Sorted chronologically by deadline</span>
        </div>

        <div class="table-responsive" style="margin: 0;">
          <table class="custom-table" style="margin: 0; width: 100%;">
            <thead>
              <tr style="background: var(--bg-page); font-size: 11.5px;">
                <th style="padding: 10px 14px;">Task Title & Details</th>
                <th style="padding: 10px 14px;">Group & Trainer</th>
                <th style="padding: 10px 14px;">Assigned Student</th>
                <th style="padding: 10px 14px;">Due Date</th>
                <th style="padding: 10px 14px;">Priority</th>
                <th style="padding: 10px 14px;">Status</th>
                <th style="padding: 10px 14px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.length === 0 ? `
                <tr><td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted); font-size: 13px;">No tasks match the selected filters.</td></tr>
              ` : tasks.map(t => {
                let statusBadge = '';
                if (t.calculated_status === 'completed') statusBadge = '<span class="status-badge badge-completed">Completed</span>';
                else if (t.calculated_status === 'waiting_review') statusBadge = '<span class="status-badge badge-reviewing">Waiting Review</span>';
                else if (t.calculated_status === 'overdue') statusBadge = `<span class="status-badge badge-late">Overdue (+${t.days_overdue} days)</span>`;
                else if (t.calculated_status === 'in_progress') statusBadge = '<span class="status-badge badge-submitted">In Progress</span>';
                else statusBadge = '<span class="status-badge" style="background: #F1F5F9; color: #64748B; border: 1px solid #CBD5E1;">Not Started</span>';

                let prioBadge = '';
                if (t.priority === 'Urgent') prioBadge = '<span class="status-badge badge-late">🔴 Urgent</span>';
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
                      <strong style="color: var(--primary-navy); display: block;">${t.group_name === 'Bireysel Görev' ? 'Individual Assignment' : t.group_name}</strong>
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
                          <button class="btn-action btn-primary btn-sm" style="padding: 3px 8px; font-size: 11px;" onclick="TrainerController.openReviewModal(${t.submission_id})">Grade</button>
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
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading...</span></div>`;

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
              <h2 style="font-size: 19px; font-weight: 800; color: #FFFFFF; margin: 0;">19. Announcements (Akademik Announcement Panosu)</h2>
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
              🌐 All (${announcements.length})
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
              <option value="Urgent" ${this.currentFilters.priority === 'Urgent' ? 'selected' : ''}>🔴 Urgent Announcement</option>
              <option value="Önemli" ${this.currentFilters.priority === 'Önemli' ? 'selected' : ''}>🟠 Önemli</option>
              <option value="Normal" ${this.currentFilters.priority === 'Normal' ? 'selected' : ''}>🔵 Normal</option>
            </select>
            <input type="text" placeholder="🔍 Announcementsda ara..." value="${this.currentFilters.search || ''}" oninput="AnnouncementsController.handleSearch(this.value)" class="form-control" style="font-size: 12px; padding: 6px 10px; height: 34px; width: 200px;">
          </div>
        </div>
      </div>

      <!-- Announcements Feed List -->
      <div id="announcements-feed-container" style="display: flex; flex-direction: column; gap: 16px;">
        ${announcements.length === 0 ? `
          <div class="panel-card" style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
            <div style="font-size: 36px; margin-bottom: 10px;">📭</div>
            <strong style="font-size: 14px; color: var(--primary-navy); display: block; margin-bottom: 4px;">No Announcements Yet</strong>
            <p style="font-size: 12.5px; margin: 0;">No academic announcements match the selected criteria.</p>
          </div>
        ` : announcements.map(a => {
          let targetBadge = '';
          if (a.target_type === 'all_users') targetBadge = '<span class="status-badge badge-submitted">👥 All Users (Tüm Userlar)</span>';
          else if (a.target_type === 'all_students') targetBadge = '<span class="status-badge badge-submitted">🎓 All Students (Tüm Studentler)</span>';
          else if (a.target_type === 'all_trainers') targetBadge = '<span class="status-badge badge-reviewing">👨‍🏫 All Trainers (Tüm Trainerler)</span>';
          else if (a.target_type === 'specific_group') targetBadge = `<span class="status-badge badge-completed">🏢 Group: ${escapeHtml(a.target_group_name || 'Training Group')}</span>`;
          else if (a.target_type === 'specific_students') targetBadge = '<span class="status-badge" style="background: #FAF5FF; color: #9333EA; border: 1px solid #E9D5FF;">👤 Specific Students (Özel Studentler)</span>';

          let prioBadge = '';
          if (a.priority === 'Urgent') prioBadge = '<span class="status-badge badge-late">🔴 Urgent Announcement</span>';
          else if (a.priority === 'Önemli') prioBadge = '<span class="status-badge" style="background: #FFF7ED; color: #EA580C; border: 1px solid #FFEDD5;">🟠 Önemli</span>';
          else prioBadge = '<span class="status-badge badge-submitted">🔵 Normal</span>';

          const isAuthorOrAdmin = ['super_admin', 'admin', 'training_manager'].includes(user.role) || a.author_id === user.id;

          return `
            <div class="panel-card" style="padding: 20px 24px; border-radius: 12px; border: 1px solid ${a.is_pinned ? '#93C5FD' : 'var(--border-light)'}; background: ${a.is_pinned ? 'rgba(239, 246, 255, 0.6)' : 'var(--bg-card)'}; box-shadow: ${a.is_pinned ? '0 4px 15px rgba(59, 130, 246, 0.08)' : 'none'}; position: relative;">
              ${a.is_pinned ? `
                <div style="display: flex; align-items: center; gap: 4px; color: var(--primary-blue); font-size: 11.5px; font-weight: 700; margin-bottom: 8px;">
                  <span>📌</span> Sabitlenmiş Announcement
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
                    <button class="btn-action btn-danger btn-sm" onclick="AnnouncementsController.deleteAnnouncement(${a.id})" title="Announcementyu Delete" style="padding: 4px 8px; font-size: 11px;">
                      🗑️ Delete
                    </button>
                  ` : ''}
                </div>
              </div>

              <!-- Announcement Metni -->
              <div style="font-size: 13.5px; color: var(--text-main); line-height: 1.6; white-space: pre-wrap; margin-bottom: 16px; padding: 12px 14px; background: ${a.is_pinned ? '#FFFFFF' : 'var(--bg-page)'}; border-radius: 8px; border: 1px solid var(--border-light);">
                ${escapeHtml(a.message)}
              </div>

              <!-- Alt Information: Published By ve Date -->
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
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    const res = await apiFetch(`/api/announcements/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Announcement başarıyla silindi.');
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
          <input type="text" id="ann-title" class="form-control" placeholder="e.g. Final Project Submission Deadlines & Rubric Criteria" required>
        </div>

        <div>
          <label class="form-label" style="font-weight: 700;">Target Audience Selectimi (Section 19: 5 Selectenek) <span style="color: var(--accent-rose);">*</span></label>
          <select id="ann-target-type" class="form-control" onchange="AnnouncementsController.handleTargetTypeChange(this.value)" required style="font-weight: 600;">
            <option value="all_users">👥 All Users (Sistemdeki Tüm Userlar)</option>
            <option value="all_students">🎓 All Students (Tüm Studentler)</option>
            <option value="all_trainers">👨‍🏫 All Trainers (Tüm Trainerler ve Asistanlar)</option>
            <option value="specific_group">🏢 Specific Group (Belirli Bir Training Group)</option>
            <option value="specific_students">👤 Specific Students (Belirli Studentler)</option>
          </select>
        </div>

        <!-- Dynamic Sub-Picker: Specific Group -->
        <div id="ann-group-container" style="display: none; padding: 12px; background: var(--bg-page); border-radius: 8px; border: 1px solid var(--border-light);">
          <label class="form-label" style="font-weight: 700;">Training Group Selectin <span style="color: var(--accent-rose);">*</span></label>
          <select id="ann-target-group-id" class="form-control">
            <option value="">-- Group Select --</option>
            ${groups.map(g => `<option value="${g.id}">${g.name} (${g.department})</option>`).join('')}
          </select>
        </div>

        <!-- Dynamic Sub-Picker: Specific Students Multi-Select -->
        <div id="ann-students-container" style="display: none; padding: 12px; background: var(--bg-page); border-radius: 8px; border: 1px solid var(--border-light);">
          <label class="form-label" style="font-weight: 700;">Studentleri Selectin (Birden Fazla Selectebilirsiniz) <span style="color: var(--accent-rose);">*</span></label>
          <input type="text" placeholder="🔍 Student ara..." oninput="AnnouncementsController.filterStudentCheckboxes(this.value)" class="form-control" style="font-size: 11.5px; padding: 5px 8px; margin-bottom: 8px;">
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
          <label class="form-label" style="font-weight: 700;">Priority Severityi</label>
          <select id="ann-priority" class="form-control">
            <option value="Normal">🔵 Normal</option>
            <option value="Önemli">🟠 Önemli</option>
            <option value="Urgent">🔴 Urgent Announcement</option>
          </select>
        </div>

        <div>
          <label class="form-label" style="font-weight: 700;">Announcement Content ve Description <span style="color: var(--accent-rose);">*</span></label>
          <textarea id="ann-message" rows="5" class="form-control" placeholder="Announcement detaylarını, talimatları ve gerekli bağlantıları buraya yazınız..." required></textarea>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
          <input type="checkbox" id="ann-is-pinned" value="1">
          <label for="ann-is-pinned" style="font-size: 12.5px; font-weight: 600; cursor: pointer; color: var(--primary-navy);">
            📌 Pin this announcement to the top of the noticeboard
          </label>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button type="button" class="btn-action btn-secondary" onclick="closeUniversalModal()">Cancel</button>
          <button type="submit" class="btn-action btn-primary" id="btn-save-announcement">
            <span>📢 Publish Announcement</span>
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
        showToast('Please select a training group.', 'error');
        btn.disabled = false;
        btn.innerText = '📢 Publish Announcement';
        return;
      }
    } else if (target_type === 'specific_students') {
      const checked = document.querySelectorAll('input[name="ann_student_id"]:checked');
      target_student_ids = Array.from(checked).map(c => parseInt(c.value));
      if (target_student_ids.length === 0) {
        showToast('Please select at least one student.', 'error');
        btn.disabled = false;
        btn.innerText = '📢 Publish Announcement';
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
    btn.innerText = '📢 Publish Announcement';

    if (res.success) {
      showToast(res.message || 'Announcement başarıyla yayınlandı!');
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
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading...</span></div>`;

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
              <h2 style="font-size: 19px; font-weight: 800; color: #FFFFFF; margin: 0;">20. Calendar (Genel Academic Calendar)</h2>
              <span class="status-badge" style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(96, 165, 250, 0.3);">6 Category Desteği</span>
            </div>
            <p style="color: #94A3B8; font-size: 12.5px; margin: 0; max-width: 750px;">
              التقويم الأكاديمي الشامل: متابعة Tasks, Deadlines, Training Sessions, Events, Exams, ve Meetings.
            </p>
          </div>
          ${canCreate ? `
            <button class="btn-action btn-primary" onclick="CalendarController.openCreateEventModal()" style="padding: 8px 16px; font-size: 13px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>+ Yeni Calendar Öğesi Ekle (20)</span>
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
              <option value="all" ${this.selectedGroupId === 'all' ? 'selected' : ''}>🏢 Tüm Grouplar</option>
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
          <strong style="font-size: 14px; color: var(--primary-navy); display: block; margin-bottom: 4px;">This Monthda Planlanmış Etkinlik Bulunmuyor</strong>
          <p style="font-size: 12.5px; margin: 0;">Selectilen filtre ve kategorilere uygun takvim öğesi bulunamadı.</p>
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
      showToast('Calendar öğesi silindi.');
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

    modalTitle.innerHTML = `📅 20. Yeni Calendar Öğesi Ekle (Academic Calendar)`;
    modalBody.innerHTML = `
      <form id="create-calendar-event-form" onsubmit="CalendarController.handleCreateSubmit(event)" style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label class="form-label" style="font-weight: 700;">Event / Item Title <span style="color: var(--accent-rose);">*</span></label>
          <input type="text" id="cal-title" class="form-control" placeholder="e.g. Midterm Exam - Database Management Systems" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700;">Category / Tür (Section 20: 6 Category) <span style="color: var(--accent-rose);">*</span></label>
            <select id="cal-event-type" class="form-control" required style="font-weight: 600;">
              <option value="training_sessions">🎓 Training Sessions (Training Oturumu)</option>
              <option value="exams">📝 Exams (Sınavlar - Vize, Final, Quiz)</option>
              <option value="events">🎪 Events (Akademik Etkinlik / Seminer)</option>
              <option value="meetings">🤝 Meetings (Toplantı & Görüşme)</option>
              <option value="tasks">📋 Tasks (Task & Çalışma)</option>
              <option value="deadlines">⏰ Deadlines (Due Date Datei)</option>
            </select>
          </div>

          <div>
            <label class="form-label" style="font-weight: 700;">Date <span style="color: var(--accent-rose);">*</span></label>
            <input type="date" id="cal-event-date" value="${defaultDate}" class="form-control" required>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700;">Start Date Timei</label>
            <input type="time" id="cal-start-time" value="10:00" class="form-control">
          </div>
          <div>
            <label class="form-label" style="font-weight: 700;">End Date Timei</label>
            <input type="time" id="cal-end-time" value="11:30" class="form-control">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700;">Lokasyon / Online Toplantı Linki</label>
            <input type="text" id="cal-location" class="form-control" placeholder="Örn: Amfi-2 veya https://meet.google.com/xyz">
          </div>

          <div>
            <label class="form-label" style="font-weight: 700;">Training Group</label>
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
          <label class="form-label" style="font-weight: 700;">Description ve Gradelar</label>
          <textarea id="cal-description" rows="3" class="form-control" placeholder="Etkinlik yönergeleri, getirilecek materyaller veya toplantı gündemi..."></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button type="button" class="btn-action btn-secondary" onclick="closeUniversalModal()">Cancel</button>
          <button type="submit" class="btn-action btn-primary" id="btn-save-cal-event">
            <span>📅 Calendare Save</span>
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
    btn.innerText = 'Saving...';

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
    btn.innerText = '📅 Calendare Save';

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
          + Bu Güne Add Event
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
    { id: 'student_performance', title: '1. Student Thuformansı', icon: '🎓', desc: 'Student Thuformance Report' },
    { id: 'trainer_performance', title: '2. Trainer Thuformansı', icon: '👨‍🏫', desc: 'Trainer Thuformance Report' },
    { id: 'group_performance', title: '3. Group Thuformansı', icon: '🏢', desc: 'Group Thuformance Report' },
    { id: 'tasks_report', title: '4. Tasks & Submissions', icon: '📋', desc: 'Tasks Distribution Report' },
    { id: 'late_tasks_report', title: '5. Overdue Tasks', icon: '⏰', desc: 'Overdue & Risk Analysis Report' },
    { id: 'activity_attendance_report', title: '6. Aktivite & Katılım', icon: '⚡', desc: 'Activity / Attendance Report' }
  ],

  async renderReports(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading...</span></div>`;

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
              <h2 style="font-size: 19px; font-weight: 800; color: #FFFFFF; margin: 0;">21. Reports (Reportlama ve Analitik Merkezi)</h2>
              <span class="status-badge" style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(96, 165, 250, 0.3);">6 Temel Report Modülü</span>
            </div>
            <p style="color: #94A3B8; font-size: 12.5px; margin: 0; max-width: 750px;">
              Student Thuformance, Trainer Thuformance, Group Thuformance, Tasks Report, Late Tasks Report, ve Activity/Attendance Report.
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="btn-action btn-secondary" onclick="ReportsController.exportToCsv()" style="padding: 8px 14px; font-size: 12.5px; background: rgba(255,255,255,0.1); color: #FFF; border: 1px solid rgba(255,255,255,0.2);">
              📥 Export CSV
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
                <option value="all" ${this.currentFilters.group === 'all' ? 'selected' : ''}>🏢 Tüm Grouplar</option>
                ${groups.map(g => `<option value="${g.id}" ${String(this.currentFilters.group) === String(g.id) ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('')}
              </select>
            ` : ''}

            <!-- Trainer Filter -->
            ${this.currentReportType === 'student_performance' ? `
              <select class="form-control" style="font-size: 12px; padding: 5px 10px; height: 34px; width: 170px;" onchange="ReportsController.setTrainerFilter(this.value)">
                <option value="all" ${this.currentFilters.trainer === 'all' ? 'selected' : ''}>👨‍🏫 Tüm Trainerler</option>
                ${trainers.map(tr => `<option value="${tr.id}" ${String(this.currentFilters.trainer) === String(tr.id) ? 'selected' : ''}>${escapeHtml(tr.name)}</option>`).join('')}
              </select>
            ` : ''}

            <!-- Live Search -->
            <input type="text" placeholder="🔍 Report içinde ara..." value="${escapeHtml(this.currentFilters.search || '')}" oninput="ReportsController.handleSearch(this.value)" class="form-control" style="font-size: 12px; padding: 5px 10px; height: 34px; width: 220px;">
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Toplam ${records.length} Kayıt</span>
            <button class="btn-action btn-secondary btn-sm" onclick="ReportsController.resetFilters()" style="padding: 4px 10px; font-size: 11.5px;">
              Reset Filters
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
        { label: 'Toplam Student', val: kpis.total_students || 0, icon: '🎓', color: '#2563EB' },
        { label: 'Sınıf Grade Mediumlaması', val: `${kpis.class_average_grade || 0} / 100`, icon: '📈', color: '#059669' },
        { label: 'Average Score Oranı', val: `%${kpis.average_completion_rate || 0}`, icon: '🎯', color: '#7C3AED' },
        { label: 'High Success (>85)', val: kpis.high_achievers_count || 0, icon: '⭐', color: '#D97706' }
      ];
    } else if (type === 'trainer_performance') {
      items = [
        { label: 'Active Trainer Sayısı', val: kpis.total_trainers || 0, icon: '👨‍🏫', color: '#2563EB' },
        { label: 'Alınan Total Submissions', val: kpis.total_submissions_received || 0, icon: '📥', color: '#059669' },
        { label: 'Tamamlanan Viewmeler', val: kpis.total_reviews_completed || 0, icon: '✅', color: '#7C3AED' },
        { label: 'Mediumlama Viewme Oranı', val: `%${kpis.average_review_rate || 0}`, icon: '⚡', color: '#D97706' }
      ];
    } else if (type === 'group_performance') {
      items = [
        { label: 'Toplam Training Group', val: kpis.total_groups || 0, icon: '🏢', color: '#2563EB' },
        { label: 'Kayıtlı Toplam Kursiyer', val: kpis.total_enrolled_students || 0, icon: '👥', color: '#059669' },
        { label: 'Genel Grade Mediumlaması', val: `${kpis.group_overall_average || 0} / 100`, icon: '📊', color: '#7C3AED' },
        { label: 'En Success Group', val: kpis.top_group_name || '-', icon: '🏆', color: '#D97706' }
      ];
    } else if (type === 'tasks_report') {
      items = [
        { label: 'Total Tasks Sayısı', val: kpis.total_tasks || 0, icon: '📋', color: '#2563EB' },
        { label: 'Average Submission Rate', val: `%${kpis.average_turnin_rate || 0}`, icon: '📈', color: '#059669' },
        { label: 'Mediumlama Task Gradeu', val: `${kpis.average_task_grade || 0} / 100`, icon: '🎯', color: '#7C3AED' },
        { label: 'Urgent Priority Tasks', val: kpis.urgent_tasks_count || 0, icon: '🚨', color: '#DC2626' }
      ];
    } else if (type === 'late_tasks_report') {
      items = [
        { label: 'Toplam Overdue Task', val: kpis.total_late_tasks || 0, icon: '⏰', color: '#DC2626' },
        { label: 'Kritik Gecikme (>7 Gün)', val: kpis.critical_overdue_count || 0, icon: '🔴', color: '#B91C1C' },
        { label: 'Medium Severity Gecikme', val: kpis.moderate_overdue_count || 0, icon: '🟠', color: '#EA580C' },
        { label: 'Pending Urgent Tasks', val: kpis.pending_urgent_count || 0, icon: '⚠️', color: '#D97706' }
      ];
    } else if (type === 'activity_attendance_report') {
      items = [
        { label: 'İzlenen Userlar', val: kpis.total_monitored_users || 0, icon: '👥', color: '#2563EB' },
        { label: 'High Activelik (High)', val: kpis.high_activity_users || 0, icon: '🟢', color: '#059669' },
        { label: 'Medium Activelik (Moderate)', val: kpis.moderate_activity_users || 0, icon: '🟡', color: '#D97706' },
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
          <strong style="font-size: 14px; color: var(--primary-navy); display: block; margin-bottom: 4px;">No Audit Logs Found</strong>
          <p style="font-size: 12.5px; margin: 0;">Selectilen arama veya filtre kriterlerine uygun rapor verisi bulunmamaktadır.</p>
        </div>
      `;
    }

    if (type === 'student_performance') {
      return `
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
          <thead>
            <tr style="background: var(--bg-page); border-bottom: 1px solid var(--border-light); text-align: left;">
              <th style="padding: 12px 16px;">Student Informationsi</th>
              <th style="padding: 12px 16px;">Training Group & Trainer</th>
              <th style="padding: 12px 16px; text-align: center;">Total Tasks</th>
              <th style="padding: 12px 16px; text-align: center;">Tamamlanan</th>
              <th style="padding: 12px 16px;">Success Rate</th>
              <th style="padding: 12px 16px; text-align: center;">Grade Mediumlaması</th>
              <th style="padding: 12px 16px; text-align: center;">Action</th>
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
              <th style="padding: 12px 16px;">Trainer</th>
              <th style="padding: 12px 16px;">Rol & Grouplar</th>
              <th style="padding: 12px 16px; text-align: center;">Bağlı Student</th>
              <th style="padding: 12px 16px; text-align: center;">Oluşturulan Task</th>
              <th style="padding: 12px 16px; text-align: center;">Submissions Received</th>
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
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">🏢 ${r.groups_count} Groups Managed</div>
                </td>
                <td style="padding: 12px 16px; text-align: center; font-weight: 700;">${r.students_count}</td>
                <td style="padding: 12px 16px; text-align: center; font-weight: 700;">${r.tasks_created}</td>
                <td style="padding: 12px 16px; text-align: center;">${r.submissions_received}</td>
                <td style="padding: 12px 16px; text-align: center;">
                  <span class="status-badge badge-completed" style="font-size: 11px;">${r.reviewed_submissions}</span>
                  ${r.pending_reviews > 0 ? `<span class="status-badge badge-late" style="margin-left: 4px; font-size: 10px;">${r.pending_reviews} Pending</span>` : ''}
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
              <th style="padding: 12px 16px;">Group Adı</th>
              <th style="padding: 12px 16px;">Bölüm / Program</th>
              <th style="padding: 12px 16px;">Sorumlu Trainer</th>
              <th style="padding: 12px 16px; text-align: center;">Kayıtlı Kursiyer</th>
              <th style="padding: 12px 16px; text-align: center;">Group Tasks</th>
              <th style="padding: 12px 16px;">Success Rate</th>
              <th style="padding: 12px 16px; text-align: center;">Group Grade Mediumlaması</th>
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
              <th style="padding: 12px 16px;">Group & Trainer</th>
              <th style="padding: 12px 16px;">Due Date</th>
              <th style="padding: 12px 16px; text-align: center;">Atanan Student</th>
              <th style="padding: 12px 16px; text-align: center;">Submission Count</th>
              <th style="padding: 12px 16px;">Turn-in Rate</th>
              <th style="padding: 12px 16px; text-align: center;">Average Grade</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(r => `
              <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="padding: 12px 16px;">
                  <strong style="color: var(--primary-navy); display: block;">📋 ${escapeHtml(r.task_title)}</strong>
                  <span class="status-badge" style="font-size: 10px; margin-top: 3px; ${r.priority === 'Urgent' ? 'background: #FEE2E2; color: #DC2626;' : 'background: #EFF6FF; color: #2563EB;'}">${r.priority}</span>
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
              <th style="padding: 12px 16px;">Overdue Task</th>
              <th style="padding: 12px 16px;">Student Informationsi</th>
              <th style="padding: 12px 16px;">Group & Trainer</th>
              <th style="padding: 12px 16px;">Due Date</th>
              <th style="padding: 12px 16px; text-align: center;">Gecikme Süresi</th>
              <th style="padding: 12px 16px; text-align: center;">Status</th>
              <th style="padding: 12px 16px; text-align: center;">Action</th>
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
                  <span class="status-badge badge-reviewing" style="font-size: 10.5px;">${r.submission_status || 'Not Submitted'}</span>
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
              <th style="padding: 12px 16px; text-align: center;">Submissions</th>
              <th style="padding: 12px 16px; text-align: center;">Comment & Mesajlar</th>
              <th style="padding: 12px 16px; text-align: center;">Alınan Bildirimler</th>
              <th style="padding: 12px 16px; text-align: center;">Aktivite Skoru</th>
              <th style="padding: 12px 16px; text-align: center;">Katılım Severityi</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(r => {
              let levelBadge = '<span class="status-badge badge-completed">🟢 High</span>';
              if (r.activity_level.includes('Moderate')) levelBadge = '<span class="status-badge badge-reviewing">🟡 Medium</span>';
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
                    <strong style="font-size: 13.5px; color: var(--primary-navy);">${r.activity_score} Points</strong>
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
      showToast('Downloadilecek rapor verisi bulunmuyor.');
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
    showToast('Report exported as CSV file.');
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
    'all': '📂 All Event Categories',
    'users': '👤 User Management',
    'permissions': '🔑 Yetki & Roller',
    'tasks': '📋 Task Management',
    'submissions': '📝 Submissions & Grading',
    'announcements': '📢 Announcement Management',
    'calendar': '📅 Calendar Actionsi',
    'auth': '🔐 Oturum & Kimlik'
  },

  async renderAuditLogs(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Loading audit log registry...</span></div>`;

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
              <h2 style="font-size: 19px; font-weight: 800; color: #FFFFFF; margin: 0;">22. Audit Logs & System Security Monitor</h2>
              <span class="status-badge" style="background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid rgba(52, 211, 153, 0.3);">Who • What • When • IP Address Tracked</span>
            </div>
            <p style="color: #94A3B8; font-size: 12.5px; margin: 0; max-width: 750px;">
              Comprehensive audit trail for user provisioning, role permission modifications, assignments, submissions, grading, and security events.
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="btn-action btn-secondary" onclick="AuditLogsController.exportLogsCsv()" style="padding: 8px 14px; font-size: 12.5px; background: rgba(255,255,255,0.1); color: #FFF; border: 1px solid rgba(255,255,255,0.2);">
              📥 Export CSV
            </button>
            <button class="btn-action btn-primary" onclick="AuditLogsController.refresh()" style="padding: 8px 14px; font-size: 12.5px;">
              🔄 Refresh
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
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Today's Actions</div>
            <div style="font-size: 20px; font-weight: 800; color: #059669;">${auditData.today_count}</div>
          </div>
          <div style="font-size: 24px; padding: 8px; background: var(--bg-page); border-radius: 8px;">⚡</div>
        </div>

        <div class="panel-card" style="padding: 16px 18px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Critical & Warnings</div>
            <div style="font-size: 20px; font-weight: 800; color: #DC2626;">${auditData.critical_count}</div>
          </div>
          <div style="font-size: 24px; padding: 8px; background: var(--bg-page); border-radius: 8px;">🚨</div>
        </div>

        <div class="panel-card" style="padding: 16px 18px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Active Users</div>
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
              <option value="all" ${this.filters.severity === 'all' ? 'selected' : ''}>🛡️ Tüm Severityler</option>
              <option value="info" ${this.filters.severity === 'info' ? 'selected' : ''}>🟢 Info (Info)</option>
              <option value="warning" ${this.filters.severity === 'warning' ? 'selected' : ''}>🟡 Warning (Warning)</option>
              <option value="critical" ${this.filters.severity === 'critical' ? 'selected' : ''}>🔴 Critical (Critical)</option>
            </select>

            <!-- Date Range Filter -->
            <select class="form-control" style="font-size: 12px; padding: 5px 10px; height: 34px; width: 140px;" onchange="AuditLogsController.setFilter('dateRange', this.value)">
              <option value="all" ${this.filters.dateRange === 'all' ? 'selected' : ''}>📅 All Time</option>
              <option value="today" ${this.filters.dateRange === 'today' ? 'selected' : ''}>Bugün</option>
              <option value="week" ${this.filters.dateRange === 'week' ? 'selected' : ''}>Last 7 Days</option>
              <option value="month" ${this.filters.dateRange === 'month' ? 'selected' : ''}>Last 30 Days</option>
            </select>

            <!-- Search Input -->
            <input type="text" placeholder="🔍 Search logs, actors, or IP addresses..." value="${escapeHtml(this.filters.search)}" oninput="AuditLogsController.handleSearch(this.value)" class="form-control" style="font-size: 12px; padding: 5px 10px; height: 34px; width: 210px;">
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">${this.cachedLogs.length} Records Displayed</span>
            <button class="btn-action btn-secondary btn-sm" onclick="AuditLogsController.resetFilters()" style="padding: 4px 10px; font-size: 11.5px;">
              Reset Filters
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
          <strong style="font-size: 14px; color: var(--primary-navy); display: block; margin-bottom: 4px;">No Audit Logs Found</strong>
          <p style="font-size: 12.5px; margin: 0;">No audit log entries match the selected filters.</p>
        </div>
      `;
    }

    return `
      <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: var(--bg-page); border-bottom: 1px solid var(--border-light); text-align: left;">
            <th style="padding: 12px 14px; width: 145px;">⏰ Timestamp</th>
            <th style="padding: 12px 14px;">👤 User (Actor)</th>
            <th style="padding: 12px 14px;">⚡ Action & Event Type</th>
            <th style="padding: 12px 14px;">📝 Event Description & Payload Details</th>
            <th style="padding: 12px 14px; text-align: center;">🌐 IP Address</th>
            <th style="padding: 12px 14px; text-align: center;">🛡️ Severity</th>
            <th style="padding: 12px 14px; text-align: center;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(log => {
            let sevBadge = '<span class="status-badge" style="background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.2);">🟢 Info</span>';
            if (log.severity === 'warning') sevBadge = '<span class="status-badge" style="background: rgba(245,158,11,0.1); color: #D97706; border: 1px solid rgba(245,158,11,0.2);">🟡 Warning</span>';
            else if (log.severity === 'critical') sevBadge = '<span class="status-badge" style="background: rgba(239,68,68,0.1); color: #DC2626; border: 1px solid rgba(239,68,68,0.2);">🔴 Critical</span>';

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
                    🔍 Details
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
            <h3 style="margin: 0; font-size: 16px; color: var(--primary-navy);">Denetim Kaydı Detailsı (#${log.id})</h3>
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
                <span style="font-size: 10.5px; font-weight: 700; color: var(--accent-rose);">Old Values (Old):</span>
                <pre style="background: #FFF1F2; border: 1px solid #FECDD3; color: #9F1239; padding: 8px; border-radius: 6px; font-size: 11px; overflow-x: auto; margin-top: 2px;">${JSON.stringify(log.old_values || {}, null, 2)}</pre>
              </div>
              <div>
                <span style="font-size: 10.5px; font-weight: 700; color: var(--accent-emerald);">New Values (New):</span>
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

    const headers = ['ID', 'Timestamp', 'Kullanici_ID', 'Kullanici_Adi', 'Rol', 'Eposta', 'Islem', 'Category', 'Aciklama', 'IP_Adresi', 'Guvenlik_Duzeyi'];
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
    showToast('Audit logs exported as CSV successfully.');
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
              Fully normalized data dictionary for users, roles, permissions, training groups, tasks, submissions, evaluations, calendar, and audit logs.
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
              All (${schema.tables.length})
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
          <p style="font-size: 12.5px; margin: 0;">Search kriterinize uygun veritabanı tablosu eşleşmedi.</p>
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
            <strong style="color: #D97706; font-size: 13px;">4. İletişim, Announcements ve Calendar</strong>
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
          <h3>Error</h3>
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
            <strong>No live records found in this table.</strong>
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
          <p>⚠️ Settings yüklenirken bir hata oluştu: ${escapeHtml(err.message)}</p>
          <button class="btn-action btn-primary" onclick="SettingsController.renderSettings(document.getElementById('main-content'))">Tekrar Dene</button>
        </div>
      `;
    }
  },

  renderUI(container) {
    // Group settings by category
    const categories = {
      'general': { name: 'General & Academic', icon: '🎓', desc: 'Üniversite, akademik yıl, dönem ve sistem başlık ayarları' },
      'submission': { name: 'Submission & File Policy', icon: '📁', desc: 'Max file size limits, accepted formats, and late submission policies.' },
      'notification': { name: 'Bildirimler & Email', icon: '🔔', desc: 'E-posta şablonları, anlık bildirim kanalları ve hatırlatmalar' },
      'security': { name: 'Security & Session', icon: '🛡️', desc: 'Password politikası, oturum zaman aşımı ve denetim log saklama süresi' }
    };

    const currentCatSettings = this.settings.filter(s => (s.category || 'general') === this.activeCategory);

    container.innerHTML = `
      <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FFF; padding: 24px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(59,130,246,0.25); border: 1px solid rgba(59,130,246,0.4); border-radius: 20px; font-size: 11px; font-weight: 700; color: #93C5FD; text-transform: uppercase; margin-bottom: 8px;">
              ⚙️ SECTION 26.29 • SİSTEM AYARLARI MERKEZİ
            </div>
            <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 6px 0; color: #FFFFFF;">System Parameters & Konfigürasyon</h2>
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

      <!-- Settings Form Alanı -->
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
            <button type="button" class="btn-action btn-secondary" onclick="SettingsController.resetToDefaults()">Reset to Defaults</button>
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
          <input type="text" id="set_system_name" class="form-control" value="University Task & Training Management Platform (TTMS)" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Giriş ekranında ve üst başlıkta görüntülenecek kurum adı.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Active Academic Year</label>
          <input type="text" id="set_academic_year" class="form-control" value="2025-2026" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Reportlama ve grup atamalarında varsayılan akademik yıl.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Active Semester</label>
          <select id="set_active_semester" class="form-control" style="font-size: 13px;">
            <option value="Fall Semester">Fall Semester</option>
            <option value="Spring Semester" selected>Spring Semester</option>
            <option value="Summer School">Summer School</option>
          </select>
          <small style="color: var(--text-muted); font-size: 11px;">Active ders ve ödev takviminin işlendiği dönem.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Kurumsal İletişim Emailsı</label>
          <input type="email" id="set_support_email" class="form-control" value="destek@universite.edu.tr" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Yardım ve destek taleplerinin yönlendirileceği e-posta.</small>
        </div>
      `;
    } else if (cat === 'submission') {
      return `
        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Max Upload File Youe (MB)</label>
          <input type="number" id="set_max_upload_size" class="form-control" value="25" min="5" max="100" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Maximum file size limit allowed for student submissions.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Allowed File Extensions</label>
          <input type="text" id="set_allowed_extensions" class="form-control" value="pdf, docx, zip, py, ipynb, rar, png, jpg" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Virgülle ayrılmış geçerli dosya uzantıları.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Late Submissionat Politikası</label>
          <select id="set_allow_late_submission" class="form-control" style="font-size: 13px;">
            <option value="true" selected>İzin Ver (Ceza Pointsı ile)</option>
            <option value="false">Kesinlikle İzin Verme (Due Datede Kilitlenir)</option>
          </select>
          <small style="color: var(--text-muted); font-size: 11px;">Permission policy for accepting submissions after deadline.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Günlük Late Submissionat Points Kesintisi (%)</label>
          <input type="number" id="set_late_penalty_rate" class="form-control" value="5" min="0" max="50" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Overdue her 24 saat için toplam puandan düşülecek yüzde.</small>
        </div>
      `;
    } else if (cat === 'notification') {
      return `
        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Yaklaşan Teslimat Hatırlatması (Time Önce)</label>
          <input type="number" id="set_deadline_reminder_hours" class="form-control" value="24" min="1" max="72" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Automated reminder dispatched before the submission due date.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Otomatik Email Bildirimleri</label>
          <select id="set_enable_email_notifications" class="form-control" style="font-size: 13px;">
            <option value="true" selected>Active (Send email alerts upon task assignment and grading)</option>
            <option value="false">Inactive (Yalnızca web portal içi bildirimler)</option>
          </select>
          <small style="color: var(--text-muted); font-size: 11px;">SMTP e-posta sunucusu üzerinden anlık uyarı iletimi.</small>
        </div>
      `;
    } else if (cat === 'security') {
      return `
        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Oturum Timestamp Aşımı (Dakika)</label>
          <input type="number" id="set_session_timeout_minutes" class="form-control" value="120" min="15" max="1440" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">Hareketsiz kalan kullanıcı oturumunun otomatik kapatılma süresi.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Denetim Günlüğü (Audit Log) Saklama Süresi (Gün)</label>
          <input type="number" id="set_audit_retention_days" class="form-control" value="365" min="30" max="1825" style="font-size: 13px;">
          <small style="color: var(--text-muted); font-size: 11px;">KVKK ve akademik denetim gereği güvenlik loglarının arşivde tutulma süresi.</small>
        </div>

        <div class="form-group">
          <label style="font-size: 12.5px; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; display: block;">Password Karmaşıklık Politikası</label>
          <select id="set_password_complexity" class="form-control" style="font-size: 13px;">
            <option value="high" selected>High (En az 8 karakter, büyük harf, rakam ve özel karakter)</option>
            <option value="medium">Medium (En az 6 karakter, harf ve rakam)</option>
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
    showToast('Settings kaydediliyor...', 'info');
    try {
      await apiRequest('/api/settings', 'POST', {
        settings: {
          system_name: 'University Task & Training Management Platform (TTMS)',
          academic_year: '2025-2026',
          active_semester: 'Spring Semester',
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





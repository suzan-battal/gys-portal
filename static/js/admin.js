/**
 * Üniversite Tasks Yönetim Sistemi - Yönetici Paneli Denetleyicisi (admin.js)
 * İstatistikler, Student/Trainer/Kullanıcı CRUD, Eğitim Groupları (Training Groups) ve Tasks Yönetimi.
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
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Yükleniyor...</span></div>`;

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
      <!-- Hoş Geldiniz Bannerı (Hero Banner) -->
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

      <!-- Section 16: 7x KPI İstatistik Kartları -->
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
            <strong style="font-size: 15px; color: var(--primary-navy);">Student Progress & Performance Overview</strong>
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

      <!-- 2-Kolonlu Düzen: 9. Trainer Activity & 10. Late Submissions -->
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
              <strong style="font-size: 14px; color: var(--primary-navy);">10. Late Submissions (Overdue Tasksler)</strong>
            </div>
            <button class="btn-action btn-secondary btn-sm" onclick="switchTab('tasks')">Tüm Tasksler</button>
          </div>
          <div class="table-responsive" style="margin: 0;">
            <table class="custom-table" style="margin: 0; width: 100%;">
              <thead>
                <tr style="background: var(--bg-page); font-size: 11px;">
                  <th style="padding: 8px 12px;">Student</th>
                  <th style="padding: 8px 12px;">Tasks Başlığı</th>
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

      <!-- 11. Training Groups Performance -->
      <div class="panel-card" style="padding: 20px; border: 1px solid var(--border-light); border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary-blue);"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            <strong style="font-size: 15px; color: var(--primary-navy);">11. Training Groups Performance (Eğitim Groupları Başarı ve İlerleme Tablosu)</strong>
          </div>
          <button class="btn-action btn-primary btn-sm" onclick="switchTab('groups')">Tüm Groupları Yönet</button>
        </div>

        <div class="table-responsive" style="margin: 0;">
          <table class="custom-table" style="margin: 0; width: 100%;">
            <thead>
              <tr style="background: var(--bg-page); font-size: 11.5px;">
                <th style="padding: 10px 14px;">Group Adı & Uzmanlık</th>
                <th style="padding: 10px 14px;">Sorumlu Trainer</th>
                <th style="padding: 10px 14px;">Student Mevcudu</th>
                <th style="padding: 10px 14px;">Total Tasks</th>
                <th style="padding: 10px 14px;">Biten Tasks</th>
                <th style="padding: 10px 14px; min-width: 140px;">Progress (%)</th>
                <th style="padding: 10px 14px;">Average Grade</th>
                <th style="padding: 10px 14px; text-align: right;">Durum</th>
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
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Yükleniyor...</span></div>`;

    const res = await apiFetch('/api/groups');
    const groups = res.groups || [];

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-header-left">
            <h3>Eğitim Groupları ve Şubeler (${groups.length})</h3>
          </div>
          <button class="btn-action btn-primary" onclick="AdminController.openAddGroupModal()" style="width: auto;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Yeni Group Oluştur</span>
          </button>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Group Adı & Uzmanlık</th>
                <th>Sorumlu Trainer</th>
                <th>Enrolled Students</th>
                <th>Date Range</th>
                <th>Durum</th>
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
                      ${g.status === 'Active' ? 'Active' : (g.status === 'Completed' ? 'Tamamlandı' : 'Archived')}
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
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Yükleniyor...</span></div>`;

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
                <th>Ad Soyad</th>
                <th>Kurumsal E-posta</th>
                <th>Kayıt Tarihi</th>
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
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Kullanıcılar Yükleniyor...</span></div>`;

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
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Yükleniyor...</span></div>`;

    const res = await apiFetch('/api/tasks');
    const tasks = res.tasks || [];

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-header-left">
            <h3>Tanımlı Tasksler ve Ödevler (${tasks.length})</h3>
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
                <th>Tasks Başlığı</th>
                <th>Priority</th>
                <th>Sorumlu Trainer</th>
                <th>Atanan Student</th>
                <th>Submission Deadline</th>
                <th>Durum</th>
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
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Yükleniyor...</span></div>`;

    const res = await apiFetch('/api/submissions');
    const submissions = res.submissions || [];

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-header-left">
            <h3>Student Teslim ve Notlandırma Listesi (${submissions.length})</h3>
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
                <th>Durum</th>
                <th>Not</th>
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
                    ${s.is_late ? '<span class="status-badge badge-pending" style="font-size:11px;">⚠️ Gecikmiş (Is Late)</span>' : '<span class="status-badge badge-completed" style="font-size:11px;">⏰ Zamanında</span>'}
                  </td>
                  <td>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                      ${s.file_path ? `
                        <a href="/uploads/${encodeURIComponent(s.file_path)}" download="${s.original_filename || s.file_path}" target="_blank" class="btn-action btn-secondary btn-sm" style="font-size:11.5px; padding:4px 8px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                          ${s.original_filename || 'Dosya İndir'}
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
                      İncele & Değerlendir
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

  // ==================== GRUP MODAL İŞLEMLERİ ====================
  async openAddGroupModal() {
    const [trainersRes, studentsRes] = await Promise.all([
      apiFetch('/api/users?role=trainer'),
      apiFetch('/api/users?role=student')
    ]);

    const modalHtml = `
      <div id="modal-group-custom" class="modal-overlay active">
        <div class="modal-box" style="max-width: 620px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden;">
          <div class="modal-header">
            <h3>Yeni Eğitim Grubu (Training Group) Oluştur</h3>
            <button class="modal-close-btn" onclick="document.getElementById('modal-group-custom').remove()">&times;</button>
          </div>
          <form onsubmit="AdminController.handleSaveGroup(event, null)" style="display: flex; flex-direction: column; overflow: hidden; flex: 1;">
            <div class="modal-body" style="overflow-y: auto; max-height: calc(85vh - 130px); padding: 16px 20px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group">
                  <label>Group / Şube Adı *</label>
                  <input type="text" id="group-name" placeholder="Örn: Yazılım Mühendisliği - Şube A" required>
                </div>
                <div class="form-group">
                  <label>Bölüm / Uzmanlık Alanı *</label>
                  <input type="text" id="group-dept" placeholder="Örn: Bilgisayar Mühendisliği" required>
                </div>
              </div>
              <div class="form-group">
                <label>Group Açıklaması ve Hedefleri</label>
                <textarea id="group-desc" rows="2" placeholder="Group hedefleri, ders kapsamı ve yönergeler..."></textarea>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
                <div class="form-group">
                  <label>Başlangıç Tarihi *</label>
                  <input type="date" id="group-start" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                  <label>Bitiş Tarihi *</label>
                  <input type="date" id="group-end" value="2026-12-31" required>
                </div>
                <div class="form-group">
                  <label>Group Durumu *</label>
                  <select id="group-status" required>
                    <option value="Active" selected>🟢 Active (Active)</option>
                    <option value="Completed">🔵 Completed (Tamamlandı)</option>
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
              <button type="button" class="btn-action btn-secondary" onclick="document.getElementById('modal-group-custom').remove()">İptal</button>
              <button type="submit" class="btn-action btn-primary">Grubu Kaydet</button>
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
            <h3>Eğitim Grubunu Edit: ${g.name}</h3>
            <button class="modal-close-btn" onclick="document.getElementById('modal-group-custom').remove()">&times;</button>
          </div>
          <form onsubmit="AdminController.handleSaveGroup(event, ${g.id})" style="display: flex; flex-direction: column; overflow: hidden; flex: 1;">
            <div class="modal-body" style="overflow-y: auto; max-height: calc(85vh - 130px); padding: 16px 20px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group">
                  <label>Group / Şube Adı *</label>
                  <input type="text" id="group-name" value="${g.name}" required>
                </div>
                <div class="form-group">
                  <label>Bölüm / Uzmanlık Alanı *</label>
                  <input type="text" id="group-dept" value="${g.department}" required>
                </div>
              </div>
              <div class="form-group">
                <label>Group Açıklaması ve Hedefleri</label>
                <textarea id="group-desc" rows="2">${g.description || ''}</textarea>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
                <div class="form-group">
                  <label>Başlangıç Tarihi *</label>
                  <input type="date" id="group-start" value="${g.start_date || ''}" required>
                </div>
                <div class="form-group">
                  <label>Bitiş Tarihi *</label>
                  <input type="date" id="group-end" value="${g.end_date || ''}" required>
                </div>
                <div class="form-group">
                  <label>Group Durumu *</label>
                  <select id="group-status" required>
                    <option value="Active" ${g.status === 'Active' ? 'selected' : ''}>🟢 Active (Active)</option>
                    <option value="Completed" ${g.status === 'Completed' ? 'selected' : ''}>🔵 Completed (Tamamlandı)</option>
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
                  <label style="margin-bottom:0;">Gruba Enrolled Studentsler (${enrolledIds.length} Seçili)</label>
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
              <button type="button" class="btn-action btn-secondary" onclick="document.getElementById('modal-group-custom').remove()">İptal</button>
              <button type="submit" class="btn-action btn-primary">Değişiklikleri Kaydet</button>
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
      showToast(groupId ? "Eğitim grubu güncellendi." : "Eğitim grubu başarıyla oluşturuldu.", "success");
      switchTab('groups');
    } else {
      showToast(res.error || "Group kaydedilirken hata oluştu.", "error");
    }
  },

  deleteGroup(groupId, groupName) {
    openConfirmModal(
      'Grubu Delete',
      `"${groupName}" adlı eğitim grubunu silmek istediğinizden emin misiniz?`,
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
    document.getElementById('modal-user-title').textContent = defaultRole === 'trainer' ? 'Trainer Ekle' : (defaultRole === 'admin' ? 'Yönetici Ekle' : 'Student Ekle');
    document.getElementById('user-id').value = '';
    document.getElementById('user-name').value = '';
    document.getElementById('user-email').value = '';
    document.getElementById('user-role').value = defaultRole;
    document.getElementById('user-password').value = '';
    document.getElementById('user-password').required = true;
    document.getElementById('label-user-password').textContent = 'Şifre *';
    document.getElementById('help-user-password').style.display = 'none';

    openModal('modal-user');
  },

  async openEditUserModal(userId) {
    const res = await apiFetch(`/api/users/${userId}`);
    if (!res.success || !res.user) {
      showToast(res.error || "Kullanıcı bilgileri alınamadı.", "error");
      return;
    }

    const u = res.user;
    document.getElementById('modal-user-title').textContent = 'Kullanıcı Edit';
    document.getElementById('user-id').value = u.id;
    document.getElementById('user-name').value = u.name;
    document.getElementById('user-email').value = u.email;
    document.getElementById('user-role').value = u.role;
    document.getElementById('user-password').value = '';
    document.getElementById('user-password').required = false;
    document.getElementById('label-user-password').textContent = 'Yeni Şifre (İsteğe bağlı)';
    document.getElementById('help-user-password').style.display = 'block';

    openModal('modal-user');
  },

  deleteUser(userId, userName) {
    openConfirmModal(
      'Kullanıcıyı Delete',
      `"${userName}" adlı kullanıcıyı silmek istediğinizden emin misiniz?`,
      async () => {
        const res = await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
        if (res.success) {
          showToast("User deleted successfully.", "success");
          switchTab(AppState.currentTab);
        } else {
          showToast(res.error || "Kullanıcı silinirken bir hata oluştu.", "error");
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
    if (document.getElementById('task-estimated-time')) document.getElementById('task-estimated-time').value = '4 Saat';
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
      `"${taskTitle}" başlıklı görevi silmek istediğinizden emin misiniz?`,
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
    showToast(res.message || "Kullanıcı başarıyla kaydedildi.", "success");
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
  container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Roller ve Yetki Matrisi Yükleniyor...</span></div>`;

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
        <h2 style="font-size: 20px; color: var(--primary-navy); margin: 0 0 4px 0;">12. Roles & Permissions (Roller ve Yetkiler Matrisi)</h2>
        <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">Sistemdeki 6 rol ve 26 modüler iznin canlı kontrol ve denetim tablosu.</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn-action btn-primary" onclick="AdminController.saveAllRolePermissions()" style="display: flex; align-items: center; gap: 6px; padding: 10px 20px; font-size: 13px; font-weight: 600;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          <span>Yetki Değişikliklerini Kaydet (Save)</span>
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
              <th style="padding: 14px 18px; text-align: left; width: 340px; font-size: 13px;">İzin Kodu & Açıklaması (Permission Code)</th>
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

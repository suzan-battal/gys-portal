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
                    ${s.is_late ? '<span class="status-badge badge-pending" style="font-size:11px;">⚠️ Overdue (Is Late)</span>' : '<span class="status-badge badge-completed" style="font-size:11px;">⏰ Timestamp (When)ında</span>'}
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

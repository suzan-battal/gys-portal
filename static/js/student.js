/**
 * Üniversite Görev Yönetim Sistemi - Öğrenci Paneli Denetleyicisi (student.js)
 * Görev takibi, haftalık çalışma grafiği, dosya teslimi, not ve geri bildirim görüntüleme.
 */

const StudentController = {

  async renderTab(tabId) {
    const main = document.getElementById('main-content');
    const heading = document.getElementById('page-heading');

    if (tabId === 'home') {
      heading.innerHTML = `<span>Student Dashboard - Overview</span>`;
      await this.renderHome(main);
    } else if (tabId === 'my-tasks') {
      heading.innerHTML = `<span>Görevlerim ve Ödev Teslimi</span>`;
      await this.renderMyTasks(main);
    } else if (tabId === 'my-submissions') {
      heading.innerHTML = `<span>My Submissions & Academic Grades</span>`;
      await this.renderMySubmissions(main);
    }
  },

  // ==================== 1. ANA SAYFA & İSTATİSTİKLER ====================
  async renderHome(container) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Yükleniyor...</span></div>`;

    const [statsRes, tasksRes] = await Promise.all([
      apiFetch('/api/stats'),
      apiFetch('/api/tasks')
    ]);

    const stats = statsRes.stats || { total_tasks: 0, pending_tasks: 0, submitted_tasks: 0, reviewed_tasks: 0 };
    const tasks = tasksRes.tasks || [];
    const user = AppState.currentUser;

    container.innerHTML = `
      <!-- Hoş Geldiniz Hero Bannerı -->
      <div class="welcome-hero">
        <div class="welcome-hero-content">
          <h2>Hoş Geldin, ${user.name} 👋</h2>
          <p>İstanbul Üniversitesi Öğrenci Bilgi ve Ödev Portalı. Atanan ders görevlerini inceleyebilir, dosyalarını doğrudan teslim edebilir ve eğitmenlerinin geri bildirimlerini anında görebilirsin.</p>
        </div>
        <div class="welcome-hero-actions">
          <button class="btn-hero-action" onclick="openUniversalUploadModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            <span>Submit Assignment</span>
          </button>
          <button class="btn-hero-action" onclick="switchTab('my-submissions')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Notlarımı Gör</span>
          </button>
        </div>
      </div>

      <!-- 4x KPI İstatistik Kartları -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <span>Toplam Görev</span>
            <h3>${stats.total_tasks}</h3>
            <div class="stat-trend neutral">
              <span>Bahar Dönemi</span>
            </div>
          </div>
          <div class="stat-icon-wrapper icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span>Pending Start Ödevler</span>
            <h3>${stats.pending_tasks}</h3>
            <div class="stat-trend positive" style="color:var(--accent-gold);">
              <span>Teslim Edilecek</span>
            </div>
          </div>
          <div class="stat-icon-wrapper icon-gold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span>Teslim Edilenler</span>
            <h3>${stats.submitted_tasks}</h3>
            <div class="stat-trend positive">
              <span>İncelemede</span>
            </div>
          </div>
          <div class="stat-icon-wrapper icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span>Notlanan & Completed</span>
            <h3>${stats.reviewed_tasks}</h3>
            <div class="stat-trend positive">
              <span>Sonuçlandı</span>
            </div>
          </div>
          <div class="stat-icon-wrapper icon-emerald">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
        </div>
      </div>

      <!-- 2-Kolonlu Zengin Düzen (2/3 Sol + 1/3 Sağ) -->
      <div class="dashboard-grid-2col">
        <!-- SOL: Haftalık İlerleme & Görev Tablosu -->
        <div>
          <!-- Haftalık Çalışma Çubuk Grafiği -->
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-header-left">
                <h3>Haftalık Çalışma ve Teslim Yoğunluğu</h3>
                <p>Son 7 gün içindeki çalışma süren ve teslim edilen ödevlerin</p>
              </div>
              <span class="status-badge badge-submitted">Aktif Hafta</span>
            </div>
            <div class="bar-chart-container">
              <div class="bar-column">
                <div class="bar-track"><div class="bar-fill" style="height: 40%;"></div></div>
                <span class="bar-label">Pzt</span>
              </div>
              <div class="bar-column">
                <div class="bar-track"><div class="bar-fill" style="height: 75%;"></div></div>
                <span class="bar-label">Sal</span>
              </div>
              <div class="bar-column">
                <div class="bar-track"><div class="bar-fill" style="height: 85%;"></div></div>
                <span class="bar-label">Çar</span>
              </div>
              <div class="bar-column">
                <div class="bar-track"><div class="bar-fill" style="height: 60%;"></div></div>
                <span class="bar-label">Per</span>
              </div>
              <div class="bar-column">
                <div class="bar-track"><div class="bar-fill" style="height: 90%;"></div></div>
                <span class="bar-label">Cum</span>
              </div>
              <div class="bar-column">
                <div class="bar-track"><div class="bar-fill" style="height: 50%;"></div></div>
                <span class="bar-label">Cts</span>
              </div>
              <div class="bar-column">
                <div class="bar-track"><div class="bar-fill" style="height: 65%;"></div></div>
                <span class="bar-label">Paz</span>
              </div>
            </div>
          </div>

          <!-- Görevlerim Tablosu -->
          <div class="panel-card">
            <div class="panel-header">
              <div class="panel-header-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary-navy);"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                <h3>Akademik Görevlerim ve Ödevlerim</h3>
              </div>
              <button class="btn-action btn-secondary btn-sm" onclick="switchTab('my-tasks')">Tümünü Gör</button>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Görev</th>
                    <th>Instructor</th>
                    <th>Due Date Tarihi</th>
                    <th>Status</th>
                    <th>Not</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${tasks.length === 0 ? `
                    <tr><td colspan="6" class="empty-state">Henüz size atanmış bir görev bulunmuyor.</td></tr>
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
                          Dosya Yükle / Teslim Et
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- SAĞ: Donut Grafik, Mini Takvim, Duyurular -->
        <div>
          <!-- Dönem Başarı Oranı Donut Widgetı -->
          <div class="donut-widget">
            <div class="chart-header" style="margin-bottom: 0;">
              <div class="chart-header-left">
                <h4 style="font-size: 15px; font-weight: 700;">Dönem Tamamlama Oranı</h4>
                <p>Teslim ettiğin ödevlerin genel oranı</p>
              </div>
            </div>
            <div class="donut-center-box">
              <svg class="donut-svg" viewBox="0 0 120 120">
                <circle class="donut-circle-bg" cx="60" cy="60" r="54"></circle>
                <circle class="donut-circle-progress" cx="60" cy="60" r="54" stroke-dashoffset="25"></circle>
              </svg>
              <div class="donut-inner-text">
                <h4>%95</h4>
                <span>Tamamlandı</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-around; font-size: 12px; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
              <div>
                <span style="color:var(--text-muted); display:block;">Teslim Edilen</span>
                <strong style="color:var(--accent-emerald);">${stats.submitted_tasks + stats.reviewed_tasks}</strong>
              </div>
              <div>
                <span style="color:var(--text-muted); display:block;">Pending Start</span>
                <strong style="color:var(--accent-gold);">${stats.pending_tasks}</strong>
              </div>
              <div>
                <span style="color:var(--text-muted); display:block;">Ortalama Not</span>
                <strong style="color:var(--primary-navy);">92.5</strong>
              </div>
            </div>
          </div>

          <!-- Mini Akademik Takvim Widgetı -->
          <div class="calendar-card">
            <div class="calendar-header">
              <h4>📅 Akademik Takvim</h4>
              <span style="font-size:12px; font-weight:600; color:var(--primary-blue);">Ağustos 2026</span>
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

          <!-- Akademik Duyurular Listesi -->
          <div class="announcements-card">
            <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 8px;">📢 Öğrenci Duyuruları</h4>
            <div class="announcement-item">
              <div class="announcement-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              </div>
              <div class="announcement-content">
                <h5>Ödev Teslim Formatı</h5>
                <span>Lütfen Python ve veri analizi ödevlerinizi ZIP veya PY dosyası olarak yükleyiniz.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ==================== 2. GÖREVLERİM SAYFASI ====================
  async renderMyTasks(container, activeFilter = 'all') {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Yükleniyor...</span></div>`;

    const res = await apiFetch('/api/tasks');
    const allTasks = res.tasks || [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const todayCount = allTasks.filter(t => t.deadline === todayStr).length;
    const overdueCount = allTasks.filter(t => t.deadline < todayStr && t.status !== 'Tamamlandı').length;
    const upcomingCount = allTasks.filter(t => t.deadline > todayStr).length;

    let filteredTasks = allTasks;
    if (activeFilter === 'today') {
      filteredTasks = allTasks.filter(t => t.deadline === todayStr);
    } else if (activeFilter === 'overdue') {
      filteredTasks = allTasks.filter(t => t.deadline < todayStr && t.status !== 'Tamamlandı');
    } else if (activeFilter === 'upcoming') {
      filteredTasks = allTasks.filter(t => t.deadline > todayStr);
    }

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header" style="flex-wrap:wrap; gap:12px;">
          <div class="panel-header-left">
            <h3>Görevlerim ve Dosya Teslimi (${allTasks.length})</h3>
          </div>
          
          <!-- Filtre Butonları (Bugün, Yaklaşan, Geciken) -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn-action ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="StudentController.renderMyTasks(document.getElementById('main-content'), 'all')">
              📌 Tümü (${allTasks.length})
            </button>
            <button class="btn-action ${activeFilter === 'today' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="StudentController.renderMyTasks(document.getElementById('main-content'), 'today')">
              ⚡ Bugün Teslim (${todayCount})
            </button>
            <button class="btn-action ${activeFilter === 'upcoming' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="StudentController.renderMyTasks(document.getElementById('main-content'), 'upcoming')">
              📅 Yaklaşanlar (${upcomingCount})
            </button>
            <button class="btn-action ${activeFilter === 'overdue' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="StudentController.renderMyTasks(document.getElementById('main-content'), 'overdue')" style="${overdueCount > 0 ? 'border-color:var(--accent-rose); color:var(--accent-rose);' : ''}">
              ⚠️ Gecikenler (${overdueCount})
            </button>
          </div>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Görev</th>
                <th>Instructor</th>
                <th>Due Date Tarihi</th>
                <th>Priority</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTasks.length === 0 ? `
                <tr><td colspan="6" class="empty-state">Bu filtreye uygun bir görev bulunmamaktadır.</td></tr>
              ` : filteredTasks.map(t => `
                <tr>
                  <td class="text-main">
                    <div style="font-weight:700;">${t.title}</div>
                    <div style="font-size:12px; color:var(--text-secondary); margin-top:2px; max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.description}</div>
                  </td>
                  <td>${t.trainer_name}</td>
                  <td>
                    ${formatDateTr(t.deadline)}
                    ${t.deadline < todayStr && t.status !== 'Tamamlandı' ? '<span style="color:var(--accent-rose); font-size:11px; font-weight:700; display:block;">Gecikmiş</span>' : ''}
                  </td>
                  <td>
                    <span class="status-badge ${t.priority === 'Acil' ? 'badge-pending' : (t.priority === 'Yüksek' ? 'badge-reviewing' : 'badge-submitted')}">
                      ${t.priority || 'Normal'}
                    </span>
                  </td>
                  <td>${getStatusBadgeHtml(t.status)}</td>
                  <td style="text-align: right; white-space: nowrap;">
                    <button class="btn-action btn-secondary btn-sm" onclick="StudentController.openTaskDetailModal(${t.id})">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      Detaylar & Çözüm
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
    container.innerHTML = `<div style="text-align:center; padding:40px;"><span style="color:var(--text-muted);">Yükleniyor...</span></div>`;

    const res = await apiFetch('/api/submissions');
    const submissions = res.submissions || [];

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-header-left">
            <h3>Teslim Ettiğim Ödevler ve Notlarım (${submissions.length})</h3>
          </div>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Görev</th>
                <th>Instructor</th>
                <th>Teslim Tarihi</th>
                <th>Yüklenen Dosya</th>
                <th>Status</th>
                <th>Not</th>
                <th>Instructor Trainer Feedbacki</th>
              </tr>
            </thead>
            <tbody>
              ${submissions.length === 0 ? `
                <tr><td colspan="7" class="empty-state">Henüz teslim ettiğiniz bir ödev bulunmuyor.</td></tr>
              ` : submissions.map(s => `
                <tr>
                  <td class="text-main">${s.task_title}</td>
                  <td>${s.trainer_name}</td>
                  <td>${formatDateTr(s.submitted_at)}</td>
                  <td>
                    <a href="/uploads/${encodeURIComponent(s.file_path)}" download="${s.original_filename || s.file_path}" target="_blank" class="btn-action btn-secondary btn-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      ${s.original_filename || 'Dosya İndir'}
                    </a>
                  </td>
                  <td>${getStatusBadgeHtml(s.status)}</td>
                  <td>${s.grade !== null && s.grade !== undefined ? `<span class="grade-badge">${s.grade} / 100</span>` : '<span style="color:var(--text-muted);">Bekleniyor</span>'}</td>
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

  // ==================== GÖREV DETAY & DOSYA YÜKLEME MODALI ====================
  async openTaskDetailModal(taskId) {
    AppState.activeTaskId = taskId;
    AppState.selectedFile = null;
    clearSelectedFile();

    const res = await apiFetch(`/api/tasks/${taskId}`);
    if (!res.success || !res.task) {
      showToast("Görev bilgileri alınamadı.", "error");
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
      prioBadgeEl.className = `status-badge ${t.priority === 'Urgent' || t.priority === 'Acil' ? 'badge-pending' : (t.priority === 'High' || t.priority === 'Yüksek' ? 'badge-reviewing' : 'badge-submitted')}`;
    }

    const estTimeEl = document.getElementById('detail-estimated-time');
    if (estTimeEl) estTimeEl.textContent = t.estimated_time || 'Belirtilmedi';

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
      if (t.status === 'Bekliyor' || !t.status) {
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

    if (t.status === 'Düzeltme İstendi') {
      if (evalBox) {
        evalBox.style.display = 'block';
        evalBox.style.background = '#FFFBEB';
        evalBox.style.border = '1px solid #FDE68A';
      }
      if (evalHeaderTitle) evalHeaderTitle.innerHTML = `<span style="color:#D97706; font-weight:700;">⚠️ Instructor Düzeltme ve Revizyon Talebi</span>`;
      if (gradeBadge) {
        gradeBadge.textContent = t.grade !== null && t.grade !== undefined ? `Puan: ${t.grade} / 100` : 'Düzeltme Bekleniyor';
        gradeBadge.style.background = '#F59E0B';
      }
      if (feedbackText) feedbackText.textContent = t.feedback || 'Lütfen ödevinizi eğitmenin belirttiği kriterlere göre revize edip yeniden teslim ediniz.';
      if (btnSubmitText) btnSubmitText.textContent = '🔄 Düzeltilmiş Ödevi Yeniden Teslim Et';
    } else if (t.grade !== null && t.grade !== undefined || t.feedback) {
      if (evalBox) {
        evalBox.style.display = 'block';
        evalBox.style.background = 'var(--bg-page)';
        evalBox.style.border = '1px solid var(--border-light)';
      }
      if (evalHeaderTitle) evalHeaderTitle.innerHTML = `Instructor Değerlendirmesi & Notu`;
      if (gradeBadge) {
        gradeBadge.textContent = `Not: ${t.grade} / 100`;
        gradeBadge.style.background = 'var(--accent-gold)';
      }
      if (feedbackText) feedbackText.textContent = t.feedback || 'Instructoriniz henüz yazılı geri bildirim girmedi.';
      if (btnSubmitText) btnSubmitText.textContent = 'Submit Solution';
    } else {
      if (evalBox) evalBox.style.display = 'none';
      if (btnSubmitText) btnSubmitText.textContent = 'Submit Solution';
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
        badgeEl.textContent = `Alınan Not: ${t.grade !== null && t.grade !== undefined ? t.grade : 0} / 100`;
        badgeEl.className = 'status-badge badge-completed';
      } else {
        badgeEl.textContent = `Toplam: 100 Puan (Rubrik Modeli)`;
        badgeEl.className = 'status-badge badge-pending';
      }
    }

    if (compEl) compEl.innerHTML = isGraded ? `${t.rubric_completion !== null && t.rubric_completion !== undefined ? t.rubric_completion : '-'} <span style="font-size:10px; color:var(--text-muted);">/30</span>` : `30 Puan`;
    if (qualEl) qualEl.innerHTML = isGraded ? `${t.rubric_quality !== null && t.rubric_quality !== undefined ? t.rubric_quality : '-'} <span style="font-size:10px; color:var(--text-muted);">/25</span>` : `25 Puan`;
    if (accuEl) accuEl.innerHTML = isGraded ? `${t.rubric_accuracy !== null && t.rubric_accuracy !== undefined ? t.rubric_accuracy : '-'} <span style="font-size:10px; color:var(--text-muted);">/20</span>` : `20 Puan`;
    if (deadEl) deadEl.innerHTML = isGraded ? `${t.rubric_deadline !== null && t.rubric_deadline !== undefined ? t.rubric_deadline : '-'} <span style="font-size:10px; color:var(--text-muted);">/15</span>` : `15 Puan`;
    if (commEl) commEl.innerHTML = isGraded ? `${t.rubric_communication !== null && t.rubric_communication !== undefined ? t.rubric_communication : '-'} <span style="font-size:10px; color:var(--text-muted);">/10</span>` : `10 Puan`;

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

    // Section 7: Teslim Geçmişi ve Revizyonlar (Submission History)
    const historyBox = document.getElementById('detail-submission-history-box');
    const historyList = document.getElementById('detail-submission-history-list');
    const historyCountBadge = document.getElementById('detail-history-count-badge');
    const history = t.submissions_history || [];

    if (historyBox && historyList) {
      if (history.length > 0) {
        historyBox.style.display = 'block';
        if (historyCountBadge) historyCountBadge.textContent = `${history.length} Teslim Kaydı`;
        
        historyList.innerHTML = history.map((sub, idx) => `
          <div style="background: var(--bg-page); border: 1px solid var(--border-light); border-radius: 8px; padding: 10px 14px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <strong style="color: var(--primary-navy);">Teslim Denemesi #${sub.submission_number || (history.length - idx)} (Revizyon ${sub.revision_number || (history.length - idx)}.0)</strong>
                <span style="font-size: 11px; color: var(--text-muted);">🕒 ${formatDateTr(sub.submitted_at)}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                ${sub.is_late ? '<span class="status-badge badge-pending" style="font-size: 10.5px;">⚠️ Gecikmiş (Is Late)</span>' : '<span class="status-badge badge-completed" style="font-size: 10.5px;">⏰ Zamanında</span>'}
                ${getStatusBadgeHtml(sub.status)}
              </div>
            </div>
            ${sub.file_path ? `
              <div style="margin-top: 4px; display: flex; align-items: center; gap: 6px;">
                <span style="color: var(--text-muted); font-size: 12px;">📁 Dosya:</span>
                <a href="/uploads/${encodeURIComponent(sub.file_path)}" download="${sub.original_filename || sub.file_path}" target="_blank" style="color: var(--primary-blue); font-weight: 600; text-decoration: none;">
                  ${sub.original_filename || sub.file_path}
                </a>
              </div>
            ` : ''}
            ${sub.student_link ? `
              <div style="margin-top: 4px; display: flex; align-items: center; gap: 6px;">
                <span style="color: var(--text-muted); font-size: 12px;">🔗 Proje Linki:</span>
                <a href="${sub.student_link}" target="_blank" style="color: var(--primary-blue); font-weight: 600; text-decoration: none;">
                  ${sub.student_link}
                </a>
              </div>
            ` : ''}
            ${sub.student_notes ? `
              <div style="margin-top: 4px; color: var(--text-secondary); font-size: 12px; background: rgba(0,0,0,0.02); padding: 4px 8px; border-radius: 4px;">
                💬 Not: ${sub.student_notes}
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

    // Section 10: Görev İçi Yorumları Listele (Task Comments)
    if (typeof renderTaskComments === 'function') {
      renderTaskComments(t.comments || []);
    }

    openModal('modal-task-detail');
  }
};

// ==================== ÖĞRENCİ OLAYLARI VE DOSYA İŞLEMLERİ ====================
function handleFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 25 * 1024 * 1024) {
    showToast("Dosya boyutu çok büyük. Maksimum 25 MB yükleyebilirsiniz.", "error");
    clearSelectedFile();
    return;
  }

  AppState.selectedFile = file;

  const preview = document.getElementById('file-selected-preview');
  const filename = document.getElementById('selected-filename');
  const filesize = document.getElementById('selected-filesize');

  if (filename) filename.textContent = file.name;
  if (filesize) filesize.textContent = `(${formatFileSize(file.size)})`;
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
    showToast("Göreviniz 'Devam Ediyor' (In Progress) durumuna alındı! Başarılar.", "success");
    StudentController.openTaskDetailModal(taskId);
    switchTab(AppState.currentTab);
  } else {
    showToast(res.error || "Action sırasında bir hata oluştu.", "error");
  }
}

async function handleUploadTaskSubmission() {
  const modalEl = document.getElementById('modal-task-detail');
  const taskId = AppState.activeTaskId || (modalEl ? modalEl.dataset.taskId : null);
  if (!taskId) {
    showToast("Geçerli bir görev seçilmedi.", "error");
    return;
  }

  let file = AppState.selectedFile;
  const studentLink = document.getElementById('submission-link') ? document.getElementById('submission-link').value.trim() : '';
  const studentNotes = document.getElementById('submission-notes') ? document.getElementById('submission-notes').value.trim() : '';

  if (!file) {
    if (studentLink || studentNotes) {
      // Link veya not girildiyse otomatik çözüm raporu belgesi oluştur
      const content = `ÖĞRENCİ ÖDEV TESLİM VE ÇÖZÜM RAPORU\n=========================================\n\nProje / Kaynak Linki:\n${studentLink || 'Belirtilmedi'}\n\nÖğrenci Notu ve Açıklamaları:\n${studentNotes || 'Belirtilmedi'}\n\nSubmission Date: ${new Date().toLocaleString('tr-TR')}\n`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      file = new File([blob], 'ogrenci_cozum_raporu.txt', { type: 'text/plain' });
    } else {
      const fileInput = document.getElementById('submission-file-input');
      if (fileInput) fileInput.click();
      showToast("Lütfen bir ödev dosyası seçiniz veya link/not giriniz.", "error");
      return;
    }
  }

  const btn = document.getElementById('btn-submit-task-file');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Yükleniyor...</span>`;
  }

  const formData = new FormData();
  formData.append('task_id', taskId);
  formData.append('file', file);

  if (studentLink) formData.append('student_link', studentLink);
  if (studentNotes) formData.append('student_notes', studentNotes);

  const res = await apiFetch('/api/submissions/upload', {
    method: 'POST',
    body: formData
  });

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span id="btn-submit-text">Submit Solution</span>`;
  }

  if (res.success) {
    closeModal('modal-task-detail');
    showToast("Ödeviniz başarıyla teslim edildi!", "success");
    clearSelectedFile();
    switchTab(AppState.currentTab);
  } else {
    showToast(res.error || "Dosya yüklenirken bir hata oluştu.", "error");
  }
}

// Global scope'a bağla
window.handleFileSelected = handleFileSelected;
window.clearSelectedFile = clearSelectedFile;
window.handleStartTask = handleStartTask;
window.handleUploadTaskSubmission = handleUploadTaskSubmission;

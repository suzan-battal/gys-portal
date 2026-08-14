/**
 * University Task & Training Management System (TTMS)
 * AI Academic Assistant & Knowledge Engine (chatbot.js)
 * 
 * Provides an intelligent, role-aware, context-sensitive assistant
 * capable of answering system queries, navigating tabs, and providing guidance.
 */

(function() {
  'use strict';

  const AIChatbot = {
    isOpen: false,
    messages: [],
    
    init() {
      this.injectStyles();
      this.injectWidgetHTML();
      this.bindEvents();
      this.loadInitialGreeting();
    },

    injectStyles() {
      if (document.getElementById('ttms-ai-chatbot-styles')) return;
      const style = document.createElement('style');
      style.id = 'ttms-ai-chatbot-styles';
      style.textContent = `
        /* Floating Chatbot Launcher */
        #ttms-ai-launcher {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: none;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        #ttms-ai-launcher-btn {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #6366F1 100%);
          color: #ffffff;
          border: none;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4), 0 2px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        #ttms-ai-launcher-btn:hover {
          transform: scale(1.08) translateY(-2px);
          box-shadow: 0 12px 28px rgba(37, 99, 235, 0.5);
        }

        #ttms-ai-launcher-btn:active {
          transform: scale(0.96);
        }

        .ai-pulse-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid rgba(99, 102, 241, 0.6);
          animation: aiPulse 2.4s infinite;
          pointer-events: none;
        }

        @keyframes aiPulse {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(1.35); opacity: 0; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        .ai-badge-ping {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 14px;
          height: 14px;
          background: #10B981;
          border: 2px solid #ffffff;
          border-radius: 50%;
        }

        .ai-tooltip-pill {
          background: #0F172A;
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12.5px;
          font-weight: 600;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
          animation: floatPill 3s ease-in-out infinite;
          white-space: nowrap;
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        @keyframes floatPill {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        /* Chat Window Container */
        #ttms-ai-window {
          position: fixed;
          bottom: 92px;
          right: 24px;
          width: 390px;
          height: 580px;
          max-width: calc(100vw - 36px);
          max-height: calc(100vh - 110px);
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.22), 0 4px 12px rgba(0, 0, 0, 0.06);
          border: 1px solid #E2E8F0;
          display: flex;
          flex-direction: column;
          z-index: 9999;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        #ttms-ai-window.active {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
        }

        /* Chat Header */
        .ai-chat-header {
          padding: 16px 18px;
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .ai-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ai-avatar {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3B82F6 0%, #6366F1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.35);
        }

        .ai-header-text h4 {
          font-size: 14.5px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 2px 0;
        }

        .ai-status-online {
          font-size: 11px;
          color: #34D399;
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }

        .ai-status-online::before {
          content: '';
          width: 6px;
          height: 6px;
          background: #34D399;
          border-radius: 50%;
          display: inline-block;
        }

        .ai-header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ai-header-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          color: #94A3B8;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .ai-header-btn:hover {
          background: rgba(255,255,255,0.2);
          color: #ffffff;
        }

        /* Messages History Area */
        .ai-chat-body {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #F8FAFC;
        }

        .ai-msg {
          display: flex;
          flex-direction: column;
          max-width: 86%;
          animation: msgFadeIn 0.25s ease-out;
        }

        @keyframes msgFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ai-msg.user {
          align-self: flex-end;
        }

        .ai-msg.bot {
          align-self: flex-start;
        }

        .ai-bubble {
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.45;
          word-break: break-word;
        }

        .ai-msg.user .ai-bubble {
          background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
          color: #ffffff;
          border-bottom-right-radius: 3px;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
        }

        .ai-msg.bot .ai-bubble {
          background: #ffffff;
          color: #1E293B;
          border: 1px solid #E2E8F0;
          border-bottom-left-radius: 3px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .ai-bubble p {
          margin: 0 0 6px 0;
        }
        .ai-bubble p:last-child {
          margin-bottom: 0;
        }

        .ai-bubble ul {
          margin: 4px 0 6px 18px;
          padding: 0;
        }

        .ai-bubble li {
          margin-bottom: 3px;
        }

        .ai-bubble strong {
          color: #0F172A;
        }

        .ai-msg.user .ai-bubble strong {
          color: #ffffff;
        }

        .ai-action-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #EFF6FF;
          color: #1D4ED8;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 11.5px;
          margin-top: 6px;
          cursor: pointer;
          border: 1px solid #BFDBFE;
          transition: all 0.2s;
        }

        .ai-action-link:hover {
          background: #DBEAFE;
          color: #1E40AF;
        }

        .ai-time {
          font-size: 10px;
          color: #94A3B8;
          margin-top: 3px;
          align-self: flex-start;
        }

        .ai-msg.user .ai-time {
          align-self: flex-end;
        }

        /* Typing Dots Indicator */
        .ai-typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          border-bottom-left-radius: 3px;
          width: fit-content;
        }

        .ai-dot {
          width: 6px;
          height: 6px;
          background: #3B82F6;
          border-radius: 50%;
          animation: typingDot 1.4s infinite ease-in-out both;
        }

        .ai-dot:nth-child(1) { animation-delay: -0.32s; }
        .ai-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typingDot {
          0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* Chat Input Footer */
        .ai-chat-footer {
          padding: 12px 14px;
          background: #ffffff;
          border-top: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        #ai-chat-input {
          flex: 1;
          padding: 9px 12px;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }

        #ai-chat-input:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        #ai-chat-send-btn {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 15px;
          transition: transform 0.2s, background 0.2s;
        }

        #ai-chat-send-btn:hover {
          transform: scale(1.05);
          background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%);
        }
      `;
      document.head.appendChild(style);
    },

    injectWidgetHTML() {
      if (document.getElementById('ttms-ai-launcher')) return;

      const widgetHTML = `
        <!-- Floating Chatbot Launcher -->
        <div id="ttms-ai-launcher" title="Open TTMS AI Assistant">
          <div class="ai-tooltip-pill">
            <span>✨</span>
            <span>Ask TTMS AI</span>
          </div>
          <button id="ttms-ai-launcher-btn" aria-label="Open AI Chatbot">
            <span class="ai-pulse-ring"></span>
            <span class="ai-badge-ping"></span>
            <span>🤖</span>
          </button>
        </div>

        <!-- Chat Window -->
        <div id="ttms-ai-window">
          <!-- Header -->
          <div class="ai-chat-header">
            <div class="ai-header-info">
              <div class="ai-avatar">🤖</div>
              <div class="ai-header-text">
                <h4>TTMS Academic AI</h4>
                <div class="ai-status-online">Online & Ready to Help</div>
              </div>
            </div>
            <div class="ai-header-actions">
              <button class="ai-header-btn" id="ai-clear-btn" title="Clear Chat History">🗑️</button>
              <button class="ai-header-btn" id="ai-close-btn" title="Close">✕</button>
            </div>
          </div>

          <!-- Messages Body -->
          <div class="ai-chat-body" id="ai-chat-body">
            <!-- Messages inserted here -->
          </div>

          <!-- Footer Input -->
          <form class="ai-chat-footer" id="ai-chat-form" onsubmit="event.preventDefault(); window.AIChatbot.handleUserSubmit();">
            <input type="text" id="ai-chat-input" placeholder="Type your academic or system question..." autocomplete="off" />
            <button type="submit" id="ai-chat-send-btn" title="Send message">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      `;

      const container = document.createElement('div');
      container.innerHTML = widgetHTML;
      document.body.appendChild(container);
    },

    bindEvents() {
      const launcher = document.getElementById('ttms-ai-launcher');
      const closeBtn = document.getElementById('ai-close-btn');
      const clearBtn = document.getElementById('ai-clear-btn');

      if (launcher) {
        launcher.addEventListener('click', () => this.toggleChat());
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeChat();
        });
      }
      if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.clearChat();
        });
      }
    },

    toggleChat() {
      this.isOpen = !this.isOpen;
      const win = document.getElementById('ttms-ai-window');
      if (!win) return;

      if (this.isOpen) {
        win.classList.add('active');
        const input = document.getElementById('ai-chat-input');
        if (input) setTimeout(() => input.focus(), 150);
      } else {
        win.classList.remove('active');
      }
    },

    openChat() {
      this.isOpen = true;
      const win = document.getElementById('ttms-ai-window');
      if (win) {
        win.classList.add('active');
      }
    },

    closeChat() {
      this.isOpen = false;
      const win = document.getElementById('ttms-ai-window');
      if (win) win.classList.remove('active');
    },

    hide() {
      this.closeChat();
      const launcher = document.getElementById('ttms-ai-launcher');
      if (launcher) launcher.style.display = 'none';
    },

    updateSuggestionsForRole() {
      const launcher = document.getElementById('ttms-ai-launcher');
      if (launcher) launcher.style.display = 'flex';
    },

    loadInitialGreeting() {
      const user = window.AppState ? window.AppState.currentUser : null;
      const userName = user ? user.name : 'Colleague';
      const roleName = user ? user.role.replace('_', ' ').toUpperCase() : 'STUDENT';

      const greetingText = `
        <p>Hello, <strong>${userName}</strong>! 👋</p>
        <p>I am your <strong>TTMS Academic AI Assistant</strong> tailored for your <strong>${roleName}</strong> workspace.</p>
        <p>How can I assist your academic workflow today? Choose a quick topic above or type any question below!</p>
      `;

      this.appendMessage('bot', greetingText);
    },

    appendMessage(sender, htmlContent) {
      const body = document.getElementById('ai-chat-body');
      if (!body) return;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const msgDiv = document.createElement('div');
      msgDiv.className = `ai-msg ${sender}`;
      msgDiv.innerHTML = `
        <div class="ai-bubble">
          ${htmlContent}
        </div>
        <div class="ai-time">${timeStr}</div>
      `;

      body.appendChild(msgDiv);
      body.scrollTop = body.scrollHeight;
    },

    showTyping() {
      const body = document.getElementById('ai-chat-body');
      if (!body) return null;

      const typingDiv = document.createElement('div');
      typingDiv.className = 'ai-msg bot';
      typingDiv.id = 'ai-typing-indicator-box';
      typingDiv.innerHTML = `
        <div class="ai-typing-indicator">
          <span class="ai-dot"></span>
          <span class="ai-dot"></span>
          <span class="ai-dot"></span>
        </div>
      `;
      body.appendChild(typingDiv);
      body.scrollTop = body.scrollHeight;
      return typingDiv;
    },

    hideTyping() {
      const el = document.getElementById('ai-typing-indicator-box');
      if (el) el.remove();
    },

    sendPresetQuery(queryText) {
      const input = document.getElementById('ai-chat-input');
      if (input) input.value = queryText;
      this.handleUserSubmit();
    },

    async handleUserSubmit() {
      const input = document.getElementById('ai-chat-input');
      if (!input) return;
      const query = input.value.trim();
      if (!query) return;

      input.value = '';

      // Append user bubble
      this.appendMessage('user', `<p>${escapeHtml(query)}</p>`);

      // Show typing
      this.showTyping();

      // Generate AI response
      setTimeout(() => {
        this.hideTyping();
        const responseHTML = this.generateResponse(query);
        this.appendMessage('bot', responseHTML);
      }, 550);
    },

    generateResponse(rawQuery) {
      const q = rawQuery.toLowerCase();
      const user = window.AppState ? window.AppState.currentUser : null;
      const role = user ? user.role : 'student';

      // 1. Tasks & Assignments
      if (q.includes('task') || q.includes('assignment') || q.includes('ödev') || q.includes('görev') || q.includes('active')) {
        if (role === 'student') {
          return `
            <p>📋 <strong>Your Active Assignments:</strong></p>
            <p>You can view all assigned coursework in the <strong>My Tasks</strong> hub.</p>
            <ul>
              <li><strong>Binary Search Tree (BST)</strong> (Computer Science) - Due in 5 days</li>
              <li><strong>RESTful API & JWT</strong> (Web Programming) - Due in 8 days</li>
              <li><strong>CNN Image Classification</strong> (AI & Deep Learning)</li>
            </ul>
            <p>Click below to jump directly to your tasks:</p>
            <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('my-tasks');">
              👉 Go to My Tasks Hub
            </div>
          `;
        } else if (role === 'trainer' || role === 'assistant_trainer') {
          return `
            <p>📋 <strong>Task Management for Trainers:</strong></p>
            <p>You can define new tasks with custom deadlines, attach starter files, and assign them to specific students or entire training groups.</p>
            <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('tasks'); openTaskModal();">
              ➕ Create New Task Now
            </div>
          `;
        } else {
          return `
            <p>📋 <strong>University Tasks Directory:</strong></p>
            <p>The system tracks all course assignments, submission rates, and overdue metrics across all university departments.</p>
            <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('tasks');">
              👉 View University Tasks
            </div>
          `;
        }
      }

      // 2. Deadlines
      if (q.includes('deadline') || q.includes('due') || q.includes('upcoming') || q.includes('date')) {
        return `
          <p>⏰ <strong>Upcoming Academic Deadlines:</strong></p>
          <ul>
            <li><strong>BST Implementation:</strong> Friday, 23:59 (Section A)</li>
            <li><strong>REST API & JWT:</strong> Next Monday, 18:00 (Section A)</li>
            <li><strong>Final Project Code:</strong> End of Semester</li>
          </ul>
          <p>Check the interactive calendar for all upcoming exam and submission milestones:</p>
          <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('calendar');">
            📅 Open Academic Calendar
          </div>
        `;
      }

      // 3. How to Submit
      if (q.includes('submit') || q.includes('upload') || q.includes('how to submit') || q.includes('file')) {
        return `
          <p>📤 <strong>How to Submit Your Assignment:</strong></p>
          <ol style="margin: 4px 0 8px 18px; padding: 0;">
            <li>Go to <strong>My Tasks</strong> or <strong>Today's Tasks</strong>.</li>
            <li>Click the blue <strong>"Submit"</strong> button on your assigned task.</li>
            <li>Drag & drop your solution file (<strong>PDF, ZIP, Python, Docs</strong> up to 25 MB) or paste your <strong>GitHub / GitLab</strong> repository link.</li>
            <li>Add optional notes for your trainer and click <strong>"Submit Assignment"</strong>.</li>
          </ol>
          <p>You will receive automated instant confirmation upon submission!</p>
          <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('my-tasks');">
            👉 Open My Tasks to Submit
          </div>
        `;
      }

      // 4. Rubric & Grading
      if (q.includes('rubric') || q.includes('grade') || q.includes('grading') || q.includes('points') || q.includes('100') || q.includes('gpa')) {
        return `
          <p>💯 <strong>100-Point Standardized Rubric Breakdown:</strong></p>
          <ul>
            <li>🎯 <strong>Task Completion (25 pts):</strong> Full coverage of problem requirements.</li>
            <li>💻 <strong>Code Quality (25 pts):</strong> Clean architecture, efficiency, and modularity.</li>
            <li>🧪 <strong>Accuracy & Testing (20 pts):</strong> Correct edge-case handling.</li>
            <li>⏱️ <strong>Deadline Adherence (15 pts):</strong> On-time submission vs late penalties.</li>
            <li>📑 <strong>Documentation (15 pts):</strong> Clear comments, README, and report.</li>
          </ul>
          <p>Grades translate to standard university letter grades: <strong>AA (90-100)</strong>, <strong>BA (80-89)</strong>, <strong>BB (70-79)</strong>, etc.</p>
        `;
      }

      // 5. Review & Pending Submissions (Trainer)
      if (q.includes('review') || q.includes('pending') || q.includes('grade submission') || q.includes('waiting')) {
        return `
          <p>📝 <strong>Submissions Awaiting Review:</strong></p>
          <p>Trainers can inspect student files, download solution archives, assign rubric criteria scores, and write detailed feedback.</p>
          <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('submissions');">
            👉 Open Submissions & Review Hub
          </div>
        `;
      }

      // 6. Training Groups
      if (q.includes('group') || q.includes('section') || q.includes('training group')) {
        return `
          <p>🏢 <strong>Training Groups & Sections:</strong></p>
          <ul>
            <li><strong>Section A:</strong> Software Development & Algorithms (Prof. Ahmet Yilmaz)</li>
            <li><strong>Section B:</strong> Cyber Security & Network Systems (Assoc. Prof. Ayse Kaya)</li>
            <li><strong>Section C:</strong> Data Science & Machine Learning</li>
          </ul>
          <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('groups');">
            👉 Manage Training Groups
          </div>
        `;
      }

      // 7. Announcements
      if (q.includes('announcement') || q.includes('notice') || q.includes('news')) {
        return `
          <p>📢 <strong>University Announcements Hub:</strong></p>
          <p>Latest notices include: <em>Spring Term 2025-2026 Academic Calendar & Midterm Schedule Update</em> and <em>Cloud Laboratory Access Guidelines</em>.</p>
          <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('announcements');">
            👉 View All Announcements
          </div>
        `;
      }

      // 8. User Roles & Permissions
      if (q.includes('role') || q.includes('permission') || q.includes('admin') || q.includes('super admin') || q.includes('rbac')) {
        return `
          <p>🔑 <strong>System Role Hierarchy (RBAC):</strong></p>
          <ul>
            <li>👑 <strong>Super Admin:</strong> Full unrestricted access (26/26 permissions) and audit logs.</li>
            <li>🏛️ <strong>Administrator:</strong> User management, training group definitions, and reports.</li>
            <li>🎓 <strong>Training Manager:</strong> Academic curriculum monitoring.</li>
            <li>👨‍🏫 <strong>Trainer & TA:</strong> Task creation, submissions review, and rubric evaluations.</li>
            <li>🎒 <strong>Student:</strong> Coursework submissions, progress tracking, and grade history.</li>
          </ul>
          <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('roles-permissions');">
            👉 Inspect Roles & Permissions Matrix
          </div>
        `;
      }

      // Role-specific Duties / "My Job" / Responsibilities
      if (q.includes('job') || q.includes('my job') || q.includes('duties') || q.includes('responsibility') || q.includes('what should i do') || q.includes('my role')) {
        if (role === 'super_admin') {
          return `
            <p>👑 <strong>Super Administrator Responsibilities & Workflow:</strong></p>
            <p>As the <strong>Super Admin</strong>, you hold master administrative privileges across the entire university portal:</p>
            <ul>
              <li>🛡️ <strong>Security & Audit Logs:</strong> Monitor authentication events, user operations, and IP activity logs.</li>
              <li>🔑 <strong>RBAC Permissions:</strong> Configure the 26 granular permissions across all 5 user roles.</li>
              <li>👥 <strong>University Directory:</strong> Manage all faculty, trainers, students, and departmental accounts.</li>
              <li>🏢 <strong>Academic Groups:</strong> Oversee all training groups, quotas, and assigned professors.</li>
              <li>⚙️ <strong>System Architecture:</strong> Adjust upload policies, backup data, and inspect database schema.</li>
            </ul>
            <p>Quick shortcuts for your primary duties:</p>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('audit-logs');">🛡️ View Security Audit Logs</div>
              <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('roles-permissions');">🔑 Configure RBAC Matrix</div>
              <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('users');">👥 Manage User Directory</div>
            </div>
          `;
        } else if (role === 'admin' || role === 'training_manager') {
          return `
            <p>🏛️ <strong>Administrator Responsibilities & Workflow:</strong></p>
            <p>As an <strong>Administrator</strong>, you coordinate university training operations:</p>
            <ul>
              <li>👥 <strong>User Management:</strong> Provision new student and trainer accounts.</li>
              <li>🏢 <strong>Training Groups:</strong> Create groups, assign trainers, and enroll students.</li>
              <li>📢 <strong>Campus Announcements:</strong> Publish priority announcements to departments.</li>
              <li>📊 <strong>Analytics & Reports:</strong> Export performance summaries and grade statistics.</li>
            </ul>
            <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('users');">👥 Open User Management</div>
          `;
        } else if (role === 'trainer' || role === 'assistant_trainer') {
          return `
            <p>👨‍🏫 <strong>Trainer Responsibilities & Workflow:</strong></p>
            <p>As a <strong>Faculty Trainer</strong>, your main academic tasks are:</p>
            <ul>
              <li>➕ <strong>Create Tasks:</strong> Define assignments with deadlines and guidelines.</li>
              <li>📝 <strong>Grade Submissions:</strong> Evaluate student submissions with the 100-point rubric.</li>
              <li>💬 <strong>Feedback & Mentoring:</strong> Provide written guidance and request revisions.</li>
              <li>📈 <strong>Track Progress:</strong> Monitor student completion rates and overdue work.</li>
            </ul>
            <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('submissions');">📝 Review Pending Submissions</div>
          `;
        } else {
          return `
            <p>🎒 <strong>Student Responsibilities & Workflow:</strong></p>
            <p>As an enrolled <strong>Student</strong>, your academic routine includes:</p>
            <ul>
              <li>📋 <strong>Check Assignments:</strong> View active tasks and deadline countdowns in My Tasks.</li>
              <li>📤 <strong>Submit Coursework:</strong> Upload solution files (PDF, ZIP, Python) or GitHub repo links.</li>
              <li>📊 <strong>Review Feedback & Grades:</strong> Check rubric scores and trainer notes.</li>
              <li>📅 <strong>Follow Academic Schedule:</strong> Track exam and submission milestones on the Calendar.</li>
            </ul>
            <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('my-tasks');">📋 View My Tasks</div>
          `;
        }
      }

      // 9. Audit Logs
      if (q.includes('audit') || q.includes('log') || q.includes('security') || q.includes('ip')) {
        return `
          <p>🛡️ <strong>Audit Logs & Security Monitoring:</strong></p>
          <p>All critical operations (user provisioning, role modifications, task submissions, grading, and authentication events) are immutably logged with actor, timestamp, IP address, and payload diffs.</p>
          <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('audit-logs');">
            👉 View Security Audit Logs
          </div>
        `;
      }

      // 10. Help / General Info
      if (q.includes('help') || q.includes('who are you') || q.includes('what can you do') || q.includes('menu')) {
        return `
          <p>💡 <strong>TTMS AI Assistant Capabilities:</strong></p>
          <p>I am your smart companion for the University Task & Training Management System. You can ask me about:</p>
          <ul>
            <li>📌 <em>"What tasks are due this week?"</em></li>
            <li>📌 <em>"How do I upload my project zip file?"</em></li>
            <li>📌 <em>"Explain the 100-point rubric breakdown"</em></li>
            <li>📌 <em>"How do I grade student submissions?"</em></li>
            <li>📌 <em>"Show me security audit logs"</em></li>
          </ul>
          <p>Try clicking any action link above to navigate anywhere instantly!</p>
        `;
      }

      // Fallback
      return `
        <p>I understand you're asking about <em>"${escapeHtml(rawQuery)}"</em>.</p>
        <p>You can manage this directly using the navigation sidebar or quick tools. Would you like to check:</p>
        <ul>
          <li><strong>Tasks & Assignments:</strong> View active and overdue tasks.</li>
          <li><strong>Submissions & Review:</strong> Upload or evaluate coursework.</li>
          <li><strong>Academic Calendar:</strong> Track milestones and exam dates.</li>
        </ul>
        <div class="ai-action-link" onclick="window.AIChatbot.closeChat(); switchTab('home');">
          🏠 Return to Dashboard
        </div>
      `;
    }
  };

  window.AIChatbot = AIChatbot;

  // Auto-init on DOMContentLoaded or immediate if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AIChatbot.init());
  } else {
    AIChatbot.init();
  }

})();

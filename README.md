# 🎓 Training Task Management System (TTMS) - University Portal

> **Modern, Role-Based University Academic Task, Assignment, Rubric Grading & Training Management Platform**

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![Database SQLite](https://img.shields.io/badge/database-SQLite_3NF-green.svg)](https://sqlite.org/)
[![Architecture RESTful](https://img.shields.io/badge/architecture-RESTful_JSON_API-orange.svg)]()
[![Status Complete](https://img.shields.io/badge/status-100%25_Completed-brightgreen.svg)]()

---

## 🌟 Project Overview

**TTMS (Training Task Management System)** is an enterprise academic web platform designed to streamline and digitize all workflows between **Administrators**, **Faculty Trainers**, and **Students** in universities and training institutions.

The platform provides end-to-end assignment lifecycles, submission versioning, 5-criteria 100-point rubric evaluations, academic calendars, targeted announcements, real-time notification centers, 6-module analytical reporting (with CSV export), and tamper-evident audit logs.

---

## 🚀 Core Features & Architecture

1. **👥 Role-Based Access Control (RBAC)**:
   - 6 Defined Institutional Roles (`Super Admin`, `Admin`, `Training Manager`, `Trainer`, `Assistant Trainer`, `Student`).
   - 26 Granular Permission Codes with a Dynamic Roles & Permissions Matrix.
2. **🏫 Training Groups & Cohorts**:
   - Multi-trainer assignment, bulk student enrollment, and cohort-wide task dispatching.
3. **📋 Task & Submission Lifecycle (12-Parameter Specification)**:
   - Priority levels (`Low`, `Medium`, `High`, `Urgent`), start and due dates, estimated hours, checklists, and taxonomic tags.
   - Secure file uploads (PDF, ZIP, Python, Java, C++, JS, Jupyter Notebooks) and revision attempt histories (`v1`, `v2`, `v3`).
4. **⭐ 5-Criterion Rubric Evaluation Model (0-100 Points)**:
   - Task Completion (30 pts), Quality (25 pts), Accuracy (20 pts), Deadline Commitment (15 pts), Communication (10 pts).
   - Trainer decision flow: `Approve` (Completed), `Needs Revision`, or `Reject`.
5. **🗓️ Academic Calendar & Today's Tasks Hub**:
   - Integrated live scheduling for exams, classes, and upcoming deadlines.
6. **📢 Targeted Announcements & Notification Center**:
   - Targeted broadcasts for 5 audience scopes, unread counters, and automated submission alerts.
7. **📊 Analytics & Reporting Center (CSV Export)**:
   - Student Performance & GPA, Trainer Review Speeds, Group Completion Rates, Task Distribution, and Overdue Submissions.
8. **🛡️ Security & Tamper-Evident Audit Logging**:
   - Detailed `Who / What / When / IP Address / Changes (Diff)` tracking for full academic integrity.

---

## 🗄️ Relational Database Architecture (36 Tables)

Built in **Third Normal Form (3NF)** with strict Foreign Key enforcement, composite indexes, and ACID compliance:

* **Core Tables (28 Tables)**: `users`, `roles`, `permissions`, `role_user`, `permission_role`, `student_profiles`, `trainer_profiles`, `training_groups`, `training_group_students`, `training_group_trainers`, `tasks`, `task_assignments`, `task_attachments`, `task_submissions`, `submission_attachments`, `task_reviews`, `task_evaluations`, `task_comments`, `comment_attachments`, `notifications`, `notification_recipients`, `announcements`, `announcement_recipients`, `training_sessions`, `session_attendances`, `activity_logs`, `audit_logs`, `settings`.
* **Extension Tables (8 Tables)**: `projects`, `project_members`, `project_tasks`, `tags`, `task_tags`, `task_dependencies`, `task_checklists`, `task_checklist_items`.

---

## 💻 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/suzan-battal/gys-portal.git
cd gys-portal
```

### 2. Launch the Application Server
```bash
python3 server.py
```

### 3. Open in Browser
Navigate to [http://localhost:8080](http://localhost:8080) in your web browser.

### 🔑 Demo Credentials (1-Click Login Supported):
* **Super Admin**: `superadmin@universite.edu.tr` / `SuperAdmin123!`
* **Administrator**: `yonetici@universite.edu.tr` / `Admin123!`
* **Training Manager**: `egitim.muduru@universite.edu.tr` / `Mudur123!`
* **Trainer**: `ahmet.yilmaz@universite.edu.tr` / `Egitmen123!`
* **Assistant Trainer**: `asistan.merve@universite.edu.tr` / `Asistan123!`
* **Student**: `mehmet.demir@universite.edu.tr` / `Ogrenci123!`

---

## 📄 Project Specification & Documentation Report
Access the complete 31-Section Academic Specification Report inside the platform via the **`Project Specification Report`** navigation tab or directly at [http://localhost:8080/static/documentation.html](http://localhost:8080/static/documentation.html).

---
**Developer**: Suzan Battal  
**Project**: University Task & Training Management System (TTMS)

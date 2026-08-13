"""
Üniversite Görev Yönetim Sistemi - Veritabanı ve Veri Erişim Katmanı (Database Module)
SQLite tabanlı ilişkisel veritabanı şeması, CRUD operasyonları, Eğitim Grupları (Training Groups) ve tohumlama.
"""

import sqlite3
import hashlib
import json
import os
import secrets
from datetime import datetime, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "database.sqlite"
UPLOADS_DIR = BASE_DIR / "uploads"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# ==================== SECTION 12: ROLES & PERMISSIONS (RBAC ENGINE) ====================

AVAILABLE_ROLES = [
    {"code": "super_admin", "title": "Super Admin", "desc": "System Super Administrator (Full Permissions)"},
    {"code": "admin", "title": "Admin", "desc": "System & Academic Administrator"},
    {"code": "training_manager", "title": "Training Manager", "desc": "Training & Academic Program Coordinator"},
    {"code": "trainer", "title": "Trainer", "desc": "Faculty Instructor / Academic Trainer"},
    {"code": "assistant_trainer", "title": "Assistant Trainer", "desc": "Teaching Assistant / Assistant Trainer"},
    {"code": "student", "title": "Student", "desc": "Enrolled Student / Trainee"}
]

ALL_PERMISSIONS = [
    {"code": "users.view", "name": "View Users", "category": "User Management"},
    {"code": "users.create", "name": "Create Users", "category": "User Management"},
    {"code": "users.update", "name": "Update Users", "category": "User Management"},
    {"code": "users.delete", "name": "Delete Users", "category": "User Management"},
    
    {"code": "students.view", "name": "List Students", "category": "Student Management"},
    {"code": "students.create", "name": "Create Student Record", "category": "Student Management"},
    {"code": "students.update", "name": "Update Student Record", "category": "Student Management"},
    
    {"code": "trainers.view", "name": "List Trainers", "category": "Trainer Management"},
    {"code": "trainers.create", "name": "Add New Trainer", "category": "Trainer Management"},
    
    {"code": "groups.view", "name": "View Training Groups", "category": "Group Management"},
    {"code": "groups.create", "name": "Create Training Group", "category": "Group Management"},
    {"code": "groups.update", "name": "Update Training Group", "category": "Group Management"},
    {"code": "groups.delete", "name": "Delete Training Group", "category": "Group Management"},
    
    {"code": "tasks.view", "name": "View Tasks", "category": "Task Management"},
    {"code": "tasks.create", "name": "Create New Task", "category": "Task Management"},
    {"code": "tasks.update", "name": "Edit Task Details", "category": "Task Management"},
    {"code": "tasks.delete", "name": "Delete Task", "category": "Task Management"},
    {"code": "tasks.assign", "name": "Assign Task (Single/Group)", "category": "Task Management"},
    
    {"code": "submissions.view", "name": "List Submissions", "category": "Submission & Review"},
    {"code": "submissions.review", "name": "Review & Evaluate Submission", "category": "Submission & Review"},
    
    {"code": "evaluations.view", "name": "View Grades & Evaluations", "category": "Grading"},
    {"code": "evaluations.create", "name": "Submit Grade & Feedback", "category": "Grading"},
    
    {"code": "notifications.view", "name": "View Notifications", "category": "Communication"},
    {"code": "notifications.send", "name": "Send Announcements & Notifications", "category": "Communication"},
    
    {"code": "reports.view", "name": "View Academic Reports", "category": "Reporting & System"},
    {"code": "settings.manage", "name": "Manage System Settings", "category": "Reporting & System"}
]

DEFAULT_ROLE_PERMISSIONS = {
    "super_admin": [p["code"] for p in ALL_PERMISSIONS],
    "admin": [
        "users.view", "users.create", "users.update", "users.delete",
        "students.view", "students.create", "students.update",
        "trainers.view", "trainers.create",
        "groups.view", "groups.create", "groups.update", "groups.delete",
        "tasks.view", "tasks.create", "tasks.update", "tasks.delete", "tasks.assign",
        "submissions.view", "submissions.review",
        "evaluations.view", "evaluations.create",
        "notifications.view", "notifications.send",
        "reports.view", "settings.manage"
    ],
    "training_manager": [
        "users.view",
        "students.view", "students.create", "students.update",
        "trainers.view", "trainers.create",
        "groups.view", "groups.create", "groups.update", "groups.delete",
        "tasks.view", "tasks.create", "tasks.update", "tasks.assign",
        "submissions.view", "submissions.review",
        "evaluations.view", "evaluations.create",
        "notifications.view", "notifications.send",
        "reports.view"
    ],
    "trainer": [
        "students.view",
        "groups.view",
        "tasks.view", "tasks.create", "tasks.update", "tasks.delete", "tasks.assign",
        "submissions.view", "submissions.review",
        "evaluations.view", "evaluations.create",
        "notifications.view", "notifications.send",
        "reports.view"
    ],
    "assistant_trainer": [
        "students.view",
        "groups.view",
        "tasks.view", "tasks.update", "tasks.assign",
        "submissions.view", "submissions.review",
        "evaluations.view", "evaluations.create",
        "notifications.view"
    ],
    "student": [
        "tasks.view",
        "submissions.view",
        "evaluations.view",
        "notifications.view"
    ]
}


def get_db_connection():
    """SQLite veritabanı bağlantısı oluşturur ve foreign key kısıtlamalarını etkinleştirir."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def hash_password(password: str, salt: str = None) -> str:
    """Parolayı SHA-256 ve tuz (salt) kullanarak güvenli bir şekilde hashler."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return f"{salt}${hashed}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Düz metin parolayı hashlenmiş parola ile karşılaştırır."""
    try:
        salt, expected_hash = hashed_password.split("$")
        calculated_hash = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()
        return secrets.compare_digest(expected_hash, calculated_hash)
    except Exception:
        return False


def init_db():
    """Tabloları oluşturur ve indeksleri tanımlar."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. users tablosu (Section 12: 6 Rol Desteği)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL COLLATE NOCASE,
                password TEXT NOT NULL,
                role TEXT CHECK(role IN ('super_admin', 'admin', 'training_manager', 'trainer', 'assistant_trainer', 'student')) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 2. groups tablosu (Eğitim Grupları - Training Groups)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                department TEXT NOT NULL,
                description TEXT,
                start_date DATE,
                end_date DATE,
                status TEXT CHECK(status IN ('Active', 'Completed', 'Archived')) DEFAULT 'Active',
                trainer_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 3. group_members tablosu
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS group_members (
                group_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (group_id, student_id),
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 4. tasks tablosu (priority ve group_id destekli)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                deadline DATE NOT NULL,
                priority TEXT DEFAULT 'Normal',
                group_id INTEGER NULL,
                trainer_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
            );
        """)

        # 5. submissions tablosu
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                file_size INTEGER NOT NULL DEFAULT 0,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'Teslim Edildi',
                grade REAL NULL,
                feedback TEXT NULL,
                student_notes TEXT NULL,
                student_link TEXT NULL,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 6. sessions tablosu (Kalıcı Oturumlar)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        try:
            cursor.execute("ALTER TABLE groups ADD COLUMN assistant_trainers TEXT NULL;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'Normal';")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE tasks ADD COLUMN group_id INTEGER NULL;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE tasks ADD COLUMN attachment_url TEXT NULL;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE tasks ADD COLUMN attachment_file TEXT NULL;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE tasks ADD COLUMN instructions TEXT NULL;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE tasks ADD COLUMN start_date TEXT NULL;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE tasks ADD COLUMN estimated_time TEXT NULL;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE submissions ADD COLUMN student_notes TEXT NULL;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE submissions ADD COLUMN student_link TEXT NULL;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE submissions ADD COLUMN submission_number INTEGER DEFAULT 1;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE submissions ADD COLUMN revision_number INTEGER DEFAULT 1;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE submissions ADD COLUMN is_late INTEGER DEFAULT 0;")
        except Exception:
            pass

        # Section 9: 100 Puanlık Rubrik Değerlendirme Kriterleri
        try:
            cursor.execute("ALTER TABLE submissions ADD COLUMN rubric_completion REAL NULL;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE submissions ADD COLUMN rubric_quality REAL NULL;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE submissions ADD COLUMN rubric_accuracy REAL NULL;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE submissions ADD COLUMN rubric_deadline REAL NULL;")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE submissions ADD COLUMN rubric_communication REAL NULL;")
        except Exception:
            pass

        # Section 13: Users Management (status ve last_login)
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Active';")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL;")
        except Exception:
            pass

        # 7. notifications tablosu (Section 8: Otomatik Bildirimler)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'review',
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 8. task_comments tablosu (Section 10: Task Comments Thread)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                attachment_file TEXT NULL,
                attachment_url TEXT NULL,
                is_image INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 9. role_permissions tablosu (Section 12: Roles & Permissions Matrix)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS role_permissions (
                role TEXT NOT NULL,
                permission TEXT NOT NULL,
                PRIMARY KEY (role, permission)
            );
        """)

        # 10. announcements tablosu (Section 19: Announcements - All Users, All Students, All Trainers, Specific Group, Specific Students)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS announcements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                author_id INTEGER NOT NULL,
                target_type TEXT NOT NULL,
                target_group_id INTEGER NULL,
                target_student_ids TEXT NULL,
                priority TEXT DEFAULT 'Normal',
                is_pinned INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (target_group_id) REFERENCES groups(id) ON DELETE SET NULL
            );
        """)

        # 11. calendar_events tablosu (Section 20: Calendar - Tasks, Deadlines, Training Sessions, Events, Exams, Meetings)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS calendar_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NULL,
                event_type TEXT NOT NULL,
                event_date DATE NOT NULL,
                start_time TEXT NULL,
                end_time TEXT NULL,
                location TEXT NULL,
                organizer_id INTEGER NOT NULL,
                group_id INTEGER NULL,
                target_scope TEXT DEFAULT 'all_users',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
            );
        """)

        # 12. audit_logs tablosu (Section 22: Audit Logs - Who / What / When / IP)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NULL,
                user_name TEXT NULL,
                user_role TEXT NULL,
                user_email TEXT NULL,
                action TEXT NOT NULL,
                category TEXT NOT NULL,
                entity_type TEXT NULL,
                entity_id INTEGER NULL,
                description TEXT NOT NULL,
                old_values TEXT NULL,
                new_values TEXT NULL,
                ip_address TEXT DEFAULT '127.0.0.1',
                user_agent TEXT NULL,
                severity TEXT DEFAULT 'info',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        """)

        # ==================== SECTION 23: 28 PROPOSED CORE DATABASE TABLES ====================
        
        # 13. roles
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                description TEXT NULL,
                is_system BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 14. permissions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                category TEXT NOT NULL,
                display_name TEXT NOT NULL,
                description TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 15. role_user
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS role_user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                role_id INTEGER NOT NULL,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                UNIQUE(user_id, role_id)
            );
        """)

        # 16. permission_role
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS permission_role (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role_id INTEGER NOT NULL,
                permission_id INTEGER NOT NULL,
                granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
                UNIQUE(role_id, permission_id)
            );
        """)

        # 17. student_profiles (Section 14)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS student_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                student_no TEXT NULL,
                department TEXT NULL,
                academic_year TEXT DEFAULT '2025-2026',
                semester TEXT DEFAULT 'Bahar',
                gpa REAL DEFAULT 0.0,
                advisor_id INTEGER NULL,
                emergency_phone TEXT NULL,
                bio TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (advisor_id) REFERENCES users(id) ON DELETE SET NULL
            );
        """)

        # 18. trainer_profiles
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trainer_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                title TEXT DEFAULT 'Öğretim Görevlisi',
                department TEXT NULL,
                office_location TEXT NULL,
                phone TEXT NULL,
                bio TEXT NULL,
                max_groups INTEGER DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 19. training_groups (Alias & Normalized Model)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS training_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                department TEXT NOT NULL,
                description TEXT NULL,
                trainer_id INTEGER NULL,
                start_date DATE NULL,
                end_date DATE NULL,
                status TEXT DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE SET NULL
            );
        """)

        # 20. training_group_students
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS training_group_students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'Active',
                FOREIGN KEY (group_id) REFERENCES training_groups(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(group_id, student_id)
            );
        """)

        # 21. training_group_trainers
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS training_group_trainers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                trainer_id INTEGER NOT NULL,
                role_in_group TEXT DEFAULT 'lead', -- 'lead', 'assistant'
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES training_groups(id) ON DELETE CASCADE,
                FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(group_id, trainer_id)
            );
        """)

        # 22. task_assignments
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                group_id INTEGER NULL,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'Bekliyor',
                due_date DATETIME NULL,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES training_groups(id) ON DELETE SET NULL
            );
        """)

        # 23. task_attachments
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_url TEXT NULL,
                file_size INTEGER DEFAULT 0,
                file_type TEXT NULL,
                uploaded_by INTEGER NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
            );
        """)

        # 24. task_submissions (Normalized Submissions Model)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                version INTEGER DEFAULT 1,
                content TEXT NULL,
                file_path TEXT NULL,
                file_url TEXT NULL,
                status TEXT DEFAULT 'Teslim Edildi',
                grade REAL NULL,
                feedback TEXT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP NULL,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 25. submission_attachments
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS submission_attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                submission_id INTEGER NOT NULL,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_url TEXT NULL,
                file_size INTEGER DEFAULT 0,
                file_type TEXT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (submission_id) REFERENCES task_submissions(id) ON DELETE CASCADE
            );
        """)

        # 26. task_reviews
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                submission_id INTEGER NOT NULL,
                reviewer_id INTEGER NOT NULL,
                review_status TEXT DEFAULT 'Tamamlandı',
                grade REAL NULL,
                feedback TEXT NULL,
                reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (submission_id) REFERENCES task_submissions(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 27. task_evaluations (Section 8: Rubrics Rubric Evaluation Criteria)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_evaluations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                submission_id INTEGER NOT NULL,
                criteria_name TEXT NOT NULL,
                max_score REAL DEFAULT 20.0,
                given_score REAL DEFAULT 0.0,
                weight REAL DEFAULT 1.0,
                feedback TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (submission_id) REFERENCES task_submissions(id) ON DELETE CASCADE
            );
        """)

        # 28. comment_attachments
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS comment_attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                comment_id INTEGER NOT NULL,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_url TEXT NULL,
                file_size INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (comment_id) REFERENCES task_comments(id) ON DELETE CASCADE
            );
        """)

        # 29. notification_recipients
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notification_recipients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                notification_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                is_read BOOLEAN DEFAULT 0,
                read_at TIMESTAMP NULL,
                delivered_channel TEXT DEFAULT 'in_app', -- 'in_app', 'email', 'push'
                FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 30. announcement_recipients
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS announcement_recipients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                announcement_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                is_read BOOLEAN DEFAULT 0,
                read_at TIMESTAMP NULL,
                FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(announcement_id, user_id)
            );
        """)

        # 31. training_sessions (Section 20 Calendar Sessions Model)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS training_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NULL,
                organizer_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                session_type TEXT DEFAULT 'Lecture', -- 'Lecture', 'Lab', 'Workshop', 'Exam', 'Meeting'
                session_date DATE NOT NULL,
                start_time TIME NULL,
                end_time TIME NULL,
                location TEXT NULL,
                meeting_link TEXT NULL,
                status TEXT DEFAULT 'Scheduled', -- 'Scheduled', 'Completed', 'Cancelled'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES training_groups(id) ON DELETE SET NULL,
                FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 32. session_attendances (Aktivite ve Devam Durumu)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS session_attendances (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                status TEXT DEFAULT 'Present', -- 'Present', 'Absent', 'Excused', 'Late'
                notes TEXT NULL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(session_id, student_id)
            );
        """)

        # 33. activity_logs (Kullanıcı Aktivite ve Katılım Takibi)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                action_type TEXT NOT NULL,
                entity_type TEXT NULL,
                entity_id INTEGER NULL,
                metadata TEXT NULL,
                ip_address TEXT DEFAULT '127.0.0.1',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 34. user_devices (Cihaz ve Oturum Cihazları)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                device_token TEXT NULL,
                device_type TEXT DEFAULT 'Browser', -- 'Browser', 'iOS', 'Android'
                os_version TEXT NULL,
                browser TEXT NULL,
                last_ip TEXT DEFAULT '127.0.0.1',
                last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 35. settings (Sistem Konfigürasyonları ve Parametreler)
        # 35. settings (Sistem Konfigürasyonları ve Parametreler)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                category TEXT DEFAULT 'general', -- 'general', 'academic', 'email', 'security', 'branding'
                description TEXT NULL,
                updated_by INTEGER NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
            );
        """)

        # ==================== SECTION 24: 8 OPTIONAL EXTENSION DATABASE TABLES ====================

        # 36. projects (Grup & Bireysel Proje Yönetimi)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT UNIQUE NOT NULL,
                description TEXT NULL,
                group_id INTEGER NULL,
                manager_id INTEGER NULL,
                start_date DATE NULL,
                end_date DATE NULL,
                budget REAL DEFAULT 0.0,
                status TEXT DEFAULT 'Active', -- 'Planning', 'Active', 'On Hold', 'Completed'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES training_groups(id) ON DELETE SET NULL,
                FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
            );
        """)

        # 37. project_members (Proje Ekip Üyeleri)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS project_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                role_in_project TEXT DEFAULT 'Member', -- 'Project Leader', 'Developer', 'Designer', 'Researcher', 'Member'
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(project_id, user_id)
            );
        """)

        # 38. project_tasks (Proje ile Görev Eşleştirme)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS project_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                task_id INTEGER NOT NULL,
                milestone TEXT NULL,
                weight REAL DEFAULT 1.0,
                order_num INTEGER DEFAULT 1,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                UNIQUE(project_id, task_id)
            );
        """)

        # 39. tags (Etiketler & Kategorizasyon)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                color TEXT DEFAULT '#2563EB',
                category TEXT DEFAULT 'general',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 40. task_tags (Görev Etiket İlişkisi)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
                UNIQUE(task_id, tag_id)
            );
        """)

        # 41. task_dependencies (Görev Bağımlılıkları & Gantt Ön Koşulları)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_dependencies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                depends_on_task_id INTEGER NOT NULL,
                dependency_type TEXT DEFAULT 'FS', -- 'FS' (Finish-to-Start), 'SS' (Start-to-Start), 'FF' (Finish-to-Finish)
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                UNIQUE(task_id, depends_on_task_id)
            );
        """)

        # 42. task_checklists (Görev Kontrol Listeleri)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_checklists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                is_mandatory BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );
        """)

        # 43. task_checklist_items (Kontrol Listesi Alt Maddeleri)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_checklist_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                checklist_id INTEGER NOT NULL,
                item_text TEXT NOT NULL,
                is_completed BOOLEAN DEFAULT 0,
                completed_by INTEGER NULL,
                completed_at TIMESTAMP NULL,
                order_num INTEGER DEFAULT 1,
                FOREIGN KEY (checklist_id) REFERENCES task_checklists(id) ON DELETE CASCADE,
                FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
            );
        """)

        # İndeksler
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_student ON tasks(student_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_trainer ON tasks(trainer_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_submissions_task ON submissions(task_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_group_members ON group_members(group_id, student_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_role_permissions ON role_permissions(role);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_announcements_author ON announcements(author_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_announcements_target ON announcements(target_type);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_calendar_events_group ON calendar_events(group_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_category ON audit_logs(category);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(session_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_project_members ON project_members(project_id, user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_task_tags ON task_tags(task_id, tag_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_task_dep ON task_dependencies(task_id, depends_on_task_id);")
        
        conn.commit()

        # Seed Core Roles
        roles_data = [
            ('super_admin', 'Süper Yönetici (Super Admin)', 'Tüm sisteme tam erişim ve konfigürasyon yetkisi.'),
            ('admin', 'Sistem Yöneticisi (Admin)', 'Kullanıcı, grup, görev ve raporlama yönetimi.'),
            ('training_manager', 'Eğitim Koordinatörü (Training Manager)', 'Eğitim grupları, müfredat ve eğitmen denetimi.'),
            ('trainer', 'Eğitmen (Trainer)', 'Görev oluşturma, teslim inceleme ve öğrenci notlandırma.'),
            ('assistant_trainer', 'Yardımcı Eğitmen (Assistant Trainer)', 'Görev desteği ve grup rehberliği.'),
            ('student', 'Öğrenci (Student)', 'Görev alma, teslim yapma ve not/ilerleme takibi.')
        ]
        for r_name, r_disp, r_desc in roles_data:
            cursor.execute("INSERT OR IGNORE INTO roles (name, display_name, description) VALUES (?, ?, ?);", (r_name, r_disp, r_desc))

        # Seed Core Permissions
        for p in ALL_PERMISSIONS:
            cursor.execute("""
                INSERT OR IGNORE INTO permissions (name, category, display_name, description)
                VALUES (?, ?, ?, ?);
            """, (p['code'], p['category'], p['name'], p.get('description', p['name'])))

        # Seed Default Settings
        settings_defaults = [
            ('system_name', 'Üniversite Görev ve Eğitim Yönetim Sistemi', 'general', 'Sistem Ana Başlığı'),
            ('academic_year', '2025-2026', 'academic', 'Aktif Akademik Yıl'),
            ('current_semester', 'Bahar Dönemi', 'academic', 'Aktif Dönem'),
            ('max_file_upload_mb', '25', 'security', 'Maksimum Dosya Yükleme Boyutu (MB)'),
            ('audit_retention_days', '365', 'security', 'Denetim Logları Saklama Süresi (Gün)'),
            ('allow_late_submissions', 'true', 'academic', 'Geç Görev Teslimlerine İzin Ver'),
            ('late_penalty_percent_per_day', '5', 'academic', 'Günlük Geç Teslim Puan Kesintisi (%)')
        ]
        for s_key, s_val, s_cat, s_desc in settings_defaults:
            cursor.execute("INSERT OR IGNORE INTO settings (key, value, category, description) VALUES (?, ?, ?, ?);", (s_key, s_val, s_cat, s_desc))

        # Synchronize roles mapping and profiles
        cursor.execute("SELECT id, role FROM users;")
        all_users = cursor.fetchall()
        for u in all_users:
            cursor.execute("SELECT id FROM roles WHERE name = ?;", (u['role'],))
            r_row = cursor.fetchone()
            if r_row:
                cursor.execute("INSERT OR IGNORE INTO role_user (user_id, role_id) VALUES (?, ?);", (u['id'], r_row['id']))

            if u['role'] == 'student':
                cursor.execute("INSERT OR IGNORE INTO student_profiles (user_id, student_no, department) VALUES (?, ?, ?);", (u['id'], f"STD-{u['id']:04d}", 'Bilgisayar Mühendisliği'))
            elif u['role'] in ['trainer', 'assistant_trainer']:
                cursor.execute("INSERT OR IGNORE INTO trainer_profiles (user_id, department) VALUES (?, ?);", (u['id'], 'Yazılım & Bilişim Bilimleri'))

        # Synchronize training_groups and training_group_students
        cursor.execute("SELECT id, name, department, trainer_id, start_date, end_date, status, description FROM groups;")
        for g in cursor.fetchall():
            cursor.execute("""
                INSERT OR IGNORE INTO training_groups (id, name, department, trainer_id, start_date, end_date, status, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, (g['id'], g['name'], g['department'], g['trainer_id'], g['start_date'], g['end_date'], g['status'], g['description']))

        cursor.execute("SELECT group_id, student_id FROM group_members;")
        for gm in cursor.fetchall():
            cursor.execute("INSERT OR IGNORE INTO training_group_students (group_id, student_id) VALUES (?, ?);", (gm['group_id'], gm['student_id']))

        # Varsayılan Yetkileri Tohumla (Section 12: 26 İzin & 6 Rol)
        cursor.execute("SELECT COUNT(*) FROM role_permissions;")
        if cursor.fetchone()[0] == 0:
            for role_name, perms in DEFAULT_ROLE_PERMISSIONS.items():
                for p in perms:
                    cursor.execute("INSERT OR IGNORE INTO role_permissions (role, permission) VALUES (?, ?);", (role_name, p))
            conn.commit()


# ==================== OTURUM İŞLEMLERİ (SESSION MANAGEMENT) ====================

def save_session(token: str, user_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO sessions (token, user_id) VALUES (?, ?);", (token, user_id))
        conn.commit()


def get_user_by_session_token(token: str):
    if not token:
        return None
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.name, u.email, u.role, u.created_at
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ?;
        """, (token,))
        row = cursor.fetchone()
        return dict(row) if row else None


def delete_session(token: str):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE token = ?;", (token,))
        conn.commit()


# ==================== KULLANICI İŞLEMLERİ (USER CRUD) ====================

def get_user_by_email(email: str):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?;", (email.strip(),))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, role, created_at FROM users WHERE id = ?;", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def list_users(role: str = None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        query = """
            SELECT u.id, u.name, u.email, u.role, 
                   COALESCE(u.status, 'Active') as status, 
                   u.last_login, u.created_at,
                   (
                       SELECT g.name FROM groups g 
                       JOIN group_members gm ON g.id = gm.group_id 
                       WHERE gm.student_id = u.id 
                       LIMIT 1
                   ) as student_group_name,
                   (
                       SELECT g.id FROM groups g 
                       JOIN group_members gm ON g.id = gm.group_id 
                       WHERE gm.student_id = u.id 
                       LIMIT 1
                   ) as student_group_id,
                   (
                       SELECT g.name FROM groups g 
                       WHERE g.trainer_id = u.id 
                       LIMIT 1
                   ) as trainer_group_name,
                   (
                       SELECT g.id FROM groups g 
                       WHERE g.trainer_id = u.id 
                       LIMIT 1
                   ) as trainer_group_id
            FROM users u
        """
        params = []
        if role:
            query += " WHERE u.role = ?"
            params.append(role)

        query += " ORDER BY u.id DESC;"
        cursor.execute(query, params)
        
        users = []
        for r in cursor.fetchall():
            d = dict(r)
            g_name = d["student_group_name"] or d["trainer_group_name"] or "-"
            g_id = d["student_group_id"] or d["trainer_group_id"] or None
            d["group_name"] = g_name
            d["group_id"] = g_id
            users.append(d)
        return users


def update_user_last_login(user_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?;", (user_id,))
        conn.commit()


def create_user(name: str, email: str, password: str, role: str, status: str = 'Active'):
    hashed_pwd = hash_password(password)
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?);",
            (name.strip(), email.strip().lower(), hashed_pwd, role.strip().lower(), status.strip())
        )
        conn.commit()
        return cursor.lastrowid


def update_user(user_id: int, name: str, email: str, role: str, password: str = None, status: str = 'Active'):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if password and password.strip():
            hashed_pwd = hash_password(password.strip())
            cursor.execute(
                "UPDATE users SET name = ?, email = ?, role = ?, password = ?, status = ? WHERE id = ?;",
                (name.strip(), email.strip().lower(), role.strip().lower(), hashed_pwd, status.strip(), user_id)
            )
        else:
            cursor.execute(
                "UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?;",
                (name.strip(), email.strip().lower(), role.strip().lower(), status.strip(), user_id)
            )
        conn.commit()
        return cursor.rowcount > 0


def delete_user(user_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = ?;", (user_id,))
        conn.commit()
        return cursor.rowcount > 0


# ==================== EĞİTİM GRUPLARI (TRAINING GROUPS CRUD) ====================

def create_group(name: str, department: str, description: str, start_date: str, end_date: str, trainer_id: int, student_ids: list = None, status: str = 'Active', assistant_trainers: str = None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO groups (name, department, description, start_date, end_date, trainer_id, status, assistant_trainers)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, (name.strip(), department.strip(), description.strip() if description else '', start_date, end_date, trainer_id, status, assistant_trainers))
        group_id = cursor.lastrowid

        if student_ids:
            for s_id in student_ids:
                try:
                    cursor.execute("INSERT OR IGNORE INTO group_members (group_id, student_id) VALUES (?, ?);", (group_id, int(s_id)))
                except Exception:
                    pass

        conn.commit()
        return group_id


def list_groups(trainer_id: int = None, student_id: int = None, status: str = None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        query = """
            SELECT g.*, u.name as trainer_name,
                   (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as student_count
            FROM groups g
            JOIN users u ON g.trainer_id = u.id
        """
        params = []
        conditions = []

        if student_id:
            query += " JOIN group_members gm ON g.id = gm.group_id"
            conditions.append("gm.student_id = ?")
            params.append(student_id)
        elif trainer_id:
            conditions.append("(g.trainer_id = ? OR g.assistant_trainers LIKE ?)")
            params.extend([trainer_id, f"%{trainer_id}%"])

        if status:
            conditions.append("g.status = ?")
            params.append(status)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY g.id DESC;"
        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]


def get_group_by_id(group_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT g.*, u.name as trainer_name
            FROM groups g
            JOIN users u ON g.trainer_id = u.id
            WHERE g.id = ?;
        """, (group_id,))
        row = cursor.fetchone()
        if not row:
            return None
        group_data = dict(row)

        cursor.execute("""
            SELECT u.id, u.name, u.email, gm.joined_at
            FROM group_members gm
            JOIN users u ON gm.student_id = u.id
            WHERE gm.group_id = ?;
        """, (group_id,))
        group_data["students"] = [dict(r) for r in cursor.fetchall()]
        return group_data


def update_group(group_id: int, name: str, department: str, description: str, start_date: str, end_date: str, status: str, trainer_id: int, student_ids: list = None, assistant_trainers: str = None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE groups
            SET name = ?, department = ?, description = ?, start_date = ?, end_date = ?, status = ?, trainer_id = ?, assistant_trainers = ?
            WHERE id = ?;
        """, (name.strip(), department.strip(), description.strip() if description else '', start_date, end_date, status, trainer_id, assistant_trainers, group_id))

        if student_ids is not None:
            cursor.execute("DELETE FROM group_members WHERE group_id = ?;", (group_id,))
            for s_id in student_ids:
                try:
                    cursor.execute("INSERT OR IGNORE INTO group_members (group_id, student_id) VALUES (?, ?);", (group_id, int(s_id)))
                except Exception:
                    pass

        conn.commit()

        # Section 11 Event #9: Group / Training Session Update
        try:
            cursor.execute("SELECT student_id FROM group_members WHERE group_id = ?;", (group_id,))
            members = cursor.fetchall()
            for m in members:
                cursor.execute("""
                    INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                    VALUES (?, ?, ?, 'group_update', 0, CURRENT_TIMESTAMP);
                """, (m["student_id"], f"👥 Eğitim Grubu Güncellemesi: {name.strip()}", f"Dahil olduğunuz '{name.strip()}' grubunun eğitim oturumu ve detayları güncellendi."))
            conn.commit()
        except Exception:
            pass

        return True


def delete_group(group_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM groups WHERE id = ?;", (group_id,))
        conn.commit()
        return cursor.rowcount > 0


# ==================== GÖREV İŞLEMLERİ (TASK CRUD) ====================

def create_task(title: str, description: str, deadline: str, trainer_id: int, student_id: int, priority: str = 'Normal', group_id: int = None, attachment_url: str = None, attachment_file: str = None, instructions: str = None, start_date: str = None, estimated_time: str = None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO tasks (title, description, deadline, trainer_id, student_id, priority, group_id, attachment_url, attachment_file, instructions, start_date, estimated_time) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
            (title.strip(), description.strip(), deadline.strip(), trainer_id, student_id, priority, group_id, 
             attachment_url.strip() if attachment_url else None, attachment_file, 
             instructions.strip() if instructions else None, start_date or None, estimated_time.strip() if estimated_time else None)
        )
        task_id = cursor.lastrowid
        conn.commit()

        # Section 11 Event #1: New Task Assigned
        try:
            cursor.execute("SELECT name FROM users WHERE id = ?;", (trainer_id,))
            tr_row = cursor.fetchone()
            trainer_name = tr_row["name"] if tr_row else "Eğitmeniniz"
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                VALUES (?, ?, ?, 'new_task', 0, CURRENT_TIMESTAMP);
            """, (student_id, f"📌 Yeni Görev Atandı: {title.strip()}", f"{trainer_name} size yeni bir görev atadı. Son Teslim: {deadline}"))
            conn.commit()
        except Exception:
            pass

        return task_id


def assign_task_to_group(title: str, description: str, deadline: str, trainer_id: int, group_id: int, priority: str = 'Normal', attachment_url: str = None, attachment_file: str = None, instructions: str = None, start_date: str = None, estimated_time: str = None):
    """Gruptaki tüm öğrencilere toplu olarak görev atar."""
    created_task_ids = []
    group = get_group_by_id(group_id)
    if not group or not group.get("students"):
        return created_task_ids

    for st in group["students"]:
        tid = create_task(title, description, deadline, trainer_id, st["id"], priority, group_id, attachment_url, attachment_file, instructions, start_date, estimated_time)
        created_task_ids.append(tid)

    return created_task_ids


def update_task(task_id: int, title: str, description: str, deadline: str, trainer_id: int, student_id: int, priority: str = 'Normal', attachment_url: str = None, attachment_file: str = None, instructions: str = None, start_date: str = None, estimated_time: str = None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """UPDATE tasks 
               SET title = ?, description = ?, deadline = ?, trainer_id = ?, student_id = ?, priority = ?, 
                   attachment_url = ?, attachment_file = COALESCE(?, attachment_file),
                   instructions = ?, start_date = ?, estimated_time = ?
               WHERE id = ?;""",
            (title.strip(), description.strip(), deadline.strip(), trainer_id, student_id, priority, 
             attachment_url.strip() if attachment_url else None, attachment_file, 
             instructions.strip() if instructions else None, start_date or None, estimated_time.strip() if estimated_time else None, task_id)
        )
        conn.commit()
        return cursor.rowcount > 0


def delete_task(task_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = ?;", (task_id,))
        conn.commit()
        return cursor.rowcount > 0


def get_task_by_id(task_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT t.*, 
                   tr.name as trainer_name, tr.email as trainer_email,
                   st.name as student_name, st.email as student_email,
                   g.name as group_name,
                   s.id as submission_id, s.submission_number, s.revision_number, s.is_late,
                   s.file_path, s.original_filename, s.file_size, s.submitted_at, 
                   s.status as submission_status, s.grade, s.feedback, s.student_notes, s.student_link,
                   s.rubric_completion, s.rubric_quality, s.rubric_accuracy, s.rubric_deadline, s.rubric_communication
            FROM tasks t
            JOIN users tr ON t.trainer_id = tr.id
            JOIN users st ON t.student_id = st.id
            LEFT JOIN groups g ON t.group_id = g.id
            LEFT JOIN submissions s ON s.id = (SELECT id FROM submissions WHERE task_id = t.id ORDER BY id DESC LIMIT 1)
            WHERE t.id = ?;
        """, (task_id,))
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        today_str = datetime.now().strftime("%Y-%m-%d")
        sub_status = d.get("submission_status")
        
        if sub_status:
            d["status"] = sub_status
        elif d.get("deadline") and str(d["deadline"]) < today_str:
            d["status"] = "Gecikmiş"
        else:
            d["status"] = "Bekliyor"
            
        d["submissions_history"] = get_task_submissions(task_id)
        d["comments"] = get_task_comments(task_id)
        return d


def list_tasks(trainer_id: int = None, student_id: int = None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        base_query = """
            SELECT t.*, 
                   tr.name as trainer_name, tr.email as trainer_email,
                   st.name as student_name, st.email as student_email,
                   g.name as group_name,
                   s.id as submission_id, s.submission_number, s.revision_number, s.is_late,
                   s.file_path, s.original_filename, s.submitted_at, 
                   s.status as submission_status, s.grade, s.feedback
            FROM tasks t
            JOIN users tr ON t.trainer_id = tr.id
            JOIN users st ON t.student_id = st.id
            LEFT JOIN groups g ON t.group_id = g.id
            LEFT JOIN submissions s ON s.id = (SELECT id FROM submissions WHERE task_id = t.id ORDER BY id DESC LIMIT 1)
        """
        params = []
        conditions = []

        if trainer_id:
            conditions.append("t.trainer_id = ?")
            params.append(trainer_id)
        if student_id:
            conditions.append("t.student_id = ?")
            params.append(student_id)

        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)

        base_query += " ORDER BY t.deadline ASC, t.id DESC;"
        
        cursor.execute(base_query, params)
        rows = cursor.fetchall()
        result = []
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        for r in rows:
            d = dict(r)
            sub_status = d.get("submission_status")
            if sub_status:
                if sub_status in ['Bekliyor', 'Görüntülendi', 'Devam Ediyor', 'In Progress'] and d.get("deadline") and str(d["deadline"]) < today_str:
                    d["status"] = "Gecikmiş"
                else:
                    d["status"] = sub_status
            elif d.get("deadline") and str(d["deadline"]) < today_str:
                d["status"] = "Gecikmiş"
            else:
                d["status"] = "Bekliyor"
            result.append(d)
        return result


# ==================== TESLİM VE DEĞERLENDİRME İŞLEMLERİ (SECTION 7: TASK SUBMISSIONS) ====================

def create_or_update_submission(task_id: int, student_id: int, file_path: str, original_filename: str, file_size: int, student_notes: str = None, student_link: str = None):
    """Her teslim girişimini bağımsız bir kayıt olarak kaydeder (Tarihçe ve revizyon takibi)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Görevin son teslim tarihini al
        cursor.execute("SELECT deadline FROM tasks WHERE id = ?;", (task_id,))
        task_row = cursor.fetchone()
        deadline = task_row["deadline"] if task_row else None
        
        today_str = datetime.now().strftime("%Y-%m-%d")
        is_late = 1 if (deadline and str(deadline) < today_str) else 0

        # 2. Önceki teslim sayısını ve durumunu al
        cursor.execute("SELECT COUNT(*), MAX(submission_number), MAX(revision_number) FROM submissions WHERE task_id = ? AND student_id = ? AND (file_path != '' OR student_link IS NOT NULL);", (task_id, student_id))
        count_row = cursor.fetchone()
        prev_count = count_row[0] if count_row else 0
        submission_number = prev_count + 1
        revision_number = prev_count + 1

        cursor.execute("SELECT status FROM submissions WHERE task_id = ? AND student_id = ? ORDER BY id DESC LIMIT 1;", (task_id, student_id))
        last_sub = cursor.fetchone()
        last_status = last_sub["status"] if last_sub else ""
        new_status = 'Yeniden Teslim Edildi' if last_status == 'Düzeltme İstendi' else 'Teslim Edildi'

        cursor.execute("""
            INSERT INTO submissions (task_id, student_id, submission_number, revision_number, file_path, original_filename, file_size, status, is_late, submitted_at, student_notes, student_link)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?);
        """, (task_id, student_id, submission_number, revision_number, file_path, original_filename, file_size, new_status, is_late, student_notes, student_link))
        
        sub_id = cursor.lastrowid
        conn.commit()

        # Section 11 Event #4: Student Submitted Task (Notify Trainer)
        try:
            cursor.execute("""
                SELECT t.trainer_id, t.title as task_title, u.name as student_name
                FROM tasks t
                JOIN users u ON u.id = ?
                WHERE t.id = ?;
            """, (student_id, task_id))
            info = cursor.fetchone()
            if info:
                t_id = info["trainer_id"]
                t_title = info["task_title"]
                s_name = info["student_name"]
                cursor.execute("""
                    INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                    VALUES (?, ?, ?, 'submission', 0, CURRENT_TIMESTAMP);
                """, (t_id, f"📥 Yeni Ödev Teslimi: {t_title}", f"{s_name} (#{submission_number}. deneme) ödevini teslim etti. İnceleme bekliyor."))
                conn.commit()
        except Exception:
            pass

        return sub_id


def get_task_submissions(task_id: int, student_id: int = None):
    """Bir göreve ait tüm teslim denemelerini ve revizyon geçmişini döndürür."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        query = """
            SELECT s.*, 
                   st.name as student_name, st.email as student_email,
                   t.title as task_title, t.deadline as task_deadline
            FROM submissions s
            JOIN users st ON s.student_id = st.id
            JOIN tasks t ON s.task_id = t.id
            WHERE s.task_id = ? AND (s.file_path != '' OR s.student_link IS NOT NULL OR s.student_notes IS NOT NULL)
        """
        params = [task_id]
        if student_id:
            query += " AND s.student_id = ?"
            params.append(student_id)
        
        query += " ORDER BY s.submission_number DESC, s.id DESC;"
        cursor.execute(query, params)
        return [dict(r) for r in cursor.fetchall()]


def set_task_viewed(task_id: int, student_id: int):
    """Öğrenci görevi ilk açtığında durumu 'Görüntülendi' (Viewed) yapar."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, status FROM submissions WHERE task_id = ? AND student_id = ? ORDER BY id DESC LIMIT 1;", (task_id, student_id))
        row = cursor.fetchone()
        if not row:
            cursor.execute("""
                INSERT INTO submissions (task_id, student_id, submission_number, revision_number, file_path, original_filename, file_size, status)
                VALUES (?, ?, 1, 1, '', '', 0, 'Görüntülendi');
            """, (task_id, student_id))
        elif row["status"] in ['Bekliyor', '', 'Assigned']:
            cursor.execute("UPDATE submissions SET status = 'Görüntülendi' WHERE id = ?;", (row["id"],))
        conn.commit()
        return True


def set_task_in_progress(task_id: int, student_id: int):
    """Öğrenci ödeve başladığında durumu 'Devam Ediyor' (In Progress) yapar."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, status FROM submissions WHERE task_id = ? AND student_id = ? ORDER BY id DESC LIMIT 1;", (task_id, student_id))
        row = cursor.fetchone()
        if not row:
            cursor.execute("""
                INSERT INTO submissions (task_id, student_id, submission_number, revision_number, file_path, original_filename, file_size, status)
                VALUES (?, ?, 1, 1, '', '', 0, 'Devam Ediyor');
            """, (task_id, student_id))
        elif row["status"] in ['Bekliyor', '', 'Görüntülendi', 'Assigned']:
            cursor.execute("UPDATE submissions SET status = 'Devam Ediyor' WHERE id = ?;", (row["id"],))
        conn.commit()
        return True


def update_submission_evaluation(
    submission_id: int, 
    grade: float, 
    feedback: str, 
    status: str = "Tamamlandı",
    rubric_completion: float = None,
    rubric_quality: float = None,
    rubric_accuracy: float = None,
    rubric_deadline: float = None,
    rubric_communication: float = None
):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE submissions
            SET grade = ?, feedback = ?, status = ?,
                rubric_completion = ?, rubric_quality = ?, rubric_accuracy = ?,
                rubric_deadline = ?, rubric_communication = ?
            WHERE id = ?;
        """, (grade, feedback.strip() if feedback else None, status,
              rubric_completion, rubric_quality, rubric_accuracy,
              rubric_deadline, rubric_communication, submission_id))
        conn.commit()
        
        # Section 8: Otomatik Bildirim Gönder (Send automatic notification to student)
        cursor.execute("""
            SELECT s.student_id, t.title as task_title, tr.name as trainer_name
            FROM submissions s
            JOIN tasks t ON s.task_id = t.id
            JOIN users tr ON t.trainer_id = tr.id
            WHERE s.id = ?;
        """, (submission_id,))
        row = cursor.fetchone()
        if row:
            student_id = row["student_id"]
            task_title = row["task_title"]
            trainer_name = row["trainer_name"]
            
            if status in ['Tamamlandı', 'Completed', 'Kabul Edildi']:
                title = f"🎉 Göreviniz Kabul Edildi: {task_title}"
                msg = f"{trainer_name} görevinizi onayladı. Not: {grade if grade is not None else '-'}/100. Geri Bildirim: {feedback or 'Tebrikler!'}"
            elif status in ['Düzeltme İstendi', 'Needs Revision']:
                title = f"⚠️ Revizyon Talebi: {task_title}"
                msg = f"{trainer_name} göreviniz için düzeltme talep etti. Geri Bildirim: {feedback or 'Lütfen eksikleri tamamlayıp yeniden teslim ediniz.'}"
            elif status in ['Reddedildi', 'Rejected']:
                title = f"🔴 Göreviniz Reddedildi: {task_title}"
                msg = f"{trainer_name} görevinizi reddetti. Geri Bildirim: {feedback or 'Açıklamayı inceleyiniz.'}"
            else:
                title = f"📋 Değerlendirme Güncellendi: {task_title}"
                msg = f"Göreviniz '{status}' durumuna güncellendi."
                
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                VALUES (?, ?, ?, 'review', 0, CURRENT_TIMESTAMP);
            """, (student_id, title, msg))
            conn.commit()
            
        return cursor.rowcount > 0


# ==================== BİLDİRİM FONKSİYONLARI (NOTIFICATIONS) ====================

def create_notification(user_id: int, title: str, message: str, notif_type: str = "review"):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
            VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP);
        """, (user_id, title, message, notif_type))
        conn.commit()
        return cursor.lastrowid


def list_notifications(user_id: int, limit: int = 20):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM notifications
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT ?;
        """, (user_id, limit))
        return [dict(r) for r in cursor.fetchall()]


def mark_notification_as_read(notification_id: int, user_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE notifications SET is_read = 1
            WHERE id = ? AND user_id = ?;
        """, (notification_id, user_id))
        conn.commit()
        return cursor.rowcount > 0


def mark_all_notifications_as_read(user_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE notifications SET is_read = 1
            WHERE user_id = ?;
        """, (user_id,))
        conn.commit()
        return cursor.rowcount > 0


# ==================== SECTION 19: ANNOUNCEMENTS (DUYURU SİSTEMİ & 5 HEDEF KİTLE) ====================

def create_announcement(author_id: int, title: str, message: str, target_type: str, 
                        target_group_id: int = None, target_student_ids: list = None, 
                        priority: str = 'Normal', is_pinned: int = 0):
    """Section 19: Announcements - All Users, All Students, All Trainers, Specific Group, Specific Students."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        valid_group_id = None
        if target_type == 'specific_group' and target_group_id:
            cursor.execute("SELECT id FROM groups WHERE id = ?;", (int(target_group_id),))
            grow = cursor.fetchone()
            if not grow:
                raise ValueError("Belirtilen eğitim grubu bulunamadı.")
            valid_group_id = int(target_group_id)

        target_students_json = None
        if target_type == 'specific_students':
            target_students_json = json.dumps([int(s) for s in (target_student_ids or []) if str(s).isdigit()])
        
        cursor.execute("""
            INSERT INTO announcements (title, message, author_id, target_type, target_group_id, target_student_ids, priority, is_pinned, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
        """, (title.strip(), message.strip(), author_id, target_type, valid_group_id, target_students_json, priority, is_pinned))
        
        announcement_id = cursor.lastrowid
        
        # Calculate target recipients for instant push notifications
        recipient_user_ids = set()
        if target_type == 'all_users':
            cursor.execute("SELECT id FROM users;")
            recipient_user_ids = {r[0] for r in cursor.fetchall()}
        elif target_type == 'all_students':
            cursor.execute("SELECT id FROM users WHERE role = 'student';")
            recipient_user_ids = {r[0] for r in cursor.fetchall()}
        elif target_type == 'all_trainers':
            cursor.execute("SELECT id FROM users WHERE role IN ('trainer', 'assistant_trainer');")
            recipient_user_ids = {r[0] for r in cursor.fetchall()}
        elif target_type == 'specific_group' and valid_group_id:
            cursor.execute("SELECT student_id FROM group_members WHERE group_id = ?;", (valid_group_id,))
            recipient_user_ids = {r[0] for r in cursor.fetchall()}
            cursor.execute("SELECT trainer_id FROM groups WHERE id = ?;", (valid_group_id,))
            tr_row = cursor.fetchone()
            if tr_row and tr_row[0]:
                recipient_user_ids.add(tr_row[0])
        elif target_type == 'specific_students' and target_student_ids:
            recipient_user_ids = set(int(s) for s in target_student_ids if str(s).isdigit())
            
        # Dispatch notification to all recipients:
        for uid in recipient_user_ids:
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                VALUES (?, ?, ?, 'announcement', 0, CURRENT_TIMESTAMP);
            """, (uid, f"📢 Duyuru ({priority}): {title.strip()}", message.strip()))
            
        conn.commit()
        return announcement_id, len(recipient_user_ids)


def get_announcements_for_user(user_id: int, role: str, search: str = None, target_filter: str = None, priority_filter: str = None):
    """Section 19: Kullanıcının yetkisi ve hedef kitlesine göre duyuruları listeler."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Kullanıcının bağlı olduğu gruplar
        user_groups = set()
        if role == 'student':
            cursor.execute("SELECT group_id FROM group_members WHERE student_id = ?;", (user_id,))
            user_groups = {r[0] for r in cursor.fetchall()}
        elif role in ['trainer', 'assistant_trainer']:
            cursor.execute("SELECT id FROM groups WHERE trainer_id = ?;", (user_id,))
            user_groups = {r[0] for r in cursor.fetchall()}

        cursor.execute("""
            SELECT a.id, a.title, a.message, a.author_id, a.target_type, a.target_group_id,
                   a.target_student_ids, a.priority, a.is_pinned, a.created_at,
                   u.name as author_name, u.role as author_role, u.email as author_email,
                   g.name as target_group_name, g.department as target_group_department
            FROM announcements a
            JOIN users u ON a.author_id = u.id
            LEFT JOIN groups g ON a.target_group_id = g.id
            ORDER BY a.is_pinned DESC, a.created_at DESC;
        """)
        
        all_announcements = [dict(r) for r in cursor.fetchall()]
        
        visible = []
        for a in all_announcements:
            # Super admin and admin can see all announcements
            if role in ['super_admin', 'admin', 'training_manager'] or a['author_id'] == user_id:
                visible.append(a)
                continue
                
            ttype = a['target_type']
            if ttype == 'all_users':
                visible.append(a)
            elif ttype == 'all_students' and role == 'student':
                visible.append(a)
            elif ttype == 'all_trainers' and role in ['trainer', 'assistant_trainer']:
                visible.append(a)
            elif ttype == 'specific_group' and a['target_group_id'] in user_groups:
                visible.append(a)
            elif ttype == 'specific_students':
                try:
                    s_ids = json.loads(a['target_student_ids'] or '[]')
                    if user_id in [int(x) for x in s_ids if str(x).isdigit()]:
                        visible.append(a)
                except Exception:
                    pass

        # Search and filters
        if search:
            q = search.lower().strip()
            visible = [a for a in visible if q in a['title'].lower() or q in a['message'].lower() or q in a['author_name'].lower()]
            
        if target_filter and target_filter != 'all':
            visible = [a for a in visible if a['target_type'] == target_filter]
            
        if priority_filter and priority_filter != 'all':
            visible = [a for a in visible if a['priority'] == priority_filter]

        return visible


def delete_announcement(announcement_id: int, user_id: int, role: str):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if role in ['super_admin', 'admin', 'training_manager']:
            cursor.execute("DELETE FROM announcements WHERE id = ?;", (announcement_id,))
        else:
            cursor.execute("DELETE FROM announcements WHERE id = ? AND author_id = ?;", (announcement_id, user_id))
        conn.commit()
        return cursor.rowcount > 0


def toggle_pin_announcement(announcement_id: int, user_id: int, role: str):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT is_pinned, author_id FROM announcements WHERE id = ?;", (announcement_id,))
        row = cursor.fetchone()
        if not row:
            return False
        if role not in ['super_admin', 'admin', 'training_manager'] and row['author_id'] != user_id:
            return False
        new_pinned = 0 if row['is_pinned'] == 1 else 1
        cursor.execute("UPDATE announcements SET is_pinned = ? WHERE id = ?;", (new_pinned, announcement_id))
        conn.commit()
        return True


# ==================== SECTION 20: CALENDAR (GENEL AKADEMİK TAKVİM) ====================

def create_calendar_event(organizer_id: int, title: str, description: str, event_type: str,
                          event_date: str, start_time: str = None, end_time: str = None,
                          location: str = None, group_id: int = None, target_scope: str = 'all_users'):
    """Section 20: Calendar event creation - Tasks, Deadlines, Training Sessions, Events, Exams, Meetings."""
    VALID_TYPES = ['tasks', 'deadlines', 'training_sessions', 'events', 'exams', 'meetings']
    if event_type not in VALID_TYPES:
        raise ValueError(f"Geçersiz etkinlik türü. İzin verilen türler: {', '.join(VALID_TYPES)}")

    with get_db_connection() as conn:
        cursor = conn.cursor()

        valid_group_id = None
        if group_id:
            cursor.execute("SELECT id FROM groups WHERE id = ?;", (int(group_id),))
            if cursor.fetchone():
                valid_group_id = int(group_id)

        cursor.execute("""
            INSERT INTO calendar_events (title, description, event_type, event_date, start_time, end_time, location, organizer_id, group_id, target_scope, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
        """, (title.strip(), description.strip() if description else None, event_type, event_date.strip(),
              start_time.strip() if start_time else None, end_time.strip() if end_time else None,
              location.strip() if location else None, organizer_id, valid_group_id, target_scope))

        event_id = cursor.lastrowid

        # Send notification to target audience
        recipient_ids = set()
        if target_scope == 'all_users':
            cursor.execute("SELECT id FROM users;")
            recipient_ids = {r[0] for r in cursor.fetchall()}
        elif target_scope == 'all_students':
            cursor.execute("SELECT id FROM users WHERE role = 'student';")
            recipient_ids = {r[0] for r in cursor.fetchall()}
        elif target_scope == 'all_trainers':
            cursor.execute("SELECT id FROM users WHERE role IN ('trainer', 'assistant_trainer');")
            recipient_ids = {r[0] for r in cursor.fetchall()}
        elif valid_group_id:
            cursor.execute("SELECT student_id FROM group_members WHERE group_id = ?;", (valid_group_id,))
            recipient_ids = {r[0] for r in cursor.fetchall()}
            cursor.execute("SELECT trainer_id FROM groups WHERE id = ?;", (valid_group_id,))
            tr_row = cursor.fetchone()
            if tr_row and tr_row[0]:
                recipient_ids.add(tr_row[0])

        type_labels = {
            'tasks': '📋 Görev',
            'deadlines': '⏰ Son Teslim',
            'training_sessions': '🎓 Eğitim Oturumu',
            'events': '🎪 Etkinlik',
            'exams': '📝 Sınav',
            'meetings': '🤝 Toplantı'
        }
        lbl = type_labels.get(event_type, 'Takvim')
        for uid in recipient_ids:
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                VALUES (?, ?, ?, 'calendar', 0, CURRENT_TIMESTAMP);
            """, (uid, f"📅 Yeni Takvim Öğesi ({lbl}): {title.strip()}", f"{event_date} - {title.strip()} ({location or 'Genel'})"))

        conn.commit()
        return event_id


def get_calendar_events_for_user(user_id: int, role: str, year: int, month: int, event_types: list = None, group_id: int = None):
    """Section 20: Verilen ay/yıl için kullanıcının takvim öğelerini ve görevlerini birleştirir."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        month_str = f"{year:04d}-{month:02d}"

        # 1. Custom Calendar Events
        cursor.execute("""
            SELECT ce.id, ce.title, ce.description, ce.event_type, ce.event_date,
                   ce.start_time, ce.end_time, ce.location, ce.organizer_id, ce.group_id,
                   ce.target_scope, ce.created_at,
                   u.name as organizer_name, u.role as organizer_role,
                   g.name as group_name, g.department as group_department
            FROM calendar_events ce
            JOIN users u ON ce.organizer_id = u.id
            LEFT JOIN groups g ON ce.group_id = g.id
            WHERE strftime('%Y-%m', ce.event_date) = ?
            ORDER BY ce.event_date ASC, ce.start_time ASC;
        """, (month_str,))
        raw_events = [dict(r) for r in cursor.fetchall()]

        # Filter custom events by user scope
        user_groups = set()
        if role == 'student':
            cursor.execute("SELECT group_id FROM group_members WHERE student_id = ?;", (user_id,))
            user_groups = {r[0] for r in cursor.fetchall()}
        elif role in ['trainer', 'assistant_trainer']:
            cursor.execute("SELECT id FROM groups WHERE trainer_id = ?;", (user_id,))
            user_groups = {r[0] for r in cursor.fetchall()}

        filtered_events = []
        for e in raw_events:
            e['is_custom'] = True
            e['task_id'] = None
            e['submission_status'] = None
            e['grade'] = None

            if role in ['super_admin', 'admin', 'training_manager'] or e['organizer_id'] == user_id:
                filtered_events.append(e)
            elif e['target_scope'] == 'all_users':
                filtered_events.append(e)
            elif e['target_scope'] == 'all_students' and role == 'student':
                filtered_events.append(e)
            elif e['target_scope'] == 'all_trainers' and role in ['trainer', 'assistant_trainer']:
                filtered_events.append(e)
            elif e['group_id'] and e['group_id'] in user_groups:
                filtered_events.append(e)

        # 2. System Task Deadlines (Mapped to 'deadlines')
        task_query = """
            SELECT t.id as task_id, t.title, t.description, t.deadline, t.priority,
                   t.group_id, t.trainer_id, t.student_id,
                   u_st.name as student_name, u_tr.name as trainer_name,
                   g.name as group_name,
                   s.status as submission_status, s.grade
            FROM tasks t
            JOIN users u_st ON t.student_id = u_st.id
            JOIN users u_tr ON t.trainer_id = u_tr.id
            LEFT JOIN groups g ON t.group_id = g.id
            LEFT JOIN submissions s ON t.id = s.task_id AND s.student_id = t.student_id
            WHERE strftime('%Y-%m', t.deadline) = ?
        """
        task_params = [month_str]
        if role == 'student':
            task_query += " AND t.student_id = ?"
            task_params.append(user_id)
        elif role in ['trainer', 'assistant_trainer']:
            task_query += " AND (t.trainer_id = ? OR g.trainer_id = ?)"
            task_params.extend([user_id, user_id])

        cursor.execute(task_query, tuple(task_params))
        tasks = cursor.fetchall()

        for t in tasks:
            d_date = t['deadline'].split()[0] if t['deadline'] else None
            if not d_date:
                continue
            filtered_events.append({
                "id": f"task-deadline-{t['task_id']}",
                "title": f"⏰ Son Teslim: {t['title']}",
                "description": t['description'],
                "event_type": "deadlines",
                "event_date": d_date,
                "start_time": "23:59",
                "end_time": None,
                "location": f"Group: {t['group_name'] or 'Individual'}",
                "organizer_id": t['trainer_id'],
                "organizer_name": t['trainer_name'],
                "organizer_role": "trainer",
                "group_id": t['group_id'],
                "group_name": t['group_name'],
                "target_scope": "specific_students",
                "created_at": None,
                "is_custom": False,
                "task_id": t['task_id'],
                "student_name": t['student_name'],
                "submission_status": t['submission_status'] or 'Bekliyor',
                "grade": t['grade']
            })

        # Apply category filter if specified
        if event_types and 'all' not in event_types:
            filtered_events = [e for e in filtered_events if e['event_type'] in event_types]

        if group_id and str(group_id) != 'all':
            filtered_events = [e for e in filtered_events if str(e.get('group_id')) == str(group_id)]

        # Calculate counts across 6 categories
        counts = {
            "tasks": sum(1 for e in filtered_events if e['event_type'] == 'tasks'),
            "deadlines": sum(1 for e in filtered_events if e['event_type'] == 'deadlines'),
            "training_sessions": sum(1 for e in filtered_events if e['event_type'] == 'training_sessions'),
            "events": sum(1 for e in filtered_events if e['event_type'] == 'events'),
            "exams": sum(1 for e in filtered_events if e['event_type'] == 'exams'),
            "meetings": sum(1 for e in filtered_events if e['event_type'] == 'meetings'),
            "total": len(filtered_events)
        }

        # Sort chronologically
        filtered_events.sort(key=lambda x: (x['event_date'], x.get('start_time') or '00:00'))

        return {
            "year": year,
            "month": month,
            "counts": counts,
            "events": filtered_events
        }


def delete_calendar_event(event_id: int, user_id: int, role: str):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if role in ['super_admin', 'admin', 'training_manager']:
            cursor.execute("DELETE FROM calendar_events WHERE id = ?;", (event_id,))
        else:
            cursor.execute("DELETE FROM calendar_events WHERE id = ? AND organizer_id = ?;", (event_id, user_id))
        conn.commit()
        return cursor.rowcount > 0


def calculate_letter_grade(score: float) -> str:
    """Türk Üniversite Not Sistemi Harf Notu Hesaplama (AA, BA, BB, CB, CC, DC, DD, FD, FF)."""
    if score is None or score <= 0:
        return '-'
    if score >= 90:
        return 'AA'
    elif score >= 85:
        return 'BA'
    elif score >= 80:
        return 'BB'
    elif score >= 75:
        return 'CB'
    elif score >= 70:
        return 'CC'
    elif score >= 65:
        return 'DC'
    elif score >= 60:
        return 'DD'
    elif score >= 50:
        return 'FD'
    else:
        return 'FF'


# ==================== SECTION 21: REPORTS (RAPORLAMA VE ANALİTİK MERKEZİ) ====================

def get_academic_reports(report_type: str = 'student_performance', group_id: str = None, 
                         trainer_id: str = None, search: str = None, user_id: int = None, role: str = None):
    """Section 21: 6 Temel Akademik Raporu Hesaplar ve Döndürür."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Student Performance Report
        if report_type == 'student_performance':
            query = """
                SELECT u.id as student_id, u.name as student_name, u.email, 
                       'STD-' || printf('%04d', u.id) as student_no,
                       g.id as group_id, g.name as group_name,
                       tr.name as trainer_name,
                       COUNT(t.id) as total_tasks,
                       SUM(CASE WHEN s.status IN ('Tamamlandı', 'Kabul Edildi') THEN 1 ELSE 0 END) as completed_tasks,
                       SUM(CASE WHEN s.status IN ('Teslim Edildi', 'İnceleniyor') THEN 1 ELSE 0 END) as in_review_tasks,
                       SUM(CASE WHEN s.status = 'Düzeltme İstendi' THEN 1 ELSE 0 END) as revision_tasks,
                       SUM(CASE WHEN s.status IS NULL OR s.status IN ('Bekliyor', 'Görüntülendi') THEN 1 ELSE 0 END) as pending_tasks,
                       SUM(CASE WHEN datetime(t.deadline) < datetime('now', 'localtime') AND (s.status IS NULL OR s.status NOT IN ('Tamamlandı', 'Kabul Edildi')) THEN 1 ELSE 0 END) as late_tasks,
                       AVG(CASE WHEN s.grade IS NOT NULL THEN s.grade ELSE NULL END) as avg_grade
                FROM users u
                LEFT JOIN group_members gm ON u.id = gm.student_id
                LEFT JOIN groups g ON gm.group_id = g.id
                LEFT JOIN users tr ON g.trainer_id = tr.id
                LEFT JOIN tasks t ON u.id = t.student_id
                LEFT JOIN submissions s ON t.id = s.task_id AND s.student_id = u.id
                WHERE u.role = 'student'
            """
            params = []
            if group_id and str(group_id) != 'all':
                query += " AND g.id = ?"
                params.append(int(group_id))
            if trainer_id and str(trainer_id) != 'all':
                query += " AND g.trainer_id = ?"
                params.append(int(trainer_id))
            if search:
                query += " AND (u.name LIKE ? OR u.email LIKE ? OR cast(u.id as text) LIKE ?)"
                params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

            query += " GROUP BY u.id ORDER BY avg_grade DESC, completed_tasks DESC;"
            cursor.execute(query, tuple(params))
            rows = [dict(r) for r in cursor.fetchall()]

            for r in rows:
                tt = r['total_tasks'] or 0
                ct = r['completed_tasks'] or 0
                r['completion_rate'] = round((ct / tt * 100), 1) if tt > 0 else 0.0
                avg_g = round(float(r['avg_grade']), 1) if r['avg_grade'] is not None else 0.0
                r['avg_grade'] = avg_g
                r['letter_grade'] = calculate_letter_grade(avg_g)

            total_std = len(rows)
            class_avg = round(sum(r['avg_grade'] for r in rows) / total_std, 1) if total_std > 0 else 0.0
            avg_comp = round(sum(r['completion_rate'] for r in rows) / total_std, 1) if total_std > 0 else 0.0
            high_achievers = sum(1 for r in rows if r['avg_grade'] >= 85)
            at_risk = sum(1 for r in rows if r['avg_grade'] < 60 and r['total_tasks'] > 0)

            return {
                "type": "student_performance",
                "title": "Öğrenci Performans Raporu (Student Performance Report)",
                "kpis": {
                    "total_students": total_std,
                    "class_average_grade": class_avg,
                    "average_completion_rate": avg_comp,
                    "high_achievers_count": high_achievers,
                    "at_risk_count": at_risk
                },
                "records": rows
            }

        # 2. Trainer Performance Report
        elif report_type == 'trainer_performance':
            query = """
                SELECT u.id as trainer_id, u.name as trainer_name, u.email, u.role,
                       COUNT(DISTINCT g.id) as groups_count,
                       COUNT(DISTINCT gm.student_id) as students_count,
                       COUNT(DISTINCT t.id) as tasks_created,
                       COUNT(DISTINCT s.id) as submissions_received,
                       SUM(CASE WHEN s.status IN ('Tamamlandı', 'Kabul Edildi', 'Düzeltme İstendi') THEN 1 ELSE 0 END) as reviewed_submissions,
                       SUM(CASE WHEN s.status IN ('Teslim Edildi', 'İnceleniyor') THEN 1 ELSE 0 END) as pending_reviews,
                       AVG(CASE WHEN s.grade IS NOT NULL THEN s.grade ELSE NULL END) as avg_grade_given
                FROM users u
                LEFT JOIN groups g ON u.id = g.trainer_id
                LEFT JOIN group_members gm ON g.id = gm.group_id
                LEFT JOIN tasks t ON u.id = t.trainer_id
                LEFT JOIN submissions s ON t.id = s.task_id
                WHERE u.role IN ('trainer', 'assistant_trainer')
            """
            params = []
            if search:
                query += " AND (u.name LIKE ? OR u.email LIKE ?)"
                params.extend([f"%{search}%", f"%{search}%"])

            query += " GROUP BY u.id ORDER BY reviewed_submissions DESC;"
            cursor.execute(query, tuple(params))
            rows = [dict(r) for r in cursor.fetchall()]

            for r in rows:
                rec = r['submissions_received'] or 0
                rev = r['reviewed_submissions'] or 0
                r['review_rate'] = round((rev / rec * 100), 1) if rec > 0 else 100.0
                r['avg_grade_given'] = round(float(r['avg_grade_given']), 1) if r['avg_grade_given'] is not None else 0.0

            total_tr = len(rows)
            total_sub_rec = sum(r['submissions_received'] or 0 for r in rows)
            total_rev = sum(r['reviewed_submissions'] or 0 for r in rows)
            avg_rate = round(total_rev / total_sub_rec * 100, 1) if total_sub_rec > 0 else 100.0

            return {
                "type": "trainer_performance",
                "title": "Eğitmen Performans Raporu (Trainer Performance Report)",
                "kpis": {
                    "total_trainers": total_tr,
                    "total_submissions_received": total_sub_rec,
                    "total_reviews_completed": total_rev,
                    "average_review_rate": avg_rate,
                    "pending_reviews_total": sum(r['pending_reviews'] or 0 for r in rows)
                },
                "records": rows
            }

        # 3. Group Performance Report
        elif report_type == 'group_performance':
            query = """
                SELECT g.id as group_id, g.name as group_name, g.department,
                       tr.name as trainer_name,
                       COUNT(DISTINCT gm.student_id) as enrolled_students,
                       COUNT(DISTINCT t.id) as total_tasks,
                       COUNT(DISTINCT s.id) as total_submissions,
                       SUM(CASE WHEN s.status IN ('Tamamlandı', 'Kabul Edildi') THEN 1 ELSE 0 END) as completed_tasks,
                       AVG(CASE WHEN s.grade IS NOT NULL THEN s.grade ELSE NULL END) as avg_group_grade
                FROM groups g
                LEFT JOIN users tr ON g.trainer_id = tr.id
                LEFT JOIN group_members gm ON g.id = gm.group_id
                LEFT JOIN tasks t ON g.id = t.group_id
                LEFT JOIN submissions s ON t.id = s.task_id
            """
            params = []
            if search:
                query += " WHERE (g.name LIKE ? OR g.department LIKE ? OR tr.name LIKE ?)"
                params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

            query += " GROUP BY g.id ORDER BY avg_group_grade DESC;"
            cursor.execute(query, tuple(params))
            rows = [dict(r) for r in cursor.fetchall()]

            for r in rows:
                st = r['enrolled_students'] or 0
                tt = r['total_tasks'] or 0
                expected = st * tt
                comp = r['completed_tasks'] or 0
                r['completion_rate'] = round((comp / expected * 100), 1) if expected > 0 else (100.0 if comp > 0 else 0.0)
                avg_g = round(float(r['avg_group_grade']), 1) if r['avg_group_grade'] is not None else 0.0
                r['avg_group_grade'] = avg_g
                r['letter_grade'] = calculate_letter_grade(avg_g)

            total_grp = len(rows)
            total_students = sum(r['enrolled_students'] or 0 for r in rows)
            overall_avg = round(sum(r['avg_group_grade'] for r in rows) / total_grp, 1) if total_grp > 0 else 0.0

            return {
                "type": "group_performance",
                "title": "Eğitim Grupları Performans Raporu (Group Performance Report)",
                "kpis": {
                    "total_groups": total_grp,
                    "total_enrolled_students": total_students,
                    "group_overall_average": overall_avg,
                    "top_group_name": rows[0]['group_name'] if rows else '-'
                },
                "records": rows
            }

        # 4. Tasks Report
        elif report_type == 'tasks_report':
            query = """
                SELECT t.id as task_id, t.title as task_title, t.deadline, t.priority,
                       g.name as group_name, tr.name as trainer_name,
                       COUNT(DISTINCT t.student_id) as assigned_students,
                       COUNT(DISTINCT s.id) as submissions_count,
                       SUM(CASE WHEN s.status IN ('Tamamlandı', 'Kabul Edildi') THEN 1 ELSE 0 END) as completed_count,
                       SUM(CASE WHEN s.status IN ('Teslim Edildi', 'İnceleniyor') THEN 1 ELSE 0 END) as in_review_count,
                       SUM(CASE WHEN datetime(t.deadline) < datetime('now', 'localtime') AND (s.status IS NULL OR s.status NOT IN ('Tamamlandı', 'Kabul Edildi')) THEN 1 ELSE 0 END) as late_count,
                       AVG(CASE WHEN s.grade IS NOT NULL THEN s.grade ELSE NULL END) as avg_task_grade
                FROM tasks t
                LEFT JOIN groups g ON t.group_id = g.id
                LEFT JOIN users tr ON t.trainer_id = tr.id
                LEFT JOIN submissions s ON t.id = s.task_id AND s.student_id = t.student_id
                WHERE 1=1
            """
            params = []
            if group_id and str(group_id) != 'all':
                query += " AND t.group_id = ?"
                params.append(int(group_id))
            if search:
                query += " AND (t.title LIKE ? OR g.name LIKE ? OR tr.name LIKE ?)"
                params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

            query += " GROUP BY t.id ORDER BY t.deadline DESC;"
            cursor.execute(query, tuple(params))
            rows = [dict(r) for r in cursor.fetchall()]

            for r in rows:
                asg = r['assigned_students'] or 1
                sub = r['submissions_count'] or 0
                r['turnin_rate'] = round((sub / asg * 100), 1) if asg > 0 else 0.0
                r['avg_task_grade'] = round(float(r['avg_task_grade']), 1) if r['avg_task_grade'] is not None else 0.0

            total_t = len(rows)
            avg_turnin = round(sum(r['turnin_rate'] for r in rows) / total_t, 1) if total_t > 0 else 0.0
            avg_grade = round(sum(r['avg_task_grade'] for r in rows if r['avg_task_grade'] > 0) / max(1, sum(1 for r in rows if r['avg_task_grade'] > 0)), 1)

            return {
                "type": "tasks_report",
                "title": "Görevler ve Teslimat Raporu (Tasks Report)",
                "kpis": {
                    "total_tasks": total_t,
                    "average_turnin_rate": avg_turnin,
                    "average_task_grade": avg_grade,
                    "urgent_tasks_count": sum(1 for r in rows if r['priority'] == 'Acil')
                },
                "records": rows
            }

        # 5. Late Tasks Report
        elif report_type == 'late_tasks_report':
            query = """
                SELECT t.id as task_id, t.title as task_title, t.deadline, t.priority,
                       u.id as student_id, u.name as student_name, u.email as student_email,
                       g.name as group_name, tr.name as trainer_name,
                       s.id as submission_id, s.status as submission_status, s.submitted_at,
                       CAST((julianday('now', 'localtime') - julianday(t.deadline)) AS INTEGER) as days_overdue
                FROM tasks t
                JOIN users u ON t.student_id = u.id
                LEFT JOIN groups g ON t.group_id = g.id
                LEFT JOIN users tr ON t.trainer_id = tr.id
                LEFT JOIN submissions s ON t.id = s.task_id AND s.student_id = u.id
                WHERE datetime(t.deadline) < datetime('now', 'localtime')
                  AND (s.status IS NULL OR s.status NOT IN ('Tamamlandı', 'Kabul Edildi'))
            """
            params = []
            if group_id and str(group_id) != 'all':
                query += " AND t.group_id = ?"
                params.append(int(group_id))
            if search:
                query += " AND (t.title LIKE ? OR u.name LIKE ? OR g.name LIKE ?)"
                params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

            query += " ORDER BY days_overdue DESC, t.deadline ASC;"
            cursor.execute(query, tuple(params))
            rows = [dict(r) for r in cursor.fetchall()]

            critical = sum(1 for r in rows if (r['days_overdue'] or 0) >= 7)
            moderate = sum(1 for r in rows if 0 < (r['days_overdue'] or 0) < 7)

            return {
                "type": "late_tasks_report",
                "title": "Geciken Görevler ve Uyarı Raporu (Late Tasks Report)",
                "kpis": {
                    "total_late_tasks": len(rows),
                    "critical_overdue_count": critical,
                    "moderate_overdue_count": moderate,
                    "pending_urgent_count": sum(1 for r in rows if r['priority'] == 'Acil')
                },
                "records": rows
            }

        # 6. Activity / Attendance Report
        elif report_type == 'activity_attendance_report':
            query = """
                SELECT u.id as user_id, u.name as user_name, u.email, u.role, u.created_at,
                       COUNT(DISTINCT s.id) as submissions_count,
                       COUNT(DISTINCT tc.id) as comments_count,
                       COUNT(DISTINCT n.id) as notifications_received
                FROM users u
                LEFT JOIN submissions s ON u.id = s.student_id
                LEFT JOIN task_comments tc ON u.id = tc.user_id
                LEFT JOIN notifications n ON u.id = n.user_id
                WHERE 1=1
            """
            params = []
            if search:
                query += " AND (u.name LIKE ? OR u.email LIKE ?)"
                params.extend([f"%{search}%", f"%{search}%"])

            query += " GROUP BY u.id ORDER BY (submissions_count + comments_count) DESC;"
            cursor.execute(query, tuple(params))
            rows = [dict(r) for r in cursor.fetchall()]

            for r in rows:
                score = (r['submissions_count'] * 15) + (r['comments_count'] * 10) + min(r['notifications_received'], 20)
                r['activity_score'] = score
                if score >= 50:
                    r['activity_level'] = 'Yüksek (High)'
                elif score >= 20:
                    r['activity_level'] = 'Orta (Moderate)'
                else:
                    r['activity_level'] = 'Düşük (Low)'

            total_users = len(rows)
            high_eng = sum(1 for r in rows if r['activity_level'] == 'Yüksek (High)')
            mod_eng = sum(1 for r in rows if r['activity_level'] == 'Orta (Moderate)')

            return {
                "type": "activity_attendance_report",
                "title": "Aktivite, Katılım ve Etkileşim Raporu (Activity / Attendance Report)",
                "kpis": {
                    "total_monitored_users": total_users,
                    "high_activity_users": high_eng,
                    "moderate_activity_users": mod_eng,
                    "low_activity_users": total_users - (high_eng + mod_eng)
                },
                "records": rows
            }


# ==================== SECTION 22: AUDIT LOGS (GÜVENLİK VE DENETİM GÜNLÜĞÜ) ====================

def log_audit_event(action: str, category: str, description: str,
                    user_id: int = None, user_name: str = None, user_role: str = None, user_email: str = None,
                    entity_type: str = None, entity_id: int = None,
                    old_values: dict = None, new_values: dict = None,
                    ip_address: str = '127.0.0.1', user_agent: str = None, severity: str = 'info'):
    """Section 22: Who / What / When / IP formatında kritik güvenlik ve denetim logu kaydeder."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # If user details not provided but user_id is given, fetch from users
            if user_id and (not user_name or not user_role):
                cursor.execute("SELECT name, role, email FROM users WHERE id = ?;", (user_id,))
                urow = cursor.fetchone()
                if urow:
                    user_name = urow['name']
                    user_role = urow['role']
                    user_email = urow['email']

            old_v_json = json.dumps(old_values, ensure_ascii=False) if old_values else None
            new_v_json = json.dumps(new_values, ensure_ascii=False) if new_values else None

            cursor.execute("""
                INSERT INTO audit_logs (
                    user_id, user_name, user_role, user_email,
                    action, category, entity_type, entity_id,
                    description, old_values, new_values,
                    ip_address, user_agent, severity, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
            """, (
                user_id, user_name or 'Sistem', user_role or 'system', user_email or 'system@local',
                action, category, entity_type, entity_id,
                description, old_v_json, new_v_json,
                ip_address or '127.0.0.1', user_agent, severity
            ))
            conn.commit()
            return cursor.lastrowid
    except Exception as e:
        print(f"[Audit Log Error]: {e}")
        return None


def get_audit_logs(category: str = None, action: str = None, user_id: int = None,
                   severity: str = None, date_range: str = 'all', search: str = None,
                   limit: int = 100, offset: int = 0):
    """Section 22: Denetim kayıtlarını filtreli ve sayfalı olarak listeler."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        query = "SELECT * FROM audit_logs WHERE 1=1"
        params = []

        if category and category != 'all':
            query += " AND category = ?"
            params.append(category)

        if action and action != 'all':
            query += " AND action = ?"
            params.append(action)

        if user_id and str(user_id) != 'all':
            query += " AND user_id = ?"
            params.append(int(user_id))

        if severity and severity != 'all':
            query += " AND severity = ?"
            params.append(severity)

        if date_range == 'today':
            query += " AND date(created_at) = date('now', 'localtime')"
        elif date_range == 'week':
            query += " AND datetime(created_at) >= datetime('now', '-7 days', 'localtime')"
        elif date_range == 'month':
            query += " AND datetime(created_at) >= datetime('now', '-30 days', 'localtime')"

        if search:
            query += " AND (description LIKE ? OR user_name LIKE ? OR user_email LIKE ? OR ip_address LIKE ? OR action LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%", f"%{search}%", f"%{search}%"])

        # Count total matching
        count_query = query.replace("SELECT *", "SELECT COUNT(*)")
        cursor.execute(count_query, tuple(params))
        total_count = cursor.fetchone()[0]

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?;"
        params.extend([limit, offset])
        cursor.execute(query, tuple(params))
        logs = [dict(r) for r in cursor.fetchall()]

        # Parse JSON fields
        for l in logs:
            if l['old_values']:
                try:
                    l['old_values'] = json.loads(l['old_values'])
                except Exception:
                    pass
            if l['new_values']:
                try:
                    l['new_values'] = json.loads(l['new_values'])
                except Exception:
                    pass

        # Calculate summary KPIs
        cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE date(created_at) = date('now', 'localtime');")
        today_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE severity IN ('warning', 'critical');")
        critical_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT user_id) FROM audit_logs WHERE user_id IS NOT NULL;")
        active_users_count = cursor.fetchone()[0]

        return {
            "total_count": total_count,
            "today_count": today_count,
            "critical_count": critical_count,
            "active_users_count": active_users_count,
            "logs": logs
        }


# ==================== SECTION 23: PROPOSED DATABASE SCHEMA & DATA DICTIONARY ====================

SECTION_23_TABLE_CATEGORIES = {
    # 1. Kullanıcı & Yetkilendirme
    "users": {"category": "Kullanıcı & Kimlik", "icon": "👤", "desc": "Sistem kullanıcı ana tablosu (Admin, Eğitmen, Öğrenci)"},
    "roles": {"category": "Kullanıcı & Kimlik", "icon": "🔑", "desc": "Sistem rolleri tanımları (Super Admin, Trainer vb.)"},
    "permissions": {"category": "Kullanıcı & Kimlik", "icon": "🛡️", "desc": "26 Temel sistem izin tanımları kataloğu"},
    "role_user": {"category": "Kullanıcı & Kimlik", "icon": "🔗", "desc": "Kullanıcı ve rol çoktan çoğa ilişki tablosu"},
    "permission_role": {"category": "Kullanıcı & Kimlik", "icon": "🔒", "desc": "Rol ve izin eşleştirme matrisi"},
    
    # 2. Profiller ve Gruplar
    "student_profiles": {"category": "Profiller & Gruplar", "icon": "🎓", "desc": "Öğrenci detaylı akademik profil ve GPA bilgileri"},
    "trainer_profiles": {"category": "Profiller & Gruplar", "icon": "👨‍🏫", "desc": "Eğitmen akademik unvan, ofis ve kapasite profili"},
    "training_groups": {"category": "Profiller & Gruplar", "icon": "🏢", "desc": "Eğitim şubeleri ve kursiyer grupları"},
    "training_group_students": {"category": "Profiller & Gruplar", "icon": "👥", "desc": "Eğitim gruplarına kayıtlı öğrenciler"},
    "training_group_trainers": {"category": "Profiller & Gruplar", "icon": "👔", "desc": "Gruplara atanan baş ve yardımcı eğitmenler"},
    
    # 3. Görevler ve Teslimat
    "tasks": {"category": "Görev & Teslimat", "icon": "📋", "desc": "Akademik ödev, proje ve sınav görevleri"},
    "task_assignments": {"category": "Görev & Teslimat", "icon": "📌", "desc": "Öğrencilere atanan görevler ve özel teslim tarihleri"},
    "task_attachments": {"category": "Görev & Teslimat", "icon": "📎", "desc": "Görevlere eklenen doküman, PDF ve kaynak dosyalar"},
    "task_submissions": {"category": "Görev & Teslimat", "icon": "📥", "desc": "Öğrenci ödev teslimleri ve revizyon versiyonları"},
    "submission_attachments": {"category": "Görev & Teslimat", "icon": "📁", "desc": "Öğrencilerin yüklediği teslimat dosyaları"},
    "task_reviews": {"category": "Görev & Teslimat", "icon": "✅", "desc": "Eğitmen inceleme, onay ve geri bildirim kayıtları"},
    "task_evaluations": {"category": "Görev & Teslimat", "icon": "⭐", "desc": "Rubrik değerlendirme kriterleri ve puan dağılımları"},
    "task_comments": {"category": "Görev & Teslimat", "icon": "💬", "desc": "Görev içi soru-cevap ve eğitmen-öğrenci mesajlaşmaları"},
    "comment_attachments": {"category": "Görev & Teslimat", "icon": "📎", "desc": "Yorumlara iliştirilen ekran görüntüsü ve dosyalar"},
    
    # 4. İletişim ve Takvim
    "notifications": {"category": "İletişim & Takvim", "icon": "🔔", "desc": "Sistem içi anlık bildirim mesajları"},
    "notification_recipients": {"category": "İletişim & Takvim", "icon": "📬", "desc": "Bildirim alıcıları ve okunma durumları"},
    "announcements": {"category": "İletişim & Takvim", "icon": "📢", "desc": "Genel duyurular ve hedef kitle panosu"},
    "announcement_recipients": {"category": "İletişim & Takvim", "icon": "👀", "desc": "Duyuru hedef kitle ve görüntülenme takibi"},
    "training_sessions": {"category": "İletişim & Takvim", "icon": "📅", "desc": "Akademik takvim ders oturumları, sınav ve toplantılar"},
    "session_attendances": {"category": "İletişim & Takvim", "icon": "✋", "desc": "Ders ve etkinlik katılım / yoklama kayıtları"},
    
    # 5. Güvenlik, Denetim ve Konfigürasyon
    "activity_logs": {"category": "Güvenlik & Sistem", "icon": "⚡", "desc": "Kullanıcı etkileşim ve aktivite hareketleri"},
    "audit_logs": {"category": "Güvenlik & Sistem", "icon": "🛡️", "desc": "Kritik işlemler denetim günlüğü (Who/What/When/IP)"},
    "user_devices": {"category": "Güvenlik & Sistem", "icon": "📱", "desc": "Kullanıcı oturum cihazları ve IP geçmişi"},
    "settings": {"category": "Güvenlik & Sistem", "icon": "⚙️", "desc": "Global sistem parametreleri ve akademik ayarlar"},
    
    # 6. Section 24: İsteğe Bağlı Genişletme Modülü (Projects, Tags, Dependencies, Checklists)
    "projects": {"category": "Proje & Genişletme (24)", "icon": "🚀", "desc": "Grup ve bireysel dönem bitirme projeleri yönetimi"},
    "project_members": {"category": "Proje & Genişletme (24)", "icon": "👥", "desc": "Proje ekip üyeleri ve rolleri (Lider, Geliştirici vb.)"},
    "project_tasks": {"category": "Proje & Genişletme (24)", "icon": "📑", "desc": "Proje kilometre taşları ve görev eşleştirmeleri"},
    "tags": {"category": "Proje & Genişletme (24)", "icon": "🏷️", "desc": "Görev etiketleme ve kategorizasyon taksonomisi"},
    "task_tags": {"category": "Proje & Genişletme (24)", "icon": "🔗", "desc": "Görevler ve etiketler çoktan çoğa eşleştirme"},
    "task_dependencies": {"category": "Proje & Genişletme (24)", "icon": "⛓️", "desc": "Gantt şeması görev ön koşul ve bağımlılık zincirleri"},
    "task_checklists": {"category": "Proje & Genişletme (24)", "icon": "☑️", "desc": "Görev adım adım kontrol ve onay listeleri"},
    "task_checklist_items": {"category": "Proje & Genişletme (24)", "icon": "✅", "desc": "Kontrol listesi alt maddeleri ve tamamlanma durumu"}
}

def get_database_schema_overview():
    """Section 23: 28 Temel Tablonun Şema Yapısını, Satır Sayılarını ve İlişkilerini Döndürür."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        existing_table_names = [r['name'] for r in cursor.fetchall()]

        tables_meta = []
        total_rows = 0
        total_columns = 0
        total_fks = 0

        # Process Section 23 tables first, then any other auxiliary tables
        all_to_process = list(SECTION_23_TABLE_CATEGORIES.keys())
        for extra in existing_table_names:
            if extra not in all_to_process and not extra.startswith('sqlite_'):
                all_to_process.append(extra)

        for tname in all_to_process:
            if tname not in existing_table_names:
                continue

            # Row count
            cursor.execute(f"SELECT COUNT(*) FROM `{tname}`;")
            rc = cursor.fetchone()[0]
            total_rows += rc

            # Columns info
            cursor.execute(f"PRAGMA table_info(`{tname}`);")
            cols = [dict(c) for c in cursor.fetchall()]
            total_columns += len(cols)

            # Foreign keys
            cursor.execute(f"PRAGMA foreign_key_list(`{tname}`);")
            fks = [dict(fk) for fk in cursor.fetchall()]
            total_fks += len(fks)

            # Indexes
            cursor.execute(f"PRAGMA index_list(`{tname}`);")
            idxs = [dict(idx) for idx in cursor.fetchall()]

            # DDL create SQL
            cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name = ?;", (tname,))
            ddl_row = cursor.fetchone()
            ddl = ddl_row['sql'] if ddl_row else ''

            cat_info = SECTION_23_TABLE_CATEGORIES.get(tname, {
                "category": "Yardımcı Tablolar",
                "icon": "🗄️",
                "desc": f"{tname} tablosu"
            })

            tables_meta.append({
                "table_name": tname,
                "category": cat_info["category"],
                "icon": cat_info["icon"],
                "description": cat_info["desc"],
                "row_count": rc,
                "column_count": len(cols),
                "columns": cols,
                "foreign_keys": fks,
                "indexes": idxs,
                "ddl": ddl
            })

        # Calculate category grouping
        categories_dict = {}
        for tm in tables_meta:
            cat = tm["category"]
            if cat not in categories_dict:
                categories_dict[cat] = {"category_name": cat, "table_count": 0, "total_rows": 0, "tables": []}
            categories_dict[cat]["table_count"] += 1
            categories_dict[cat]["total_rows"] += tm["row_count"]
            categories_dict[cat]["tables"].append(tm["table_name"])

        return {
            "total_tables": len(tables_meta),
            "total_rows": total_rows,
            "total_columns": total_columns,
            "total_foreign_keys": total_fks,
            "categories": list(categories_dict.values()),
            "tables": tables_meta
        }


def get_table_records_browser(table_name: str, search: str = None, limit: int = 50, offset: int = 0):
    """Section 23: Seçilen veritabanı tablosunun satırlarını ve şemasını güvenle sayfalar."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Sanitize table name against sqlite_master
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name = ?;", (table_name,))
        if not cursor.fetchone():
            return None

        cursor.execute(f"PRAGMA table_info(`{table_name}`);")
        cols = [dict(c) for c in cursor.fetchall()]

        cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`;")
        total_rows = cursor.fetchone()[0]

        cursor.execute(f"SELECT * FROM `{table_name}` ORDER BY 1 DESC LIMIT ? OFFSET ?;", (limit, offset))
        raw_rows = cursor.fetchall()
        rows = [dict(r) for r in raw_rows]

        # Mask password hashes for security in users table
        if table_name == 'users':
            for r in rows:
                if 'password' in r:
                    r['password'] = '•••••••• (SHA-256)'

        return {
            "table_name": table_name,
            "total_rows": total_rows,
            "columns": cols,
            "rows": rows,
            "limit": limit,
            "offset": offset
        }


# ==================== SECTION 26.29: SYSTEM SETTINGS MANAGEMENT ====================

def get_all_settings():
    """Section 26.29: Sistem ayarlarını kategorize edilmiş olarak döndürür."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM settings ORDER BY category ASC, id ASC;")
        return [dict(r) for r in cursor.fetchall()]


def update_system_setting(key: str, value: str, user_id: int = None):
    """Section 26.29: Sistem ayarını günceller."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE settings
            SET value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
            WHERE key = ?;
        """, (str(value), user_id, key))
        conn.commit()
        return cursor.rowcount > 0


def create_broadcast_announcement(title: str, message: str, target_role: str = "all"):
    """Legacy helper maintained for backward compatibility."""
    target_type = "all_users" if target_role == "all" else f"all_{target_role}s"
    _, count = create_announcement(1, title, message, target_type)
    return count


def check_and_notify_task_deadlines(student_id: int):
    """Section 11 Events #2 & #3: Task Deadline Approaching & Task Overdue."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        today = datetime.now().date()
        
        cursor.execute("""
            SELECT t.id, t.title, t.deadline
            FROM tasks t
            LEFT JOIN submissions s ON s.id = (SELECT id FROM submissions WHERE task_id = t.id AND student_id = t.student_id ORDER BY id DESC LIMIT 1)
            WHERE t.student_id = ? AND (s.id IS NULL OR s.status IN ('Bekliyor', 'Görüntülendi', 'Devam Ediyor', 'Düzeltme İstendi'));
        """, (student_id,))
        tasks = cursor.fetchall()
        
        for t in tasks:
            if not t["deadline"]:
                continue
            try:
                d_date = datetime.strptime(t["deadline"].split()[0], "%Y-%m-%d").date()
                diff_days = (d_date - today).days
                
                # Event #2: Deadline Approaching (0 veya 1-2 gün kala)
                if 0 <= diff_days <= 2:
                    cursor.execute("""
                        SELECT id FROM notifications 
                        WHERE user_id = ? AND type = 'deadline_approaching' AND title LIKE ? 
                          AND date(created_at) = date('now');
                    """, (student_id, f"%{t['title'][:20]}%"))
                    if not cursor.fetchone():
                        cursor.execute("""
                            INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                            VALUES (?, ?, ?, 'deadline_approaching', 0, CURRENT_TIMESTAMP);
                        """, (student_id, f"⏰ Teslim Tarihi Yaklaşıyor: {t['title']}", f"'{t['title']}' görevinin son teslimine {diff_days} gün kaldı (Son Tarih: {t['deadline']})."))
                        conn.commit()
                        
                # Event #3: Task Overdue (Gecikmiş)
                elif diff_days < 0:
                    cursor.execute("""
                        SELECT id FROM notifications 
                        WHERE user_id = ? AND type = 'task_overdue' AND title LIKE ? 
                          AND date(created_at) = date('now');
                    """, (student_id, f"%{t['title'][:20]}%"))
                    if not cursor.fetchone():
                        cursor.execute("""
                            INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                            VALUES (?, ?, ?, 'task_overdue', 0, CURRENT_TIMESTAMP);
                        """, (student_id, f"🔴 Görev Süresi Doldu (Overdue): {t['title']}", f"'{t['title']}' görevinin teslim süresi geçti (Son Tarih: {t['deadline']}). Lütfen en kısa sürede teslim ediniz."))
                        conn.commit()
            except Exception:
                pass


# ==================== SECTION 10: GÖREV İÇİ YORUMLAR (TASK COMMENTS THREAD) ====================

def add_task_comment(task_id: int, user_id: int, content: str, attachment_file: str = None, attachment_url: str = None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Dosya uzantısı kontrolü ile resim mi tespit et
        is_image = 0
        if attachment_file:
            ext = os.path.splitext(attachment_file)[1].lower()
            if ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']:
                is_image = 1

        cursor.execute("""
            INSERT INTO task_comments (task_id, user_id, content, attachment_file, attachment_url, is_image, created_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
        """, (task_id, user_id, content.strip() if content else "", attachment_file, attachment_url.strip() if attachment_url else None, is_image))
        comment_id = cursor.lastrowid
        conn.commit()

        # Otomatik bildirim: Eğitmen yazdıysa öğrenciye, öğrenci yazdıysa eğitmene bildirim ilet
        cursor.execute("""
            SELECT t.student_id, t.trainer_id, t.title as task_title, u.name as sender_name, u.role as sender_role
            FROM tasks t
            JOIN users u ON u.id = ?
            WHERE t.id = ?;
        """, (user_id, task_id))
        row = cursor.fetchone()
        if row:
            student_id = row["student_id"]
            trainer_id = row["trainer_id"]
            task_title = row["task_title"]
            sender_name = row["sender_name"]
            sender_role = row["sender_role"]

            target_user_id = trainer_id if sender_role == 'student' else student_id
            if target_user_id:
                notif_title = f"💬 Yeni Yorum: {task_title}"
                snippet = (content[:50] + '...') if len(content) > 50 else content
                notif_msg = f"{sender_name}: '{snippet}'"
                cursor.execute("""
                    INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                    VALUES (?, ?, ?, 'comment', 0, CURRENT_TIMESTAMP);
                """, (target_user_id, notif_title, notif_msg))
                conn.commit()

        return comment_id


def get_task_comments(task_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.*, 
                   u.name as user_name, u.email as user_email, u.role as user_role
            FROM task_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.task_id = ?
            ORDER BY c.id ASC;
        """, (task_id,))
        return [dict(r) for r in cursor.fetchall()]


def update_submission_status(task_id: int, student_id: int, status: str = "İnceleniyor"):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM submissions WHERE task_id = ? AND student_id = ? ORDER BY id DESC LIMIT 1;", (task_id, student_id))
        row = cursor.fetchone()
        if row:
            cursor.execute("UPDATE submissions SET status = ? WHERE id = ?;", (status, row["id"]))
        else:
            cursor.execute("""
                INSERT INTO submissions (task_id, student_id, submission_number, revision_number, file_path, original_filename, file_size, status)
                VALUES (?, ?, 1, 1, '', '', 0, ?);
            """, (task_id, student_id, status))
        conn.commit()
        return True


def get_submission_by_id(submission_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, 
                   t.title as task_title, t.description as task_description, t.deadline as task_deadline,
                   t.trainer_id, tr.name as trainer_name,
                   st.name as student_name, st.email as student_email
            FROM submissions s
            JOIN tasks t ON s.task_id = t.id
            JOIN users tr ON t.trainer_id = tr.id
            JOIN users st ON s.student_id = st.id
            WHERE s.id = ?;
        """, (submission_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def list_submissions(trainer_id: int = None, student_id: int = None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        base_query = """
            SELECT s.*, 
                   t.title as task_title, t.deadline as task_deadline,
                   t.trainer_id, tr.name as trainer_name,
                   st.name as student_name, st.email as student_email
            FROM submissions s
            JOIN tasks t ON s.task_id = t.id
            JOIN users tr ON t.trainer_id = tr.id
            JOIN users st ON s.student_id = st.id
        """
        params = []
        conditions = ["(s.file_path != '' OR s.student_link IS NOT NULL OR s.student_notes IS NOT NULL)"]

        if trainer_id:
            conditions.append("t.trainer_id = ?")
            params.append(trainer_id)
        if student_id:
            conditions.append("s.student_id = ?")
            params.append(student_id)

        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)

        base_query += " ORDER BY s.submitted_at DESC;"
        
        cursor.execute(base_query, params)
        return [dict(r) for r in cursor.fetchall()]


# ==================== SECTION 12: ROLES & PERMISSIONS (RBAC FUNCTIONS) ====================

def get_role_permissions(role: str) -> list:
    """Belirli bir rolün sahip olduğu tüm izin kodlarını döndürür."""
    if not role:
        return []
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT permission FROM role_permissions WHERE role = ?;", (role.strip().lower(),))
        return [r["permission"] for r in cursor.fetchall()]


def has_permission(role: str, permission_code: str) -> bool:
    """Kullanıcı rolünün ilgili işleme yetkisi olup olmadığını kontrol eder."""
    if not role:
        return False
    if role in ["super_admin", "admin"] and permission_code != "super_admin_only":
        return True
    perms = get_role_permissions(role)
    return permission_code in perms


def get_all_roles_permissions_matrix() -> dict:
    """Tüm roller ve 26 iznin matrisini döndürür."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT role, permission FROM role_permissions;")
        rows = cursor.fetchall()
        matrix = {r["code"]: [] for r in AVAILABLE_ROLES}
        for row in rows:
            r_code = row["role"]
            if r_code in matrix:
                matrix[r_code].append(row["permission"])
        return {
            "roles": AVAILABLE_ROLES,
            "permissions": ALL_PERMISSIONS,
            "matrix": matrix
        }


def update_role_permissions(role: str, permissions_list: list) -> bool:
    """Bir rolün yetkilerini günceller."""
    role = role.strip().lower()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM role_permissions WHERE role = ?;", (role,))
        for p in permissions_list:
            cursor.execute("INSERT OR IGNORE INTO role_permissions (role, permission) VALUES (?, ?);", (role, p.strip()))
        conn.commit()
        return True


# ==================== İSTATİSTİKLER (DASHBOARD STATS) ====================

def get_admin_stats():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'student';")
        total_students = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'trainer';")
        total_trainers = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM tasks;")
        total_tasks = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM groups;")
        total_groups = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM submissions;")
        total_submissions = cursor.fetchone()[0]

        return {
            "total_students": total_students,
            "total_trainers": total_trainers,
            "total_tasks": total_tasks,
            "total_groups": total_groups,
            "total_submissions": total_submissions
        }


# ==================== SECTION 16: ADMIN DASHBOARD (YÖNETİCİ KONTROL PANELİ) ====================

def get_admin_dashboard_full_data():
    """Section 16: Yönetici Kontrol Panelinin 11 temel gereksinimini hesaplar."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Total Students
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'student';")
        total_students = cursor.fetchone()[0]

        # 2. Total Trainers
        cursor.execute("SELECT COUNT(*) FROM users WHERE role IN ('trainer', 'assistant_trainer');")
        total_trainers = cursor.fetchone()[0]

        # 3. Training Groups
        cursor.execute("SELECT COUNT(*) FROM groups;")
        training_groups_count = cursor.fetchone()[0]

        # 4. Active Tasks
        cursor.execute("""
            SELECT COUNT(*) FROM tasks t
            LEFT JOIN submissions s ON t.id = s.task_id
            WHERE s.status IS NULL OR s.status NOT IN ('Tamamlandı', 'Kabul Edildi');
        """)
        active_tasks_count = cursor.fetchone()[0]

        # 5. Pending Reviews
        cursor.execute("SELECT COUNT(*) FROM submissions WHERE status IN ('Teslim Edildi', 'İnceleniyor');")
        pending_reviews_count = cursor.fetchone()[0]

        # 6. Late Tasks
        cursor.execute("""
            SELECT COUNT(*) FROM tasks t
            LEFT JOIN submissions s ON t.id = s.task_id
            WHERE datetime(t.deadline) < datetime('now', 'localtime')
              AND (s.status IS NULL OR s.status NOT IN ('Tamamlandı', 'Kabul Edildi'));
        """)
        late_tasks_count = cursor.fetchone()[0]

        # 7. Tasks Completed This Week
        cursor.execute("""
            SELECT COUNT(*) FROM submissions
            WHERE status IN ('Tamamlandı', 'Kabul Edildi')
              AND datetime(submitted_at) >= datetime('now', '-7 days', 'localtime');
        """)
        tasks_completed_this_week = cursor.fetchone()[0]

        # 8. Student Progress Overview
        cursor.execute("SELECT COUNT(*) FROM tasks;")
        total_tasks_assigned = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM submissions WHERE status IN ('Tamamlandı', 'Kabul Edildi');")
        total_completed_tasks = cursor.fetchone()[0]
        cursor.execute("SELECT AVG(grade) FROM submissions WHERE grade IS NOT NULL;")
        avg_system_grade_row = cursor.fetchone()[0]
        avg_system_grade = round(float(avg_system_grade_row), 1) if avg_system_grade_row is not None else 0.0
        completion_rate = round((total_completed_tasks / total_tasks_assigned * 100), 1) if total_tasks_assigned > 0 else 0.0

        student_progress = {
            "total_tasks_assigned": total_tasks_assigned,
            "completed": total_completed_tasks,
            "in_progress": max(0, active_tasks_count - late_tasks_count),
            "late": late_tasks_count,
            "completion_rate": completion_rate,
            "avg_grade": avg_system_grade
        }

        # 9. Trainer Activity
        cursor.execute("""
            SELECT u.id, u.name, u.email, u.role,
                   (SELECT COUNT(*) FROM tasks t WHERE t.trainer_id = u.id) as total_tasks_created,
                   (
                       SELECT COUNT(*) FROM submissions s
                       JOIN tasks t ON s.task_id = t.id
                       WHERE t.trainer_id = u.id AND s.status IN ('Teslim Edildi', 'İnceleniyor')
                   ) as pending_reviews,
                   (
                       SELECT COUNT(*) FROM submissions s
                       JOIN tasks t ON s.task_id = t.id
                       WHERE t.trainer_id = u.id AND s.status IN ('Tamamlandı', 'Kabul Edildi')
                   ) as completed_reviews,
                   (
                       SELECT AVG(s.grade) FROM submissions s
                       JOIN tasks t ON s.task_id = t.id
                       WHERE t.trainer_id = u.id AND s.grade IS NOT NULL
                   ) as avg_grade_given
            FROM users u
            WHERE u.role IN ('trainer', 'assistant_trainer')
            ORDER BY total_tasks_created DESC, completed_reviews DESC;
        """)
        trainer_activity = []
        for r in cursor.fetchall():
            d = dict(r)
            d["avg_grade_given"] = round(float(d["avg_grade_given"]), 1) if d["avg_grade_given"] is not None else 0.0
            trainer_activity.append(d)

        # 10. Late Submissions (Overdue Tasks needing attention)
        cursor.execute("""
            SELECT t.id as task_id, t.title as task_title, t.deadline, t.priority,
                   u.id as student_id, u.name as student_name, u.email as student_email,
                   COALESCE(g.name, 'Individual') as group_name,
                   tr.name as trainer_name,
                   COALESCE(s.status, 'Teslim Edilmedi') as submission_status,
                   ROUND((julianday('now', 'localtime') - julianday(t.deadline))) as days_overdue
            FROM tasks t
            LEFT JOIN submissions s ON t.id = s.task_id
            JOIN users u ON t.student_id = u.id
            LEFT JOIN groups g ON t.group_id = g.id
            LEFT JOIN users tr ON t.trainer_id = tr.id
            WHERE datetime(t.deadline) < datetime('now', 'localtime')
              AND (s.status IS NULL OR s.status NOT IN ('Tamamlandı', 'Kabul Edildi'))
            ORDER BY t.deadline ASC
            LIMIT 10;
        """)
        late_submissions = [dict(r) for r in cursor.fetchall()]

        # 11. Training Groups Performance
        cursor.execute("""
            SELECT g.id, g.name, g.department, g.status,
                   u.name as trainer_name,
                   COUNT(DISTINCT gm.student_id) as student_count,
                   (
                       SELECT COUNT(*) FROM tasks t WHERE t.group_id = g.id
                   ) as total_tasks,
                   (
                       SELECT COUNT(*) FROM tasks t 
                       JOIN submissions s ON t.id = s.task_id
                       WHERE t.group_id = g.id AND s.status IN ('Tamamlandı', 'Kabul Edildi')
                   ) as completed_tasks,
                   (
                       SELECT AVG(s.grade) FROM tasks t
                       JOIN submissions s ON t.id = s.task_id
                       WHERE t.group_id = g.id AND s.grade IS NOT NULL
                   ) as avg_grade
            FROM groups g
            LEFT JOIN group_members gm ON g.id = gm.group_id
            LEFT JOIN users u ON g.trainer_id = u.id
            GROUP BY g.id
            ORDER BY g.id DESC;
        """)
        training_groups_performance = []
        for r in cursor.fetchall():
            d = dict(r)
            tot = d["total_tasks"] or 0
            comp = d["completed_tasks"] or 0
            d["completion_rate"] = round((comp / tot * 100), 1) if tot > 0 else 0.0
            d["avg_grade"] = round(float(d["avg_grade"]), 1) if d["avg_grade"] is not None else 0.0
            training_groups_performance.append(d)

        return {
            "kpi": {
                "total_students": total_students,
                "total_trainers": total_trainers,
                "training_groups": training_groups_count,
                "active_tasks": active_tasks_count,
                "pending_reviews": pending_reviews_count,
                "late_tasks": late_tasks_count,
                "tasks_completed_this_week": tasks_completed_this_week
            },
            "student_progress": student_progress,
            "trainer_activity": trainer_activity,
            "late_submissions": late_submissions,
            "training_groups_performance": training_groups_performance
        }


# ==================== SECTION 17: TODAY'S TASKS (GÜNLÜK GÖREV YÖNETİMİ & TAKİP) ====================

def get_today_tasks_overview(user_id: int, role: str, filters: dict = None):
    """Section 17: Bugünün Görevleri merkezi izleme sayfası verileri ve 5 filtreli sorgulama."""
    filters = filters or {}
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        query = """
            SELECT t.id as task_id, t.title, t.description, t.instructions, t.deadline, t.priority,
                   t.estimated_time, t.start_date, t.attachment_url, t.attachment_file,
                   t.trainer_id, t.student_id, t.group_id,
                   u_st.name as student_name, u_st.email as student_email,
                   u_tr.name as trainer_name, u_tr.email as trainer_email,
                   COALESCE(g.name, 'Bireysel Görev') as group_name,
                   COALESCE(g.department, 'Genel') as group_department,
                   s.id as submission_id, s.status as submission_status, s.grade, s.submitted_at, s.feedback,
                   s.original_filename, s.file_path,
                   CASE 
                     WHEN s.status IN ('Tamamlandı', 'Kabul Edildi') THEN 'completed'
                     WHEN s.status IN ('Teslim Edildi', 'İnceleniyor') THEN 'waiting_review'
                     WHEN datetime(t.deadline) < datetime('now', 'localtime') AND (s.status IS NULL OR s.status NOT IN ('Tamamlandı', 'Kabul Edildi')) THEN 'overdue'
                     WHEN s.status = 'Devam Ediyor' OR s.id IS NOT NULL THEN 'in_progress'
                     ELSE 'not_started'
                   END as calculated_status,
                   ROUND((julianday('now', 'localtime') - julianday(t.deadline))) as days_overdue
            FROM tasks t
            JOIN users u_st ON t.student_id = u_st.id
            JOIN users u_tr ON t.trainer_id = u_tr.id
            LEFT JOIN groups g ON t.group_id = g.id
            LEFT JOIN submissions s ON t.id = s.task_id AND s.student_id = t.student_id
            WHERE 1=1
        """
        params = []

        # Role-based scoping:
        if role in ['trainer', 'assistant_trainer']:
            query += " AND (t.trainer_id = ? OR g.trainer_id = ?)"
            params.extend([user_id, user_id])
        elif role == 'student':
            query += " AND t.student_id = ?"
            params.append(user_id)

        # Filters:
        if filters.get('trainer_id') and str(filters['trainer_id']) != 'all':
            query += " AND t.trainer_id = ?"
            params.append(int(filters['trainer_id']))
        if filters.get('student_id') and str(filters['student_id']) != 'all':
            query += " AND t.student_id = ?"
            params.append(int(filters['student_id']))
        if filters.get('group_id') and str(filters['group_id']) != 'all':
            query += " AND t.group_id = ?"
            params.append(int(filters['group_id']))
        if filters.get('priority') and str(filters['priority']) != 'all':
            query += " AND t.priority = ?"
            params.append(filters['priority'])

        query += " ORDER BY t.deadline ASC, t.id DESC;"
        cursor.execute(query, tuple(params))
        all_tasks = [dict(r) for r in cursor.fetchall()]

        # 6 KPI metric counts:
        total_tasks = len(all_tasks)
        completed_count = sum(1 for t in all_tasks if t['calculated_status'] == 'completed')
        in_progress_count = sum(1 for t in all_tasks if t['calculated_status'] == 'in_progress')
        waiting_review_count = sum(1 for t in all_tasks if t['calculated_status'] == 'waiting_review')
        not_started_count = sum(1 for t in all_tasks if t['calculated_status'] == 'not_started')
        overdue_count = sum(1 for t in all_tasks if t['calculated_status'] == 'overdue')

        # Filter by calculated_status if requested:
        target_status = filters.get('status', 'all')
        if target_status and target_status != 'all':
            filtered_tasks = [t for t in all_tasks if t['calculated_status'] == target_status]
        else:
            filtered_tasks = all_tasks

        # Search query filtering:
        search_query = filters.get('search', '').strip().lower()
        if search_query:
            filtered_tasks = [
                t for t in filtered_tasks 
                if search_query in t['title'].lower() 
                or search_query in t['student_name'].lower() 
                or search_query in t['trainer_name'].lower()
                or search_query in t['group_name'].lower()
            ]

        return {
            "kpi": {
                "total_tasks": total_tasks,
                "completed": completed_count,
                "in_progress": in_progress_count,
                "waiting_review": waiting_review_count,
                "not_started": not_started_count,
                "overdue": overdue_count
            },
            "tasks": filtered_tasks
        }


def get_trainer_stats(trainer_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(DISTINCT student_id) FROM tasks WHERE trainer_id = ?;", (trainer_id,))
        total_students = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE trainer_id = ?;", (trainer_id,))
        total_tasks = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM groups WHERE trainer_id = ?;", (trainer_id,))
        total_groups = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM submissions s
            JOIN tasks t ON s.task_id = t.id
            WHERE t.trainer_id = ? AND s.status IN ('Teslim Edildi', 'İnceleniyor');
        """, (trainer_id,))
        pending_reviews = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM submissions s
            JOIN tasks t ON s.task_id = t.id
            WHERE t.trainer_id = ? AND s.status = 'Tamamlandı';
        """, (trainer_id,))
        completed_reviews = cursor.fetchone()[0]

        return {
            "total_students": total_students,
            "total_tasks": total_tasks,
            "total_groups": total_groups,
            "pending_reviews": pending_reviews,
            "completed_reviews": completed_reviews
        }


# ==================== SECTION 15: TRAINER DASHBOARD (EĞİTMEN KONTROL PANELİ) ====================

def get_trainer_dashboard_data(trainer_id: int):
    """Section 15: Eğitmen Kontrol Panelinin 8 temel gereksinimini hesaplar."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. My Students (Bağlı Öğrenciler)
        cursor.execute("""
            SELECT COUNT(DISTINCT student_id) FROM (
                SELECT gm.student_id FROM group_members gm
                JOIN groups g ON gm.group_id = g.id
                WHERE g.trainer_id = ?
                UNION
                SELECT student_id FROM tasks WHERE trainer_id = ?
            );
        """, (trainer_id, trainer_id))
        my_students_count = cursor.fetchone()[0]

        # 2. Active Tasks (Aktif ve Devam Eden Görevler)
        cursor.execute("""
            SELECT COUNT(*) FROM tasks t
            LEFT JOIN submissions s ON t.id = s.task_id
            WHERE t.trainer_id = ? AND (s.status IS NULL OR s.status NOT IN ('Tamamlandı', 'Kabul Edildi'));
        """, (trainer_id,))
        active_tasks_count = cursor.fetchone()[0]

        # 3. Waiting Review (İnceleme ve Notlandırma Bekleyenler)
        cursor.execute("""
            SELECT COUNT(*) FROM submissions s
            JOIN tasks t ON s.task_id = t.id
            WHERE t.trainer_id = ? AND s.status IN ('Teslim Edildi', 'İnceleniyor');
        """, (trainer_id,))
        waiting_review_count = cursor.fetchone()[0]

        # 4. Late Tasks (Geciken / Süresi Dolan Görevler)
        cursor.execute("""
            SELECT COUNT(*) FROM tasks t
            LEFT JOIN submissions s ON t.id = s.task_id
            WHERE t.trainer_id = ? 
              AND datetime(t.deadline) < datetime('now', 'localtime')
              AND (s.status IS NULL OR s.status NOT IN ('Tamamlandı', 'Kabul Edildi'));
        """, (trainer_id,))
        late_tasks_count = cursor.fetchone()[0]

        # 5. Completed Today (Bugün Tamamlanan / İncelenenler)
        cursor.execute("""
            SELECT COUNT(*) FROM submissions s
            JOIN tasks t ON s.task_id = t.id
            WHERE t.trainer_id = ? 
              AND s.status IN ('Tamamlandı', 'Kabul Edildi')
              AND date(s.submitted_at) = date('now', 'localtime');
        """, (trainer_id,))
        completed_today_count = cursor.fetchone()[0]

        # 6. Tasks Waiting for Review (İnceleme Bekleyen Ödevler Listesi)
        cursor.execute("""
            SELECT s.id as submission_id, s.task_id, s.student_id, s.submitted_at, s.status as submission_status,
                   s.original_filename, s.file_path, s.student_notes, s.student_link,
                   t.title as task_title, t.deadline, t.priority,
                   u.name as student_name, u.email as student_email
            FROM submissions s
            JOIN tasks t ON s.task_id = t.id
            JOIN users u ON s.student_id = u.id
            WHERE t.trainer_id = ? AND s.status IN ('Teslim Edildi', 'İnceleniyor')
            ORDER BY s.submitted_at DESC;
        """, (trainer_id,))
        tasks_waiting_for_review = [dict(r) for r in cursor.fetchall()]

        # 7. Recent Student Submissions (Son Öğrenci Teslimleri)
        cursor.execute("""
            SELECT s.id as submission_id, s.task_id, s.student_id, s.submitted_at, s.status as submission_status,
                   s.grade, s.original_filename,
                   t.title as task_title,
                   u.name as student_name, u.email as student_email
            FROM submissions s
            JOIN tasks t ON s.task_id = t.id
            JOIN users u ON s.student_id = u.id
            WHERE t.trainer_id = ?
            ORDER BY s.submitted_at DESC
            LIMIT 6;
        """, (trainer_id,))
        recent_student_submissions = [dict(r) for r in cursor.fetchall()]

        # 8. Group Progress (Grup İlerleme ve Başarı Oranları)
        cursor.execute("""
            SELECT g.id, g.name, g.department, g.status,
                   COUNT(DISTINCT gm.student_id) as student_count,
                   (
                       SELECT COUNT(*) FROM tasks t WHERE t.group_id = g.id
                   ) as total_group_tasks,
                   (
                       SELECT COUNT(*) FROM tasks t 
                       JOIN submissions s ON t.id = s.task_id
                       WHERE t.group_id = g.id AND s.status IN ('Tamamlandı', 'Kabul Edildi')
                   ) as completed_group_tasks,
                   (
                       SELECT AVG(s.grade) FROM tasks t
                       JOIN submissions s ON t.id = s.task_id
                       WHERE t.group_id = g.id AND s.grade IS NOT NULL
                   ) as avg_grade
            FROM groups g
            LEFT JOIN group_members gm ON g.id = gm.group_id
            WHERE g.trainer_id = ?
            GROUP BY g.id;
        """, (trainer_id,))
        groups_progress = []
        for r in cursor.fetchall():
            d = dict(r)
            tot_tasks = d["total_group_tasks"] or 0
            comp_tasks = d["completed_group_tasks"] or 0
            d["progress_pct"] = round((comp_tasks / tot_tasks * 100), 1) if tot_tasks > 0 else 0.0
            d["avg_grade"] = round(float(d["avg_grade"]), 1) if d["avg_grade"] is not None else 0.0
            groups_progress.append(d)

        return {
            "kpi": {
                "my_students": my_students_count,
                "active_tasks": active_tasks_count,
                "waiting_review": waiting_review_count,
                "late_tasks": late_tasks_count,
                "completed_today": completed_today_count
            },
            "tasks_waiting_for_review": tasks_waiting_for_review,
            "recent_student_submissions": recent_student_submissions,
            "group_progress": groups_progress
        }


def get_student_stats(student_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE student_id = ?;", (student_id,))
        total_tasks = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM tasks t
            LEFT JOIN submissions s ON t.id = s.task_id
            WHERE t.student_id = ? AND (s.id IS NULL OR s.status = 'Bekliyor');
        """, (student_id,))
        pending_tasks = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM submissions WHERE student_id = ? AND status = 'Teslim Edildi';
        """, (student_id,))
        submitted_tasks = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM submissions WHERE student_id = ? AND status IN ('İnceleniyor', 'Tamamlandı');
        """, (student_id,))
        reviewed_tasks = cursor.fetchone()[0]
        
        return {
            "total_tasks": total_tasks,
            "pending_tasks": pending_tasks,
            "submitted_tasks": submitted_tasks,
            "reviewed_tasks": reviewed_tasks
        }


# ==================== SECTION 14: STUDENT PROFILE (ÖĞRENCİ PROFİLİ) ====================

def get_student_full_profile(student_id: int):
    """Section 14: Öğrenci profilinin 8 temel bileşenini eksiksiz hesaplar ve döndürür."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Student Information
        cursor.execute("SELECT id, name, email, role, COALESCE(status, 'Active') as status, created_at, last_login FROM users WHERE id = ?;", (student_id,))
        user_row = cursor.fetchone()
        if not user_row:
            return None
        
        student_info = dict(user_row)
        student_info["student_no"] = f"STU-{student_info['id']:05d}"
        
        # 2. Training Group and Trainer
        cursor.execute("""
            SELECT g.id as group_id, g.name as group_name, g.department, g.description as group_desc,
                   u.name as trainer_name, u.email as trainer_email,
                   g.assistant_trainers, gm.joined_at
            FROM groups g
            JOIN group_members gm ON g.id = gm.group_id
            LEFT JOIN users u ON g.trainer_id = u.id
            WHERE gm.student_id = ?
            ORDER BY gm.joined_at DESC
            LIMIT 1;
        """, (student_id,))
        group_row = cursor.fetchone()
        group_info = dict(group_row) if group_row else {
            "group_id": None,
            "group_name": "Eğitim Grubu Atanmamış",
            "department": "Genel Program",
            "group_desc": "",
            "trainer_name": "Atanmamış",
            "trainer_email": "-",
            "assistant_trainers": "-",
            "joined_at": None
        }

        # Yardımcı Eğitmen ID girilmişse ismini çözümle
        if group_row and group_row['assistant_trainers']:
            raw_ast = str(group_row['assistant_trainers']).strip()
            id_parts = [p.strip() for p in raw_ast.split(',') if p.strip().isdigit()]
            if id_parts:
                placeholders = ','.join('?' for _ in id_parts)
                cursor.execute(f"SELECT name FROM users WHERE id IN ({placeholders});", tuple(int(x) for x in id_parts))
                names = [r[0] for r in cursor.fetchall()]
                if names:
                    group_info["assistant_trainers"] = ', '.join(names)

        # 3, 4, 7. Tasks & Task History
        cursor.execute("""
            SELECT t.id as task_id, t.title, t.description, t.deadline, t.priority, 
                   COALESCE(t.estimated_time, '-') as estimated_time,
                   s.id as submission_id, COALESCE(s.status, 'Bekliyor') as submission_status, s.grade, s.submitted_at, s.feedback,
                   s.rubric_completion, s.rubric_quality, s.rubric_accuracy, s.rubric_deadline, s.rubric_communication,
                   s.original_filename as file_name,
                   CASE 
                     WHEN datetime(t.deadline) < datetime('now', 'localtime') AND (s.status IS NULL OR s.status NOT IN ('Tamamlandı', 'Kabul Edildi')) THEN 1 
                     ELSE 0 
                   END as is_late
            FROM tasks t
            LEFT JOIN submissions s ON t.id = s.task_id AND s.student_id = t.student_id
            WHERE t.student_id = ?
            ORDER BY t.deadline DESC, t.id DESC;
        """, (student_id,))
        tasks_rows = cursor.fetchall()
        
        task_history = []
        total_tasks = len(tasks_rows)
        completed_count = 0
        in_progress_count = 0
        late_count = 0
        needs_revision_count = 0
        total_grades = []

        for row in tasks_rows:
            t = dict(row)
            sub_status = t.get("submission_status")
            task_status = t.get("task_status")

            if sub_status in ['Tamamlandı', 'Kabul Edildi']:
                completed_count += 1
                if t.get("grade") is not None:
                    total_grades.append(float(t["grade"]))
            elif sub_status in ['Revizyon İstendi', 'Revizyon']:
                needs_revision_count += 1
            else:
                if t.get("is_late") == 1:
                    late_count += 1
                else:
                    in_progress_count += 1

            task_history.append(t)

        # 5. Completion Rate (Tamamlama Oranı %)
        completion_rate = round((completed_count / total_tasks * 100), 1) if total_tasks > 0 else 0.0

        # 6. Average Score (Not Ortalaması)
        avg_score = round(sum(total_grades) / len(total_grades), 1) if len(total_grades) > 0 else 0.0

        # 8. Recent Activity (Son Aktiviteler & Bildirimler)
        cursor.execute("""
            SELECT id, title, message, type, is_read, created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT 8;
        """, (student_id,))
        recent_activity = [dict(r) for r in cursor.fetchall()]

        return {
            "student_info": student_info,
            "group_info": group_info,
            "stats": {
                "total_tasks": total_tasks,
                "completed": completed_count,
                "in_progress": in_progress_count,
                "late": late_count,
                "needs_revision": needs_revision_count,
                "completion_rate": completion_rate,
                "average_score": avg_score
            },
            "task_history": task_history,
            "recent_activity": recent_activity
        }


# ==================== TOHUMLAMA (SEED DATA) ====================

def seed_database():
    """Veritabanını sıfırlamadan kontrol eder; boşsa örnek kullanıcılar, gruplar, görevler ve teslimler ekler."""
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users;")
        count = cursor.fetchone()[0]
        if count > 0:
            return

    print("Seeding initial university database with English Demo Data & Training Groups...")

    # 1. Users
    admin_id = create_user("System Administrator", "yonetici@universite.edu.tr", "Admin123!", "admin")
    
    t1_id = create_user("Prof. Ahmet Yilmaz", "ahmet.yilmaz@universite.edu.tr", "Egitmen123!", "trainer")
    t2_id = create_user("Assoc. Prof. Ayse Kaya", "ayse.kaya@universite.edu.tr", "Egitmen123!", "trainer")
    
    s1_id = create_user("Mehmet Demir", "mehmet.demir@universite.edu.tr", "Ogrenci123!", "student")
    s2_id = create_user("Zeynep Celik", "zeynep.celik@universite.edu.tr", "Ogrenci123!", "student")
    s3_id = create_user("Can Ozkan", "can.ozkan@universite.edu.tr", "Ogrenci123!", "student")
    s4_id = create_user("Elif Yildiz", "elif.yildiz@universite.edu.tr", "Ogrenci123!", "student")
    s5_id = create_user("Burak Sahin", "burak.sahin@universite.edu.tr", "Ogrenci123!", "student")

    # 2. Training Groups
    now = datetime.now()
    d_start = now.strftime("%Y-%m-%d")
    d_end = (now + timedelta(days=90)).strftime("%Y-%m-%d")

    g1_id = create_group(
        "Software Development & Algorithms - Section A",
        "Computer Science & Engineering",
        "Advanced algorithm analysis, data structures, and enterprise web architecture training group.",
        d_start, d_end, t1_id, [s1_id, s2_id, s3_id]
    )

    g2_id = create_group(
        "Cyber Security & Network Systems - Section B",
        "Information Technology & Cyber Defense",
        "Network security analysis, penetration testing, vulnerability assessment, and secure protocol design.",
        d_start, d_end, t2_id, [s4_id, s5_id]
    )

    # 3. Tasks
    d1 = (now + timedelta(days=5)).strftime("%Y-%m-%d")
    d2 = (now + timedelta(days=8)).strftime("%Y-%m-%d")
    d3 = (now + timedelta(days=12)).strftime("%Y-%m-%d")
    d4 = (now + timedelta(days=15)).strftime("%Y-%m-%d")
    d5 = (now + timedelta(days=20)).strftime("%Y-%m-%d")

    task1 = create_task(
        "Data Structures: Binary Search Tree (BST) Implementation",
        "Implement a self-balancing binary search tree (AVL/BST) in Python or C++. Include insertion, deletion, lookup operations, and full time complexity analysis in your report.",
        d1, t1_id, s1_id, 'High', g1_id
    )

    task2 = create_task(
        "Web Programming: RESTful API & JWT Authentication",
        "Develop a secure REST API providing user registration, login, and token-based session management. Include complete API documentation and Postman collection.",
        d2, t1_id, s2_id, 'Medium', g1_id
    )

    task3 = create_task(
        "Artificial Intelligence: Image Classification with CNN",
        "Train a Convolutional Neural Network (CNN) on MNIST/CIFAR-10 achieving 90%+ test accuracy. Submit test evaluation metrics and ROC curves.",
        d3, t2_id, s3_id, 'Medium', g1_id
    )

    task4 = create_task(
        "Database Management: E-Commerce Relational Schema Design & SQL Optimization",
        "Design a 3NF normalized relational database schema for an enterprise e-commerce platform. Include index optimization and query execution plans.",
        d4, t2_id, s4_id, 'Medium', g2_id
    )

    task5 = create_task(
        "Mobile Application: Cross-Platform Task Tracker UI with Flutter",
        "Design and build a responsive mobile task tracking user interface using Flutter and clean state management.",
        d5, t1_id, s5_id, 'Urgent', g2_id
    )


def create_project(name: str, code: str, description: str = None, group_id: int = None,
                   manager_id: int = None, start_date: str = None, end_date: str = None,
                   budget: float = 0.0, status: str = 'Active'):
    """Section 24.1: Yeni Proje Oluşturma (projects)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM projects WHERE code = ?;", (code,))
        existing = cursor.fetchone()
        if existing:
            return existing[0]
        cursor.execute("""
            INSERT INTO projects (name, code, description, group_id, manager_id, start_date, end_date, budget, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (name, code, description, group_id, manager_id, start_date, end_date, budget, status))
        conn.commit()
        return cursor.lastrowid


def get_all_projects(group_id: int = None, status: str = None, search: str = None):
    """Section 24.1: Tüm Projeleri Listeleme."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        query = """
            SELECT p.*, g.name as group_name, u.name as manager_name,
                   (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as members_count,
                   (SELECT COUNT(*) FROM project_tasks pt WHERE pt.project_id = p.id) as tasks_count
            FROM projects p
            LEFT JOIN training_groups g ON p.group_id = g.id
            LEFT JOIN users u ON p.manager_id = u.id
            WHERE 1=1
        """
        params = []
        if group_id and str(group_id) != 'all':
            query += " AND p.group_id = ?"
            params.append(int(group_id))
        if status and status != 'all':
            query += " AND p.status = ?"
            params.append(status)
        if search:
            query += " AND (p.name LIKE ? OR p.code LIKE ? OR p.description LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

        query += " ORDER BY p.id DESC;"
        cursor.execute(query, tuple(params))
        return [dict(r) for r in cursor.fetchall()]


def get_project_by_id(project_id: int):
    """Section 24.1 & 24.2 & 24.3: Tekil Proje Detayı, Üyeleri ve Görevleri."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.*, g.name as group_name, u.name as manager_name
            FROM projects p
            LEFT JOIN training_groups g ON p.group_id = g.id
            LEFT JOIN users u ON p.manager_id = u.id
            WHERE p.id = ?;
        """, (project_id,))
        proj_row = cursor.fetchone()
        if not proj_row:
            return None
        project = dict(proj_row)

        # Üyeler (project_members)
        cursor.execute("""
            SELECT pm.*, u.name as user_name, u.email as user_email, u.role as user_role
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = ?
            ORDER BY pm.id ASC;
        """, (project_id,))
        project['members'] = [dict(m) for m in cursor.fetchall()]

        # Görevler (project_tasks)
        cursor.execute("""
            SELECT pt.*, t.title as task_title, t.deadline as task_deadline, t.priority as task_priority
            FROM project_tasks pt
            JOIN tasks t ON pt.task_id = t.id
            WHERE pt.project_id = ?
            ORDER BY pt.order_num ASC, pt.id ASC;
        """, (project_id,))
        project['tasks'] = [dict(t) for t in cursor.fetchall()]

        return project


def add_project_member(project_id: int, user_id: int, role_in_project: str = 'Member'):
    """Section 24.2: Projeye Üye Ekleme (project_members)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO project_members (project_id, user_id, role_in_project)
            VALUES (?, ?, ?);
        """, (project_id, user_id, role_in_project))
        conn.commit()
        return cursor.lastrowid


def assign_task_to_project(project_id: int, task_id: int, milestone: str = None, weight: float = 1.0, order_num: int = 1):
    """Section 24.3: Projeye Görev / Kilometre Taşı Eşleştirme (project_tasks)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO project_tasks (project_id, task_id, milestone, weight, order_num)
            VALUES (?, ?, ?, ?, ?);
        """, (project_id, task_id, milestone, weight, order_num))
        conn.commit()
        return cursor.lastrowid


# 2. Tags (Etiketler ve Kategorizasyon)
def create_tag(name: str, color: str = '#2563EB', category: str = 'general'):
    """Section 24.4: Yeni Etiket Oluşturma (tags)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM tags WHERE name = ?;", (name.strip(),))
        row = cursor.fetchone()
        if row:
            return row[0]
        cursor.execute("""
            INSERT INTO tags (name, color, category)
            VALUES (?, ?, ?);
        """, (name.strip(), color, category))
        conn.commit()
        return cursor.lastrowid


def get_all_tags():
    """Section 24.4: Tüm Etiketleri Getirme (tags)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT t.*, (SELECT COUNT(*) FROM task_tags tt WHERE tt.tag_id = t.id) as tasks_count
            FROM tags t
            ORDER BY t.name ASC;
        """)
        return [dict(r) for r in cursor.fetchall()]


def add_tag_to_task(task_id: int, tag_id: int):
    """Section 24.5: Göreve Etiket Ekleme (task_tags)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?);", (task_id, tag_id))
        conn.commit()
        return True


def remove_tag_from_task(task_id: int, tag_id: int):
    """Section 24.5: Görevden Etiket Kaldırma (task_tags)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?;", (task_id, tag_id))
        conn.commit()
        return cursor.rowcount > 0


def get_task_tags(task_id: int):
    """Section 24.5: Görevin Etiketlerini Getirme (task_tags)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT t.* FROM tags t
            JOIN task_tags tt ON t.id = tt.tag_id
            WHERE tt.task_id = ?
            ORDER BY t.name ASC;
        """, (task_id,))
        return [dict(r) for r in cursor.fetchall()]


# 3. Task Dependencies (Görev Bağımlılıkları & Gantt Ön Koşulları)
def add_task_dependency(task_id: int, depends_on_task_id: int, dependency_type: str = 'FS'):
    """Section 24.6: Görev Ön Koşul Bağımlılığı Tanımlama (task_dependencies)."""
    if task_id == depends_on_task_id:
        return False
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO task_dependencies (task_id, depends_on_task_id, dependency_type)
            VALUES (?, ?, ?);
        """, (task_id, depends_on_task_id, dependency_type))
        conn.commit()
        return cursor.lastrowid


def get_task_dependencies(task_id: int):
    """Section 24.6: Görevin Bağımlı Olduğu Ön Koşul Görevleri Listeleme."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT td.*, t.title as prerequisite_task_title, t.deadline as prerequisite_deadline
            FROM task_dependencies td
            JOIN tasks t ON td.depends_on_task_id = t.id
            WHERE td.task_id = ?;
        """, (task_id,))
        return [dict(r) for r in cursor.fetchall()]


def check_task_dependencies_met(task_id: int, student_id: int):
    """Section 24.6: Öğrencinin bu göreve başlamadan önce ön koşul görevleri tamamlayıp tamamlamadığını doğrular."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT td.depends_on_task_id, t.title
            FROM task_dependencies td
            JOIN tasks t ON td.depends_on_task_id = t.id
            WHERE td.task_id = ?
            AND NOT EXISTS (
                SELECT 1 FROM submissions s
                WHERE s.task_id = td.depends_on_task_id
                AND s.student_id = ?
                AND s.status IN ('Tamamlandı', 'Kabul Edildi')
            );
        """, (task_id, student_id))
        unmet = [dict(r) for r in cursor.fetchall()]
        return {
            "can_start": len(unmet) == 0,
            "unmet_prerequisites": unmet
        }


# 4. Task Checklists & Items (Görev Kontrol Listeleri ve Alt Maddeler)
def create_task_checklist(task_id: int, title: str, is_mandatory: bool = False):
    """Section 24.7: Göreve Yeni Kontrol Listesi Ekleme (task_checklists)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO task_checklists (task_id, title, is_mandatory)
            VALUES (?, ?, ?);
        """, (task_id, title, 1 if is_mandatory else 0))
        conn.commit()
        return cursor.lastrowid


def add_checklist_item(checklist_id: int, item_text: str, order_num: int = 1):
    """Section 24.8: Kontrol Listesine Alt Madde Ekleme (task_checklist_items)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO task_checklist_items (checklist_id, item_text, order_num)
            VALUES (?, ?, ?);
        """, (checklist_id, item_text, order_num))
        conn.commit()
        return cursor.lastrowid


def toggle_checklist_item(item_id: int, user_id: int = None):
    """Section 24.8: Kontrol Listesi Alt Maddesini Tamamlandı / Tamamlanmadı Olarak Değiştirme."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT is_completed FROM task_checklist_items WHERE id = ?;", (item_id,))
        row = cursor.fetchone()
        if not row:
            return None
        new_val = 0 if row['is_completed'] else 1
        completed_at = datetime.now().isoformat() if new_val == 1 else None
        completed_by = user_id if new_val == 1 else None
        cursor.execute("""
            UPDATE task_checklist_items
            SET is_completed = ?, completed_by = ?, completed_at = ?
            WHERE id = ?;
        """, (new_val, completed_by, completed_at, item_id))
        conn.commit()
        return {"id": item_id, "is_completed": bool(new_val)}


def get_task_checklists(task_id: int):
    """Section 24.7 & 24.8: Görevin Tüm Kontrol Listelerini ve Alt Maddelerini Getirme."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM task_checklists WHERE task_id = ? ORDER BY id ASC;", (task_id,))
        checklists = [dict(c) for c in cursor.fetchall()]
        for c in checklists:
            cursor.execute("""
                SELECT tci.*, u.name as completed_by_name
                FROM task_checklist_items tci
                LEFT JOIN users u ON tci.completed_by = u.id
                WHERE tci.checklist_id = ?
                ORDER BY tci.order_num ASC, tci.id ASC;
            """, (c['id'],))
            items = [dict(i) for i in cursor.fetchall()]
            c['items'] = items
            c['total_items'] = len(items)
            c['completed_items'] = sum(1 for i in items if i['is_completed'])
            c['progress_percentage'] = round((c['completed_items'] / c['total_items'] * 100), 1) if c['total_items'] > 0 else 0.0
        return checklists


# 4. Örnek Teslim Dosyaları
    def create_dummy_file(filename: str, content: str):
        filepath = UPLOADS_DIR / filename
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return str(filepath), os.path.getsize(filepath)

    f1_path, f1_size = create_dummy_file(
        "bst_veri_yapisi_mehmet_demir.py",
        "# Veri Yapıları Ödevi - Mehmet Demir\nclass BSTNode:\n    def __init__(self, key):\n        self.key = key\n        self.left = None\n        self.right = None\n\n# Başarılı implementasyon tamamlandı."
    )
    f2_path, f2_size = create_dummy_file(
        "rest_api_proje_raporu_zeynep_celik.pdf",
        "%PDF-1.4 REST API ve Kimlik Doğrulama Projesi Raporu - Zeynep Çelik - Başarıyla teslim edildi."
    )

    sub1_id = create_or_update_submission(task1, s1_id, "bst_veri_yapisi_mehmet_demir.py", "bst_veri_yapisi_mehmet_demir.py", f1_size)
    update_submission_evaluation(
        sub1_id, 
        95.0, 
        "Tebrikler Mehmet! Kod implementasyonun çok temiz ve algoritma karmaşıklık analizlerin eksiksiz. AVL dengeleme rotasyonları kusursuz çalışıyor.", 
        "Tamamlandı"
    )

    sub2_id = create_or_update_submission(task2, s2_id, "rest_api_proje_raporu_zeynep_celik.pdf", "rest_api_proje_raporu_zeynep_celik.pdf", f2_size)
    update_submission_evaluation(
        sub2_id,
        None,
        "Proje teslim alındı, kod ve güvenlik testleri gerçekleştiriliyor.",
        "İnceleniyor"
    )

    # ==================== SECTION 24: EXTENSION SEED DATA ====================
    # 1. Seed Tags (tags)
    t_python = create_tag("Python & Veri Analizi", "#3776AB", "programming")
    t_web = create_tag("Web Geliştirme (Full-Stack)", "#2563EB", "programming")
    t_db = create_tag("Veritabanı & SQL Mimarisi", "#059669", "database")
    t_ai = create_tag("Yapay Zeka & Derin Öğrenme", "#7C3AED", "ai")
    t_mobile = create_tag("Mobil Uygulama (Flutter)", "#0284C7", "mobile")
    t_capstone = create_tag("Dönem Bitirme Tezi (Capstone)", "#DC2626", "academic")
    t_urgent = create_tag("Acil & Yüksek Öncelik", "#E11D48", "priority")

    # 2. Assign Tags to Tasks (task_tags)
    add_tag_to_task(task1, t_python)
    add_tag_to_task(task1, t_db)
    add_tag_to_task(task2, t_web)
    add_tag_to_task(task2, t_db)
    add_tag_to_task(task3, t_ai)
    add_tag_to_task(task4, t_db)
    add_tag_to_task(task5, t_mobile)

    # 3. Seed Projects (projects)
    p1_id = create_project(
        name="Üniversite Görev ve Eğitim Yönetim Platformu (TTMS)",
        code="PRJ-2026-001",
        description="Öğrenci ödev teslimleri, eğitmen değerlendirmeleri ve rol bazlı yönetim sistemi.",
        group_id=g1_id,
        manager_id=t1_id,
        start_date="2026-02-01",
        end_date="2026-06-15",
        budget=15000.0,
        status="Active"
    )

    p2_id = create_project(
        name="Otonom Robotik Navigasyon ve Engel Algılama",
        code="PRJ-2026-002",
        description="ROS2 ve LiDAR tabanlı gerçek zamanlı haritalama ve rota planlama algoritması.",
        group_id=g2_id,
        manager_id=t2_id,
        start_date="2026-03-01",
        end_date="2026-07-01",
        budget=25000.0,
        status="Active"
    )

    # 4. Seed Project Members (project_members)
    add_project_member(p1_id, s1_id, "Project Leader & Backend Developer")
    add_project_member(p1_id, s2_id, "Frontend Developer & UI Designer")
    add_project_member(p1_id, t1_id, "Academic Advisor")

    add_project_member(p2_id, s3_id, "Computer Vision Engineer")
    add_project_member(p2_id, s4_id, "Embedded Systems Developer")
    add_project_member(p2_id, t2_id, "Technical Lead")

    # 5. Assign Project Tasks & Milestones (project_tasks)
    assign_task_to_project(p1_id, task1, "Milestone 1: Temel Veri Mimarisi", 25.0, 1)
    assign_task_to_project(p1_id, task2, "Milestone 2: REST API & Güvenlik", 35.0, 2)
    assign_task_to_project(p2_id, task3, "Milestone 1: CNN Görüntü İşleme", 50.0, 1)

    # 6. Seed Task Dependencies (task_dependencies)
    add_task_dependency(task2, task1, "FS") # Task 2 requires Task 1 to be finished
    add_task_dependency(task4, task1, "FS") # Task 4 requires Task 1 to be finished

    # 7. Seed Task Checklists & Items (task_checklists & task_checklist_items)
    cl1_id = create_task_checklist(task1, "Teslimat Öncesi Kod Doğrulama Kontrolü", True)
    add_checklist_item(cl1_id, "AVL Ağacı dengeli rotasyon algoritmalarını implement et", 1)
    add_checklist_item(cl1_id, "Birim testleri (Unit Tests) %90+ kapsam ile çalıştır", 2)
    add_checklist_item(cl1_id, "Bellek sızıntısı (Memory Leak) analizini tamamla", 3)
    add_checklist_item(cl1_id, "Teknik proje dokümantasyonunu PDF olarak hazırla", 4)

    cl2_id = create_task_checklist(task2, "REST API Güvenlik ve Uyumluluk Listesi", True)
    add_checklist_item(cl2_id, "Bearer Token yetkilendirme katmanını entegre et", 1)
    add_checklist_item(cl2_id, "Girdi doğrulama ve SQL Injection korumasını test et", 2)
    add_checklist_item(cl2_id, "Swagger / OpenAPI endpoint spesifikasyonunu oluştur", 3)

    print("Veritabanı başarıyla tohumlandı!")


if __name__ == "__main__":
    init_db()
    seed_database()

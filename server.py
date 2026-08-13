"""
Üniversite Görev Yönetim Sistemi - REST API Sunucusu (Backend Server)
Kimlik doğrulama, rol bazlı yetkilendirme, Eğitim Grupları (Training Groups), CRUD API uç noktaları ve dosya sunumu.
"""

import http.server
import socketserver
import json
import os
import re
import mimetypes
import secrets
import urllib.parse
from datetime import datetime
from pathlib import Path

import database as db

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
UPLOADS_DIR = BASE_DIR / "uploads"

ALLOWED_EXTENSIONS = {
    '.pdf', '.zip', '.rar', '.7z', '.tar', '.gz',
    '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.csv',
    '.txt', '.py', '.java', '.c', '.cpp', '.cs', '.js', '.ts', '.html', '.css', '.json', '.sql', '.md', '.ipynb',
    '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.heic', '.heif', '.bmp'
}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


def create_session(user: dict) -> str:
    token = secrets.token_urlsafe(32)
    db.save_session(token, user["id"])
    return token


def get_current_user_from_request(headers):
    auth_header = headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    
    if not token:
        cookie_header = headers.get("Cookie", "")
        for item in cookie_header.split(";"):
            if item.strip().startswith("auth_token="):
                token = item.strip().split("=", 1)[1]
                break

    if token:
        user = db.get_user_by_session_token(token)
        if user:
            return user, token
    return None, None


class TaskAppRequestHandler(http.server.BaseHTTPRequestHandler):
    
    def log_message(self, format, *args):
        """Özelleştirilmiş kısa log çıktısı."""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {self.command} {self.path} -> {args[0] if args else ''}")

    def send_json(self, status_code: int, data: dict):
        response_bytes = json.dumps(data, ensure_ascii=False, default=str).encode('utf-8')
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(response_bytes)

    def send_error_json(self, status_code: int, message: str, details=None):
        payload = {"success": False, "error": message}
        if details:
            payload["details"] = details
        self.send_json(status_code, payload)

    def do_OPTIONS(self):
        """CORS preflight desteği."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def parse_json_body(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length)
        return json.loads(body.decode('utf-8'))

    # ==================== GET İSTEKLERİ ====================
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 0. Direct 1-Click Demo Login via HTTP GET
        if path.startswith("/auth/demo/"):
            role_target = path[len("/auth/demo/"):].strip().lower()
            email_map = {
                "super_admin": "superadmin@universite.edu.tr",
                "superadmin": "superadmin@universite.edu.tr",
                "admin": "yonetici@universite.edu.tr",
                "administrator": "yonetici@universite.edu.tr",
                "training_manager": "egitim.muduru@universite.edu.tr",
                "manager": "egitim.muduru@universite.edu.tr",
                "trainer": "ahmet.yilmaz@universite.edu.tr",
                "assistant_trainer": "asistan.merve@universite.edu.tr",
                "student": "mehmet.demir@universite.edu.tr"
            }
            email = email_map.get(role_target, "yonetici@universite.edu.tr")
            user = db.get_user_by_email(email)
            if user:
                token = create_session(user)
                db.update_user_last_login(user["id"])
                self.send_response(302)
                self.send_header("Location", f"http://127.0.0.1:8080/?token={token}&role={user['role']}")
                self.send_header("Set-Cookie", f"auth_token={token}; Path=/; Max-Age=86400")
                self.end_headers()
                return

        # 1. API Rotaları
        if path.startswith("/api/"):
            self.handle_api_get(path, query)
            return

        # 2. Dosya İndirme / Önizleme Rotası: /uploads/<filename>
        if path.startswith("/uploads/"):
            filename = urllib.parse.unquote(path[len("/uploads/"):])
            self.serve_uploaded_file(filename)
            return

        # 3. Statik Dosyalar (HTML, CSS, JS)
        self.serve_static_file(path)

    def do_HEAD(self):
        """HEAD isteklerini destekle."""
        self.do_GET()

    def handle_api_get(self, path: str, query: dict):
        user, _ = get_current_user_from_request(self.headers)

        # Auth: /api/auth/me
        if path == "/api/auth/me":
            if not user:
                return self.send_error_json(401, "Oturum açılmamış veya oturum süresi dolmuş.")
            return self.send_json(200, {"success": True, "user": user})

        # Giriş yapılmamışsa korunan API rotaları 401 döner
        if not user:
            return self.send_error_json(401, "Bu işlem için giriş yapmalısınız.")

        # İstatistikler: /api/stats
        if path == "/api/stats":
            if user["role"] in ["super_admin", "admin", "training_manager"]:
                stats = db.get_admin_stats()
            elif user["role"] in ["trainer", "assistant_trainer"]:
                stats = db.get_trainer_stats(user["id"])
            elif user["role"] == "student":
                stats = db.get_student_stats(user["id"])
            else:
                stats = {}
            return self.send_json(200, {"success": True, "stats": stats, "role": user["role"]})

        # Section 15: Trainer Dashboard Data: /api/trainer/dashboard
        if path == "/api/trainer/dashboard":
            if user["role"] not in ["super_admin", "admin", "training_manager", "trainer", "assistant_trainer"]:
                return self.send_error_json(403, "Bu panele erişim yetkiniz bulunmuyor.")
            trainer_id = int(query.get("trainer_id", [user["id"]])[0]) if user["role"] in ["super_admin", "admin"] else user["id"]
            dashboard_data = db.get_trainer_dashboard_data(trainer_id)
            return self.send_json(200, {"success": True, "data": dashboard_data})

        # Section 16: Admin Dashboard Full Data: /api/admin/dashboard
        if path == "/api/admin/dashboard":
            if user["role"] not in ["super_admin", "admin", "training_manager"]:
                return self.send_error_json(403, "Bu işlem için yönetici yetkisi gereklidir.")
            admin_dash = db.get_admin_dashboard_full_data()
            return self.send_json(200, {"success": True, "data": admin_dash})

        # Section 17: Today's Tasks Hub: /api/tasks/today
        if path == "/api/tasks/today":
            filters = {
                "trainer_id": query.get("trainer_id", [None])[0],
                "student_id": query.get("student_id", [None])[0],
                "group_id": query.get("group_id", [None])[0],
                "status": query.get("status", ["all"])[0],
                "priority": query.get("priority", ["all"])[0],
                "search": query.get("search", [""])[0]
            }
            overview = db.get_today_tasks_overview(user["id"], user["role"], filters)
            return self.send_json(200, {"success": True, "data": overview})

        # Kullanıcı Listesi: /api/users
        if path == "/api/users":
            role_filter = query.get("role", [None])[0]
            if user["role"] in ["super_admin", "admin", "training_manager"]:
                users = db.list_users(role_filter)
                return self.send_json(200, {"success": True, "users": users})
            elif user["role"] in ["trainer", "assistant_trainer"] and role_filter == "student":
                users = db.list_users("student")
                return self.send_json(200, {"success": True, "users": users})
            else:
                return self.send_error_json(403, "Bu verilere erişim yetkiniz bulunmuyor.")

        # Tekil Kullanıcı: /api/users/<id>
        user_match = re.match(r"^/api/users/(\d+)$", path)
        if user_match:
            target_id = int(user_match.group(1))
            if user["role"] not in ["super_admin", "admin", "training_manager"] and user["id"] != target_id:
                return self.send_error_json(403, "Yetkisiz erişim.")
            target_user = db.get_user_by_id(target_id)
            if not target_user:
                return self.send_error_json(404, "Kullanıcı bulunamadı.")
            return self.send_json(200, {"success": True, "user": target_user})

        # Section 14: Öğrenci Profili (Student Profile): /api/students/<id>/profile
        student_profile_match = re.match(r"^/api/students/(\d+)/profile$", path)
        if student_profile_match:
            student_id = int(student_profile_match.group(1))
            if user["role"] == "student" and user["id"] != student_id:
                return self.send_error_json(403, "Yalnızca kendi profilinizi görüntüleyebilirsiniz.")
            profile_data = db.get_student_full_profile(student_id)
            if not profile_data:
                return self.send_error_json(404, "Öğrenci profili bulunamadı.")
            return self.send_json(200, {"success": True, "profile": profile_data})

        # Eğitim Grupları: /api/groups
        if path == "/api/groups":
            if user["role"] in ["super_admin", "admin", "training_manager"]:
                groups = db.list_groups()
            elif user["role"] in ["trainer", "assistant_trainer"]:
                groups = db.list_groups(trainer_id=user["id"])
            elif user["role"] == "student":
                groups = db.list_groups(student_id=user["id"])
            else:
                groups = []
            return self.send_json(200, {"success": True, "groups": groups})

        # Section 19: Duyuruları Listele: /api/announcements
        if path == "/api/announcements":
            search_query = query.get("search", [None])[0]
            target_filter = query.get("target", [None])[0]
            priority_filter = query.get("priority", [None])[0]
            announcements = db.get_announcements_for_user(user["id"], user["role"], search_query, target_filter, priority_filter)
            return self.send_json(200, {"success": True, "announcements": announcements})

        # Section 20: Akademik Takvim: /api/calendar
        if path == "/api/calendar":
            now = datetime.now()
            year = int(query.get("year", [now.year])[0])
            month = int(query.get("month", [now.month])[0])
            types_raw = query.get("types", [None])[0]
            types_list = [t.strip() for t in types_raw.split(",")] if types_raw else None
            group_id = query.get("group_id", [None])[0]
            calendar_data = db.get_calendar_events_for_user(user["id"], user["role"], year, month, types_list, group_id)
            return self.send_json(200, {"success": True, "calendar": calendar_data})

        # Section 21: Raporlar ve Analitik Merkezi: /api/reports
        if path == "/api/reports":
            report_type = query.get("type", ["student_performance"])[0]
            group_id = query.get("group_id", [None])[0]
            trainer_id = query.get("trainer_id", [None])[0]
            search = query.get("search", [None])[0]
            report_data = db.get_academic_reports(report_type, group_id, trainer_id, search, user["id"], user["role"])
            return self.send_json(200, {"success": True, "report": report_data})

        # Section 22: Denetim Kayıtları: /api/audit-logs (Who / What / When / IP)
        if path == "/api/audit-logs":
            if user["role"] not in ["super_admin", "admin", "training_manager"]:
                return self.send_error_json(403, "Bu işlem için yönetici yetkisi gereklidir.")
            
            category = query.get("category", [None])[0]
            action = query.get("action", [None])[0]
            actor_id = query.get("user_id", [None])[0]
            severity = query.get("severity", [None])[0]
            date_range = query.get("date_range", ["all"])[0]
            search = query.get("search", [None])[0]
            limit = int(query.get("limit", [100])[0])
            offset = int(query.get("offset", [0])[0])

            audit_data = db.get_audit_logs(category, action, actor_id, severity, date_range, search, limit, offset)
            return self.send_json(200, {"success": True, "audit": audit_data})

        # Section 23: Veritabanı Şeması Genel Bakış: /api/database/schema
        if path == "/api/database/schema":
            if user["role"] not in ["super_admin", "admin", "training_manager"]:
                return self.send_error_json(403, "Bu işlem için yönetici yetkisi gereklidir.")
            schema_meta = db.get_database_schema_overview()
            return self.send_json(200, {"success": True, "schema": schema_meta})

        # Section 23: Veritabanı Tablo Verileri Gezgini: /api/database/tables/<name>
        db_table_match = re.match(r"^/api/database/tables/([a-zA-Z0-9_]+)$", path)
        if db_table_match:
            if user["role"] not in ["super_admin", "admin", "training_manager"]:
                return self.send_error_json(403, "Bu işlem için yönetici yetkisi gereklidir.")
            table_name = db_table_match.group(1)
            search = query.get("search", [None])[0]
            limit = int(query.get("limit", [50])[0])
            offset = int(query.get("offset", [0])[0])
            table_data = db.get_table_records_browser(table_name, search, limit, offset)
            if not table_data:
                return self.send_error_json(404, "Tablo bulunamadı.")
            return self.send_json(200, {"success": True, "data": table_data})

        # ==================== SECTION 24: EXTENSION API ROUTES ====================
        # Projeler Listesi: /api/projects
        if path == "/api/projects":
            group_id = query.get("group_id", [None])[0]
            status = query.get("status", [None])[0]
            search = query.get("search", [None])[0]
            projects = db.get_all_projects(group_id, status, search)
            return self.send_json(200, {"success": True, "projects": projects})

        # Tekil Proje Detayı: /api/projects/<id>
        proj_match = re.match(r"^/api/projects/(\d+)$", path)
        if proj_match:
            project_id = int(proj_match.group(1))
            project = db.get_project_by_id(project_id)
            if not project:
                return self.send_error_json(404, "Proje bulunamadı.")
            return self.send_json(200, {"success": True, "project": project})

        # Etiketler: /api/tags
        if path == "/api/tags":
            tags = db.get_all_tags()
            return self.send_json(200, {"success": True, "tags": tags})

        # Görev Kontrol Listesi: /api/tasks/<id>/checklists
        task_cl_match = re.match(r"^/api/tasks/(\d+)/checklists$", path)
        if task_cl_match:
            task_id = int(task_cl_match.group(1))
            checklists = db.get_task_checklists(task_id)
            return self.send_json(200, {"success": True, "checklists": checklists})

        # Görev Bağımlılıkları: /api/tasks/<id>/dependencies
        task_dep_match = re.match(r"^/api/tasks/(\d+)/dependencies$", path)
        if task_dep_match:
            task_id = int(task_dep_match.group(1))
            deps = db.get_task_dependencies(task_id)
            return self.send_json(200, {"success": True, "dependencies": deps})

        # Section 26.29: Sistem Ayarları: /api/settings
        if path == "/api/settings":
            if user["role"] not in ["super_admin", "admin", "training_manager"]:
                return self.send_error_json(403, "Ayar yönetimi için yönetici yetkisi gereklidir.")
            settings = db.get_all_settings()
            return self.send_json(200, {"success": True, "settings": settings})

        # Tekil Grup Detayı: /api/groups/<id>
        group_match = re.match(r"^/api/groups/(\d+)$", path)
        if group_match:
            group_id = int(group_match.group(1))
            group = db.get_group_by_id(group_id)
            if not group:
                return self.send_error_json(404, "Grup bulunamadı.")
            return self.send_json(200, {"success": True, "group": group})

        # Görevler: /api/tasks
        if path == "/api/tasks":
            if user["role"] == "admin":
                tasks = db.list_tasks()
            elif user["role"] == "trainer":
                tasks = db.list_tasks(trainer_id=user["id"])
            elif user["role"] == "student":
                tasks = db.list_tasks(student_id=user["id"])
            else:
                tasks = []
            return self.send_json(200, {"success": True, "tasks": tasks})

        # Tekil Görev Detayı: /api/tasks/<id>
        task_match = re.match(r"^/api/tasks/(\d+)$", path)
        if task_match:
            task_id = int(task_match.group(1))
            task = db.get_task_by_id(task_id)
            if not task:
                return self.send_error_json(404, "Görev bulunamadı.")
            if user["role"] == "student" and task["student_id"] != user["id"]:
                return self.send_error_json(403, "Bu görevi görüntüleme yetkiniz yok.")
            if user["role"] == "trainer" and task["trainer_id"] != user["id"]:
                return self.send_error_json(403, "Bu görevi görüntüleme yetkiniz yok.")
            
            # Öğrenci görevi açtığında durumu otomatik 'Görüntülendi' (Viewed) yap
            return self.send_json(200, {"success": True, "task": task})

        # Section 10: Görev Yorumlarını Getir: /api/tasks/<id>/comments
        comments_get_match = re.match(r"^/api/tasks/(\d+)/comments$", path)
        if comments_get_match:
            task_id = int(comments_get_match.group(1))
            return self.send_json(200, {
                "success": True,
                "comments": db.get_task_comments(task_id)
            })

        # Teslimler: /api/submissions
        if path == "/api/submissions":
            if user["role"] == "admin":
                submissions = db.list_submissions()
            elif user["role"] == "trainer":
                submissions = db.list_submissions(trainer_id=user["id"])
            elif user["role"] == "student":
                submissions = db.list_submissions(student_id=user["id"])
            else:
                submissions = []
            return self.send_json(200, {"success": True, "submissions": submissions})

        # Tekil Teslim: /api/submissions/<id>
        sub_match = re.match(r"^/api/submissions/(\d+)$", path)
        if sub_match:
            sub_id = int(sub_match.group(1))
            sub = db.get_submission_by_id(sub_id)
            if not sub:
                return self.send_error_json(404, "Teslim bulunamadı.")
            if user["role"] == "student" and sub["student_id"] != user["id"]:
                return self.send_error_json(403, "Yetkisiz erişim.")
            if user["role"] == "trainer" and sub["trainer_id"] != user["id"]:
                return self.send_error_json(403, "Yetkisiz erişim.")
            return self.send_json(200, {"success": True, "submission": sub})

        # Bildirimler: /api/notifications
        if path == "/api/notifications":
            if user["role"] == "student":
                db.check_and_notify_task_deadlines(user["id"])
            notifications = db.list_notifications(user["id"])
            return self.send_json(200, {"success": True, "notifications": notifications})

        # Section 12: Roller ve İzinler Matrisi: /api/roles/permissions
        if path == "/api/roles/permissions":
            if user["role"] not in ["super_admin", "admin", "training_manager"]:
                return self.send_error_json(403, "Bu veriyi görüntülemek için yetkiniz bulunmamaktadır.")
            matrix_data = db.get_all_roles_permissions_matrix()
            return self.send_json(200, {
                "success": True,
                "data": matrix_data
            })

        return self.send_error_json(404, "API uç noktası bulunamadı.")

    # ==================== POST İSTEKLERİ ====================
    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # 1. Giriş Yap (Login): /api/auth/login
        if path == "/api/auth/login":
            try:
                data = self.parse_json_body()
                email = data.get("email", "").strip()
                password = data.get("password", "").strip()

                if not email or not password:
                    return self.send_error_json(400, "Lütfen e-posta ve şifrenizi giriniz.")

                user = db.get_user_by_email(email)
                if not user or not db.verify_password(password, user["password"]):
                    return self.send_error_json(401, "Geçersiz e-posta veya şifre.")

                token = create_session(user)
                db.update_user_last_login(user["id"])
                
                db.log_audit_event(
                    action="AUTH_LOGIN",
                    category="auth",
                    description=f"Kullanıcı başarıyla oturum açtı: {user['name']} ({user['role']})",
                    user_id=user["id"],
                    user_name=user["name"],
                    user_role=user["role"],
                    user_email=user["email"],
                    ip_address=self.client_address[0] if hasattr(self, 'client_address') else '127.0.0.1',
                    severity="info"
                )

                user_info = {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "role": user["role"]
                }
                return self.send_json(200, {
                    "success": True,
                    "message": "Giriş başarılı.",
                    "token": token,
                    "user": user_info
                })
            except Exception as e:
                return self.send_error_json(500, f"Giriş sırasında bir hata oluştu: {str(e)}")

        # 2. Çıkış Yap (Logout): /api/auth/logout
        if path == "/api/auth/logout":
            user, token = get_current_user_from_request(self.headers)
            if token:
                db.delete_session(token)
            return self.send_json(200, {"success": True, "message": "Başarıyla çıkış yapıldı."})

        # Giriş Kontrolü
        user, _ = get_current_user_from_request(self.headers)
        if not user:
            return self.send_error_json(401, "Bu işlem için giriş yapmalısınız.")

        # 3. Dosya Yükleme & Görevi Teslim Et: /api/submissions/upload (Multipart Form)
        if path == "/api/submissions/upload":
            return self.handle_multipart_upload(user)

        # 4. Değerlendirme Kaydet (Trainer / Admin): /api/submissions/<id>/review
        review_match = re.match(r"^/api/submissions/(\d+)/review$", path)
        if review_match:
            sub_id = int(review_match.group(1))
            if user["role"] not in ["super_admin", "admin", "training_manager", "trainer", "assistant_trainer"]:
                return self.send_error_json(403, "Yalnızca eğitmenler ve yöneticiler değerlendirme yapabilir.")
            
            sub = db.get_submission_by_id(sub_id)
            if not sub:
                return self.send_error_json(404, "Değerlendirilecek teslim bulunamadı.")
            
            if user["role"] in ["trainer", "assistant_trainer"] and sub["trainer_id"] != user["id"]:
                return self.send_error_json(403, "Bu ödevi değerlendirme yetkiniz bulunmuyor.")

            data = self.parse_json_body()
            grade_raw = data.get("grade")
            feedback = data.get("feedback", "").strip()
            status = data.get("status", "Tamamlandı")
            
            # Section 9: Rubric Kriterleri (100 Puanlık Model)
            rubric_completion = data.get("rubric_completion")
            rubric_quality = data.get("rubric_quality")
            rubric_accuracy = data.get("rubric_accuracy")
            rubric_deadline = data.get("rubric_deadline")
            rubric_communication = data.get("rubric_communication")

            # Eğer rubrik puanları gönderildiyse toplam notu otomatik hesapla
            if rubric_completion is not None or rubric_quality is not None or rubric_accuracy is not None:
                try:
                    c = float(rubric_completion or 0)
                    q = float(rubric_quality or 0)
                    a = float(rubric_accuracy or 0)
                    d = float(rubric_deadline or 0)
                    m = float(rubric_communication or 0)
                    grade = min(100.0, max(0.0, c + q + a + d + m))
                except (ValueError, TypeError):
                    grade = None
            else:
                grade = None
                if grade_raw is not None and str(grade_raw).strip() != "":
                    try:
                        grade = float(grade_raw)
                        if grade < 0 or grade > 100:
                            return self.send_error_json(400, "Not 0 ile 100 arasında olmalıdır.")
                    except ValueError:
                        return self.send_error_json(400, "Geçerli bir sayısal not giriniz.")

            valid_statuses = ["Tamamlandı", "Düzeltme İstendi", "Reddedildi", "İnceleniyor", "Completed", "Needs Revision", "Reject", "Rejected"]
            if status not in valid_statuses:
                status = "Tamamlandı" if grade is not None else "İnceleniyor"

            updated = db.update_submission_evaluation(
                sub_id, grade, feedback, status,
                rubric_completion, rubric_quality, rubric_accuracy, rubric_deadline, rubric_communication
            )
            if updated:
                return self.send_json(200, {
                    "success": True,
                    "message": "Değerlendirme başarıyla kaydedildi ve öğrenciye otomatik bildirim iletildi.",
                    "submission": db.get_submission_by_id(sub_id)
                })
            else:
                return self.send_error_json(500, "Değerlendirme kaydedilirken bir hata oluştu.")

        # Bildirim Okundu Yap: /api/notifications/<id>/read
        notif_read_match = re.match(r"^/api/notifications/(\d+)/read$", path)
        if notif_read_match:
            notif_id = int(notif_read_match.group(1))
            db.mark_notification_as_read(notif_id, user["id"])
            return self.send_json(200, {"success": True})

        # Tüm Bildirimleri Okundu Yap: /api/notifications/read-all
        if path == "/api/notifications/read-all":
            db.mark_all_notifications_as_read(user["id"])
            return self.send_json(200, {"success": True})

        # Section 24: Kontrol Listesi Maddesi Durum Değiştir: /api/checklists/items/<id>/toggle
        cl_toggle_match = re.match(r"^/api/checklists/items/(\d+)/toggle$", path)
        if cl_toggle_match:
            item_id = int(cl_toggle_match.group(1))
            res = db.toggle_checklist_item(item_id, user["id"])
            if not res:
                return self.send_error_json(404, "Kontrol listesi maddesi bulunamadı.")
            return self.send_json(200, {"success": True, "item": res})

        # Section 24: Yeni Proje Oluştur: /api/projects
        if path == "/api/projects":
            if user["role"] not in ["super_admin", "admin", "training_manager", "trainer"]:
                return self.send_error_json(403, "Proje oluşturma yetkiniz bulunmamaktadır.")
            data = self.parse_json_body()
            name = data.get("name", "").strip()
            code = data.get("code", "").strip()
            if not name or not code:
                return self.send_error_json(400, "Proje adı ve kodu zorunludur.")
            proj_id = db.create_project(
                name, code, data.get("description"), data.get("group_id"),
                user["id"], data.get("start_date"), data.get("end_date"),
                float(data.get("budget", 0.0)), data.get("status", "Active")
            )
            return self.send_json(201, {"success": True, "project_id": proj_id})

        # Section 24: Yeni Etiket Oluştur: /api/tags
        if path == "/api/tags":
            if user["role"] not in ["super_admin", "admin", "training_manager", "trainer"]:
                return self.send_error_json(403, "Etiket oluşturma yetkiniz bulunmamaktadır.")
            data = self.parse_json_body()
            tag_name = data.get("name", "").strip()
            if not tag_name:
                return self.send_error_json(400, "Etiket adı zorunludur.")
            tag_id = db.create_tag(tag_name, data.get("color", "#2563EB"), data.get("category", "general"))
            return self.send_json(201, {"success": True, "tag_id": tag_id})

        # Section 26.29: Sistem Ayarlarını Güncelle: /api/settings
        if path == "/api/settings":
            if user["role"] not in ["super_admin", "admin", "training_manager"]:
                return self.send_error_json(403, "Ayar güncelleme için yönetici yetkisi gereklidir.")
            data = self.parse_json_body()
            settings_dict = data.get("settings", {})
            for k, v in settings_dict.items():
                db.update_system_setting(k, str(v), user["id"])
            
            # Audit log
            client_ip = self.client_address[0] if hasattr(self, 'client_address') and self.client_address else '127.0.0.1'
            db.log_audit_event(
                user_id=user["id"],
                user_name=user["name"],
                user_role=user["role"],
                user_email=user["email"],
                action="SETTINGS_UPDATED",
                category="system",
                entity_type="settings",
                description=f"Sistem ayarları {user['name']} tarafından güncellendi.",
                new_values=settings_dict,
                ip_address=client_ip,
                severity="info"
            )
            return self.send_json(200, {"success": True, "message": "Ayarlar başarıyla güncellendi."})

        # Section 19: Yeni Duyuru Yayınla (Admin veya Trainer): /api/announcements
        if path == "/api/announcements":
            if user["role"] not in ["super_admin", "admin", "training_manager", "trainer", "assistant_trainer"]:
                return self.send_error_json(403, "Yalnızca yönetici ve eğitmenler duyuru yayınlayabilir.")

            data = self.parse_json_body()
            title = data.get("title", "").strip()
            message = data.get("message", "").strip()
            target_type = data.get("target_type", "all_users").strip()
            target_group_id = data.get("target_group_id")
            target_student_ids = data.get("target_student_ids", [])
            priority = data.get("priority", "Normal").strip()
            is_pinned = int(data.get("is_pinned", 0))

            if not title or not message:
                return self.send_error_json(400, "Duyuru başlığı ve mesajı zorunludur.")

            VALID_TARGETS = ["all_users", "all_students", "all_trainers", "specific_group", "specific_students"]
            if target_type not in VALID_TARGETS:
                return self.send_error_json(400, "Geçersiz hedef kitle türü.")

            if target_type == "specific_group" and not target_group_id:
                return self.send_error_json(400, "Lütfen bir eğitim grubu seçin.")

            if target_type == "specific_students" and not target_student_ids:
                return self.send_error_json(400, "Lütfen en az bir öğrenci seçin.")

            try:
                announcement_id, recipient_count = db.create_announcement(
                    author_id=user["id"],
                    title=title,
                    message=message,
                    target_type=target_type,
                    target_group_id=int(target_group_id) if target_group_id else None,
                    target_student_ids=target_student_ids,
                    priority=priority,
                    is_pinned=is_pinned
                )

                return self.send_json(201, {
                    "success": True,
                    "message": f"Duyuru başarıyla yayınlandı ve {recipient_count} kişiye iletildi.",
                    "announcement_id": announcement_id
                })
            except Exception as e:
                return self.send_error_json(400, f"Duyuru oluşturulamadı: {str(e)}")

        # Section 19: Pin/Unpin Duyuru: /api/announcements/<id>/pin
        pin_match = re.match(r"^/api/announcements/(\d+)/pin$", path)
        if pin_match:
            ann_id = int(pin_match.group(1))
            res = db.toggle_pin_announcement(ann_id, user["id"], user["role"])
            if not res:
                return self.send_error_json(403, "Bu işlem için yetkiniz yok veya duyuru bulunamadı.")
            return self.send_json(200, {"success": True, "message": "Duyuru sabitleme durumu güncellendi."})

        # Section 20: Yeni Takvim Öğesi Ekle (Admin veya Trainer): /api/calendar
        if path == "/api/calendar":
            if user["role"] not in ["super_admin", "admin", "training_manager", "trainer", "assistant_trainer"]:
                return self.send_error_json(403, "Yalnızca yönetici ve eğitmenler takvime öğe ekleyebilir.")

            data = self.parse_json_body()
            title = data.get("title", "").strip()
            description = data.get("description", "").strip()
            event_type = data.get("event_type", "events").strip()
            event_date = data.get("event_date", "").strip()
            start_time = data.get("start_time", "").strip() or None
            end_time = data.get("end_time", "").strip() or None
            location = data.get("location", "").strip() or None
            group_id = data.get("group_id")
            target_scope = data.get("target_scope", "all_users").strip()

            if not title or not event_date or not event_type:
                return self.send_error_json(400, "Başlık, etkinlik türü ve tarih zorunludur.")

            try:
                event_id = db.create_calendar_event(
                    organizer_id=user["id"],
                    title=title,
                    description=description,
                    event_type=event_type,
                    event_date=event_date,
                    start_time=start_time,
                    end_time=end_time,
                    location=location,
                    group_id=int(group_id) if group_id else None,
                    target_scope=target_scope
                )
                return self.send_json(201, {
                    "success": True,
                    "message": "Takvim öğesi başarıyla oluşturuldu.",
                    "event_id": event_id
                })
            except Exception as e:
                return self.send_error_json(400, f"Takvim öğesi oluşturulamadı: {str(e)}")

        # 5. Kullanıcı Ekle (Admin / Super Admin / Training Manager): /api/users
        if path == "/api/users":
            if user["role"] not in ["super_admin", "admin", "training_manager"]:
                return self.send_error_json(403, "Bu işlem için yönetici yetkisi gereklidir.")
            
            data = self.parse_json_body()
            name = data.get("name", "").strip()
            email = data.get("email", "").strip()
            password = data.get("password", "").strip()
            role = data.get("role", "").strip().lower()

            if not name or not email or not password or not role:
                return self.send_error_json(400, "Tüm alanlar zorunludur.")

            VALID_ROLES = ["super_admin", "admin", "training_manager", "trainer", "assistant_trainer", "student"]
            if role not in VALID_ROLES:
                return self.send_error_json(400, "Geçersiz kullanıcı rolü. Desteklenen roller: Super Admin, Admin, Training Manager, Trainer, Assistant Trainer, Student.")

            if db.get_user_by_email(email):
                return self.send_error_json(400, "Bu e-posta adresi zaten kullanımda.")

            new_user_id = db.create_user(name, email, password, role)
            return self.send_json(201, {
                "success": True,
                "message": "Kullanıcı başarıyla oluşturuldu.",
                "user": db.get_user_by_id(new_user_id)
            })

        # 6. Eğitim Grubu Ekle (Admin veya Trainer): /api/groups
        if path == "/api/groups":
            if user["role"] not in ["super_admin", "admin", "training_manager", "trainer"]:
                return self.send_error_json(403, "Yalnızca yöneticiler ve eğitmenler grup oluşturabilir.")

            data = self.parse_json_body()
            name = data.get("name", "").strip()
            department = data.get("department", "").strip()
            description = data.get("description", "").strip()
            start_date = data.get("start_date", "").strip()
            end_date = data.get("end_date", "").strip()
            status = data.get("status", "Active").strip()
            assistant_trainers = data.get("assistant_trainers", "").strip() or None
            trainer_id = int(data.get("trainer_id") or user["id"])
            student_ids = data.get("student_ids", [])

            if not name or not department:
                return self.send_error_json(400, "Grup adı ve bölüm/uzmanlık alanı zorunludur.")

            group_id = db.create_group(name, department, description, start_date, end_date, trainer_id, student_ids, status, assistant_trainers)
            return self.send_json(201, {
                "success": True,
                "message": "Eğitim grubu başarıyla oluşturuldu.",
                "group": db.get_group_by_id(group_id)
            })

        # 7. Gruba Toplu Görev Ata: /api/tasks/group
        if path == "/api/tasks/group":
            if user["role"] not in ["super_admin", "admin", "training_manager", "trainer", "assistant_trainer"]:
                return self.send_error_json(403, "Yetkiniz bulunmuyor.")

            data = self.parse_json_body()
            title = data.get("title", "").strip()
            description = data.get("description", "").strip()
            instructions = data.get("instructions", "").strip() or None
            start_date = data.get("start_date", "").strip() or None
            deadline = data.get("deadline", "").strip()
            priority = data.get("priority", "Normal")
            estimated_time = data.get("estimated_time", "").strip() or None
            group_id = data.get("group_id")
            attachment_url = data.get("attachment_url", "").strip() or None
            attachment_file = data.get("attachment_file", "").strip() or None
            trainer_id = int(data.get("trainer_id") or user["id"])

            if not title or not description or not deadline or not group_id:
                return self.send_error_json(400, "Lütfen başlık, açıklama, tarih ve grup seçimini yapınız.")

            created_ids = db.assign_task_to_group(title, description, deadline, trainer_id, int(group_id), priority, attachment_url, attachment_file, instructions, start_date, estimated_time)
            return self.send_json(201, {
                "success": True,
                "message": f"Görev gruptaki {len(created_ids)} öğrenciye başarıyla atandı.",
                "count": len(created_ids)
            })

        # 8. Tekil Görev Oluştur (Admin veya Trainer): /api/tasks
        if path == "/api/tasks":
            if user["role"] not in ["super_admin", "admin", "training_manager", "trainer", "assistant_trainer"]:
                return self.send_error_json(403, "Yalnızca yöneticiler ve eğitmenler görev oluşturabilir.")

            data = self.parse_json_body()
            title = data.get("title", "").strip()
            description = data.get("description", "").strip()
            instructions = data.get("instructions", "").strip() or None
            start_date = data.get("start_date", "").strip() or None
            deadline = data.get("deadline", "").strip()
            priority = data.get("priority", "Normal")
            estimated_time = data.get("estimated_time", "").strip() or None
            group_id = data.get("group_id")
            attachment_url = data.get("attachment_url", "").strip() or None
            attachment_file = data.get("attachment_file", "").strip() or None
            trainer_id = data.get("trainer_id") or (user["id"] if user["role"] == "trainer" else None)
            student_id = data.get("student_id")

            if not title or not description or not deadline or not trainer_id or not student_id:
                return self.send_error_json(400, "Lütfen tüm görev alanlarını eksiksiz doldurunuz.")

            try:
                trainer_id = int(trainer_id)
                student_id = int(student_id)
                group_id = int(group_id) if group_id else None
            except ValueError:
                return self.send_error_json(400, "Geçersiz eğitmen veya öğrenci seçimi.")

            trainer = db.get_user_by_id(trainer_id)
            student = db.get_user_by_id(student_id)
            if not trainer or trainer["role"] != "trainer":
                return self.send_error_json(400, "Seçilen eğitmen bulunamadı veya rolü eğitmen değil.")
            if not student or student["role"] != "student":
                return self.send_error_json(400, "Seçilen öğrenci bulunamadı veya rolü öğrenci değil.")

            task_id = db.create_task(title, description, deadline, trainer_id, student_id, priority, group_id, attachment_url, attachment_file, instructions, start_date, estimated_time)
            return self.send_json(201, {
                "success": True,
                "message": "Görev başarıyla oluşturuldu ve atandı.",
                "task": db.get_task_by_id(task_id)
            })

        # 9. Göreve Başla (In Progress / Devam Ediyor): /api/tasks/<id>/start
        start_match = re.match(r"^/api/tasks/(\d+)/start$", path)
        if start_match:
            task_id = int(start_match.group(1))
            task = db.get_task_by_id(task_id)
            if not task:
                return self.send_error_json(404, "Görev bulunamadı.")
            if user["role"] == "student" and task["student_id"] != user["id"]:
                return self.send_error_json(403, "Bu görevi başlatma yetkiniz yok.")
            
            db.set_task_in_progress(task_id, task["student_id"])
            return self.send_json(200, {
                "success": True,
                "message": "Görev durumu 'Devam Ediyor' olarak güncellendi.",
                "task": db.get_task_by_id(task_id)
            })

        # Section 10: Görev İçi Yorum Ekle: /api/tasks/<id>/comments
        comment_post_match = re.match(r"^/api/tasks/(\d+)/comments$", path)
        if comment_post_match:
            task_id = int(comment_post_match.group(1))
            task = db.get_task_by_id(task_id)
            if not task:
                return self.send_error_json(404, "Görev bulunamadı.")
            
            data = self.parse_json_body()
            content = str(data.get("content") or "").strip()
            attachment_file = str(data.get("attachment_file") or "").strip() or None
            attachment_url = str(data.get("attachment_url") or "").strip() or None

            if not content and not attachment_file and not attachment_url:
                return self.send_error_json(400, "Lütfen bir mesaj, dosya veya bağlantı giriniz.")

            cid = db.add_task_comment(task_id, user["id"], content, attachment_file, attachment_url)
            return self.send_json(201, {
                "success": True,
                "message": "Yorum başarıyla iletildi.",
                "comment_id": cid,
                "comments": db.get_task_comments(task_id)
            })

        return self.send_error_json(404, "API uç noktası bulunamadı.")

    # ==================== PUT İSTEKLERİ ====================
    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        user, _ = get_current_user_from_request(self.headers)
        if not user:
            return self.send_error_json(401, "Bu işlem için giriş yapmalısınız.")

        # 1. Kullanıcı Düzenle (Admin / Super Admin / Training Manager): /api/users/<id>
        user_match = re.match(r"^/api/users/(\d+)$", path)
        if user_match:
            if user["role"] not in ["super_admin", "admin", "training_manager"]:
                return self.send_error_json(403, "Bu işlem için yönetici yetkisi gereklidir.")
            
            target_id = int(user_match.group(1))
            existing_user = db.get_user_by_id(target_id)
            if not existing_user:
                return self.send_error_json(404, "Kullanıcı bulunamadı.")

            data = self.parse_json_body()
            name = data.get("name", "").strip()
            email = data.get("email", "").strip()
            role = data.get("role", "").strip().lower()
            password = data.get("password")

            VALID_ROLES = ["super_admin", "admin", "training_manager", "trainer", "assistant_trainer", "student"]
            if role not in VALID_ROLES:
                return self.send_error_json(400, "Geçersiz kullanıcı rolü.")

            user_by_email = db.get_user_by_email(email)
            if user_by_email and user_by_email["id"] != target_id:
                return self.send_error_json(400, "Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.")

            db.update_user(target_id, name, email, role, password)
            return self.send_json(200, {
                "success": True,
                "message": "Kullanıcı bilgileri başarıyla güncellendi.",
                "user": db.get_user_by_id(target_id)
            })

        # Section 12: Rol İzinlerini Güncelle: /api/roles/<role>/permissions
        role_perm_match = re.match(r"^/api/roles/([a-zA-Z0-9_-]+)/permissions$", path)
        if role_perm_match:
            if user["role"] not in ["super_admin", "admin"]:
                return self.send_error_json(403, "Yalnızca Sistem Yöneticileri rol izinlerini düzenleyebilir.")
            role_code = role_perm_match.group(1)
            data = self.parse_json_body()
            perms = data.get("permissions", [])
            db.update_role_permissions(role_code, perms)
            return self.send_json(200, {
                "success": True,
                "message": f"'{role_code}' rolünün yetkileri başarıyla güncellendi.",
                "data": db.get_all_roles_permissions_matrix()
            })

        # 2. Grup Düzenle (Admin veya ilgili Trainer): /api/groups/<id>
        group_match = re.match(r"^/api/groups/(\d+)$", path)
        if group_match:
            group_id = int(group_match.group(1))
            group = db.get_group_by_id(group_id)
            if not group:
                return self.send_error_json(404, "Grup bulunamadı.")

            if user["role"] in ["trainer", "assistant_trainer"] and group["trainer_id"] != user["id"]:
                return self.send_error_json(403, "Bu grubu düzenleme yetkiniz yok.")
            elif user["role"] not in ["super_admin", "admin", "training_manager", "trainer", "assistant_trainer"]:
                return self.send_error_json(403, "Yetkiniz bulunmuyor.")

            data = self.parse_json_body()
            name = data.get("name", group["name"]).strip()
            department = data.get("department", group["department"]).strip()
            description = data.get("description", group.get("description", "")).strip()
            start_date = data.get("start_date", group.get("start_date", ""))
            end_date = data.get("end_date", group.get("end_date", ""))
            status = data.get("status", group.get("status", "Active"))
            trainer_id = int(data.get("trainer_id", group["trainer_id"]))
            student_ids = data.get("student_ids")
            assistant_trainers = data.get("assistant_trainers", group.get("assistant_trainers", "")).strip() or None

            db.update_group(group_id, name, department, description, start_date, end_date, status, trainer_id, student_ids, assistant_trainers)
            return self.send_json(200, {
                "success": True,
                "message": "Grup bilgileri güncellendi.",
                "group": db.get_group_by_id(group_id)
            })

        # 3. Görev Düzenle (Admin veya ilgili Trainer): /api/tasks/<id>
        task_match = re.match(r"^/api/tasks/(\d+)$", path)
        if task_match:
            task_id = int(task_match.group(1))
            task = db.get_task_by_id(task_id)
            if not task:
                return self.send_error_json(404, "Görev bulunamadı.")

            if user["role"] in ["trainer", "assistant_trainer"] and task["trainer_id"] != user["id"]:
                return self.send_error_json(403, "Bu görevi düzenleme yetkiniz yok.")
            elif user["role"] not in ["super_admin", "admin", "training_manager", "trainer", "assistant_trainer"]:
                return self.send_error_json(403, "Bu işlem için yetkiniz bulunmuyor.")

            data = self.parse_json_body()
            title = data.get("title", "").strip()
            description = data.get("description", "").strip()
            deadline = data.get("deadline", "").strip()
            priority = data.get("priority", task.get("priority", "Normal"))
            attachment_url = data.get("attachment_url", "").strip() or None
            attachment_file = data.get("attachment_file", "").strip() or None
            instructions = data.get("instructions", task.get("instructions", "")).strip() or None
            start_date = data.get("start_date", task.get("start_date", "")).strip() or None
            estimated_time = data.get("estimated_time", task.get("estimated_time", "")).strip() or None
            trainer_id = int(data.get("trainer_id", task["trainer_id"]))
            student_id = int(data.get("student_id", task["student_id"]))

            if not title or not description or not deadline:
                return self.send_error_json(400, "Tüm alanlar zorunludur.")

            db.update_task(task_id, title, description, deadline, trainer_id, student_id, priority, attachment_url, attachment_file, instructions, start_date, estimated_time)
            return self.send_json(200, {
                "success": True,
                "message": "Görev başarıyla güncellendi.",
                "task": db.get_task_by_id(task_id)
            })

        return self.send_error_json(404, "API uç noktası bulunamadı.")

    # ==================== DELETE İSTEKLERİ ====================
    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        user, _ = get_current_user_from_request(self.headers)
        if not user:
            return self.send_error_json(401, "Bu işlem için giriş yapmalısınız.")

        # 1. Kullanıcı Sil: /api/users/<id>
        user_match = re.match(r"^/api/users/(\d+)$", path)
        if user_match:
            if user["role"] not in ["super_admin", "admin"]:
                return self.send_error_json(403, "Bu işlem için yönetici yetkisi gereklidir.")

            target_id = int(user_match.group(1))
            if target_id == user["id"]:
                return self.send_error_json(400, "Kendi yönetici hesabınızı silemezsiniz.")
            
            target_user = db.get_user_by_id(target_id)
            deleted = db.delete_user(target_id)
            if deleted:
                db.log_audit_event(
                    action="USER_DELETED",
                    category="users",
                    description=f"Kullanıcı silindi: ID #{target_id} ({target_user['name'] if target_user else 'Kullanıcı'}, {target_user['role'] if target_user else ''})",
                    user_id=user["id"],
                    user_name=user["name"],
                    user_role=user["role"],
                    user_email=user["email"],
                    entity_type="user",
                    entity_id=target_id,
                    old_values=dict(target_user) if target_user else None,
                    ip_address=self.client_address[0] if hasattr(self, 'client_address') else '127.0.0.1',
                    severity="critical"
                )
                return self.send_json(200, {"success": True, "message": "Kullanıcı başarıyla silindi."})
            else:
                return self.send_error_json(404, "Silinecek kullanıcı bulunamadı.")

        # 2. Grup Sil: /api/groups/<id>
        group_match = re.match(r"^/api/groups/(\d+)$", path)
        if group_match:
            if user["role"] not in ["super_admin", "admin", "training_manager"]:
                return self.send_error_json(403, "Yetkiniz bulunmuyor.")

            group_id = int(group_match.group(1))
            target_group = db.get_group_by_id(group_id)
            deleted = db.delete_group(group_id)
            if deleted:
                db.log_audit_event(
                    action="GROUP_DELETED",
                    category="groups",
                    description=f"Eğitim grubu silindi: ID #{group_id} ({target_group['name'] if target_group else 'Grup'})",
                    user_id=user["id"],
                    user_name=user["name"],
                    user_role=user["role"],
                    user_email=user["email"],
                    entity_type="group",
                    entity_id=group_id,
                    old_values=dict(target_group) if target_group else None,
                    ip_address=self.client_address[0] if hasattr(self, 'client_address') else '127.0.0.1',
                    severity="warning"
                )
                return self.send_json(200, {"success": True, "message": "Eğitim grubu başarıyla silindi."})
            else:
                return self.send_error_json(404, "Silinecek grup bulunamadı.")

        # 3. Görev Sil: /api/tasks/<id>
        task_match = re.match(r"^/api/tasks/(\d+)$", path)
        if task_match:
            task_id = int(task_match.group(1))
            task = db.get_task_by_id(task_id)
            if not task:
                return self.send_error_json(404, "Silinecek görev bulunamadı.")

            if user["role"] in ["trainer", "assistant_trainer"] and task["trainer_id"] != user["id"]:
                return self.send_error_json(403, "Bu görevi silme yetkiniz yok.")
            elif user["role"] not in ["super_admin", "admin", "training_manager", "trainer", "assistant_trainer"]:
                return self.send_error_json(403, "Bu işlem için yetkiniz bulunmuyor.")

            deleted = db.delete_task(task_id)
            if deleted:
                db.log_audit_event(
                    action="TASK_DELETED",
                    category="tasks",
                    description=f"Akademik görev silindi: #{task_id} ({task['title']})",
                    user_id=user["id"],
                    user_name=user["name"],
                    user_role=user["role"],
                    user_email=user["email"],
                    entity_type="task",
                    entity_id=task_id,
                    old_values=dict(task),
                    ip_address=self.client_address[0] if hasattr(self, 'client_address') else '127.0.0.1',
                    severity="critical"
                )
                return self.send_json(200, {"success": True, "message": "Görev başarıyla silindi."})
            else:
                return self.send_error_json(404, "Silinecek görev bulunamadı.")

        # 4. Duyuru Sil: /api/announcements/<id>
        ann_del_match = re.match(r"^/api/announcements/(\d+)$", path)
        if ann_del_match:
            ann_id = int(ann_del_match.group(1))
            res = db.delete_announcement(ann_id, user["id"], user["role"])
            if not res:
                return self.send_error_json(403, "Bu duyuruyu silme yetkiniz bulunmamaktadır.")
            db.log_audit_event(
                action="ANNOUNCEMENT_DELETED",
                category="announcements",
                description=f"Duyuru silindi: ID #{ann_id}",
                user_id=user["id"],
                user_name=user["name"],
                user_role=user["role"],
                user_email=user["email"],
                entity_type="announcement",
                entity_id=ann_id,
                ip_address=self.client_address[0] if hasattr(self, 'client_address') else '127.0.0.1',
                severity="info"
            )
            return self.send_json(200, {"success": True, "message": "Duyuru başarıyla silindi."})

        # 5. Takvim Öğesi Sil: /api/calendar/<id>
        cal_del_match = re.match(r"^/api/calendar/(\d+)$", path)
        if cal_del_match:
            cal_id = int(cal_del_match.group(1))
            res = db.delete_calendar_event(cal_id, user["id"], user["role"])
            if not res:
                return self.send_error_json(403, "Bu takvim öğesini silme yetkiniz bulunmamaktadır.")
            db.log_audit_event(
                action="CALENDAR_EVENT_DELETED",
                category="calendar",
                description=f"Takvim öğesi silindi: ID #{cal_id}",
                user_id=user["id"],
                user_name=user["name"],
                user_role=user["role"],
                user_email=user["email"],
                entity_type="calendar_event",
                entity_id=cal_id,
                ip_address=self.client_address[0] if hasattr(self, 'client_address') else '127.0.0.1',
                severity="info"
            )
            return self.send_json(200, {"success": True, "message": "Takvim öğesi başarıyla silindi."})

        return self.send_error_json(404, "API uç noktası bulunamadı.")

    # ==================== MULTIPART FORM DOSYA YÜKLEME ====================
    def handle_multipart_upload(self, user: dict):
        content_type = self.headers.get("Content-Type", "")
        if not content_type.startswith("multipart/form-data"):
            return self.send_error_json(400, "Geçersiz içerik türü. Multipart form verisi bekleniyor.")

        boundary_match = re.search(r'boundary=([^;]+)', content_type)
        if not boundary_match:
            return self.send_error_json(400, "Form sınır belirteci (boundary) bulunamadı.")
        
        boundary = boundary_match.group(1).strip().strip('"').encode('utf-8')
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > MAX_FILE_SIZE:
            return self.send_error_json(400, "Dosya boyutu çok büyük. Maksimum 25 MB yükleyebilirsiniz.")

        raw_body = self.rfile.read(content_length)
        parts = raw_body.split(b"--" + boundary)

        fields = {}
        uploaded_file_data = None
        original_filename = None

        for part in parts:
            if not part or part == b"--\r\n" or part == b"--":
                continue
            if b"\r\n\r\n" not in part:
                continue

            headers_raw, content_raw = part.split(b"\r\n\r\n", 1)
            if content_raw.endswith(b"\r\n"):
                content_raw = content_raw[:-2]

            headers_text = headers_raw.decode('utf-8', errors='ignore')
            disp_match = re.search(r'Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?', headers_text, re.IGNORECASE)
            
            if disp_match:
                field_name = disp_match.group(1)
                filename = disp_match.group(2)
                
                if filename is not None:
                    original_filename = os.path.basename(filename)
                    uploaded_file_data = content_raw
                else:
                    fields[field_name] = content_raw.decode('utf-8', errors='ignore')

        task_id = fields.get("task_id")
        task = None

        if task_id and task_id not in ["new", "null", "undefined"]:
            try:
                task = db.get_task_by_id(int(task_id))
            except ValueError:
                task = None

        if not task:
            # Otomatik görev tespiti veya oluşturma
            if user["role"] == "student":
                tasks = db.list_tasks(student_id=user["id"])
                if tasks:
                    task = tasks[0]
                else:
                    trainers = db.list_users("trainer")
                    trainer_id = trainers[0]["id"] if trainers else 1
                    new_tid = db.create_task("Akademik Ödev Teslimi", "Öğrenci tarafından yüklenen çalışma dosyası", "2026-12-31", trainer_id, user["id"])
                    task = db.get_task_by_id(new_tid)
            else:
                all_tasks = db.list_tasks()
                if all_tasks:
                    task = all_tasks[0]
                else:
                    students = db.list_users("student")
                    trainers = db.list_users("trainer")
                    st_id = students[0]["id"] if students else user["id"]
                    tr_id = trainers[0]["id"] if trainers else user["id"]
                    new_tid = db.create_task("Sistem Dosyası", "Yönetici tarafından yüklenen dosya", "2026-12-31", tr_id, st_id)
                    task = db.get_task_by_id(new_tid)

        task_id = task["id"]
        target_student_id = task["student_id"] if user["role"] in ["admin", "trainer"] else user["id"]

        if not uploaded_file_data or not original_filename:
            return self.send_error_json(400, "Lütfen yüklenecek bir dosya seçiniz.")

        ext = os.path.splitext(original_filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return self.send_error_json(400, f"Desteklenmeyen dosya türü ({ext}). İzin verilenler: PDF, Word, ZIP, Kod ve Resim dosyaları.")

        safe_prefix = f"task_{task_id}_student_{target_student_id}_{secrets.token_hex(4)}"
        clean_orig = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', original_filename)
        saved_filename = f"{safe_prefix}_{clean_orig}"
        saved_path = UPLOADS_DIR / saved_filename

        with open(saved_path, "wb") as f:
            f.write(uploaded_file_data)

        file_size = len(uploaded_file_data)
        student_notes = fields.get("student_notes", "").strip() or None
        student_link = fields.get("student_link", "").strip() or None
        sub_id = db.create_or_update_submission(task_id, target_student_id, saved_filename, original_filename, file_size, student_notes, student_link)

        return self.send_json(200, {
            "success": True,
            "message": "Ödev ve çözüm dosyası başarıyla teslim edildi.",
            "submission_id": sub_id,
            "filename": original_filename,
            "file_size": file_size,
            "status": "Teslim Edildi"
        })

    # ==================== STATİK VE YÜKLENEN DOSYA SUNUMU ====================
    def serve_uploaded_file(self, filename: str):
        safe_filename = os.path.basename(filename)
        file_path = UPLOADS_DIR / safe_filename

        if not file_path.exists() or not file_path.is_file():
            self.send_response(404)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write("Dosya bulunamadı.".encode('utf-8'))
            return

        content_type, _ = mimetypes.guess_type(str(file_path))
        if not content_type:
            content_type = "application/octet-stream"

        file_size = os.path.getsize(file_path)
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(file_size))
        encoded_name = urllib.parse.quote(safe_filename)
        self.send_header("Content-Disposition", f'attachment; filename="{safe_filename}"; filename*=UTF-8\'\'{encoded_name}')
        self.end_headers()

        with open(file_path, "rb") as f:
            while chunk := f.read(64 * 1024):
                self.wfile.write(chunk)

    def serve_static_file(self, path: str):
        if path == "/" or path == "":
            path = "/index.html"

        clean_path = os.path.normpath(path.lstrip("/"))
        file_path = STATIC_DIR / clean_path

        if not file_path.exists() or not file_path.is_file():
            file_path = STATIC_DIR / "index.html"
            if not file_path.exists():
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b"404 Not Found")
                return

        content_type, _ = mimetypes.guess_type(str(file_path))
        if not content_type:
            content_type = "application/octet-stream"
        if content_type.startswith("text/") or content_type in ["application/javascript", "application/json"]:
            content_type += "; charset=utf-8"

        file_size = os.path.getsize(file_path)
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(file_size))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.end_headers()

        with open(file_path, "rb") as f:
            while chunk := f.read(64 * 1024):
                self.wfile.write(chunk)


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def run_server(port: int = 8080):
    db.init_db()
    db.seed_database()
    server_address = ('0.0.0.0', port)
    httpd = ThreadedHTTPServer(server_address, TaskAppRequestHandler)
    print(f"==================================================")
    print(f"🎓 Üniversite Görev Yönetim Sistemi Sunucusu Aktif!")
    print(f"🌐 Erişim Adresi: http://localhost:{port}")
    print(f"==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nSunucu kapatılıyor...")
        httpd.server_close()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    run_server(port)

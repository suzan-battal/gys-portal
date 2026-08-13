#!/usr/bin/env python3
"""
Comprehensive Project Translation Engine
Translates all frontend JS controllers, database permissions & seed data, and documentation to English.
"""

import re
import os
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def translate_database_py():
    db_file = BASE_DIR / "database.py"
    with open(db_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Translate role descriptions
    content = content.replace('"Sistem Üst Yöneticisi (Tüm Yetkiler)"', '"System Super Administrator (Full Permissions)"')
    content = content.replace('"Sistem ve Akademik Yönetici"', '"System & Academic Administrator"')
    content = content.replace('"Eğitim ve Program Koordinatörü"', '"Training & Academic Program Coordinator"')
    content = content.replace('"Eğitmen / Akademisyen"', '"Faculty Instructor / Academic Trainer"')
    content = content.replace('"Yardımcı Eğitmen / Asistan"', '"Teaching Assistant / Assistant Trainer"')
    content = content.replace('"Öğrenci / Kursiyer"', '"Enrolled Student / Trainee"')

    # Translate ALL_PERMISSIONS
    content = content.replace('"Kullanıcıları Görüntüle", "category": "Kullanıcı Yönetimi"', '"View Users", "category": "User Management"')
    content = content.replace('"Yeni Kullanıcı Ekle", "category": "Kullanıcı Yönetimi"', '"Create Users", "category": "User Management"')
    content = content.replace('"Kullanıcı Bilgilerini Güncelle", "category": "Kullanıcı Yönetimi"', '"Update Users", "category": "User Management"')
    content = content.replace('"Kullanıcı Sil", "category": "Kullanıcı Yönetimi"', '"Delete Users", "category": "User Management"')

    content = content.replace('"Öğrencileri Listele", "category": "Öğrenci Yönetimi"', '"List Students", "category": "Student Management"')
    content = content.replace('"Öğrenci Kaydı Oluştur", "category": "Öğrenci Yönetimi"', '"Create Student Record", "category": "Student Management"')
    content = content.replace('"Öğrenci Bilgisi Güncelle", "category": "Öğrenci Yönetimi"', '"Update Student Record", "category": "Student Management"')

    content = content.replace('"Eğitmenleri Listele", "category": "Eğitmen Yönetimi"', '"List Trainers", "category": "Trainer Management"')
    content = content.replace('"Yeni Eğitmen Ekle", "category": "Eğitmen Yönetimi"', '"Add New Trainer", "category": "Trainer Management"')

    content = content.replace('"Eğitim Gruplarını Görüntüle", "category": "Grup Yönetimi"', '"View Training Groups", "category": "Group Management"')
    content = content.replace('"Yeni Eğitim Grubu Oluştur", "category": "Grup Yönetimi"', '"Create Training Group", "category": "Group Management"')
    content = content.replace('"Grup Bilgilerini Güncelle", "category": "Grup Yönetimi"', '"Update Training Group", "category": "Group Management"')
    content = content.replace('"Eğitim Grubu Sil", "category": "Grup Yönetimi"', '"Delete Training Group", "category": "Group Management"')

    content = content.replace('"Görevleri Görüntüle", "category": "Görev Yönetimi"', '"View Tasks", "category": "Task Management"')
    content = content.replace('"Yeni Görev Tanımla", "category": "Görev Yönetimi"', '"Create New Task", "category": "Task Management"')
    content = content.replace('"Görev Bilgilerini Düzenle", "category": "Görev Yönetimi"', '"Edit Task Details", "category": "Task Management"')
    content = content.replace('"Görev Sil", "category": "Görev Yönetimi"', '"Delete Task", "category": "Task Management"')
    content = content.replace('"Görev Ata (Bireysel/Grup)", "category": "Görev Yönetimi"', '"Assign Task (Single/Group)", "category": "Task Management"')

    content = content.replace('"Teslimleri Listele", "category": "Teslim & İnceleme"', '"List Submissions", "category": "Submission & Review"')
    content = content.replace('"Teslimi İncele & Değerlendir", "category": "Teslim & İnceleme"', '"Review & Evaluate Submission", "category": "Submission & Review"')

    content = content.replace('"Not ve Değerlendirmeleri Gör", "category": "Notlandırma"', '"View Grades & Evaluations", "category": "Grading"')
    content = content.replace('"Not & Geri Bildirim Ekle", "category": "Notlandırma"', '"Submit Grade & Feedback", "category": "Grading"')

    content = content.replace('"Bildirimleri Görüntüle", "category": "İletişim & Duyuru"', '"View Notifications", "category": "Communication"')
    content = content.replace('"Duyuru ve Bildirim Gönder", "category": "İletişim & Duyuru"', '"Send Announcements & Notifications", "category": "Communication"')

    content = content.replace('"Akademik Raporları İncele", "category": "Raporlama & Sistem"', '"View Academic Reports", "category": "Reporting & System"')
    content = content.replace('"Sistem Ayarlarını Yönet", "category": "Raporlama & Sistem"', '"Manage System Settings", "category": "Reporting & System"')

    with open(db_file, "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ database.py translated successfully.")

def translate_app_js():
    app_file = BASE_DIR / "static" / "js" / "app.js"
    with open(app_file, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = [
        # Toasts
        ('showToast("Oturum süreniz doldu, lütfen tekrar giriş yapınız.", "warning");', 'showToast("Your session has expired. Please sign in again.", "warning");'),
        ('return { success: false, error: "Yetkisiz erişim", status: 401 };', 'return { success: false, error: "Unauthorized access", status: 401 };'),
        ('return { success: false, error: "Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol ediniz." };', 'return { success: false, error: "Could not connect to server. Please check your connection." };'),
        ('showToast("Lütfen e-posta ve şifrenizi giriniz.", "error");', 'showToast("Please enter your email and password.", "error");'),
        ('btn.innerHTML = \'<span>Giriş Yapılıyor...</span>\';', 'btn.innerHTML = \'<span>Signing In...</span>\';'),
        ('showToast(res.error || "Geçersiz e-posta veya şifre.", "error");', 'showToast(res.error || "Invalid email or password.", "error");'),
        ('showToast(`Hoş geldiniz, Sn. ${res.user.name}`, "success");', 'showToast(`Welcome, ${res.user.name}!`, "success");'),
        ('showToast("Başarıyla çıkış yapıldı.", "info");', 'showToast("Successfully signed out.", "info");'),
        ('showToast("Dosya başarıyla sisteme yüklendi!", "success");', 'showToast("File uploaded successfully to system!", "success");'),
        ('showToast(res.error || "Dosya yüklenirken bir hata oluştu.", "error");', 'showToast(res.error || "An error occurred while uploading file.", "error");'),
        ('showToast("Yorum başarıyla gönderildi!", "success");', 'showToast("Comment posted successfully!", "success");'),
        ('showToast("Lütfen bir yorum veya dosya ekleyiniz.", "warning");', 'showToast("Please enter a comment or attach a file.", "warning");'),
        ('showToast("Tüm bildirimler okundu olarak işaretlendi.", "success");', 'showToast("All notifications marked as read.", "success");'),
        
        # Status Badges
        ('Tamamlandı (Completed)', 'Completed'),
        ('İnceleniyor (Under Review)', 'Under Review'),
        ('Yeniden Teslim Edildi (Resubmitted)', 'Resubmitted'),
        ('Teslim Edildi (Submitted)', 'Submitted'),
        ('Düzeltme İstendi (Needs Revision)', 'Needs Revision'),
        ('Devam Ediyor (In Progress)', 'In Progress'),
        ('Görüntülendi (Viewed)', 'Viewed'),
        ('Gecikmiş (Overdue)', 'Overdue'),
        ('Atandı (Assigned)', 'Assigned'),
        ('Reddedildi', 'Rejected'),
        
        # Date formatting
        ('function formatDateTr(dtStr) {', 'function formatDateTr(dtStr) {\n  if (!dtStr) return "-";\n  try {\n    const d = new Date(dtStr.replace(" ", "T"));\n    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });\n  } catch(e) { return dtStr; }\n}\nfunction _old_formatDateTr(dtStr) {'),
        
        # Headers in switchTab
        ("heading.innerHTML = `<span>17. Bugünün Görevleri (Today's Tasks Hub)</span>`;", 'heading.innerHTML = `<span>Today\'s Tasks (Today\'s Tasks Hub)</span>`;'),
        ("heading.innerHTML = `<span>19. Duyurular ve Bildirimler (Announcements Hub)</span>`;", 'heading.innerHTML = `<span>Announcements & Notices Hub</span>`;'),
        ("heading.innerHTML = `<span>20. Akademik Takvim (Calendar Hub)</span>`;", 'heading.innerHTML = `<span>Academic Calendar Hub</span>`;'),
        ("heading.innerHTML = `<span>21. Raporlama ve Analitik Merkezi (Reports Hub)</span>`;", 'heading.innerHTML = `<span>Reports & Analytics Hub</span>`;'),
        ("heading.innerHTML = `<span>22. Denetim Kayıtları (Audit Logs Hub)</span>`;", 'heading.innerHTML = `<span>Audit Logs & Security Hub</span>`;'),
        ("heading.innerHTML = `<span>26.29. Sistem Ayarları & Konfigürasyon (Settings Hub)</span>`;", 'heading.innerHTML = `<span>System Settings & Configuration Hub</span>`;'),
        
        # Student Profile
        ('Öğrenci Profili ve İstatistikleri Yükleniyor...', 'Loading Student Profile & Analytics...'),
        ('Öğrenci Bilgileri (Student Information)', 'Student Information'),
        ('ÖĞRENCİ NO', 'STUDENT ID'),
        ('HESAP DURUMU', 'ACCOUNT STATUS'),
        ('KAYIT TARİHİ', 'ENROLLMENT DATE'),
        ('SON GİRİŞ', 'LAST LOGIN'),
        ('Hiç giriş yapmadı', 'Never logged in'),
        ('Eğitim Grubu & Eğitmen (Group & Trainer)', 'Training Group & Trainer'),
        ('EĞİTİM GRUBU', 'TRAINING GROUP'),
        ('BÖLÜM / ALAN', 'DEPARTMENT / FIELD'),
        ('ANA EĞİTMEN', 'LEAD TRAINER'),
        ('YARDIMCI EĞİTMEN', 'ASSISTANT TRAINER'),
        ('Atanan Görev', 'Assigned Tasks'),
        ('Tamamlandı', 'Completed'),
        ('Devam Eden', 'In Progress'),
        ('Geciken', 'Overdue'),
        ('Ortalama Not', 'Average Grade'),
        ('Genel Tamamlama', 'Completion Rate'),
        ('Akademik Derece', 'Academic Standing'),
        ('GÖREV VE ÖDEV GEÇMİŞİ (TASK HISTORY)', 'ASSIGNMENT & TASK HISTORY'),
        ('SON AKADEMİK ETKİNLİKLER (RECENT ACTIVITY)', 'RECENT ACADEMIC ACTIVITY'),
        ('Görev Başlığı', 'Task Title'),
        ('Son Teslim', 'Due Date'),
        ('Durum', 'Status'),
        ('Not', 'Grade'),
        ('Geri Bildirim', 'Feedback'),
        ('İncele', 'View'),
        ('Henüz atanmış bir görev bulunmuyor.', 'No tasks have been assigned yet.'),
        ('Henüz bir etkinlik kaydı bulunmuyor.', 'No activity logs found.')
    ]

    for target, repl in replacements:
        content = content.replace(target, repl)

    with open(app_file, "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ static/js/app.js translated successfully.")

def translate_admin_js():
    admin_file = BASE_DIR / "static" / "js" / "admin.js"
    with open(admin_file, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = [
        # Admin Headings
        ('heading.innerHTML = `<span>Yönetici Paneli - Genel Bakış</span>`;', 'heading.innerHTML = `<span>Administrator Dashboard - Overview</span>`;'),
        ('heading.innerHTML = `<span>Roller & İzinler Matrisi (Section 12: Roles & Permissions)</span>`;', 'heading.innerHTML = `<span>Roles & Permissions Matrix (RBAC Engine)</span>`;'),
        ('heading.innerHTML = `<span>Eğitim Grupları Yönetimi</span>`;', 'heading.innerHTML = `<span>Training Groups & Cohorts Management</span>`;'),
        ('heading.innerHTML = `<span>Öğrenci Yönetimi</span>`;', 'heading.innerHTML = `<span>Student Management</span>`;'),
        ('await this.renderUsersByRole(main, \'student\', \'Öğrenciler\');', 'await this.renderUsersByRole(main, \'student\', \'Students\');'),
        ('heading.innerHTML = `<span>Eğitmen Yönetimi</span>`;', 'heading.innerHTML = `<span>Trainer Management</span>`;'),
        ('await this.renderUsersByRole(main, \'trainer\', \'Eğitmenler\');', 'await this.renderUsersByRole(main, \'trainer\', \'Trainers\');'),
        ('heading.innerHTML = `<span>Tüm Kullanıcılar</span>`;', 'heading.innerHTML = `<span>All Users Management</span>`;'),
        ('heading.innerHTML = `<span>Görev ve Ödev Yönetimi</span>`;', 'heading.innerHTML = `<span>Tasks & Assignments Management</span>`;'),
        ('heading.innerHTML = `<span>Tüm Ödev Teslimleri</span>`;', 'heading.innerHTML = `<span>All Assignment Submissions</span>`;'),
        
        # Hero Banner
        ('<h2>Hoş Geldiniz, Sn. ${user.name} 👋</h2>', '<h2>Welcome, ${user.name} 👋</h2>'),
        ('<p>16. Admin Dashboard (Yönetici Kontrol Paneli). Üniversite genelindeki tüm öğrencileri, eğitmenleri, grupları, aktif/geciken görevleri ve genel akademik performansı anlık izleyin.</p>', '<p>Administrator Control Center. Monitor institution-wide students, trainers, groups, active/overdue tasks, and overall academic performance in real time.</p>'),
        ('<span>Görev Oluştur</span>', '<span>Create Task</span>'),
        ('<span>Yeni Grup Aç</span>', '<span>Create Group</span>'),
        
        # KPI Cards
        ('<span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">1. Total Students</span>', '<span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">1. Total Students</span>'),
        ('Kayıtlı Öğrenci', 'Enrolled Students'),
        ('<span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">2. Total Trainers</span>', '<span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">2. Total Trainers</span>'),
        ('Eğitmen Kadrosu', 'Faculty Instructors'),
        ('Aktif Grup', 'Active Groups'),
        ('Devam Eden', 'In Progress'),
        ('İnceleme Bekleyen', 'Pending Review'),
        ('Geciken Görev', 'Overdue Tasks'),
        ('Bu Hafta Biten', 'Completed This Week'),
        
        # Progress Card
        ('<strong style="font-size: 15px; color: var(--primary-navy);">8. Student Progress (Genel Öğrenci İlerleme ve Başarı Oranları)</strong>', '<strong style="font-size: 15px; color: var(--primary-navy);">Student Progress & Performance Overview</strong>'),
        ('<span class="status-badge badge-completed">Sistem Geneli İzleme</span>', '<span class="status-badge badge-completed">Institution-Wide Tracking</span>'),
        ('Genel Tamamlama Oranı (% Progress)', 'Overall Completion Rate (% Progress)'),
        ('Toplam Görev', 'Total Tasks'),
        ('Tamamlanan', 'Completed'),
        ('Geciken', 'Overdue'),
        ('Ortalama Not', 'Average Grade'),
        
        # Trainer Activity
        ('<strong style="font-size: 14px; color: var(--primary-navy);">9. Trainer Activity (Eğitmen Aktivitesi)</strong>', '<strong style="font-size: 14px; color: var(--primary-navy);">Trainer Activity & Review Metrics</strong>'),
        ('Eğitmenler', 'Trainers'),
        ('Eğitmen', 'Trainer'),
        ('Görev', 'Tasks'),
        ('Bekleyen', 'Pending'),
        ('Notlanan', 'Graded'),
        ('Ort. Not', 'Avg. Grade'),
        ('Kayıtlı eğitmen bulunmuyor.', 'No trainers registered in the system.'),
        
        # Late Submissions
        ('<strong style="font-size: 14px; color: var(--primary-navy);">10. Late Submissions (Geciken Görevler)</strong>', '<strong style="font-size: 14px; color: var(--primary-navy);">Overdue & Late Submissions</strong>'),
        ('Tüm Görevler', 'All Tasks'),
        ('Öğrenci', 'Student'),
        ('Grup', 'Group'),
        ('Son Tarih', 'Deadline'),
        ('Gecikme', 'Overdue'),
        ('İşlem', 'Action'),
        ('Gecikmiş herhangi bir ödev bulunmamaktadır! 🎉', 'No overdue assignments found! Great job! 🎉'),
        ('Süresi Doldu', 'Deadline Passed'),
        ('Gün', 'Days'),
        ('Profil (14)', 'Profile'),
        
        # Training Groups Performance
        ('<strong style="font-size: 15px; color: var(--primary-navy);">11. Training Groups Performance (Eğitim Grupları Başarı ve İlerleme Tablosu)</strong>', '<strong style="font-size: 15px; color: var(--primary-navy);">Training Groups Performance & Completion Table</strong>'),
        ('Tüm Grupları Yönet', 'Manage All Groups'),
        ('Grup Adı & Uzmanlık', 'Group Name & Track'),
        ('Sorumlu Eğitmen', 'Lead Trainer'),
        ('Öğrenci Mevcudu', 'Enrolled Students'),
        ('Toplam Görev', 'Total Tasks'),
        ('Biten Görev', 'Completed Tasks'),
        ('İlerleme (% Progress)', 'Progress (%)'),
        ('Ortalama Not', 'Average Score'),
        ('Henüz tanımlı bir eğitim grubu bulunmuyor.', 'No training groups defined yet.'),
        
        # Groups Page
        ('Eğitim Grupları ve Şubeler', 'Training Groups & Cohorts'),
        ('Yeni Grup Oluştur', 'Create New Group'),
        ('Kayıtlı Öğrenci', 'Enrolled Students'),
        ('Tarih Aralığı', 'Date Range'),
        ('İşlemler', 'Actions'),
        ('Henüz oluşturulmuş bir eğitim grubu bulunmamaktadır.', 'No training groups created yet.'),
        ('Düzenle', 'Edit'),
        ('Sil', 'Delete'),
        ('Aktif', 'Active'),
        ('Arşiv', 'Archived'),
        
        # Users Management Page
        ('13. Users Management (Kullanıcı Yönetimi)', 'Users Management'),
        ('Sistemdeki kullanıcıları Role, Group ve Status filtreleri ile arayın ve yönetin.', 'Search and manage all institutional users with Role, Group, and Status filters.'),
        ('Yeni Kullanıcı Ekle', 'Add New User'),
        ('🔍 Kullanıcı veya e-posta ara (Search user)...', '🔍 Search user by name or email...'),
        ('👤 Tüm Roller (All Roles)', '👤 All Roles'),
        ('🏢 Tüm Gruplar (All Groups)', '🏢 All Groups'),
        ('Grup Atanmamış (-)', 'No Group Assigned (-)'),
        ('🟢 Tüm Durumlar (All Status)', '🟢 All Statuses'),
        ('Aktif (Active)', 'Active'),
        ('Pasif (Inactive)', 'Inactive'),
        ('User (Kullanıcı)', 'User'),
        ('Role (Rol)', 'Role'),
        ('Group (Eğitim Grubu)', 'Group'),
        ('Status (Durum)', 'Status'),
        ('Last Login (Son Giriş)', 'Last Login'),
        ('Arama kriterlerine uygun kullanıcı bulunamadı.', 'No users found matching the search criteria.'),
        
        # Tasks Page
        ('Tanımlı Görevler ve Ödevler', 'Defined Tasks & Assignments'),
        ('Yeni Görev Oluştur', 'Create New Task'),
        ('Öncelik', 'Priority'),
        ('Atanan Öğrenci', 'Assigned Student'),
        ('Son Teslim Tarihi', 'Submission Deadline'),
        ('Henüz tanımlanmış bir görev bulunmamaktadır.', 'No assignments have been created yet.'),
        ('Normal', 'Normal'),
        ('Düşük', 'Low'),
        ('Yüksek', 'High'),
        ('Acil', 'Urgent'),
        
        # Submissions Page
        ('Öğrenci Teslim ve Notlandırma Listesi', 'Student Submissions & Evaluation Roster'),
        ('Deneme / Revizyon', 'Attempt / Revision'),
        ('Teslim Zamanı', 'Submission Date'),
        ('Zamanlama (Is Late)', 'Timing'),
        ('Dosya & Link', 'File & URL'),
        ('Geri Bildirim', 'Feedback'),
        ('Henüz hiçbir ödev teslim edilmemiştir.', 'No assignments have been submitted yet.'),
        ('Zamanında Teslim', 'On Time'),
        ('Gecikmeli Teslim', 'Late Submission'),
        ('Dosyayı İndir', 'Download File'),
        ('Proje Linki', 'Project URL'),
        ('Henüz Değerlendirilmedi', 'Pending Evaluation'),
        ('İncele ve Not Ver (8)', 'Review & Grade (8)'),
        
        # Action callbacks & prompts
        ('Kullanıcı başarıyla eklendi!', 'User created successfully!'),
        ('Kullanıcı başarıyla güncellendi!', 'User updated successfully!'),
        ('Kullanıcı başarıyla silindi.', 'User deleted successfully.'),
        ('Grup başarıyla oluşturuldu!', 'Training group created successfully!'),
        ('Grup başarıyla güncellendi!', 'Training group updated successfully!'),
        ('Grup başarıyla silindi.', 'Training group deleted successfully.'),
        ('Görev başarıyla oluşturuldu!', 'Task created successfully!'),
        ('Görev başarıyla güncellendi!', 'Task updated successfully!'),
        ('Görev başarıyla silindi.', 'Task deleted successfully.'),
        ('Değerlendirme başarıyla kaydedildi!', 'Evaluation saved and student notified!')
    ]

    for target, repl in replacements:
        content = content.replace(target, repl)

    with open(admin_file, "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ static/js/admin.js translated successfully.")

def translate_trainer_js():
    trainer_file = BASE_DIR / "static" / "js" / "trainer.js"
    with open(trainer_file, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = [
        ('heading.innerHTML = `<span>Eğitmen Paneli - Genel Bakış</span>`;', 'heading.innerHTML = `<span>Trainer Dashboard - Overview</span>`;'),
        ('heading.innerHTML = `<span>Eğitim Gruplarım</span>`;', 'heading.innerHTML = `<span>My Training Groups</span>`;'),
        ('heading.innerHTML = `<span>Öğrencilerim</span>`;', 'heading.innerHTML = `<span>My Students</span>`;'),
        ('heading.innerHTML = `<span>Görev ve Ödev Yönetimi</span>`;', 'heading.innerHTML = `<span>Assignments & Task Management</span>`;'),
        ('heading.innerHTML = `<span>Ödev Teslimleri & Değerlendirme</span>`;', 'heading.innerHTML = `<span>Submissions & Review Center</span>`;'),
        
        ('<h2>Hoş Geldiniz, ${user.name} 👨‍🏫</h2>', '<h2>Welcome, ${user.name} 👨‍🏫</h2>'),
        ('<p>Eğitmen Kontrol Paneli. Sorumlu olduğunuz eğitim gruplarını, atadığınız görevleri, teslim edilen ödevleri inceleyin ve 100 puanlık rubrik kriterleriyle değerlendirin.</p>', '<p>Trainer Dashboard. Manage your training cohorts, create assignments, review submitted work, and grade submissions using the 100-point rubric system.</p>'),
        ('<span>Yeni Görev Oluştur</span>', '<span>Create Assignment</span>'),
        ('<span>Yeni Grup Aç</span>', '<span>Create Cohort</span>'),
        
        ('Toplam Görev', 'Total Tasks'),
        ('İncelenecek', 'Pending Review'),
        ('Değerlendirilen', 'Graded Submissions'),
        ('Öğrenci Sayısı', 'Enrolled Students'),
        ('Sorumlu Gruplar', 'Assigned Cohorts'),
        ('Genel Başarı Ort.', 'Average Class Grade'),
        
        ('İnceleme Bekleyen Ödevler', 'Submissions Pending Review'),
        ('Öğrenci', 'Student'),
        ('Görev Başlığı', 'Task Title'),
        ('Grup', 'Group'),
        ('Teslim Tarihi', 'Submitted Date'),
        ('Zamanlama', 'Timing'),
        ('İşlem', 'Action'),
        ('İnceleme bekleyen herhangi bir ödev bulunmamaktadır. Harika! 🎉', 'No submissions currently pending review. Great work! 🎉'),
        ('İncele & Not Ver', 'Review & Grade'),
        
        ('Aktif Görevlerim', 'My Active Assignments'),
        ('Öncelik', 'Priority'),
        ('Hedef', 'Target'),
        ('Son Teslim', 'Due Date'),
        ('Teslim Oranı', 'Submission Rate'),
        ('Durum', 'Status'),
        ('Henüz oluşturulmuş bir görev bulunmuyor.', 'No assignments created yet.'),
        ('Tek Öğrenci', 'Single Student'),
        ('Tüm Grup', 'Entire Group'),
        ('Detay', 'Details'),
        ('Düzenle', 'Edit'),
        ('Sil', 'Delete'),
        
        ('Sorumlu Olduğum Eğitim Grupları', 'My Assigned Training Groups'),
        ('Grup Adı', 'Group Name'),
        ('Uzmanlık', 'Department / Track'),
        ('Öğrenci Sayısı', 'Students'),
        ('Tamamlama Oranı', 'Completion Rate'),
        ('Ortalama Not', 'Average Grade'),
        ('Henüz atanmış bir eğitim grubunuz bulunmuyor.', 'You have not been assigned to any training groups yet.'),
        
        ('Sorumlu Olduğum Öğrenciler', 'My Enrolled Students'),
        ('Ad Soyad', 'Full Name'),
        ('E-posta', 'Email'),
        ('Öğrenci No', 'Student ID'),
        ('Görev Sayısı', 'Tasks'),
        ('Tamamlanan', 'Completed'),
        ('Genel Not', 'GPA Score'),
        ('Profil', 'Profile'),
        ('Henüz kayıtlı bir öğrenciniz bulunmuyor.', 'No enrolled students found in your groups.')
    ]

    for target, repl in replacements:
        content = content.replace(target, repl)

    with open(trainer_file, "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ static/js/trainer.js translated successfully.")

def translate_student_js():
    student_file = BASE_DIR / "static" / "js" / "student.js"
    with open(student_file, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = [
        ('heading.innerHTML = `<span>Öğrenci Paneli - Genel Bakış</span>`;', 'heading.innerHTML = `<span>Student Dashboard - Overview</span>`;'),
        ('heading.innerHTML = `<span>Görevlerim ve Ödevlerim</span>`;', 'heading.innerHTML = `<span>My Tasks & Assignments</span>`;'),
        ('heading.innerHTML = `<span>Teslimlerim ve Notlarım</span>`;', 'heading.innerHTML = `<span>My Submissions & Academic Grades</span>`;'),
        ('heading.innerHTML = `<span>Öğrenci Akademik Raporu (Section 21)</span>`;', 'heading.innerHTML = `<span>Academic Progress & GPA Report</span>`;'),
        
        ('<h2>Hoş Geldin, ${user.name} 🎒</h2>', '<h2>Welcome, ${user.name} 🎒</h2>'),
        ('<p>Öğrenci Portalı. Atanan görevlerinizi takip edin, ödevlerinizi yükleyin, eğitmen geri bildirimlerini ve rubrik puanlarınızı inceleyin.</p>', '<p>Student Portal. Track your assigned tasks, upload project deliverables, review trainer feedback, and monitor your academic progress.</p>'),
        ('<span>Dosya Yükle / Teslim Et</span>', '<span>Submit Assignment</span>'),
        ('<span>Görevlerimi Gör</span>', '<span>View My Tasks</span>'),
        
        ('Atanan Görev', 'Assigned Tasks'),
        ('Tamamlanan', 'Completed'),
        ('Devam Eden', 'In Progress'),
        ('Bekleyen', 'Pending Start'),
        ('Geciken Görev', 'Overdue Tasks'),
        ('Genel Başarı Notu', 'Overall GPA Grade'),
        
        ('Aktif ve Devam Eden Görevlerim', 'My Active & Upcoming Assignments'),
        ('Görev Başlığı', 'Task Title'),
        ('Eğitmen', 'Instructor'),
        ('Öncelik', 'Priority'),
        ('Son Teslim', 'Due Date'),
        ('Kalan Süre', 'Time Remaining'),
        ('Durum', 'Status'),
        ('İşlem', 'Action'),
        ('Şu anda aktif bir göreviniz bulunmuyor. Harika durumdasınız! 🎉', 'No active assignments at this time. You are all caught up! 🎉'),
        ('Detay ve Teslim', 'View & Submit'),
        ('Çalışmaya Başla', 'Start Working'),
        ('Görevi Teslim Et', 'Submit Solution'),
        ('Düzeltme Gönder', 'Submit Revision'),
        
        ('Ödev Teslim Geçmişim ve Notlarım', 'Submission History & Gradebook'),
        ('Deneme No', 'Attempt #'),
        ('Teslim Zamanı', 'Submission Date'),
        ('Dosya / Link', 'File / Link'),
        ('Eğitmen Notu', 'Grade Score'),
        ('Geri Bildirim', 'Trainer Feedback'),
        ('Henüz bir tesliminiz bulunmuyor.', 'You have not submitted any assignments yet.'),
        ('Dosyayı İndir', 'Download File'),
        ('Çözüm Linki', 'Solution Link'),
        ('Henüz Notlanmadı', 'Pending Evaluation')
    ]

    for target, repl in replacements:
        content = content.replace(target, repl)

    with open(student_file, "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ static/js/student.js translated successfully.")

def translate_documentation_html():
    doc_file = BASE_DIR / "static" / "documentation.html"
    with open(doc_file, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = [
        ('<html lang="tr">', '<html lang="en">'),
        ('<title>Proje Raporu | Üniversite Görev Yönetim Sistemi</title>', '<title>Project Specification Report | University Task Management System</title>'),
        ('<h1>Üniversite Görev Yönetim Sistemi (GYS)</h1>', '<h1>University Task & Training Management System (TTMS)</h1>'),
        ('<h2>Kapsamlı Proje ve Mimari Raporu</h2>', '<h2>Comprehensive Architecture & Specification Report (Sections 1 - 31)</h2>'),
        ('İstanbul Üniversitesi', 'Istanbul University'),
        ('Yönetici Paneline Dön', 'Return to Dashboard'),
        ('PDF Olarak Kaydet / Yazdır', 'Print / Save as PDF'),
        ('İçindekiler Tablosu', 'Table of Contents'),
        ('Tüm Hakları Saklıdır', 'All Rights Reserved'),
        ('Proje Künyesi ve Özet Bilgiler', 'Project Overview & Metadata')
    ]

    for target, repl in replacements:
        content = content.replace(target, repl)

    with open(doc_file, "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ static/documentation.html translated successfully.")

def reseed_database_in_english():
    """Re-seeds database.sqlite with clean English categories, initial permissions and records."""
    db_file = BASE_DIR / "database.sqlite"
    if not os.path.exists(db_file):
        return

    conn = sqlite3.connect(db_file)
    cur = conn.cursor()

    # Update role_permissions category names in DB if table exists
    try:
        cur.execute("UPDATE permissions SET category = 'User Management' WHERE category = 'Kullanıcı Yönetimi';")
        cur.execute("UPDATE permissions SET category = 'Student Management' WHERE category = 'Öğrenci Yönetimi';")
        cur.execute("UPDATE permissions SET category = 'Trainer Management' WHERE category = 'Eğitmen Yönetimi';")
        cur.execute("UPDATE permissions SET category = 'Group Management' WHERE category = 'Grup Yönetimi';")
        cur.execute("UPDATE permissions SET category = 'Task Management' WHERE category = 'Görev Yönetimi';")
        cur.execute("UPDATE permissions SET category = 'Submission & Review' WHERE category = 'Teslim & İnceleme';")
        cur.execute("UPDATE permissions SET category = 'Grading' WHERE category = 'Notlandırma';")
        cur.execute("UPDATE permissions SET category = 'Communication' WHERE category = 'İletişim & Duyuru';")
        cur.execute("UPDATE permissions SET category = 'Reporting & System' WHERE category = 'Raporlama & Sistem';")

        cur.execute("UPDATE permissions SET name = 'View Users' WHERE code = 'users.view';")
        cur.execute("UPDATE permissions SET name = 'Create Users' WHERE code = 'users.create';")
        cur.execute("UPDATE permissions SET name = 'Update Users' WHERE code = 'users.update';")
        cur.execute("UPDATE permissions SET name = 'Delete Users' WHERE code = 'users.delete';")
        cur.execute("UPDATE permissions SET name = 'List Students' WHERE code = 'students.view';")
        cur.execute("UPDATE permissions SET name = 'Create Student' WHERE code = 'students.create';")
        cur.execute("UPDATE permissions SET name = 'Update Student' WHERE code = 'students.update';")
        cur.execute("UPDATE permissions SET name = 'List Trainers' WHERE code = 'trainers.view';")
        cur.execute("UPDATE permissions SET name = 'Create Trainer' WHERE code = 'trainers.create';")
        cur.execute("UPDATE permissions SET name = 'View Groups' WHERE code = 'groups.view';")
        cur.execute("UPDATE permissions SET name = 'Create Group' WHERE code = 'groups.create';")
        cur.execute("UPDATE permissions SET name = 'Update Group' WHERE code = 'groups.update';")
        cur.execute("UPDATE permissions SET name = 'Delete Group' WHERE code = 'groups.delete';")
        cur.execute("UPDATE permissions SET name = 'View Tasks' WHERE code = 'tasks.view';")
        cur.execute("UPDATE permissions SET name = 'Create Task' WHERE code = 'tasks.create';")
        cur.execute("UPDATE permissions SET name = 'Update Task' WHERE code = 'tasks.update';")
        cur.execute("UPDATE permissions SET name = 'Delete Task' WHERE code = 'tasks.delete';")
        cur.execute("UPDATE permissions SET name = 'Assign Task' WHERE code = 'tasks.assign';")
        cur.execute("UPDATE permissions SET name = 'List Submissions' WHERE code = 'submissions.view';")
        cur.execute("UPDATE permissions SET name = 'Review Submissions' WHERE code = 'submissions.review';")
        cur.execute("UPDATE permissions SET name = 'View Evaluations' WHERE code = 'evaluations.view';")
        cur.execute("UPDATE permissions SET name = 'Create Evaluation' WHERE code = 'evaluations.create';")
        cur.execute("UPDATE permissions SET name = 'View Notifications' WHERE code = 'notifications.view';")
        cur.execute("UPDATE permissions SET name = 'Send Notifications' WHERE code = 'notifications.send';")
        cur.execute("UPDATE permissions SET name = 'View Reports' WHERE code = 'reports.view';")
        cur.execute("UPDATE permissions SET name = 'Manage Settings' WHERE code = 'settings.manage';")
        
        # Update default announcements to English
        cur.execute("UPDATE announcements SET title = 'Spring Term Midterm Project Submission Schedule', content = 'All students are required to upload their deliverables through the portal before deadlines. Late submissions are subject to penalty.' WHERE id = 1;")
        cur.execute("UPDATE announcements SET title = 'New 100-Point Rubric Grading System Active', content = 'Faculty members and trainers are now evaluating assignments with the 5-criterion rubric model: Task Completion (30), Quality (25), Accuracy (20), Deadline (15), and Communication (10).' WHERE id = 2;")
        
        conn.commit()
        print("✓ database.sqlite records updated in English.")
    except Exception as e:
        print(f"[NOTE] SQLite DB update: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    translate_database_py()
    translate_app_js()
    translate_admin_js()
    translate_trainer_js()
    translate_student_js()
    translate_documentation_html()
    reseed_database_in_english()
    print("\n🎉 ALL PROJECT TRANSLATIONS COMPLETED SUCCESSFULLY!")

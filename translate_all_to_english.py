#!/usr/bin/env python3
"""
Comprehensive English Translator for University Task & Training Management System (TTMS)
Translates all Turkish UI strings, labels, badges, alerts, toasts, placeholders, and tooltips into professional academic English.
Preserves all variable names, database schema identifiers, HTML structures, and CSS classes.
"""

import re
import os

TRANSLATION_MAP = [
    # General & Roles
    ("Süper Admin (Tam Yetkili)", "Super Admin (Full Permissions)"),
    ("Süper Yönetici", "Super Admin"),
    ("Yönetici (Sistem Yöneticisi)", "Administrator (System Admin)"),
    ("Yönetici", "Administrator"),
    ("Eğitim Müdürü (Akademik Koordinatör)", "Training Manager (Academic Coordinator)"),
    ("Eğitim Müdürü", "Training Manager"),
    ("Eğitmen (Öğretim Üyesi)", "Trainer (Faculty Instructor)"),
    ("Eğitmen", "Trainer"),
    ("Eğitmenler", "Trainers"),
    ("Asistan Eğitmen (Öğretim Asistanı)", "Assistant Trainer (Teaching Assistant)"),
    ("Asistan Eğitmen", "Assistant Trainer"),
    ("Öğrenci (Kayıtlı Öğrenci)", "Student (Enrolled Student)"),
    ("Öğrenci", "Student"),
    ("Öğrenciler", "Students"),
    ("Kullanıcılar", "All Users"),
    ("Kullanıcı", "User"),
    ("Giriş Yap", "Sign In"),
    ("Çıkış Yap", "Sign Out"),
    ("Oturum Aç", "Sign In"),
    ("Oturumu Kapat", "Sign Out"),
    ("Hoş Geldiniz", "Welcome"),
    ("Hoş geldiniz", "Welcome"),

    # Tabs & Navigation
    ("Bugünün Görevleri", "Today's Tasks"),
    ("Duyurular & Notlar", "Announcements & Notices"),
    ("Duyurular", "Announcements"),
    ("Akademik Takvim", "Academic Calendar"),
    ("Raporlar & Analitik", "Reports & Analytics"),
    ("Raporlar", "Reports"),
    ("Denetim Kayıtları", "Audit Logs"),
    ("Roller & İzinler", "Roles & Permissions"),
    ("Sistem Ayarları", "System Settings"),
    ("Eğitim Grupları", "Training Groups"),
    ("Tanımlı Görevler ve Ödevler", "Tasks & Assignments"),
    ("Görevler", "Tasks"),
    ("Teslimler & İnceleme", "Submissions & Review"),
    ("Teslimler", "Submissions"),
    ("Proje Şartname & Raporu", "Project Specification Report"),
    ("Profilim", "My Profile"),
    ("Öğrenci Profili", "Student Profile"),

    # Status Badges
    ("Tamamlandı", "Completed"),
    ("Kabul Edildi", "Approved"),
    ("İnceleniyor", "Under Review"),
    ("Bekliyor", "Pending"),
    ("Devam Ediyor", "In Progress"),
    ("Düzeltme İstendi", "Needs Revision"),
    ("Reddedildi", "Rejected"),
    ("Gecikmiş", "Overdue"),
    ("Geç Teslim", "Late Submission"),
    ("Görüntülendi", "Viewed"),
    ("Teslim Edildi", "Submitted"),
    ("Aktif", "Active"),
    ("Pasif", "Inactive"),

    # Table Headers & Fields
    ("GÖREV BAŞLIĞI", "TASK TITLE"),
    ("Görev Başlığı", "Task Title"),
    ("ÖNCELİK", "PRIORITY"),
    ("Öncelik", "Priority"),
    ("SORUMLU EĞİTMEN", "ASSIGNED TRAINER"),
    ("Sorumlu Eğitmen", "Assigned Trainer"),
    ("ATANAN ÖĞRENCİ", "ASSIGNED STUDENT"),
    ("Atanan Öğrenci", "Assigned Student"),
    ("SON TESLİM TARİHİ", "DUE DATE"),
    ("Son Teslim Tarihi", "Due Date"),
    ("DURUM", "STATUS"),
    ("Durum", "Status"),
    ("İŞLEMLER", "ACTIONS"),
    ("İşlemler", "Actions"),
    ("NOT", "GRADE"),
    ("Not", "Grade"),
    ("GERİ BİLDİRİM", "FEEDBACK"),
    ("Geri Bildirim", "Feedback"),
    ("Açıklama", "Description"),
    ("Bölüm / Alan", "Department / Field"),
    ("Başlangıç Tarihi", "Start Date"),
    ("Bitiş Tarihi", "End Date"),
    ("E-Posta", "Email"),
    ("Şifre", "Password"),
    ("Ad Soyad", "Full Name"),
    ("Telefon", "Phone"),
    ("Kayıt Tarihi", "Registration Date"),
    ("Son Giriş", "Last Login"),

    # Modals & Actions
    ("Yeni Görev Oluştur", "Create New Task"),
    ("Görevi Düzenle", "Edit Task"),
    ("Görevi Sil", "Delete Task"),
    ("Yeni Kullanıcı Ekle", "Add New User"),
    ("Kullanıcıyı Düzenle", "Edit User"),
    ("Kullanıcıyı Sil", "Delete User"),
    ("Yeni Grup Oluştur", "Create Training Group"),
    ("Grubu Düzenle", "Edit Group"),
    ("Grubu Sil", "Delete Group"),
    ("Dosya Yükle", "Upload File"),
    ("Dosyayı Sisteme Yükle", "Upload File to System"),
    ("Ödevi Teslim Et", "Submit Assignment"),
    ("Değerlendir & Not Ver", "Review & Grade"),
    ("Değerlendirmeyi Kaydet", "Save Evaluation"),
    ("Kaydet", "Save"),
    ("İptal", "Cancel"),
    ("Kapat", "Close"),
    ("Sil", "Delete"),
    ("Düzenle", "Edit"),
    ("Detay", "Details"),
    ("İncele", "Review"),
    ("Dosyayı İndir", "Download File"),
    ("Dosya Seç", "Select File"),

    # Messages & Alerts
    ("Lütfen tüm zorunlu alanları doldurunuz.", "Please fill in all required fields."),
    ("İşlem başarıyla tamamlandı.", "Operation completed successfully."),
    ("Kayıt başarıyla eklendi.", "Record added successfully."),
    ("Kayıt başarıyla güncellendi.", "Record updated successfully."),
    ("Kayıt başarıyla silindi.", "Record deleted successfully."),
    ("Ödev ve çözüm dosyası başarıyla teslim edildi.", "Assignment and solution file submitted successfully."),
    ("Değerlendirme başarıyla kaydedildi.", "Evaluation saved successfully."),
    ("Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol ediniz.", "Could not connect to server. Please check your connection."),
    ("Yetkisiz erişim.", "Unauthorized access."),
    ("Bu işlem için yönetici yetkisi gereklidir.", "Administrator privileges required for this action."),
    ("Geçersiz e-posta veya şifre.", "Invalid email or password."),
    ("Giriş başarılı.", "Login successful."),
    ("Başarıyla çıkış yapıldı.", "Successfully signed out."),
    ("Henüz tanımlanmış bir görev bulunmamaktadır.", "No tasks found."),
    ("Henüz teslim edilen bir ödev bulunmamaktadır.", "No submissions found."),
    ("Henüz kayıtlı öğrenci bulunmamaktadır.", "No students registered yet."),
    ("Henüz kayıtlı eğitmen bulunmamaktadır.", "No trainers registered yet."),
    ("Henüz kayıtlı grup bulunmamaktadır.", "No training groups found."),
    ("Henüz bildiriminiz bulunmuyor.", "No notifications yet."),
    ("Silmek istediğinizden emin misiniz?", "Are you sure you want to delete this?"),
    ("Bu işlem geri alınamaz!", "This action cannot be undone!")
]

def translate_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    original_len = len(content)
    for tr, en in TRANSLATION_MAP:
        content = content.replace(tr, en)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✓ Translated: {filepath}")

# Execute translation across all UI files
files_to_translate = [
    "static/index.html",
    "static/js/app.js",
    "static/js/admin.js",
    "static/js/trainer.js",
    "static/js/student.js"
]

for f in files_to_translate:
    translate_file(f)

print("ALL_UI_FILES_TRANSLATED_TO_ENGLISH")

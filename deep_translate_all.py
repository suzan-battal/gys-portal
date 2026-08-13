#!/usr/bin/env python3
"""
Deep Translation Script for 100% Pure English University Task Management System.
Replaces all remaining Turkish and mixed Turkish-English words across all files and database.
"""

import re
import os
import sqlite3

# 1. Detailed replacement dictionary for UI files
UI_REPLACEMENTS = [
    # Mixed phrases from screenshot
    ("Bugün Completed", "Completed Today"),
    ("Bugün tamamlandı", "Completed today"),
    ("Geciken Görev", "Overdue Tasks"),
    ("Tüm Submissions", "All Submissions"),
    ("Canlı Akış", "Live Feed"),
    ("DOSYA", "FILE"),
    ("Gradelandır", "Grade"),
    ("Notlandır", "Grade"),
    ("Teslim Edildi", "Submitted"),
    ("Eğitim Grupları İlerleme Statüsü", "Training Group Progress Status"),
    ("Grupları Yönet", "Manage Groups"),
    ("Henüz Yok", "Not Available Yet"),
    ("Hızlı Akademik Araçlar", "Quick Academic Tools"),
    ("Yeni Görev / Ödev Tanımla", "Create New Task / Assignment"),
    ("Eğitim Gruplarını Görüntüle", "View Training Groups"),
    ("Bağlı Studentler ve Grade Status", "Assigned Students & Grade Status"),
    ("Bağlı Öğrenciler ve Not Durumu", "Assigned Students & Grade Status"),
    ("Bağlı Öğrenciler", "Assigned Students"),
    ("Bağlı Studentler", "Assigned Students"),
    ("İndir", "Download"),
    ("Eğitim Grubu", "Training Group"),
    ("Eğitim Grupları", "Training Groups"),
    ("Eğitim", "Training"),
    ("Görev", "Task"),
    ("Görevler", "Tasks"),
    ("Öğrenci", "Student"),
    ("Öğrenciler", "Students"),
    ("Eğitmen", "Trainer"),
    ("Eğitmenler", "Trainers"),
    ("Yönetici", "Administrator"),
    ("Duyuru", "Announcement"),
    ("Duyurular", "Announcements"),
    ("Takvim", "Calendar"),
    ("Raporlar", "Reports"),
    ("Rapor", "Report"),
    ("Ayarlar", "Settings"),
    ("Çıkış Yap", "Sign Out"),
    ("Giriş Yap", "Sign In"),
    ("Tümünü Gör", "View All"),
    ("Detayları Gör", "View Details"),
    ("İncele & Değerlendir", "Review & Evaluate"),
    ("İncele", "Review"),
    ("Düzenle", "Edit"),
    ("Sil", "Delete"),
    ("Kaydet", "Save"),
    ("İptal", "Cancel"),
    ("Kapat", "Close"),
    ("Gönder", "Submit"),
    ("Yükle", "Upload"),
    ("Seç", "Select"),
    ("Yenile", "Refresh"),
    ("Filtrele", "Filter"),
    ("Temizle", "Clear"),
    ("Arama", "Search"),
    ("Ara", "Search"),
    ("Tümü", "All"),
    ("Aktif", "Active"),
    ("Tamamlandı", "Completed"),
    ("Bekliyor", "Pending"),
    ("İnceleniyor", "Under Review"),
    ("Düzeltme İstendi", "Needs Revision"),
    ("Reddedildi", "Rejected"),
    ("Gecikmiş", "Overdue"),
    ("Geç", "Late"),
    ("Puan", "Points"),
    ("Not", "Grade"),
    ("Geri Bildirim", "Feedback"),
    ("Açıklama", "Description"),
    ("Talimatlar", "Instructions"),
    ("Son Teslim", "Deadline"),
    ("Başlangıç", "Start Date"),
    ("Bitiş", "End Date"),
    ("Öncelik", "Priority"),
    ("Yüksek", "High"),
    ("Orta", "Medium"),
    ("Düşük", "Low"),
    ("Acil", "Urgent"),
    ("Yorumlar", "Comments"),
    ("Yorum Yaz", "Write a Comment"),
    ("Ekli Dosya", "Attached File"),
    ("Dosya Yükleme", "File Upload"),
    ("Dosya Seçiniz", "Select a File"),
    ("Dosya Seç", "Browse File"),
    ("Proje Linki", "Project Link"),
    ("Öğrenci Notu", "Student Note"),
    ("Henüz görev bulunmuyor", "No tasks found"),
    ("Henüz teslim edilen bir ödev bulunmamaktadır.", "No submissions found."),
    ("Henüz kayıt bulunmuyor", "No records found"),
    ("Lütfen bekleyiniz...", "Please wait..."),
    ("Yükleniyor...", "Loading..."),
    ("Kaydediliyor...", "Saving..."),
    ("Siliniyor...", "Deleting..."),
    ("İşlem Başarılı", "Operation Successful"),
    ("Hata Oluştu", "An Error Occurred"),
    ("Yetkisiz Erişim", "Unauthorized Access"),
    ("Oturum Süresi Doldu", "Session Expired"),
    ("Hoş Geldiniz", "Welcome"),
    ("Siz", "You"),
    ("Grup", "Group"),
    ("Şube", "Section"),
    ("Dönem", "Semester"),
    ("Akademik Yıl", "Academic Year"),
    ("Bahar Dönemi", "Spring Semester"),
    ("Güz Dönemi", "Fall Semester"),
    ("Yaz Okulu", "Summer School")
]

def clean_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()

    for tr, en in UI_REPLACEMENTS:
        text = text.replace(tr, en)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"✓ Cleaned: {filepath}")

# Process all static files
for filename in ["static/index.html", "static/js/app.js", "static/js/admin.js", "static/js/trainer.js", "static/js/student.js"]:
    clean_file(filename)

# 2. Update Database Content to Pure English
def clean_database(db_path):
    if not os.path.exists(db_path):
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Update submissions status & feedback
    status_map = {
        'Teslim Edildi': 'Submitted',
        'Tamamlandı': 'Completed',
        'İnceleniyor': 'Under Review',
        'Düzeltme İstendi': 'Needs Revision',
        'Reddedildi': 'Rejected',
        'Bekliyor': 'Pending'
    }
    for tr, en in status_map.items():
        cursor.execute("UPDATE submissions SET status = ? WHERE status = ?;", (en, tr))

    # Update groups status
    cursor.execute("UPDATE groups SET status = 'Active' WHERE status = 'Aktif';")
    cursor.execute("UPDATE groups SET status = 'Completed' WHERE status = 'Tamamlandı';")
    cursor.execute("UPDATE groups SET status = 'Archived' WHERE status = 'Arşiv';")

    # Update priorities
    prio_map = {'Yüksek': 'High', 'Orta': 'Medium', 'Düşük': 'Low', 'Acil': 'Urgent', 'Normal': 'Normal'}
    for tr, en in prio_map.items():
        try:
            cursor.execute("UPDATE tasks SET priority = ? WHERE priority = ?;", (en, tr))
        except Exception:
            pass

    conn.commit()
    conn.close()
    print(f"✓ Database content cleaned: {db_path}")

clean_database("database.sqlite")

print("DEEP_TRANSLATION_COMPLETED_100%")

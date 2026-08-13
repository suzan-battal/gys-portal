#!/usr/bin/env python3
"""
Deep English Translation Script for All Files
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def deep_translate_app_js():
    fpath = BASE_DIR / "static" / "js" / "app.js"
    with open(fpath, "r", encoding="utf-8") as f:
        c = f.read()

    pairs = [
        # Today Tasks
        ("17. Today's Tasks (Bugünün Görevleri)", "Today's Tasks Hub"),
        ("Tüm aktif, devam eden ve geciken görevlerinizi anlık olarak izleyin ve yönetin.", "Monitor and manage all your active, in-progress, and overdue assignments in real time."),
        ("Tüm Öncelikler (All Priorities)", "All Priorities"),
        ("Tüm Durumlar (All Statuses)", "All Statuses"),
        ("Tüm Gruplar (All Groups)", "All Groups"),
        ("Tüm Görevler", "All Tasks"),
        ("Bugün Bitenler", "Due Today"),
        ("Devam Edenler", "In Progress"),
        ("Gecikenler", "Overdue"),
        ("Tamamlananlar", "Completed"),
        ("Kriterlere uygun görev bulunamadı.", "No tasks found matching your filters."),
        ("Tarih Aralığı", "Date Range"),
        ("Görevi İncele", "View Task"),
        ("Çalışmaya Başla", "Start Working"),
        ("Teslim Et", "Submit"),
        ("Detayları Gör", "View Details"),
        ("Öğrenci:", "Student:"),
        ("Eğitmen:", "Trainer:"),
        ("Son Teslim:", "Due:"),
        ("Tahmini Süre:", "Est. Time:"),
        
        # Announcements
        ("19. Announcements (Duyurular ve Bildirimler)", "Announcements & Notices Hub"),
        ("Akademik duyuruları, sınav takvimlerini ve önemli bildirimleri takip edin.", "Stay informed with academic announcements, exam schedules, and institutional notices."),
        ("Yeni Duyuru Yayınla", "Publish Announcement"),
        ("Tüm Duyurular", "All Announcements"),
        ("Sistem Geneli", "Institution-Wide"),
        ("Eğitim Grupları", "Training Groups"),
        ("Yalnızca Eğitmenler", "Faculty Only"),
        ("Yalnızca Öğrenciler", "Students Only"),
        ("Acil & Önemli", "Urgent & Important"),
        ("Normal", "Normal"),
        ("Düşük", "Low"),
        ("Yüksek", "High"),
        ("Duyuru Başlığı", "Announcement Title"),
        ("Hedef Kitle", "Target Audience"),
        ("Yayınlayan", "Published By"),
        ("Yayın Tarihi", "Publish Date"),
        ("Öncelik", "Priority"),
        ("Henüz yayınlanmış bir duyuru bulunmuyor.", "No announcements published yet."),
        
        # Calendar
        ("20. Academic Calendar (Akademik Takvim)", "Academic Calendar Hub"),
        ("Dersler, ödev teslim tarihleri, sınavlar ve etkinlikleri takvim üzerinden izleyin.", "View classes, assignment deadlines, examinations, and events on the interactive calendar."),
        ("Yeni Etkinlik Ekle", "Add Calendar Event"),
        ("Ödev Teslimi", "Assignment Deadline"),
        ("Canlı Ders / Eğitim", "Live Class / Lecture"),
        ("Sınav / Değerlendirme", "Exam / Assessment"),
        ("Tatil / Ara", "Holiday / Break"),
        ("Genel Etkinlik", "General Event"),
        ("Pazartesi", "Monday"),
        ("Salı", "Tuesday"),
        ("Çarşamba", "Wednesday"),
        ("Perşembe", "Thursday"),
        ("Cuma", "Friday"),
        ("Cumartesi", "Saturday"),
        ("Pazar", "Sunday"),
        ("Ocak", "January"),
        ("Şubat", "February"),
        ("Mart", "March"),
        ("Nisan", "April"),
        ("Mayıs", "May"),
        ("Haziran", "June"),
        ("Temmuz", "July"),
        ("Ağustos", "August"),
        ("Eylül", "September"),
        ("Ekim", "October"),
        ("Kasım", "November"),
        ("Aralık", "December"),
        
        # Reports
        ("21. Reports & Analytics (Raporlar ve Analitik)", "Reports & Analytics Center"),
        ("Öğrenci performansı, tamamlama oranları ve akademik istatistikleri inceleyin.", "Analyze student performance, completion rates, and institutional academic statistics."),
        ("CSV Olarak İndir (Export)", "Export as CSV"),
        ("Rapor Türü Seçin", "Select Report Type"),
        ("Öğrenci Başarı ve Performans Raporu", "Student Academic Performance Report"),
        ("Eğitmen Değerlendirme ve İnceleme Raporu", "Trainer Review & Evaluation Report"),
        ("Grup Bazlı Tamamlama ve İlerleme Raporu", "Group Completion & Progress Report"),
        ("Görev Dağılımı ve Öncelik Analizi", "Task Distribution & Priority Analytics"),
        ("Geciken Görevler ve Risk Analizi", "Overdue Tasks & Academic Risk Analysis"),
        ("Toplam Kayıt", "Total Records"),
        ("Ortalama Başarı", "Average Score"),
        ("Tamamlama Oranı", "Completion Rate"),
        
        # Audit Logs
        ("22. Audit Logs (Denetim Kayıtları)", "Audit Logs & Security Center"),
        ("Sistemde gerçekleşen tüm işlem, giriş, oluşturma ve silme kayıtlarını izleyin.", "Track all system events, authentications, modifications, and deletions in real time."),
        ("Kullanıcı", "User"),
        ("İşlem Türü", "Action Type"),
        ("Kategori", "Category"),
        ("Açıklama / Detay", "Details / Description"),
        ("Tarih ve Saat", "Timestamp"),
        ("IP Adresi", "IP Address"),
        ("Filtrele", "Filter"),
        ("Tüm Kategoriler", "All Categories"),
        ("Kimlik Doğrulama", "Authentication"),
        ("Kullanıcı Yönetimi", "User Management"),
        ("Görev Yönetimi", "Task Management"),
        ("Teslim ve Değerlendirme", "Submissions & Grading"),
        ("Grup Yönetimi", "Group Management"),
        ("Sistem Ayarları", "System Settings"),
        ("Henüz bir denetim kaydı bulunmuyor.", "No audit logs recorded yet."),
        
        # Settings
        ("26.29. System Settings (Sistem Ayarları)", "System Settings & Configuration"),
        ("Platform genel konfigürasyonlarını, dönem ayarlarını ve güvenlik kurallarını yönetin.", "Manage platform configurations, academic terms, submission rules, and security policies."),
        ("Ayarları Kaydet", "Save Settings"),
        ("Genel Ayarlar", "General Settings"),
        ("Sistem Başlığı", "System Title"),
        ("Aktif Akademik Dönem", "Active Academic Term"),
        ("Maksimum Dosya Yükleme Boyutu (MB)", "Max Upload File Size (MB)"),
        ("İzin Verilen Dosya Uzantıları", "Allowed File Extensions"),
        ("Geç Teslimata İzin Ver", "Allow Late Submissions"),
        ("E-posta Bildirimleri", "Email Notifications"),
        ("Bakım Modu", "Maintenance Mode"),
        ("Açık", "Enabled"),
        ("Kapalı", "Disabled"),
        ("Ayarlar başarıyla kaydedildi!", "Settings saved successfully!"),
        
        # Discussion thread
        ("Öğrenci veya Eğitmene bu görevle ilgili bir soru, not veya yorum yazınız...", "Write a question, note, or comment regarding this assignment..."),
        ("Yorumu Gönder (Send Comment)", "Send Comment"),
        ("Yorumlar", "Comments"),
        ("Yorum", "Comment"),
        ("Dosya İndir", "Download File"),
        ("Bağlantıyı Aç", "Open Link"),
        ("Henüz bir yorum yapılmamış. İlk yorumu siz yazın!", "No comments posted yet. Be the first to start the discussion!"),
        
        # Confirm & Delete
        ("Silmek istediğinize emin misiniz?", "Are you sure you want to delete this item?"),
        ("Bu işlem geri alınamaz.", "This action cannot be undone."),
        ("Sil", "Delete"),
        ("İptal", "Cancel"),
        ("Kaydet", "Save"),
        ("Kapat", "Close")
    ]

    for t, r in pairs:
        c = c.replace(t, r)

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(c)
    print("✓ static/js/app.js deep translated.")

if __name__ == "__main__":
    deep_translate_app_js()
    print("Translation complete!")

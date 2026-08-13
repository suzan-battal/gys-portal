#!/usr/bin/env python3
"""
Translate static/documentation.html to 100% pure English.
"""

with open("static/documentation.html", "r", encoding="utf-8") as f:
    doc = f.read()

DOC_REPLACEMENTS = [
    ("TTMS - Proje Şartnamesi ve Teknik Dokümantasyon Raporu", "TTMS - Project Specification & Technical Architecture Documentation Report"),
    ("Proje Analiz, Mimari ve Teknik Dokümantasyon Raporu (Project Documentation)", "University Task & Training Management Platform - Architectural Specification & Technical Report"),
    ("⬅ Sisteme Dön", "⬅ Return to Portal"),
    ("🖨️ Raporu Yazdır / PDF", "🖨️ Print Report / Export PDF"),
    ("NİHAİ PROJE ŞARTNAME BEYANI VE ÖZET", "FINAL PROJECT SPECIFICATION STATEMENT & ARCHITECTURAL SUMMARY"),
    ("Üniversite Görev ve Eğitim Yönetim Platformu (TTMS) - 31 Maddelik Tam Kapsamlı Mimari Dokümanı", "University Task & Training Management Platform (TTMS) - Comprehensive 31-Section Architectural & Technical Specification"),
    ("✓ %100 Uçtan Uca Tamamlandı ve Doğrulandı", "✓ 100% Fully Implemented, Tested & Verified"),
    ("1. Kimlik & Rol Mimarisi", "1. Identity & Role Architecture"),
    ("2. Görev & Teslimat Döngüsü", "2. Task & Submission Lifecycle"),
    ("3. İnceleme & 100 Puan Rubrik", "3. Evaluation & 100-Point Rubric"),
    ("4. Güvenlik & Denetim (Audit)", "4. Security & Audit Logging"),
    ("PROJE MİMARİ VE FONKSİYONEL ŞARTNAME MADDELERİ", "PROJECT ARCHITECTURAL & FUNCTIONAL SPECIFICATION MATRIX"),
    ("Bölüm", "Section"),
    ("Şartname Maddesi", "Specification Requirement"),
    ("Açıklama & Mimari Detay", "Architectural Description & Details"),
    ("Teknik Altyapı", "Technical Stack & Modules"),
    ("Durum", "Status"),
    ("Tamamlandı", "Completed"),
    ("Aktif", "Active"),
    ("Doğrulandı", "Verified"),
    ("Yetkilendirme", "Authorization"),
    ("Roller ve İzinler", "Roles and Permissions"),
    ("Kullanıcı Yönetimi", "User Management"),
    ("Eğitim Grupları", "Training Groups"),
    ("Görev Yaşam Döngüsü", "Task Lifecycle"),
    ("Dosya Yükleme ve Teslimat", "File Upload & Submissions"),
    ("Değerlendirme ve Notlandırma", "Evaluation and Grading"),
    ("100 Puanlık Rubrik Modeli", "100-Point Rubric Model"),
    ("Görev Yorumları ve Tartışma", "Task Comments and Discussion"),
    ("Bildirim Merkezi", "Notification Center"),
    ("Akademik Takvim Modülü", "Academic Calendar Module"),
    ("Duyurular ve İletişim", "Announcements & Communication"),
    ("Raporlar ve Analitik Merkezi", "Reports & Analytics Center"),
    ("Denetim Kayıtları (Audit Logs)", "Audit Logs & Security Monitoring"),
    ("Veritabanı Tablo Mimarisi", "Database Schema & Data Dictionary"),
    ("Sistem Ayarları ve Konfigürasyon", "System Settings & Configuration"),
    ("Giriş Yap", "Sign In"),
    ("Çıkış Yap", "Sign Out"),
    ("Öğrenci", "Student"),
    ("Eğitmen", "Trainer"),
    ("Yönetici", "Administrator"),
    ("Süper Admin", "Super Admin"),
    ("Eğitim Müdürü", "Training Manager"),
    ("Asistan Eğitmen", "Assistant Trainer"),
    ("İstanbul Üniversitesi", "Istanbul University"),
    ("Bilgisayar Mühendisliği", "Computer Science & Engineering"),
    ("Yazılım Mühendisliği", "Software Engineering"),
    ("Yapay Zeka ve Veri Analitiği", "Artificial Intelligence & Data Analytics"),
    ("Siber Güvenlik ve Ağ Sistemleri", "Cyber Security & Network Systems")
]

for tr, en in DOC_REPLACEMENTS:
    doc = doc.replace(tr, en)

with open("static/documentation.html", "w", encoding="utf-8") as f:
    f.write(doc)

print("✓ static/documentation.html updated with English translations!")

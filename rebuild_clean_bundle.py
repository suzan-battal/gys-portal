#!/usr/bin/env python3
"""
Complete Turkish to English Cleaners
Replaces every remaining Turkish text, HTML comment, toast, and placeholder across all JS and HTML files.
"""

import os
import re

EXTREME_TRANSLATION_MAP = [
    # UI Elements & Comments
    ("Yeni Group Oluştur", "Create New Group"),
    ("Welcome Hero Bannerı", "Welcome Hero Banner"),
    ("Welcome Bannerı (Hero Banner)", "Welcome Hero Banner"),
    ("7x KPI İstatistik Kartları", "7x KPI Statistics Cards"),
    ("4x KPI İstatistik Kartları", "4x KPI Statistics Cards"),
    ("5x KPI İstatistik Kartları", "5x KPI Statistics Cards"),
    ("2-Kolonlu Düzen", "2-Column Layout"),
    ("2-Kolonlu Zengin Düzen", "2-Column Rich Layout"),
    ("2-Kolonlu Zengin Ana Düzen", "2-Column Rich Main Layout"),
    ("SOL SÜTUN", "LEFT COLUMN"),
    ("SAĞ SÜTUN", "RIGHT COLUMN"),
    ("SOL: Haftalık İlerleme", "LEFT: Weekly Progress"),
    ("SAĞ: Donut Grafik", "RIGHT: Donut Chart"),
    ("Task History ve Grade Detailsları", "Task History & Grade Details"),
    ("Son Aktiviteler & Timestamp (When) Çizelgesi", "Recent Activities & Timeline"),
    ("Revizyon İstendi", "Needs Revision"),
    ("Dosya boyutu çok büyük. Maksimum 25 MB yükleyebilirsiniz.", "File size is too large. Maximum allowed size is 25 MB."),
    ("Lütfen bir dosya seçin veya proje linki girin.", "Please select a file or enter a project link."),
    ("İnceleme bekleyen teslimat bulunmamaktadır.", "No submissions pending review."),
    ("Tüm Submissionsi Listele", "List All Submissions"),
    ("Studenti Sil", "Delete Student"),
    ("Traineri Sil", "Delete Trainer"),
    ("Userı Sil", "Delete User"),
    ("Groupu Sil", "Delete Group"),
    ("Taski Sil", "Delete Task"),
    ("İşlem geri alınamaz!", "This action cannot be undone!"),
    ("Evet, Sil", "Yes, Delete"),
    ("Vazgeç", "Cancel"),
    ("Kapat", "Close"),
    ("Kaydet", "Save"),
    ("Yükleniyor...", "Loading..."),
    ("Kaydediliyor...", "Saving..."),
    ("Siliniyor...", "Deleting..."),
    ("Başarılı", "Success"),
    ("Hata", "Error"),
    ("Uyarı", "Warning"),
    ("Bilgi", "Information"),
    ("GENEL BİLGİLER", "GENERAL INFORMATION"),
    ("Proje Adı", "Project Name"),
    ("Versiyon", "Version"),
    ("Geliştirici", "Developer"),
    ("Tarih", "Date"),
    ("Hedef Kurum", "Target Institution"),
    ("MİMARİ ŞARTNAME", "ARCHITECTURAL SPECIFICATION"),
    ("FONKSİYONEL ÖZELLİKLER", "FUNCTIONAL FEATURES"),
    ("VERİTABANI MİMARİSİ", "DATABASE ARCHITECTURE"),
    ("GÜVENLİK VE DENETİM", "SECURITY & AUDIT"),
    ("RUBRİK NOTLANDIRMA MODELİ", "RUBRIC GRADING MODEL")
]

def clean_entire_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    for tr, en in EXTREME_TRANSLATION_MAP:
        content = content.replace(tr, en)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✓ Extreme Clean: {filepath}")

for fp in ["static/js/app.js", "static/js/admin.js", "static/js/trainer.js", "static/js/student.js", "static/documentation.html"]:
    clean_entire_file(fp)

# Rebuild app.bundle.js
with open("static/js/app.js", "r", encoding="utf-8") as f:
    app_js = f.read()
with open("static/js/admin.js", "r", encoding="utf-8") as f:
    admin_js = f.read()
with open("static/js/trainer.js", "r", encoding="utf-8") as f:
    trainer_js = f.read()
with open("static/js/student.js", "r", encoding="utf-8") as f:
    student_js = f.read()

bundle_content = f"{admin_js}\n\n{trainer_js}\n\n{student_js}\n\n{app_js}"
with open("static/js/app.bundle.js", "w", encoding="utf-8") as f:
    f.write(bundle_content)
print("✓ Rebuilt static/js/app.bundle.js from clean English source files!")

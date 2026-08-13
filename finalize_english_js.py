#!/usr/bin/env python3
"""
Finalize All Remaining JavaScript Strings into English
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def fix_app_js():
    fpath = BASE_DIR / "static" / "js" / "app.js"
    with open(fpath, "r", encoding="utf-8") as f:
        c = f.read()

    pairs = [
        ("Görevler yükleniyor...", "Loading tasks..."),
        ("Tüm Günlük Görevler", "All Daily Tasks"),
        ("Tasks (Görevler)", "Tasks & Assignments"),
        ("{ id: 'tasks_report', title: '4. Görevler ve Teslimat', icon: '📋', desc: 'Tasks Report' },", "{ id: 'tasks_report', title: '4. Tasks & Submissions', icon: '📋', desc: 'Tasks Distribution Report' },"),
        ("{ id: 'late_tasks_report', title: '5. Overdue Görevler', icon: '⏰', desc: 'Late Tasks Report' },", "{ id: 'late_tasks_report', title: '5. Overdue Tasks', icon: '⏰', desc: 'Overdue & Risk Analysis Report' },"),
        ("{ label: 'Acil Priorityli Görevler', val: kpis.urgent_tasks_count || 0, icon: '🚨', color: '#DC2626' }", "{ label: 'Urgent Priority Tasks', val: kpis.urgent_tasks_count || 0, icon: '🚨', color: '#DC2626' }"),
        ("{ label: 'Bekleyen Acil Görevler', val: kpis.pending_urgent_count || 0, icon: '⚠️', color: '#D97706' }", "{ label: 'Pending Urgent Tasks', val: kpis.pending_urgent_count || 0, icon: '⚠️', color: '#D97706' }"),
        ("Grup Görevleri", "Group Tasks"),
        ("3. Görevler, Teslimler ve Değerlendirmeler", "3. Tasks, Submissions & Evaluations"),
        ("1. Kullanıcılar ve Kimlik Yönetimi", "1. Users & Authentication"),
        ("2. Eğitim Grupları ve Şubeler", "2. Training Cohorts & Groups"),
        ("4. İletişim, Duyurular ve Bildirimler", "4. Announcements & Notifications"),
        ("5. Takvim, Oturumlar ve Yoklama", "5. Calendar, Sessions & Attendance"),
        ("6. Güvenlik, Denetim ve Sistem Ayarları", "6. Security, Audit Logs & Settings"),
        ("7. Genişletme: Projeler ve Taksonomi", "7. Extensions: Projects & Tags"),
        ("Öğrenci Yükleniyor...", "Loading Student..."),
        ("Eğitmen Yükleniyor...", "Loading Trainer..."),
        ("Kayıt Tarihi", "Registration Date"),
        ("Son Giriş", "Last Login"),
        ("Rol & Yetki", "Role & Permission"),
        ("Kullanıcı Profili", "User Profile"),
        ("Görev Seçiniz", "Select a Task")
    ]

    for t, r in pairs:
        c = c.replace(t, r)

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(c)
    print("✓ static/js/app.js finalized in English.")

def fix_trainer_js():
    fpath = BASE_DIR / "static" / "js" / "trainer.js"
    with open(fpath, "r", encoding="utf-8") as f:
        c = f.read()

    pairs = [
        ("Sorumlu Olduğum Görevler ve Statusları", "Assigned Tasks & Status Roster"),
        ("Sorumlu Olduğum Eğitim Grupları", "My Assigned Training Groups"),
        ("Sorumlu Olduğum Öğrenciler", "My Enrolled Students"),
        ("İnceleme Bekleyen Ödevler", "Submissions Pending Review"),
        ("Yeni Görev Tanımla", "Create New Task"),
        ("Yeni Grup Aç", "Create New Group"),
        ("Ödev Teslimleri & Değerlendirme", "Submissions & Grading Hub"),
        ("Grup Adı & Uzmanlık", "Group Name & Department"),
        ("Öğrenci Mevcudu", "Enrolled Students"),
        ("Toplam Görev", "Total Tasks"),
        ("Biten Görev", "Completed Tasks"),
        ("İlerleme (% Progress)", "Progress (%)"),
        ("Ortalama Not", "Average Grade"),
        ("Durum", "Status"),
        ("İşlemler", "Actions"),
        ("İncele & Not Ver", "Review & Grade"),
        ("Detay", "Details"),
        ("Düzenle", "Edit"),
        ("Sil", "Delete"),
        ("Öncelik", "Priority"),
        ("Hedef", "Target"),
        ("Son Teslim", "Due Date"),
        ("Teslim Oranı", "Submission Rate"),
        ("Normal", "Medium"),
        ("Yüksek", "High"),
        ("Acil", "Urgent"),
        ("Düşük", "Low")
    ]

    for t, r in pairs:
        c = c.replace(t, r)

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(c)
    print("✓ static/js/trainer.js finalized in English.")

if __name__ == "__main__":
    fix_app_js()
    fix_trainer_js()
    print("✓ All JS files finalized!")

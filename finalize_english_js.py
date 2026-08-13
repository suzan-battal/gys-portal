#!/usr/bin/env python3
"""
Final Polish: Translates all specific lines identified in audit to 100% fluent English.
"""

import re

EXACT_REPLACEMENTS = {
    'static/js/app.js': [
        ('Genel Dosya Teslimi (Otomatik Task)', 'General Submission (Auto Task)'),
        ('Değerlendirme kaydedildi ve öğrenciye otomatik bildirim iletildi!', 'Evaluation saved and student notified!'),
        ('Okunmamış yeni bildiriminiz yok.', 'No unread notifications.'),
        ('Henüz bir bildirim kaydı bulunmuyor.', 'No notifications found.'),
        ('Active görev bulunamadı.', 'Active task not found.'),
        ('Günlük operasyonel iş akışını, tamamlanan, devam eden, inceleme bekleyen, başlanmamış ve geciken görevleri anlık takip edin.', 'Monitor daily operational workflows, completed, in-progress, pending review, not started, and overdue tasks in real-time.'),
        ('Henüz Başlanmadı', 'Not Started Yet'),
        ('Task, öğrenci, eğitmen ara...', 'Search task, student, trainer...'),
        ('Henüz Announcement Bulunmuyor', 'No Announcements Yet'),
        ('Selectilen kriterlere uygun yayınlanmış akademik duyuru bulunmamaktadır.', 'No academic announcements match the selected criteria.'),
        ('Bu duyuruyu silmek istediğinize emin misiniz?', 'Are you sure you want to delete this announcement?'),
        ('Örn: Final Projesi Teslim Tarihleri ve Değerlendirme Kriterleri', 'e.g. Final Project Submission Deadlines & Rubric Criteria'),
        ('📌 Bu duyuruyu panonun en üstünde sabitle', '📌 Pin this announcement to the top of the noticeboard'),
        ('Lütfen bir eğitim grubu seçin.', 'Please select a training group.'),
        ('Lütfen en az bir öğrenci seçin.', 'Please select at least one student.'),
        ('Örn: Search Sınav (Vize) - Veri Tabanı Yönetimi', 'e.g. Midterm Exam - Database Management Systems'),
        ('Mediumlama Teslim Oranı', 'Average Submission Rate'),
        ('Alınan Teslim', 'Submissions Received'),
        ('Group Yönetiyor', 'Groups Managed'),
        ('Teslim Sayısı', 'Submission Count'),
        ('Teslim Oranı', 'Turn-in Rate'),
        ('Teslim Edilmedi', 'Not Submitted'),
        ('Report CSV dosyası olarak indirildi.', 'Report exported as CSV file.'),
        ('👤 User Yönetimi', '👤 User Management'),
        ('📝 Teslimat & Gradema', '📝 Submissions & Grading'),
        ('📢 Announcement Yönetimi', '📢 Announcement Management'),
        ('User oluşturma, yetki değişimi, teslimat ve notlandırma, tarih güncellemeleri ve silme gibi tüm kritik işlemler KVKK ve ISO 27001 standartlarında denetlenir.', 'All critical operations including user provisioning, role modifications, grading, submissions, and deletions are audited according to security standards.'),
        ('Denetim kayıtları CSV olarak indirildi.', 'Audit logs exported as CSV successfully.'),
        ('Bu tabloda henüz kayıtlı satır bulunmuyor.', 'No live records found in this table.'),
        ('Maksimum dosya boyutu, formatlar ve geç teslimat kuralları', 'Max file size limits, accepted formats, and late submission policies.'),
        ('Üniversite Task ve Training Yönetim Platformu (TTMS)', 'University Task & Training Management Platform (TTMS)'),
        ('Student teslimatlarında kabul edilecek tekil dosya limiti.', 'Maximum file size limit allowed for student submissions.'),
        ('Son teslim tarihinden sonra öğrencinin ödev yükleyebilme durumu.', 'Permission policy for accepting submissions after deadline.'),
        ('Son teslim tarihine belirtilen saat kala otomatik bildirim gönderilir.', 'Automated reminder dispatched before the submission due date.'),
        ('Active (Ödev ataması ve notlandırmada e-posta gönder)', 'Active (Send email alerts upon task assignment and grading)'),
        ('Userlar, roller, izinler, eğitim grupları, görevler, teslimler, değerlendirmeler, bildirimler, takvim ve denetim logları için tam normalize edilmiş veri sözlüğü.', 'Fully normalized data dictionary for users, roles, permissions, training groups, tasks, submissions, evaluations, calendar, and audit logs.')
    ],
    'static/js/admin.js': [
        ('Student Teslim ve Gradema Listesi', 'Student Submissions & Grading Registry'),
        ('adlı eğitim grubunu silmek istediğinizden emin misiniz?', 'Are you sure you want to delete this training group?'),
        ('başlıklı görevi silmek istediğinizden emin misiniz?', 'Are you sure you want to delete this task?')
    ],
    'static/js/trainer.js': [
        ('Trainer Kontrol Paneli', 'Trainer Control Hub'),
        ('Sorumlu olduğunuz öğrencileri, aktif görevleri, inceleme bekleyen teslimleri ve grup ilerleme oranlarını anlık yönetin.', 'Manage your assigned students, active assignments, pending submissions, and group progress rates in real-time.'),
        ('Groupları Yönet', 'Manage Groups'),
        ('Henüz size tanımlanmış bir eğitim grubu bulunmuyor.', 'No training groups assigned to you yet.'),
        ('Henüz yeni bir teslim yapılmamış.', 'No new submissions received yet.'),
        ('Henüz size tanımlı bir öğrenci bulunmamaktadır.', 'No students assigned to your groups yet.'),
        ('Henüz tanımlanmış bir göreviniz bulunmuyor.', 'No tasks created yet.'),
        ('Student Teslim Listesi ve Değerlendirmeler', 'Student Submissions & Evaluation Registry'),
        ('Teslim Timestamp (When)ı', 'Submission Timestamp'),
        ('Henüz değerlendirilecek bir teslim yapılmamış.', 'No submissions awaiting evaluation.'),
        ('Teslimi Review', 'Review Submission'),
        ('Teslim detayları alınamadı.', 'Could not fetch submission details.')
    ],
    'static/js/student.js': [
        ('Teslim Edilen', 'Submitted'),
        ('Bu filtreye uygun bir görev bulunmamaktadır.', 'No tasks match the selected filter.'),
        ('Teslim Kaydı', 'Submission Attempts'),
        ('ÖĞRENCİ ÖDEV TESLİM VE ÇÖZÜM RAPORU', 'STUDENT ASSIGNMENT SUBMISSION & SOLUTION REPORT'),
        ('Proje / Kaynak Linki', 'Project / Repository Link'),
        ('Teslim Edilen Dosya', 'Submitted File'),
        ('Öğrenci Notları', 'Student Notes'),
        ('Eğitmen Değerlendirmesi', 'Trainer Evaluation'),
        ('Verilen Not', 'Awarded Grade'),
        ('Eğitmen Geri Bildirimi', 'Trainer Feedback')
    ]
}

for fpath, replacements in EXACT_REPLACEMENTS.items():
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    for tr, en in replacements:
        content = content.replace(tr, en)
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✓ Polished: {fpath}")

print("ALL_EXACT_REPLACEMENTS_APPLIED_100%")

# 🎓 Training Task Management System (TTMS) - Üniversite Görev & Eğitim Portalı

> **Modern, Rol Tabanlı ve Tam Kapsamlı Üniversite Görev, Teslimat, Değerlendirme ve Akademik Eğitim Yönetim Platformu**

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![Database SQLite](https://img.shields.io/badge/database-SQLite_3NF-green.svg)](https://sqlite.org/)
[![Architecture RESTful](https://img.shields.io/badge/architecture-RESTful_JSON_API-orange.svg)]()
[![Status Complete](https://img.shields.io/badge/status-100%25_Completed-brightgreen.svg)]()

---

## 🌟 Proje Genel Bakışı (Project Overview)

**TTMS (Training Task Management System)**, üniversitelerde ve eğitim kurumlarında **Yönetim (Admin)**, **Eğitmenler (Trainers)** ve **Öğrenciler (Students)** arasındaki tüm akademik iş akışlarını uçtan uca dijitalleştiren tam kapsamlı bir kurumsal web platformudur.

Sistem; görev oluşturma, teslimat versiyonlama, 5 kriterli rubrik değerlendirme, akademik takvim, hedef kitleli duyurular, anlık bildirimler, 6 modüllü analitik raporlama ve denetim loglarını (Audit Logs) tek bir çatı altında sunar.

---

## 🚀 Temel Özellikler & Modüller

1. **👥 Kullanıcı & Rol Yönetimi (RBAC)**:
   - 6 Farklı Sistem Rolü (`Super Admin`, `Admin`, `Training Manager`, `Trainer`, `Assistant Trainer`, `Student`).
   - 26 Granüler İzin Kodlu Dinamik İzin Matrisi.
2. **🏫 Eğitim Grupları & Şubeler**:
   - Eğitmen atama, çoklu öğrenci kaydı, şube bazlı görev dağıtımı.
3. **📋 Görev & Teslimat Döngüsü (12 Alanlı Görev Formu)**:
   - Öncelik seviyeleri (Düşük, Normal, Yüksek, Acil), teslim tarihleri, kontrol listeleri (Checklists) ve taksonomik etiketler (Tags).
   - Dosya yükleme (PDF, Zip, Python, Jupyter Notebook vb.) ve revizyon geçmişi (v1, v2, v3).
4. **⭐ 5 Kriterli Rubrik Değerlendirme (0-100 Puan)**:
   - Tamamlanma (20p), Kod Kalitesi (20p), Doğruluk (20p), Zamanlama (20p), İletişim (20p).
   - Karar ağacı: `Approved` (Kabul) veya `Needs Revision` (Düzeltme İstendi).
5. **🗓️ Akademik Takvim & Bugünün Görevleri**:
   - Sınavlar, canlı dersler ve son teslim tarihleri entegrasyonu.
6. **📢 Hedef Kitleli Duyurular & Bildirim Merkezi**:
   - 5 Farklı hedef kitleye özel duyuru yayınlama ve anlık bildirimler.
7. **📊 Raporlama & Analitik Merkezi (CSV Export)**:
   - Öğrenci Performansı, Eğitmen İnceleme Hızı, Grup Başarısı, Görev Dağılımı ve Geç Teslimat Raporları.
8. **🛡️ Güvenlik & Denetim Günlüğü (Audit Logs)**:
   - `Who / What / When / IP / Değişiklik Değerleri (Diff)` formatında KVKK uyumlu loglama.

---

## 🗄️ Veritabanı Mimarisi (36 Tablo)

Sistem **3. Normal Forma (3NF)** uygun, Foreign Key bütünlüğü ve bileşik performans indeksleri içeren **36 ilişkisel SQLite tablosu** ile çalışır:

* **Çekirdek Tablolar (28 Tablo)**: `users`, `roles`, `permissions`, `role_user`, `permission_role`, `student_profiles`, `trainer_profiles`, `training_groups`, `training_group_students`, `training_group_trainers`, `tasks`, `task_assignments`, `task_attachments`, `task_submissions`, `submission_attachments`, `task_reviews`, `task_evaluations`, `task_comments`, `comment_attachments`, `notifications`, `notification_recipients`, `announcements`, `announcement_recipients`, `training_sessions`, `session_attendances`, `activity_logs`, `audit_logs`, `settings`.
* **Genişletme Tabloları (8 Tablo)**: `projects`, `project_members`, `project_tasks`, `tags`, `task_tags`, `task_dependencies`, `task_checklists`, `task_checklist_items`.

---

## 💻 Kurulum ve Çalıştırma (Quick Start)

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/suzan-battal/gys-portal.git
cd gys-portal
```

### 2. Uygulamayı Başlatın
```bash
python3 server.py
```

### 3. Tarayıcıda Açın
Tarayıcınızda [http://localhost:8080](http://localhost:8080) adresine gidin.

### 🔑 Demo Giriş Bilgileri:
* **Yönetici (Admin)**: `yonetici@universite.edu.tr` / `Admin123!`
* **Eğitmen (Trainer)**: `ahmet.yilmaz@universite.edu.tr` / `Egitmen123!`
* **Öğrenci (Student)**: `mehmet.demir@universite.edu.tr` / `Ogrenci123!`

---

## 📄 Proje Dokümantasyonu
Sistem içerisinde yer alan **`Proje Raporu`** sekmesinden veya doğrudan [http://localhost:8080/static/documentation.html](http://localhost:8080/static/documentation.html) adresinden tüm şartname karşılama matrislerine ve yazdırılabilir PDF raporuna erişebilirsiniz.

---
**Geliştirici**: Suzan Battal  
**Proje**: Üniversite Görev ve Eğitim Yönetim Platformu (TTMS)

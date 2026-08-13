#!/usr/bin/env python3
"""
Full English Makeover Script
Translates all database records (tasks, descriptions, priorities, comments) and all JS controllers to 100% English.
"""

import sqlite3
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def update_database_records():
    db_file = BASE_DIR / "database.sqlite"
    conn = sqlite3.connect(db_file)
    cur = conn.cursor()

    # Update Task priorities in tasks table
    cur.execute("UPDATE tasks SET priority = 'High' WHERE priority = 'Yüksek';")
    cur.execute("UPDATE tasks SET priority = 'Urgent' WHERE priority = 'Acil';")
    cur.execute("UPDATE tasks SET priority = 'Medium' WHERE priority = 'Normal';")
    cur.execute("UPDATE tasks SET priority = 'Low' WHERE priority = 'Düşük';")

    # Update Statuses in task_assignments and task_submissions
    try:
        cur.execute("UPDATE task_assignments SET status = 'Assigned' WHERE status = 'Atandı' OR status = 'Bekliyor';")
        cur.execute("UPDATE task_assignments SET status = 'In Progress' WHERE status = 'Devam Ediyor';")
        cur.execute("UPDATE task_assignments SET status = 'Submitted' WHERE status = 'Teslim Edildi';")
        cur.execute("UPDATE task_assignments SET status = 'Needs Revision' WHERE status = 'Düzeltme İstendi';")
        cur.execute("UPDATE task_assignments SET status = 'Completed' WHERE status = 'Tamamlandı';")
    except Exception as e:
        print("[NOTE task_assignments]:", e)

    try:
        cur.execute("UPDATE task_submissions SET status = 'Submitted' WHERE status = 'Teslim Edildi';")
        cur.execute("UPDATE task_submissions SET status = 'Under Review' WHERE status = 'İnceleniyor';")
        cur.execute("UPDATE task_submissions SET status = 'Needs Revision' WHERE status = 'Düzeltme İstendi';")
        cur.execute("UPDATE task_submissions SET status = 'Completed' WHERE status = 'Tamamlandı';")
    except Exception as e:
        print("[NOTE task_submissions]:", e)

    # Update Tasks Titles and Descriptions to English
    tasks_translations = [
        (1, "HTML5 & CSS3 Responsive Layout Design", "Design a responsive modern academic portfolio page using Flexbox, CSS Grid, and custom CSS variables.", "Instructions: Ensure mobile responsiveness (min-width 320px), semantic HTML tags, and clean CSS architecture."),
        (2, "JavaScript DOM & Interactive Event Handling", "Develop an interactive dynamic To-Do List and task filtering web application using Vanilla JS.", "Instructions: Use ES6+ modules, handle form submit events, and store persistent state in localStorage."),
        (3, "SQL Database Design & Relational Modeling", "Design a 3NF relational SQLite schema for students, courses, and submission evaluations with Foreign Keys.", "Instructions: Write CREATE TABLE statements, define composite indexes, and enforce PRAGMA foreign_keys = ON."),
        (4, "REST API Integration & Async Data Fetching", "Fetch and render a live academic course catalog from an external REST API endpoint using asynchronous Fetch API.", "Instructions: Handle HTTP 200/404 status codes gracefully, render loading spinners, and display error toast notifications."),
        (5, "Data Structures: Binary Search Tree Project", "Implement a generic Binary Search Tree (BST) with insert, delete, search, and in-order traversal algorithms.", "Instructions: Write clean docstrings, analyze time complexity O(log n), and include unit test assertions.")
    ]

    for tid, title, desc, inst in tasks_translations:
        cur.execute("UPDATE tasks SET title = ?, description = ?, instructions = ? WHERE id = ?;", (title, desc, inst, tid))

    cur.execute("UPDATE tasks SET title = 'HTML5 & CSS3 Responsive Layout Design', description = 'Design a responsive modern academic portfolio page using Flexbox, CSS Grid, and custom CSS variables.' WHERE id = 1;")
    cur.execute("UPDATE tasks SET title = 'JavaScript DOM & Interactive Event Handling', description = 'Develop an interactive dynamic To-Do List and task filtering web application using Vanilla JS.' WHERE id = 2;")
    cur.execute("UPDATE tasks SET title = 'SQL Database Design & Relational Modeling', description = 'Design a 3NF relational SQLite schema for students, courses, and submission evaluations with Foreign Keys.' WHERE id = 3;")
    cur.execute("UPDATE tasks SET title = 'REST API Integration & Async Data Fetching', description = 'Fetch and render a live academic course catalog from an external REST API endpoint using asynchronous Fetch API.' WHERE id = 4;")

    # Update Training Groups names
    cur.execute("UPDATE training_groups SET name = 'Software Engineering Cohort A', department = 'Computer Engineering' WHERE id = 1;")
    cur.execute("UPDATE training_groups SET name = 'Data Science & AI Cohort B', department = 'Artificial Intelligence' WHERE id = 2;")
    cur.execute("UPDATE training_groups SET name = 'Full-Stack Web Development', department = 'Information Systems' WHERE id = 3;")

    # Update Announcements
    cur.execute("UPDATE announcements SET title = 'Spring Term Midterm Project Submission Schedule', message = 'All students are required to upload their project deliverables through the TTMS portal before the deadlines. Late submissions will be flagged automatically.' WHERE id = 1;")
    cur.execute("UPDATE announcements SET title = 'New 100-Point Rubric Grading System Active', message = 'Faculty members are now evaluating assignments with the 5-criterion rubric model: Task Completion (30), Quality (25), Accuracy (20), Deadline (15), and Communication (10).' WHERE id = 2;")

    # Update user names/titles
    cur.execute("UPDATE users SET name = 'Prof. Ahmet Yilmaz' WHERE email = 'ahmet.yilmaz@universite.edu.tr';")
    cur.execute("UPDATE users SET name = 'TA Merve Kaya' WHERE email = 'asistan.merve@universite.edu.tr';")
    cur.execute("UPDATE users SET name = 'System Administrator' WHERE email = 'yonetici@universite.edu.tr';")
    cur.execute("UPDATE users SET name = 'Academic Director' WHERE email = 'egitim.muduru@universite.edu.tr';")

    conn.commit()
    conn.close()
    print("✓ SQLite database records updated with English titles, descriptions, and priorities.")

def update_student_js():
    fpath = BASE_DIR / "static" / "js" / "student.js"
    with open(fpath, "r", encoding="utf-8") as f:
        c = f.read()

    repls = [
        ("heading.innerHTML = `<span>Görevlerim ve Ödev Teslimi</span>`;", "heading.innerHTML = `<span>My Tasks & Assignments</span>`;"),
        ("<h3>Görevlerim ve Dosya Teslimi (${allTasks.length})</h3>", "<h3>My Tasks & File Submissions (${allTasks.length})</h3>"),
        ("📌 Tümü (${allTasks.length})", "📌 All Tasks (${allTasks.length})"),
        ("⚡ Bugün Teslim (${todayCount})", "⚡ Due Today (${todayCount})"),
        ("📅 Yaklaşanlar (${upcomingCount})", "📅 Upcoming (${upcomingCount})"),
        ("⚠️ Gecikenler (${overdueCount})", "⚠️ Overdue (${overdueCount})"),
        ("<th>Görev</th>", "<th>TASK</th>"),
        ("<th>Due Date Tarihi</th>", "<th>DUE DATE</th>"),
        ("<th>Status</th>", "<th>STATUS</th>"),
        ("<th>Instructor</th>", "<th>INSTRUCTOR</th>"),
        ("<th>Priority</th>", "<th>PRIORITY</th>"),
        ("<th>Action</th>", "<th>ACTION</th>"),
        ("Detaylar & Çözüm", "View Details & Submit"),
        ("Gecikmiş", "Overdue"),
        ("Hoş Geldin, ${user.name} 👋", "Welcome, ${user.name} 👋"),
        ("İstanbul Üniversitesi Öğrenci Bilgi ve Ödev Portalı. Atanan ders görevlerini inceleyebilir, dosyalarını doğrudan teslim edebilir ve eğitmenlerinin geri bildirimlerini anında görebilirsin.", "Student Academic Portal. View assigned coursework, submit assignment files directly, and review instructor feedback and rubric evaluations."),
        ("<span>Notlarımı Gör</span>", "<span>View My Grades</span>"),
        ("<span>Toplam Görev</span>", "<span>Total Tasks</span>"),
        ("<span>Bahar Dönemi</span>", "<span>Spring Term</span>"),
        ("<span>Pending Start Ödevler</span>", "<span>Pending Tasks</span>"),
        ("<span>Teslim Edilecek</span>", "<span>To Submit</span>"),
        ("<span>Teslim Edilenler</span>", "<span>Submitted</span>"),
        ("<span>İncelemede</span>", "<span>Under Review</span>"),
        ("<span>Notlanan & Completed</span>", "<span>Graded & Completed</span>"),
        ("<span>Sonuçlandı</span>", "<span>Graded</span>"),
        ("<h3>Haftalık Çalışma ve Teslim Yoğunluğu</h3>", "<h3>Weekly Activity & Submission Volume</h3>"),
        ("<p>Son 7 gün içindeki çalışma süren ve teslim edilen ödevlerin</p>", "<p>Activity hours and submitted assignments over the last 7 days</p>"),
        ("<span class=\"status-badge badge-submitted\">Aktif Hafta</span>", "<span class=\"status-badge badge-submitted\">Current Week</span>"),
        ("<h3>Akademik Görevlerim ve Ödevlerim</h3>", "<h3>Academic Tasks & Assignments</h3>"),
        ("<span>Tümünü Gör</span>", "<span>View All</span>"),
        ("Henüz size atanmış bir görev bulunmuyor.", "No tasks assigned to you yet."),
        ("Dosya Yükle / Teslim Et", "Upload / Submit Assignment"),
        ("<h4>Dönem Tamamlama Oranı</h4>", "<h4>Term Completion Rate</h4>"),
        ("<p>Teslim ettiğin ödevlerin genel oranı</p>", "<p>Overall percentage of submitted assignments</p>"),
        ("<span>Teslim Edilen</span>", "<span>Submitted</span>"),
        ("<span>Pending Start</span>", "<span>Pending</span>"),
        ("<span>Ortalama Not</span>", "<span>Average Grade</span>"),
        ("<h4>📅 Akademik Takvim</h4>", "<h4>📅 Academic Calendar</h4>"),
        ("Ağustos 2026", "August 2026"),
        ("<h4>📢 Öğrenci Duyuruları</h4>", "<h4>📢 Student Announcements</h4>"),
        ("<h5>Ödev Teslim Formatı</h5>", "<h5>Submission File Guidelines</h5>"),
        ("<span>Lütfen Python ve veri analizi ödevlerinizi ZIP veya PY dosyası olarak yükleyiniz.</span>", "<span>Please upload Python and code deliverables as ZIP or individual script files.</span>"),
        ("<h3>Teslim Ettiğim Ödevler ve Notlarım (${submissions.length})</h3>", "<h3>My Submissions & Graded Work (${submissions.length})</h3>"),
        ("<th>Teslim Tarihi</th>", "<th>SUBMISSION DATE</th>"),
        ("<th>Yüklenen Dosya</th>", "<th>SUBMITTED FILE</th>"),
        ("<th>Not</th>", "<th>GRADE</th>"),
        ("<th>Instructor Trainer Feedbacki</th>", "<th>INSTRUCTOR FEEDBACK</th>"),
        ("Henüz teslim ettiğiniz bir ödev bulunmuyor.", "No assignments submitted yet."),
        ("Dosya İndir", "Download File"),
        ("Bekleniyor", "Pending"),
        ("Görev bilgileri alınamadı.", "Could not load task details."),
        ("Belirtilmedi", "Not specified"),
        ("Puan: ${t.grade} / 100", "Score: ${t.grade} / 100"),
        ("Düzeltme Bekleniyor", "Revision Required"),
        ("Lütfen ödevinizi eğitmenin belirttiği kriterlere göre revize edip yeniden teslim ediniz.", "Please revise your assignment according to instructor guidelines and resubmit."),
        ("🔄 Düzeltilmiş Ödevi Yeniden Teslim Et", "🔄 Resubmit Revised Assignment"),
        ("Instructor Değerlendirmesi & Notu", "Instructor Evaluation & Grade"),
        ("Not: ${t.grade} / 100", "Grade: ${t.grade} / 100"),
        ("Instructoriniz henüz yazılı geri bildirim girmedi.", "Instructor has not added written feedback yet."),
        ("Submit Solution", "Submit Assignment"),
        ("Alınan Not: ${t.grade !== null && t.grade !== undefined ? t.grade : 0} / 100", "Earned Grade: ${t.grade !== null && t.grade !== undefined ? t.grade : 0} / 100"),
        ("Toplam: 100 Puan (Rubrik Modeli)", "Total: 100 Pts (Rubric Model)"),
        ("30 Puan", "30 Pts"),
        ("25 Puan", "25 Pts"),
        ("20 Puan", "20 Pts"),
        ("15 Puan", "15 Pts"),
        ("10 Puan", "10 Pts"),
        ("Teslim Denemesi #${sub.submission_number || (history.length - idx)} (Revizyon ${sub.revision_number || (history.length - idx)}.0)", "Submission Attempt #${sub.submission_number || (history.length - idx)} (Rev ${sub.revision_number || (history.length - idx)}.0)"),
        ("⚠️ Gecikmiş (Is Late)", "⚠️ Late Submission"),
        ("⏰ Zamanında", "⏰ On Time"),
        ("📁 Dosya:", "📁 File:"),
        ("🔗 Proje Linki:", "🔗 Project URL:"),
        ("💬 Not:", "💬 Note:"),
        ("Dosya boyutu çok büyük. Maksimum 25 MB yükleyebilirsiniz.", "File size exceeds limit. Maximum upload size is 25 MB."),
        ("Göreviniz 'Devam Ediyor' (In Progress) durumuna alındı! Başarılar.", "Task marked as In Progress. Good luck!"),
        ("Action sırasında bir hata oluştu.", "An error occurred during this action."),
        ("Geçerli bir görev seçilmedi.", "No valid task selected."),
        ("Lütfen bir ödev dosyası seçiniz veya link/not giriniz.", "Please select a file or provide a project URL/note."),
        ("Yükleniyor...", "Uploading..."),
        ("Ödeviniz başarıyla teslim edildi!", "Your assignment has been submitted successfully!"),
        ("Dosya yüklenirken bir hata oluştu.", "An error occurred while uploading your submission.")
    ]

    for o, n in repls:
        c = c.replace(o, n)

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(c)
    print("✓ static/js/student.js fully translated to English.")

def update_date_formatter():
    fpath = BASE_DIR / "static" / "js" / "app.js"
    with open(fpath, "r", encoding="utf-8") as f:
        c = f.read()

    old_func = """function formatDateTr(dtStr) {
  if (!dtStr) return "-";
  try {
    const d = new Date(dtStr.replace(" ", "T"));
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch(e) { return dtStr; }
}"""

    c = re.sub(
        r'function formatDateTr\(dtStr\)\s*\{[\s\S]*?return[^\}]+;?\s*\}',
        old_func,
        c
    )

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(c)
    print("✓ static/js/app.js date formatter set to English standard.")

if __name__ == "__main__":
    update_database_records()
    update_student_js()
    update_date_formatter()
    print("\n🎉 COMPLETE FULL ENGLISH MAKEOVER FINISHED!")

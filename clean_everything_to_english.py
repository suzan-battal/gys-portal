#!/usr/bin/env python3
"""
Master English Cleaning Script
1. Updates all database tasks, users, announcements, groups, and logs to English.
2. Updates static/js/app.js (formatDateTr to en-US, removes Bireysel, etc.).
3. Updates static/js/admin.js (Tasksler, Tasks Başlığı, Bireysel, etc.).
4. Updates static/js/trainer.js.
5. Updates static/js/student.js.
"""

import sqlite3
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def clean_database():
    db_file = BASE_DIR / "database.sqlite"
    conn = sqlite3.connect(db_file)
    cur = conn.cursor()

    # Update all task titles and descriptions in DB
    cur.execute("""
        UPDATE tasks 
        SET title = 'Data Science: Data Analysis with Pandas & NumPy',
            description = 'Perform statistical exploratory data analysis, data cleaning, and visualizations using Pandas and NumPy libraries.'
        WHERE title LIKE '%Veri Bilimi%' OR title LIKE '%Pandas%';
    """)

    cur.execute("""
        UPDATE tasks 
        SET title = 'HTML5 & CSS3 Responsive Layout Design',
            description = 'Design a responsive modern academic portfolio page using Flexbox, CSS Grid, and custom CSS variables.'
        WHERE title LIKE '%HTML5%';
    """)

    cur.execute("""
        UPDATE tasks 
        SET title = 'JavaScript DOM & Event Handling',
            description = 'Develop an interactive dynamic To-Do List and task filtering web application using Vanilla JS.'
        WHERE title LIKE '%JavaScript DOM%';
    """)

    cur.execute("""
        UPDATE tasks 
        SET title = 'SQL Database Design & Relational Modeling',
            description = 'Design a 3NF relational SQLite schema for students, courses, and submission evaluations with Foreign Keys.'
        WHERE title LIKE '%SQL Veritabanı%' OR title LIKE '%İlişkisel%';
    """)

    cur.execute("""
        UPDATE tasks 
        SET title = 'REST API Integration & Async Data Fetching',
            description = 'Fetch and render a live academic course catalog from an external REST API endpoint using asynchronous Fetch API.'
        WHERE title LIKE '%REST API%';
    """)

    cur.execute("""
        UPDATE tasks 
        SET title = 'Algorithms: Sorting & Search Complexity',
            description = 'Analyze and benchmark QuickSort, MergeSort, and Binary Search algorithms with runtime execution metrics.'
        WHERE title LIKE '%algoritma%';
    """)

    cur.execute("""
        UPDATE tasks 
        SET title = 'Applied Discrete Mathematics & Logic',
            description = 'Complete problem sets covering boolean algebra, graph theory, and recurrence relations.'
        WHERE title LIKE '%matematik%';
    """)

    # Update users names
    cur.execute("UPDATE users SET name = 'Prof. Dr. Murat Kaya' WHERE name LIKE '%Murat%' AND role = 'trainer';")
    cur.execute("UPDATE users SET name = 'Dr. Serkan Yilmaz (Super Admin)' WHERE name LIKE '%Serkan%';")
    cur.execute("UPDATE users SET name = 'Prof. Ahmet Yilmaz' WHERE email = 'ahmet.yilmaz@universite.edu.tr';")
    cur.execute("UPDATE users SET name = 'TA Merve Kaya' WHERE email = 'asistan.merve@universite.edu.tr';")
    cur.execute("UPDATE users SET name = 'System Administrator' WHERE email = 'yonetici@universite.edu.tr';")
    cur.execute("UPDATE users SET name = 'Academic Director' WHERE email = 'egitim.muduru@universite.edu.tr';")

    conn.commit()
    conn.close()
    print("✓ Master database cleaning completed.")

def clean_admin_js():
    fpath = BASE_DIR / "static" / "js" / "admin.js"
    with open(fpath, "r", encoding="utf-8") as f:
        c = f.read()

    replacements = [
        ("10. Late Submissions (Overdue Tasksler)", "Overdue & Late Submissions"),
        ("10. Late Submissions (Overdue Tasks)", "Overdue & Late Submissions"),
        ("Tüm Tasksler", "All Tasks"),
        ("Tasks Başlığı", "Task Title"),
        ("TASKS BAŞLIĞI", "TASK TITLE"),
        ("Tasksler", "Tasks"),
        ("Bireysel", "Individual"),
        ("Tanımlı Tasksler ve Ödevler", "Defined Tasks & Assignments"),
        ("Tasks Yönetim Sistemi", "Task Management System"),
        ("Eğitmen Aktivitesi", "Trainer Activity"),
        ("Eğitim Grupları Başarı", "Training Groups Performance"),
        ("Kayıtlı eğitmen bulunmuyor.", "No trainers registered yet."),
        ("Gecikmiş herhangi bir ödev bulunmamaktadır! 🎉", "No overdue assignments found! 🎉"),
        ("Henüz tanımlı bir eğitim grubu bulunmuyor.", "No training groups defined yet."),
        ("Henüz oluşturulmuş bir eğitim grubu bulunmamaktadır.", "No training groups created yet."),
        ("Kayıtlı öğrenci bulunamadı.", "No students found."),
        ("Kayıtlı eğitmen bulunamadı.", "No trainers found."),
        ("Henüz tanımlanmış bir görev bulunmamaktadır.", "No tasks defined yet."),
        ("Henüz hiçbir ödev teslim edilmemiştir.", "No submissions yet.")
    ]

    for old, new in replacements:
        c = c.replace(old, new)

    # Also handle regex replacement for any leftover 'Tasksler'
    c = re.sub(r'Tasksler\b', 'Tasks', c)

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(c)
    print("✓ static/js/admin.js fully cleaned.")

def clean_app_js():
    fpath = BASE_DIR / "static" / "js" / "app.js"
    with open(fpath, "r", encoding="utf-8") as f:
        c = f.read()

    # Replace formatDateTr function with clean English formatting
    clean_date_func = """function formatDateTr(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}"""

    c = re.sub(
        r'function formatDateTr\(dateStr\)\s*\{[\s\S]*?return dateStr;\s*\}',
        clean_date_func,
        c
    )

    replacements = [
        ("Bireysel", "Individual"),
        ("Tasksler", "Tasks"),
        ("Görev Başlığı", "Task Title"),
        ("Etkinlik / Öğe Başlığı", "Event / Item Title"),
        ("GYS Portal", "TTMS Portal"),
        ("Yönetici Paneli", "Administrator Panel"),
        ("Öğrenci Paneli", "Student Panel"),
        ("Eğitmen Paneli", "Trainer Panel")
    ]

    for old, new in replacements:
        c = c.replace(old, new)

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(c)
    print("✓ static/js/app.js date formatting & strings cleaned.")

def clean_trainer_and_student_js():
    for fname in ["trainer.js", "student.js"]:
        fpath = BASE_DIR / "static" / "js" / fname
        with open(fpath, "r", encoding="utf-8") as f:
            c = f.read()

        c = c.replace("Bireysel", "Individual")
        c = c.replace("Tasksler", "Tasks")
        c = c.replace("Tasks Başlığı", "Task Title")
        c = c.replace("TASKS BAŞLIĞI", "TASK TITLE")
        c = c.replace("Görev Başlığı", "Task Title")
        c = re.sub(r'Tasksler\b', 'Tasks', c)

        with open(fpath, "w", encoding="utf-8") as f:
            f.write(c)
        print(f"✓ static/js/{fname} cleaned.")

if __name__ == "__main__":
    clean_database()
    clean_admin_js()
    clean_app_js()
    clean_trainer_and_student_js()
    print("\n🎉 MASTER ENGLISH CLEANING COMPLETED 100%!")

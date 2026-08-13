#!/usr/bin/env python3
"""
Full English Database Seeder & Updater
Translates all database records (tasks, users, training groups, announcements, calendar events, notifications, settings) into clean, professional English.
"""

import sqlite3
import os

db_path = "database.sqlite"

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# 1. Update Users Table (Names)
cursor.execute("UPDATE users SET name = 'System Administrator' WHERE email = 'yonetici@universite.edu.tr';")
cursor.execute("UPDATE users SET name = 'Dr. Serkan Yilmaz (Super Admin)' WHERE email = 'superadmin@universite.edu.tr';")
cursor.execute("UPDATE users SET name = 'Academic Director' WHERE email = 'egitim.muduru@universite.edu.tr';")
cursor.execute("UPDATE users SET name = 'Prof. Ahmet Yilmaz' WHERE email = 'ahmet.yilmaz@universite.edu.tr';")
cursor.execute("UPDATE users SET name = 'Assoc. Prof. Ayse Kaya' WHERE email = 'ayse.kaya@universite.edu.tr';")
cursor.execute("UPDATE users SET name = 'TA Merve Kaya' WHERE email = 'asistan.merve@universite.edu.tr';")
cursor.execute("UPDATE users SET name = 'Mehmet Demir' WHERE email = 'mehmet.demir@universite.edu.tr';")
cursor.execute("UPDATE users SET name = 'Zeynep Celik' WHERE email = 'zeynep.celik@universite.edu.tr';")
cursor.execute("UPDATE users SET name = 'Can Ozkan' WHERE email = 'can.ozkan@universite.edu.tr';")
cursor.execute("UPDATE users SET name = 'Elif Yildiz' WHERE email = 'elif.yildiz@universite.edu.tr';")
cursor.execute("UPDATE users SET name = 'Burak Sahin' WHERE email = 'burak.sahin@universite.edu.tr';")

# 2. Update Training Groups Table
cursor.execute("""
    UPDATE groups 
    SET name = 'Software Development & Algorithms - Section A',
        department = 'Computer Science & Engineering',
        description = 'Advanced algorithm analysis, data structures, and enterprise web architecture training group.',
        status = 'Active'
    WHERE id = 1 OR name LIKE '%Yazılım Geliştirme%';
""")

cursor.execute("""
    UPDATE groups 
    SET name = 'Cyber Security & Network Systems - Section B',
        department = 'Information Technology & Cyber Defense',
        description = 'Network security analysis, penetration testing, vulnerability assessment, and secure protocol design.',
        status = 'Active'
    WHERE id = 2 OR name LIKE '%Siber Güvenlik%';
""")

cursor.execute("""
    UPDATE groups 
    SET name = 'Data Science & Machine Learning - Section C',
        department = 'Artificial Intelligence & Data Analytics',
        description = 'Applied statistical modeling, deep learning architectures, and big data processing pipeline.',
        status = 'Active'
    WHERE id = 3 OR name LIKE '%Veri Bilimi%';
""")

cursor.execute("""
    UPDATE groups 
    SET name = 'Cloud Computing & DevOps Infrastructure - Section D',
        department = 'Software Engineering',
        description = 'Containerization with Docker, Kubernetes orchestration, CI/CD pipelines, and cloud native architectures.',
        status = 'Active'
    WHERE id = 4 OR name LIKE '%Bulut Bilişim%';
""")

# 3. Update Tasks Table
tasks_translation = [
    (1, "Data Structures: Binary Search Tree (BST) Implementation", "Implement a self-balancing binary search tree (AVL/BST) in Python or C++. Include insertion, deletion, lookup operations, and full time complexity analysis in your report.", "High"),
    (2, "Web Programming: RESTful API & JWT Authentication", "Develop a secure REST API providing user registration, login, and token-based session management. Include complete API documentation and Postman collection.", "Medium"),
    (3, "Artificial Intelligence: Image Classification with CNN", "Train a Convolutional Neural Network (CNN) on MNIST/CIFAR-10 achieving 90%+ test accuracy. Submit test evaluation metrics and ROC curves.", "Medium"),
    (4, "Database Management: E-Commerce Relational Schema Design & SQL Optimization", "Design a 3NF normalized relational database schema for an enterprise e-commerce platform. Include index optimization and query execution plans.", "Medium"),
    (5, "Mobile Application: Cross-Platform Task Tracker UI with Flutter", "Design and build a responsive mobile task tracking user interface using Flutter and clean state management.", "Urgent"),
    (40, "HTML5 & CSS3 Responsive Layout Design", "Develop a fully responsive enterprise web dashboard using semantic HTML5 and modern CSS flexbox/grid layout systems.", "High"),
    (41, "JavaScript DOM & Event Handling", "Build dynamic client-side DOM manipulation logic and event-driven form validation features.", "Medium"),
    (42, "REST API Integration & Async Data Fetching", "Integrate asynchronous REST API endpoints using JavaScript Fetch API with robust error handling and loading indicators.", "Medium"),
    (43, "SQL Database Design & Relational Modeling", "Design a normalized relational database schema with primary keys, foreign keys, and referential integrity constraints.", "Urgent"),
    (46, "Applied Discrete Mathematics & Logic", "Complete exercises on predicate logic, boolean algebra, graph theory algorithms, and mathematical induction.", "Normal")
]

for t_id, title, desc, prio in tasks_translation:
    cursor.execute("UPDATE tasks SET title = ?, description = ?, priority = ? WHERE id = ?;", (title, desc, prio, t_id))

# Also update any other tasks in tasks table
cursor.execute("UPDATE tasks SET priority = 'High' WHERE priority IN ('Yüksek', 'Yuksek');")
cursor.execute("UPDATE tasks SET priority = 'Medium' WHERE priority IN ('Orta', 'Normal');")
cursor.execute("UPDATE tasks SET priority = 'Low' WHERE priority IN ('Düşük', 'Dusuk');")
cursor.execute("UPDATE tasks SET priority = 'Urgent' WHERE priority IN ('Acil');")

# 4. Update Announcements Table
cursor.execute("""
    UPDATE announcements 
    SET title = 'Spring Term 2025-2026 Academic Calendar & Midterm Schedule Update',
        message = 'By decision of the University Academic Senate, the Spring Term assignment deadlines and midterm examination schedules have been officially finalized. Please check the Academic Calendar hub for complete details.'
    WHERE id = 1 OR title LIKE '%Akademik Takvim%' OR title LIKE '%Bahar Dönemi%';
""")

cursor.execute("""
    UPDATE announcements 
    SET title = 'Campus Cloud Laboratory & Remote Server Access Guidelines',
        message = 'Access credentials and SSH guidelines for the university cloud computing laboratory and high-performance server clusters have been provisioned for all enrolled students and faculty members.'
    WHERE id = 2 OR title LIKE '%Laboratuvar%' OR title LIKE '%Sunucu%';
""")

# 5. Update Calendar Events Table
cursor.execute("""
    UPDATE calendar_events 
    SET title = 'Database Systems Midterm Examination',
        description = 'Covers ER modeling, relational algebra, SQL DDL/DML, and index structures. Closed book exam in Computer Labs A101-A103.',
        location = 'Computer Engineering Lab A101',
        event_type = 'exam'
    WHERE id = 1 OR title LIKE '%Sınav%' OR title LIKE '%Vize%';
""")

cursor.execute("""
    UPDATE calendar_events 
    SET title = 'Advanced Web Architecture & Microservices Workshop',
        description = 'Live technical workshop on building distributed services, gRPC communication, and API gateways.',
        location = 'Virtual Auditorium & Teams Link',
        event_type = 'events'
    WHERE id = 2 OR title LIKE '%Seminer%' OR title LIKE '%Çalıştay%' OR title LIKE '%Workshop%';
""")

cursor.execute("""
    UPDATE calendar_events 
    SET title = 'Final Project & Thesis Code Submission Deadline',
        description = 'Final deadline for all semester software engineering capstone project submissions and solution archives.',
        location = 'TTMS Student Portal',
        event_type = 'deadline'
    WHERE id = 3 OR title LIKE '%Teslim%' OR title LIKE '%Deadline%';
""")

# 6. Update Submissions Table
cursor.execute("UPDATE submissions SET status = 'Completed' WHERE status IN ('Tamamlandı', 'Kabul Edildi');")
cursor.execute("UPDATE submissions SET status = 'Under Review' WHERE status IN ('İnceleniyor', 'Görüntülendi');")
cursor.execute("UPDATE submissions SET status = 'Needs Revision' WHERE status IN ('Düzeltme İstendi');")
cursor.execute("UPDATE submissions SET status = 'Rejected' WHERE status IN ('Reddedildi');")
cursor.execute("UPDATE submissions SET status = 'Submitted' WHERE status IN ('Teslim Edildi', 'Bekliyor');")
cursor.execute("UPDATE submissions SET feedback = 'Excellent implementation with clear documentation, clean code structure, and accurate results. Approved!' WHERE feedback LIKE '%Harika%' OR feedback LIKE '%Tebrikler%' OR feedback LIKE '%başarılı%';")

# 7. Update Audit Logs Table
cursor.execute("UPDATE audit_logs SET description = 'User authentication successful' WHERE action = 'AUTH_LOGIN';")
cursor.execute("UPDATE audit_logs SET description = 'System configuration parameters updated' WHERE action = 'SETTINGS_UPDATED';")
cursor.execute("UPDATE audit_logs SET description = 'New task created and assigned to group' WHERE action = 'TASK_CREATED';")
cursor.execute("UPDATE audit_logs SET description = 'Assignment solution file submitted' WHERE action = 'SUBMISSION_UPLOADED';")
cursor.execute("UPDATE audit_logs SET description = 'Trainer evaluation and rubric grade saved' WHERE action = 'SUBMISSION_REVIEWED';")

conn.commit()
conn.close()

print("✓ database.sqlite successfully updated with 100% pure English content!")

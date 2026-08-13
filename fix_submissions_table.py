#!/usr/bin/env python3
import sqlite3
import os

db_path = "database.sqlite"

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Check current submissions columns
cursor.execute("PRAGMA table_info(submissions);")
cols = [row["name"] for row in cursor.fetchall()]
print("Current columns:", cols)

# 1. Create a new table without UNIQUE on task_id
cursor.execute("""
    CREATE TABLE submissions_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        submission_number INTEGER DEFAULT 1,
        revision_number INTEGER DEFAULT 1,
        file_path TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_size INTEGER NOT NULL DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'Teslim Edildi',
        grade REAL NULL,
        feedback TEXT NULL,
        student_notes TEXT NULL,
        student_link TEXT NULL,
        is_late INTEGER DEFAULT 0,
        rubric_completion REAL NULL,
        rubric_quality REAL NULL,
        rubric_accuracy REAL NULL,
        rubric_deadline REAL NULL,
        rubric_communication REAL NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );
""")

# 2. Copy data from old submissions to submissions_new
col_str = ", ".join([c for c in cols if c in [
    "id", "task_id", "student_id", "submission_number", "revision_number",
    "file_path", "original_filename", "file_size", "submitted_at", "status",
    "grade", "feedback", "student_notes", "student_link", "is_late",
    "rubric_completion", "rubric_quality", "rubric_accuracy", "rubric_deadline", "rubric_communication"
]])

cursor.execute(f"INSERT INTO submissions_new ({col_str}) SELECT {col_str} FROM submissions;")

# 3. Drop old table and rename new table
cursor.execute("DROP TABLE submissions;")
cursor.execute("ALTER TABLE submissions_new RENAME TO submissions;")

conn.commit()
conn.close()

print("✓ submissions table successfully migrated! UNIQUE constraint on task_id removed!")

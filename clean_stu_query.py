#!/usr/bin/env python3
"""
Convert student tasks query in database.py to clean string
"""

with open("database.py", "r", encoding="utf-8") as f:
    content = f.read()

old_block = '''        # 3, 4, 7. Tasks & Task History
        cursor.execute("""
            SELECT t.id as task_id, t.title, t.description, t.deadline, t.priority, 
                   COALESCE(t.estimated_time, '-') as estimated_time,
                   s.id as submission_id, COALESCE(s.status, 'Pending') as submission_status, s.grade, s.submitted_at, s.feedback,
                   s.rubric_completion, s.rubric_quality, s.rubric_accuracy, s.rubric_deadline, s.rubric_communication,
                   s.original_filename as file_name,
                   CASE 
                     WHEN datetime(t.deadline) < datetime('now', 'localtime') AND (s.status IS NULL OR s.status NOT IN ('Completed', 'Approved', 'Tamamlandı', 'Kabul Edildi')) THEN 1 
                     ELSE 0 
                   END as is_late
            FROM tasks t
            LEFT JOIN submissions s ON t.id = s.task_id AND s.student_id = t.student_id
            WHERE t.student_id = ?
            ORDER BY t.deadline DESC, t.id DESC;
        """, (student_id,))'''

new_block = '''        # 3, 4, 7. Tasks & Task History
        stu_tasks_sql = (
            "SELECT t.id as task_id, t.title, t.description, t.deadline, t.priority, "
            "COALESCE(t.estimated_time, '-') as estimated_time, "
            "s.id as submission_id, COALESCE(s.status, 'Pending') as submission_status, s.grade, s.submitted_at, s.feedback, "
            "s.rubric_completion, s.rubric_quality, s.rubric_accuracy, s.rubric_deadline, s.rubric_communication, "
            "s.original_filename as file_name, "
            "CASE WHEN datetime(t.deadline) < datetime('now', 'localtime') AND (s.status IS NULL OR s.status NOT IN ('Completed', 'Approved', 'Tamamlandı', 'Kabul Edildi')) THEN 1 ELSE 0 END as is_late "
            "FROM tasks t LEFT JOIN submissions s ON t.id = s.task_id AND s.student_id = t.student_id "
            "WHERE t.student_id = ? ORDER BY t.deadline DESC, t.id DESC;"
        )
        cursor.execute(stu_tasks_sql, (student_id,))'''

content = content.replace(old_block, new_block)

with open("database.py", "w", encoding="utf-8") as f:
    f.write(content)

import ast
try:
    ast.parse(content)
    print("SUCCESS: database.py AST PARSE PASSED PERFECTLY!")
except SyntaxError as e:
    print(f"SyntaxError at line {e.lineno}: {e.msg}")

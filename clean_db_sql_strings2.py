#!/usr/bin/env python3
"""
Convert remaining multiline SQL queries in extension functions to clean single line strings.
"""

with open("database.py", "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    ('''cursor.execute("""
            SELECT td.*, t.title as depends_on_title, t.deadline as depends_on_deadline,
                   (SELECT s.status FROM submissions s WHERE s.task_id = t.id LIMIT 1) as depends_on_status
            FROM task_dependencies td
            JOIN tasks t ON td.depends_on_task_id = t.id
            WHERE td.task_id = ?;
        """, (task_id,))''',
     '''cursor.execute("SELECT td.*, t.title as depends_on_title, t.deadline as depends_on_deadline, (SELECT s.status FROM submissions s WHERE s.task_id = t.id LIMIT 1) as depends_on_status FROM task_dependencies td JOIN tasks t ON td.depends_on_task_id = t.id WHERE td.task_id = ?;", (task_id,))'''),

    ('''cursor.execute("""
            SELECT t.* FROM tags t
            JOIN task_tags tt ON t.id = tt.tag_id
            WHERE tt.task_id = ?
            ORDER BY t.name ASC;
        """, (task_id,))''',
     '''cursor.execute("SELECT t.* FROM tags t JOIN task_tags tt ON t.id = tt.tag_id WHERE tt.task_id = ? ORDER BY t.name ASC;", (task_id,))'''),

    ('''cursor.execute("""
            SELECT t.*, (SELECT COUNT(*) FROM task_tags tt WHERE tt.tag_id = t.id) as tasks_count
            FROM tags t
            ORDER BY t.category ASC, t.name ASC;
        """)''',
     '''cursor.execute("SELECT t.*, (SELECT COUNT(*) FROM task_tags tt WHERE tt.tag_id = t.id) as tasks_count FROM tags t ORDER BY t.category ASC, t.name ASC;")'''),

    ('''cursor.execute("""
            SELECT p.*, g.name as group_name, u.name as manager_name
            FROM projects p
            LEFT JOIN training_groups g ON p.group_id = g.id
            LEFT JOIN users u ON p.manager_id = u.id
            WHERE p.id = ?;
        """, (project_id,))''',
     '''cursor.execute("SELECT p.*, g.name as group_name, u.name as manager_name FROM projects p LEFT JOIN training_groups g ON p.group_id = g.id LEFT JOIN users u ON p.manager_id = u.id WHERE p.id = ?;", (project_id,))'''),

    ('''cursor.execute("""
            SELECT pm.*, u.name as user_name, u.email as user_email, u.role as user_role
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = ?
            ORDER BY pm.id ASC;
        """, (project_id,))''',
     '''cursor.execute("SELECT pm.*, u.name as user_name, u.email as user_email, u.role as user_role FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ? ORDER BY pm.id ASC;", (project_id,))'''),

    ('''cursor.execute("""
            SELECT pt.*, t.title as task_title, t.deadline as task_deadline, t.priority as task_priority
            FROM project_tasks pt
            JOIN tasks t ON pt.task_id = t.id
            WHERE pt.project_id = ?
            ORDER BY pt.order_num ASC, pt.id ASC;
        """, (project_id,))''',
     '''cursor.execute("SELECT pt.*, t.title as task_title, t.deadline as task_deadline, t.priority as task_priority FROM project_tasks pt JOIN tasks t ON pt.task_id = t.id WHERE pt.project_id = ? ORDER BY pt.order_num ASC, pt.id ASC;", (project_id,))''')
]

for old_q, new_q in replacements:
    content = content.replace(old_q, new_q)

with open("database.py", "w", encoding="utf-8") as f:
    f.write(content)

import ast
try:
    ast.parse(content)
    print("SUCCESS: database.py AST parse passed without error!")
except SyntaxError as e:
    print(f"SyntaxError at line {e.lineno}: {e.msg}")

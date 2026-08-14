#!/usr/bin/env python3
"""
Clean SQL execution statements to single line strings in database.py
"""

import ast

with open("database.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)

content = "".join(new_lines)

# Replace any multiline queries with clean single line queries in the bottom section
replacements = [
    ('''cursor.execute("""
            UPDATE task_checklist_items 
            SET is_completed = ?, completed_at = ?, completed_by = ?
            WHERE id = ?;
        """, (new_val, comp_time, comp_by, item_id))''',
     '''cursor.execute("UPDATE task_checklist_items SET is_completed = ?, completed_at = ?, completed_by = ? WHERE id = ?;", (new_val, comp_time, comp_by, item_id))'''),

    ('''cursor.execute("""
            INSERT INTO task_checklist_items (checklist_id, title, order_num, is_completed)
            VALUES (?, ?, ?, 0);
        """, (checklist_id, title, order_num))''',
     '''cursor.execute("INSERT INTO task_checklist_items (checklist_id, title, order_num, is_completed) VALUES (?, ?, ?, 0);", (checklist_id, title, order_num))'''),

    ('''cursor.execute("""
            INSERT INTO task_checklists (task_id, title, is_required)
            VALUES (?, ?, ?);
        """, (task_id, title, 1 if is_required else 0))''',
     '''cursor.execute("INSERT INTO task_checklists (task_id, title, is_required) VALUES (?, ?, ?);", (task_id, title, 1 if is_required else 0))'''),

    ('''cursor.execute("""
            INSERT OR REPLACE INTO task_dependencies (task_id, depends_on_task_id, dependency_type)
            VALUES (?, ?, ?);
        """, (task_id, depends_on_task_id, dependency_type))''',
     '''cursor.execute("INSERT OR REPLACE INTO task_dependencies (task_id, depends_on_task_id, dependency_type) VALUES (?, ?, ?);", (task_id, depends_on_task_id, dependency_type))'''),

    ('''cursor.execute("""
            INSERT OR IGNORE INTO task_tags (task_id, tag_id)
            VALUES (?, ?);
        """, (task_id, tag_id))''',
     '''cursor.execute("INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?);", (task_id, tag_id))'''),

    ('''cursor.execute("""
            INSERT INTO tags (name, color, category)
            VALUES (?, ?, ?);
        """, (name.strip(), color, category))''',
     '''cursor.execute("INSERT INTO tags (name, color, category) VALUES (?, ?, ?);", (name.strip(), color, category))'''),

    ('''cursor.execute("""
            INSERT OR REPLACE INTO project_tasks (project_id, task_id, milestone, weight, order_num)
            VALUES (?, ?, ?, ?, ?);
        """, (project_id, task_id, milestone, weight, order_num))''',
     '''cursor.execute("INSERT OR REPLACE INTO project_tasks (project_id, task_id, milestone, weight, order_num) VALUES (?, ?, ?, ?, ?);", (project_id, task_id, milestone, weight, order_num))'''),

    ('''cursor.execute("""
            INSERT OR REPLACE INTO project_members (project_id, user_id, role_in_project)
            VALUES (?, ?, ?);
        """, (project_id, user_id, role_in_project))''',
     '''cursor.execute("INSERT OR REPLACE INTO project_members (project_id, user_id, role_in_project) VALUES (?, ?, ?);", (project_id, user_id, role_in_project))'''),

    ('''cursor.execute("""
            INSERT INTO projects (name, code, description, group_id, manager_id, start_date, end_date, budget, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (name, code, description, group_id, manager_id, start_date, end_date, budget, status))''',
     '''cursor.execute("INSERT INTO projects (name, code, description, group_id, manager_id, start_date, end_date, budget, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);", (name, code, description, group_id, manager_id, start_date, end_date, budget, status))''')
]

for old_q, new_q in replacements:
    content = content.replace(old_q, new_q)

with open("database.py", "w", encoding="utf-8") as f:
    f.write(content)

try:
    ast.parse(content)
    print("SUCCESS: database.py AST parse passed without error!")
except SyntaxError as e:
    print(f"SyntaxError at line {e.lineno}: {e.msg}")

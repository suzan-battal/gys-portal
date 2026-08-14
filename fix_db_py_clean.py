#!/usr/bin/env python3
"""
Write clean tail to database.py directly.
"""

with open("database.py", "r", encoding="utf-8") as f:
    code = f.read()

before_ext = code.split("# ==================== SECTION 24: EXTENSION FUNCTIONS ====================")[0]

tail = '''# ==================== SECTION 24: EXTENSION FUNCTIONS ====================

def create_project(name: str, code: str, description: str = None, group_id: int = None,
                   manager_id: int = None, start_date: str = None, end_date: str = None,
                   budget: float = 0.0, status: str = 'Active'):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM projects WHERE code = ?;", (code,))
        existing = cursor.fetchone()
        if existing:
            return existing[0]
        cursor.execute("""
            INSERT INTO projects (name, code, description, group_id, manager_id, start_date, end_date, budget, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (name, code, description, group_id, manager_id, start_date, end_date, budget, status))
        conn.commit()
        return cursor.lastrowid


def get_all_projects(group_id: int = None, status: str = None, search: str = None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        query = """
            SELECT p.*, g.name as group_name, u.name as manager_name,
                   (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as members_count,
                   (SELECT COUNT(*) FROM project_tasks pt WHERE pt.project_id = p.id) as tasks_count
            FROM projects p
            LEFT JOIN training_groups g ON p.group_id = g.id
            LEFT JOIN users u ON p.manager_id = u.id
            WHERE 1=1
        """
        params = []
        if group_id and str(group_id) != 'all':
            query += " AND p.group_id = ?"
            params.append(int(group_id))
        if status and status != 'all':
            query += " AND p.status = ?"
            params.append(status)
        if search:
            query += " AND (p.name LIKE ? OR p.code LIKE ? OR p.description LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

        query += " ORDER BY p.id DESC;"
        cursor.execute(query, tuple(params))
        return [dict(r) for r in cursor.fetchall()]


def get_project_by_id(project_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.*, g.name as group_name, u.name as manager_name
            FROM projects p
            LEFT JOIN training_groups g ON p.group_id = g.id
            LEFT JOIN users u ON p.manager_id = u.id
            WHERE p.id = ?;
        """, (project_id,))
        proj_row = cursor.fetchone()
        if not proj_row:
            return None
        project = dict(proj_row)

        cursor.execute("""
            SELECT pm.*, u.name as user_name, u.email as user_email, u.role as user_role
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = ?
            ORDER BY pm.id ASC;
        """, (project_id,))
        project['members'] = [dict(m) for m in cursor.fetchall()]

        cursor.execute("""
            SELECT pt.*, t.title as task_title, t.deadline as task_deadline, t.priority as task_priority
            FROM project_tasks pt
            JOIN tasks t ON pt.task_id = t.id
            WHERE pt.project_id = ?
            ORDER BY pt.order_num ASC, pt.id ASC;
        """, (project_id,))
        project['tasks'] = [dict(t) for t in cursor.fetchall()]

        return project


def add_project_member(project_id: int, user_id: int, role_in_project: str = 'Member'):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO project_members (project_id, user_id, role_in_project)
            VALUES (?, ?, ?);
        """, (project_id, user_id, role_in_project))
        conn.commit()
        return cursor.lastrowid


def assign_task_to_project(project_id: int, task_id: int, milestone: str = None, weight: float = 1.0, order_num: int = 1):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO project_tasks (project_id, task_id, milestone, weight, order_num)
            VALUES (?, ?, ?, ?, ?);
        """, (project_id, task_id, milestone, weight, order_num))
        conn.commit()
        return cursor.lastrowid


def create_tag(name: str, color: str = '#2563EB', category: str = 'general'):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM tags WHERE name = ?;", (name.strip(),))
        row = cursor.fetchone()
        if row:
            return row[0]
        cursor.execute("""
            INSERT INTO tags (name, color, category)
            VALUES (?, ?, ?);
        """, (name.strip(), color, category))
        conn.commit()
        return cursor.lastrowid


def get_all_tags():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT t.*, (SELECT COUNT(*) FROM task_tags tt WHERE tt.tag_id = t.id) as tasks_count
            FROM tags t
            ORDER BY t.category ASC, t.name ASC;
        """)
        return [dict(r) for r in cursor.fetchall()]


def add_tag_to_task(task_id: int, tag_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR IGNORE INTO task_tags (task_id, tag_id)
            VALUES (?, ?);
        """, (task_id, tag_id))
        conn.commit()


def get_task_tags(task_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT t.* FROM tags t
            JOIN task_tags tt ON t.id = tt.tag_id
            WHERE tt.task_id = ?
            ORDER BY t.name ASC;
        """, (task_id,))
        return [dict(r) for r in cursor.fetchall()]


def add_task_dependency(task_id: int, depends_on_task_id: int, dependency_type: str = 'FS'):
    if task_id == depends_on_task_id:
        return False
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO task_dependencies (task_id, depends_on_task_id, dependency_type)
            VALUES (?, ?, ?);
        """, (task_id, depends_on_task_id, dependency_type))
        conn.commit()
        return True


def get_task_dependencies(task_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT td.*, t.title as depends_on_title, t.deadline as depends_on_deadline,
                   (SELECT s.status FROM submissions s WHERE s.task_id = t.id LIMIT 1) as depends_on_status
            FROM task_dependencies td
            JOIN tasks t ON td.depends_on_task_id = t.id
            WHERE td.task_id = ?;
        """, (task_id,))
        return [dict(r) for r in cursor.fetchall()]


def create_task_checklist(task_id: int, title: str, is_required: bool = False):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO task_checklists (task_id, title, is_required)
            VALUES (?, ?, ?);
        """, (task_id, title, 1 if is_required else 0))
        conn.commit()
        return cursor.lastrowid


def add_checklist_item(checklist_id: int, title: str, order_num: int = 1):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO task_checklist_items (checklist_id, title, order_num, is_completed)
            VALUES (?, ?, ?, 0);
        """, (checklist_id, title, order_num))
        conn.commit()
        return cursor.lastrowid


def toggle_checklist_item(item_id: int, user_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT is_completed FROM task_checklist_items WHERE id = ?;", (item_id,))
        row = cursor.fetchone()
        if not row:
            return None
        new_val = 0 if row[0] == 1 else 1
        comp_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S") if new_val == 1 else None
        comp_by = user_id if new_val == 1 else None
        cursor.execute("""
            UPDATE task_checklist_items 
            SET is_completed = ?, completed_at = ?, completed_by = ?
            WHERE id = ?;
        """, (new_val, comp_time, comp_by, item_id))
        conn.commit()
        return {"id": item_id, "is_completed": bool(new_val)}


def get_task_checklists(task_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM task_checklists WHERE task_id = ? ORDER BY id ASC;", (task_id,))
        checklists = [dict(c) for c in cursor.fetchall()]
        for c in checklists:
            cursor.execute("""
                SELECT tci.*, u.name as completed_by_name
                FROM task_checklist_items tci
                LEFT JOIN users u ON tci.completed_by = u.id
                WHERE tci.checklist_id = ?
                ORDER BY tci.order_num ASC, tci.id ASC;
            """, (c['id'],))
            items = [dict(i) for i in cursor.fetchall()]
            c['items'] = items
            c['total_items'] = len(items)
            c['completed_items'] = sum(1 for i in items if i['is_completed'])
            c['progress_percentage'] = round((c['completed_items'] / c['total_items'] * 100), 1) if c['total_items'] > 0 else 0.0
        return checklists


# ==================== SEED DATABASE ====================

def seed_database():
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users;")
        count = cursor.fetchone()[0]
        if count > 0:
            return

    print("Seeding initial university database with English Demo Data & Training Groups...")

    # 1. Users
    admin_id = create_user("System Administrator", "yonetici@universite.edu.tr", "Admin123!", "admin")
    t1_id = create_user("Prof. Ahmet Yilmaz", "ahmet.yilmaz@universite.edu.tr", "Egitmen123!", "trainer")
    t2_id = create_user("Assoc. Prof. Ayse Kaya", "ayse.kaya@universite.edu.tr", "Egitmen123!", "trainer")
    s1_id = create_user("Mehmet Demir", "mehmet.demir@universite.edu.tr", "Ogrenci123!", "student")
    s2_id = create_user("Zeynep Celik", "zeynep.celik@universite.edu.tr", "Ogrenci123!", "student")
    s3_id = create_user("Can Ozkan", "can.ozkan@universite.edu.tr", "Ogrenci123!", "student")
    s4_id = create_user("Elif Yildiz", "elif.yildiz@universite.edu.tr", "Ogrenci123!", "student")
    s5_id = create_user("Burak Sahin", "burak.sahin@universite.edu.tr", "Ogrenci123!", "student")

    # 2. Training Groups
    now = datetime.now()
    d_start = now.strftime("%Y-%m-%d")
    d_end = (now + timedelta(days=90)).strftime("%Y-%m-%d")

    g1_id = create_group(
        "Software Development & Algorithms - Section A",
        "Computer Science & Engineering",
        "Advanced algorithm analysis, data structures, and enterprise web architecture training group.",
        d_start, d_end, t1_id, [s1_id, s2_id, s3_id]
    )

    g2_id = create_group(
        "Cyber Security & Network Systems - Section B",
        "Information Technology & Cyber Defense",
        "Network security analysis, penetration testing, vulnerability assessment, and secure protocol design.",
        d_start, d_end, t2_id, [s4_id, s5_id]
    )

    # 3. Tasks
    d1 = (now + timedelta(days=5)).strftime("%Y-%m-%d")
    d2 = (now + timedelta(days=8)).strftime("%Y-%m-%d")
    d3 = (now + timedelta(days=12)).strftime("%Y-%m-%d")
    d4 = (now + timedelta(days=15)).strftime("%Y-%m-%d")
    d5 = (now + timedelta(days=20)).strftime("%Y-%m-%d")

    task1 = create_task(
        "Data Structures: Binary Search Tree (BST) Implementation",
        "Implement a self-balancing binary search tree (AVL/BST) in Python or C++. Include insertion, deletion, lookup operations, and full time complexity analysis in your report.",
        d1, t1_id, s1_id, 'High', g1_id
    )

    task2 = create_task(
        "Web Programming: RESTful API & JWT Authentication",
        "Develop a secure REST API providing user registration, login, and token-based session management. Include complete API documentation and Postman collection.",
        d2, t1_id, s2_id, 'Medium', g1_id
    )

    task3 = create_task(
        "Artificial Intelligence: Image Classification with CNN",
        "Train a Convolutional Neural Network (CNN) on MNIST/CIFAR-10 achieving 90%+ test accuracy. Submit test evaluation metrics and ROC curves.",
        d3, t2_id, s3_id, 'Medium', g1_id
    )

    task4 = create_task(
        "Database Management: E-Commerce Relational Schema Design & SQL Optimization",
        "Design a 3NF normalized relational database schema for an enterprise e-commerce platform. Include index optimization and query execution plans.",
        d4, t2_id, s4_id, 'Medium', g2_id
    )

    task5 = create_task(
        "Mobile Application: Cross-Platform Task Tracker UI with Flutter",
        "Design and build a responsive mobile task tracking user interface using Flutter and clean state management.",
        d5, t1_id, s5_id, 'Urgent', g2_id
    )

    # 4. Dummy files & Submissions
    def create_dummy_file(filename: str, content: str):
        filepath = UPLOADS_DIR / filename
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return str(filepath), os.path.getsize(filepath)

    f1_path, f1_size = create_dummy_file(
        "bst_data_structure_mehmet_demir.py",
        "# Data Structures Assignment - Mehmet Demir\\nclass BSTNode:\\n    def __init__(self, key):\\n        self.key = key\\n        self.left = None\\n        self.right = None\\n\\n# Implementation completed successfully."
    )
    f2_path, f2_size = create_dummy_file(
        "rest_api_project_report_zeynep_celik.pdf",
        "%PDF-1.4 REST API & JWT Authentication Project Report - Zeynep Celik"
    )

    sub1_id = create_or_update_submission(task1, s1_id, "bst_data_structure_mehmet_demir.py", "bst_data_structure_mehmet_demir.py", f1_size)
    update_submission_evaluation(
        sub1_id, 
        95.0, 
        "Excellent implementation! Clean code structure, proper AVL rotations, and comprehensive time complexity analysis.", 
        "Completed"
    )

    sub2_id = create_or_update_submission(task2, s2_id, "rest_api_project_report_zeynep_celik.pdf", "rest_api_project_report_zeynep_celik.pdf", f2_size)
    update_submission_evaluation(
        sub2_id,
        None,
        "Submission received. Security tests and API endpoint validations in progress.",
        "Under Review"
    )

    # 5. Seed Tags
    t_python = create_tag("Python & Data Analytics", "#3776AB", "programming")
    t_web = create_tag("Web Development (Full-Stack)", "#2563EB", "programming")
    t_db = create_tag("Database & SQL Architecture", "#059669", "database")
    t_ai = create_tag("Artificial Intelligence & Deep Learning", "#7C3AED", "ai")
    t_mobile = create_tag("Mobile App (Flutter)", "#0284C7", "mobile")

    add_tag_to_task(task1, t_python)
    add_tag_to_task(task1, t_db)
    add_tag_to_task(task2, t_web)
    add_tag_to_task(task2, t_db)
    add_tag_to_task(task3, t_ai)
    add_tag_to_task(task4, t_db)
    add_tag_to_task(task5, t_mobile)

    print("Database seeded successfully with English Demo Records!")


if __name__ == "__main__":
    init_db()
    seed_database()
'''

with open("database.py", "w", encoding="utf-8") as f:
    f.write(before_ext.strip() + "\n\n" + tail.strip() + "\n")

print("✓ database.py updated perfectly!")

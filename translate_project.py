#!/usr/bin/env python3
"""
University Task Management System - Full English Translation Script
Translates:
1. static/js/app.js
2. static/js/admin.js
3. static/js/trainer.js
4. static/js/student.js
5. database.py
6. static/documentation.html
7. Re-seeds SQLite database with English sample data
"""

import os
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def replace_in_file(file_path, replacements):
    """Safely apply a list of (target, replacement) tuples to a file."""
    if not os.path.exists(file_path):
        print(f"[SKIP] File not found: {file_path}")
        return
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    for target, repl in replacements:
        content = content.replace(target, repl)

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[UPDATED] {file_path}")
    else:
        print(f"[UNCHANGED] {file_path}")

print("Translation script initialized...")

#!/usr/bin/env python3
"""
Bundle all JS files into a single unified script: static/js/app.bundle.js
Order:
1. admin.js
2. trainer.js
3. student.js
4. app.js
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
STATIC_JS = BASE_DIR / "static" / "js"

files_order = ["admin.js", "trainer.js", "student.js", "app.js"]

bundle_content = []
for f in files_order:
    fpath = STATIC_JS / f
    if fpath.exists():
        with open(fpath, "r", encoding="utf-8") as file:
            bundle_content.append(f"// ==================== FILE: {f} ====================\n" + file.read() + "\n")

bundle_file = STATIC_JS / "app.bundle.js"
with open(bundle_file, "w", encoding="utf-8") as f:
    f.write("\n".join(bundle_content))

print(f"✓ app.bundle.js successfully created ({os.path.getsize(bundle_file)} bytes)")

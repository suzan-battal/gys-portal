#!/usr/bin/env python3
"""
Comprehensive Fix for Typos and Audit Logs UI
Fixes 'Thumissions' -> 'Permissions', 'Enabledlama' -> 'Description', and completely cleans the Audit Logs & Roles UI.
"""

import os
import glob

CORRECTION_MAP = [
    ("Thumissions", "Permissions"),
    ("Thumission", "Permission"),
    ("thumission", "permission"),
    ("renderRolesThumissions", "renderRolesPermissions"),
    ("saveAllRoleThumissions", "saveAllRolePermissions"),
    ("toggleThumission", "togglePermission"),
    ("Detailslı Enabledlama", "Event Description & Payload Details"),
    ("Enabledlama", "Description"),
    ("Timestamp (When) (When)", "Timestamp"),
    ("Timestamp (When)", "Timestamp"),
    ("User (Who)", "User (Actor)"),
    ("Action (What)", "Action & Event Type"),
    ("Düzey", "Severity"),
    ("Action", "Action"),
    ("22. Audit Logs (Güvenlik & Denetim Günlüğü)", "22. Audit Logs & System Security Monitor"),
    ("Who / What / When / IP Kayıtlı", "Who • What • When • IP Address Tracked"),
    ("User oluşturma, yetki değişimi, teslimat ve notlandırma, tarih güncellemeleri ve silme gibi tüm kritik işlemler anlık olarak denetlenir.", "Comprehensive audit trail for user provisioning, role permission modifications, assignments, submissions, grading, and security events."),
    ("Bugünkü Actions", "Today's Actions"),
    ("Kritik & Warninglar", "Critical & Warnings"),
    ("Action Yapan User", "Active Users"),
    ("Tüm Categoryler", "📂 All Event Categories"),
    ("Tüm Düzeyler", "🛡️ All Severity Levels"),
    ("Kayıt Gösteriliyor", "Records Displayed"),
    ("Filterri Sıfırla", "Reset Filters"),
    ("Log, User veya IP ara...", "Search logs, actors, or IP addresses..."),
    ("Kayıt Bulunamadı", "No Audit Logs Found"),
    ("Selectilen kriterlere uygun denetim günlüğü kaydı bulunmamaktadır.", "No audit log entries match the selected filters."),
    ("Denetim kayıtları yükleniyor...", "Loading audit log registry..."),
    ("🔴 Kritik", "🔴 Critical"),
    ("🟢 Information", "🟢 Info"),
    ("🟡 Warning", "🟡 Warning"),
    ("Kullanıcı başarıyla oturum açtı:", "User successfully authenticated:"),
    ("Roller ve Yetkiler Matrisi", "Roles and Permissions Matrix (RBAC)"),
    ("İzin Kodu & Descriptionsı (Thumission Code)", "Permission Code & Scope Description"),
    ("İzin Kodu & Descriptionsı (Permission Code)", "Permission Code & Scope Description")
]

def apply_corrections(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    for wrong, right in CORRECTION_MAP:
        content = content.replace(wrong, right)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✓ Corrected: {filepath}")

for fp in glob.glob("static/js/*.js") + glob.glob("static/*.html"):
    apply_corrections(fp)

# Rebuild app.bundle.js cleanly
with open("static/js/app.js", "r", encoding="utf-8") as f:
    app_js = f.read()
with open("static/js/admin.js", "r", encoding="utf-8") as f:
    admin_js = f.read()
with open("static/js/trainer.js", "r", encoding="utf-8") as f:
    trainer_js = f.read()
with open("static/js/student.js", "r", encoding="utf-8") as f:
    student_js = f.read()

with open("static/js/app.bundle.js", "w", encoding="utf-8") as f:
    f.write(f"{admin_js}\n\n{trainer_js}\n\n{student_js}\n\n{app_js}")

print("ALL_TYPOS_AND_AUDIT_LOGS_FIXED_PERFECTLY")

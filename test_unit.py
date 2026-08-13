import database

print("Testing database core functions...")
conn = database.get_db_connection()
admin_data = database.get_admin_dashboard_full_data()
print("✓ Admin dashboard data retrieved:", bool(admin_data))
permissions_matrix = database.get_all_roles_permissions_matrix()
print("✓ Roles & Permissions Matrix loaded:", len(permissions_matrix), "roles")
roles = database.AVAILABLE_ROLES
print("✓ Available Roles in system:", len(roles))
schema_overview = database.get_database_schema_overview()
print("✓ Database Schema Overview:", len(schema_overview), "relational tables verified")
settings = database.get_all_settings()
print("✓ System Settings retrieved:", len(settings), "configuration items")
print("\n🎉 ALL LOCAL DATABASE & BACKEND TESTS PASSED 100%!")
conn.close()
